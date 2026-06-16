Anthropic Tool Use 技术评估
===

评估 Anthropic API 的 Tool Use 功能在「输出稳定数据结构」场景下的可用性。

# 结论

**可以。** Anthropic Tool Use 通过让 LLM「调用工具」而不是「输出文本」的方式，能够稳定输出严格遵循 JSON Schema 的结构化数据。在受支持的模型上（Claude 3.x / 4.x 全系列），可以通过 `tool_choice` 强制模型必须调用某个工具，从而把「自由文本生成」转化为「严格 schema 校验的参数填充」，这比 prompt 里写「请返回 JSON」要可靠得多。

本项目当前在 `packages/api/src/app/utils/extract-json.ts` 用「清洗 + 大括号匹配」的方式兜底 LLM 输出的 JSON 格式问题，那是 Qwen / OpenAI Compatible 接口下的折中方案。如果切换到 Anthropic API，Tool Use 是更上游、更可靠的解决路径。

# 功能介绍

## 是什么

Tool Use 原本设计目的是让 Claude 调用外部函数（如查天气、查数据库、执行代码），但它的实现机制天然适合做**结构化输出**：

- 开发者声明一个或多个 `tools`，每个 tool 包含 `name`、`description`、`input_schema`（JSON Schema）
- LLM 被允许返回「调用工具」的特殊响应，参数必须满足 schema
- 开发者可以用 `tool_choice` 控制行为：
  - `auto`（默认）：模型自行决定是否调用工具
  - `any`：必须调用某一个工具，但可以自选
  - `tool`：必须调用指定的某个工具
  - `none`：禁止调用任何工具

把 `tool_choice` 设为 `{ "type": "tool", "name": "..." }`，再定义一个表示「输出格式」的虚拟工具，就把 LLM 锁定在了「按 schema 填参」的模式上 —— 它的「函数调用参数」就是你要的结构化数据，**不需要真的去执行任何函数**。

## 与传统 Prompt JSON 的对比

| 维度         | Prompt 里要求返回 JSON              | Tool Use 强制调用            |
| ------------ | ----------------------------------- | ---------------------------- |
| 格式正确性   | 偶尔包 ```json``` 代码块、加解释    | API 层校验，结构稳定         |
| 字段缺失     | 模型可能省略可选字段                | schema `required` 强制       |
| 类型错误     | 字符串里塞数字、布尔写成 "true"     | API 层做类型检查             |
| 多余字段     | 模型可能创造新字段                  | schema `additionalProperties:false` 可禁止 |
| 解析复杂度   | 需要清洗、容错、重试                | 直接拿 `tool_use.input` 即可 |
| Token 开销   | schema 一次写在 prompt 里           | schema 一次写在 tools 里     |

## 支持的模型

Claude 3 / 3.5 / 3.7 / 4 / 4.5 / 4.6 / 4.7 / 4.8 系列全部支持 Tool Use。Anthropic 把这个能力作为一等公民，相比 OpenAI 当年从 `function_calling` 演进到 `tools` 的过程要清晰一些。

## 局限

- **仍可能拒绝调用**：除非用 `tool_choice: tool` 强制，否则模型仍可能选择直接回复文本
- **复杂嵌套 schema 偶有偏差**：超过 3-4 层嵌套时，建议把结构拍平
- **`description` 是契约**：schema 之外，工具的 `description` 和字段的 `description` 是模型唯一的语义线索；写不清，调用就不准
- **不能完全消除幻觉**：schema 保证「结构正确」，不保证「内容正确」 —— 模型仍可能编造合法但错误的值

# 工作原理

```
                  ┌────────────────────┐
                  │  你的请求（包含   │
                  │  tools 定义 +     │
                  │  tool_choice）    │
                  └─────────┬──────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │   Anthropic Messages API     │
              │ ┌──────────────────────────┐ │
              │ │ 模型推理：               │ │
              │ │  - 是否需要工具？       │ │
              │ │  - 选哪个？             │ │
              │ │  - 参数怎么填？         │ │
              │ └────────────┬─────────────┘ │
              │              │               │
              │ ┌────────────▼─────────────┐ │
              │ │ 解码层 (constrained      │ │
              │ │ decoding)：              │ │
              │ │  按 input_schema 约束    │ │
              │ │  token 采样             │ │
              │ └────────────┬─────────────┘ │
              └──────────────┼───────────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │ Response:                          │
        │  stop_reason: "tool_use"           │
        │  content: [                        │
        │    { type: "tool_use",             │
        │      id: "toolu_xxx",              │
        │      name: "extract_user",         │
        │      input: { ... 严格符合 schema  │
        │              的 JSON 对象 ... }    │
        │    }                               │
        │  ]                                 │
        └────────────────────────────────────┘
```

关键点是 **constrained decoding**（约束解码）：在每一步生成 token 时，根据当前 schema 状态（在哪个字段、什么类型、是否到了边界）把不合法的 token 概率压到 0 再采样。这是「结构稳定」的根本来源 —— 不是事后校验，是生成时就只能走对的路径。

# 代码示例

## 场景：从一段简历文本中抽取候选人信息

要求输出严格的 JSON：`name: string`、`email: string`、`years_of_experience: number`、`skills: string[]`、`prefers_remote: boolean`。

## TypeScript 实现

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 1. 定义"输出工具"，schema 即结构契约
const extractCandidateTool = {
  name: 'extract_candidate',
  description: '从简历文本里抽取候选人结构化信息。必须调用此工具返回结果。',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: '候选人全名',
      },
      email: {
        type: 'string',
        description: '邮箱地址；找不到时填空字符串',
      },
      years_of_experience: {
        type: 'number',
        description: '工作年数；按当前自然年估算，无法判断时填 0',
      },
      skills: {
        type: 'array',
        items: { type: 'string' },
        description: '技术栈关键词，如 "TypeScript"、"PostgreSQL"',
      },
      prefers_remote: {
        type: 'boolean',
        description: '是否偏好远程工作；不确定时填 false',
      },
    },
    required: ['name', 'email', 'years_of_experience', 'skills', 'prefers_remote'],
    additionalProperties: false,
  },
};

// 2. 调用 API，强制模型必须调用这个工具
const resume = `
张三, 上海, zhang.san@example.com
2018 年本科毕业，先在美团做 Java 后端 3 年，2021 年起在字节跳动做 Node.js / TypeScript
微服务，熟悉 PostgreSQL / Redis / Kafka。在意工作弹性，希望大部分时间居家办公。
`;

const response = await client.messages.create({
  model: 'claude-opus-4-8',
  max_tokens: 1024,
  tools: [extractCandidateTool],
  tool_choice: { type: 'tool', name: 'extract_candidate' }, // 关键：强制调用
  messages: [
    {
      role: 'user',
      content: `请从以下简历抽取候选人信息：\n\n${resume}`,
    },
  ],
});

// 3. 解析结果
const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
  throw new Error('Model did not produce a tool_use block');
}

// toolUseBlock.input 已经是经 schema 校验的对象，可直接使用
const candidate = toolUseBlock.input as {
  name: string;
  email: string;
  years_of_experience: number;
  skills: string[];
  prefers_remote: boolean;
};

console.log(candidate);
// {
//   name: "张三",
//   email: "zhang.san@example.com",
//   years_of_experience: 7,
//   skills: ["Java", "Node.js", "TypeScript", "PostgreSQL", "Redis", "Kafka"],
//   prefers_remote: true
// }
```

## 几个常用 schema 模式

**枚举（受控值）**

```ts
sentiment: {
  type: 'string',
  enum: ['positive', 'neutral', 'negative'],
  description: '...',
}
```

**可选字段**：从 `required` 里去掉即可。模型仍可能填，但不会因为缺失而调用失败。

**联合 / 多形态**：用 `oneOf`，但保持每个分支结构简单，否则采样质量会下降。

```ts
input_schema: {
  type: 'object',
  properties: {
    action: {
      oneOf: [
        { type: 'object', properties: { kind: { const: 'reply' }, text: { type: 'string' } }, required: ['kind', 'text'] },
        { type: 'object', properties: { kind: { const: 'tool_call' }, name: { type: 'string' }, params: { type: 'object' } }, required: ['kind', 'name', 'params'] },
      ],
    },
  },
}
```

# 与本项目的关系

本项目 `parseAssistantReply`（`packages/api/src/app/session/session.service.ts`）走的是 ReAct 文本协议：要求 LLM 输出 `{type, content/action/...}` 形式的 JSON 文本，然后由 `extractJsonObject` 清洗 Markdown 代码块和 prose、再 `JSON.parse`。这套设计是因为：

- 当前 Provider 是 Qwen / OpenAI 兼容接口，OpenAI 的 `tools` 在 Qwen 上支持度不一
- ReAct 在自由文本里同时表达 thought 和 action，便于流式输出 thought 给前端

如果未来切换或新增 Anthropic Provider，可以考虑两条路线：

1. **保留 ReAct 文本协议**：Anthropic 也能跑文本协议，`extractJsonObject` 仍然是合理兜底，行为最一致
2. **改造为 Tool Use**：把 `error / tool_call / final_answer` 三种 action 各定义为一个 tool，用 `tool_choice: any` 让模型从这三者里选一个调用。好处是结构稳定 + 失败重试逻辑可以下沉到 SDK；代价是 thought 的流式语义需要重新设计（thought 内容会落在 tool_use 之前的 text block 里，仍可流给前端）

不建议两套并存，因为 prompt 工程的成本主要在「教模型 protocol」上，跑两套等于教两遍。

# 进一步参考

- 官方文档：<https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview>
- Structured Outputs cookbook：<https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/extracting_structured_json.ipynb>
- `tool_choice` 详细说明：<https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use#controlling-claudes-output>
