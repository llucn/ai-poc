## Context

当前系统已有用户管理、权限控制（RBAC）、PostgreSQL 数据库持久化能力。需要新增知识库管理模块，让 SYSTEM_ADMIN 角色的用户能够管理内部文档。

文档类型包括：
- 目录（directory）：组织文档的层级结构
- Markdown 文档（file）：可在线编辑和查看
- PDF 附件（attachment）：存储在 S3，只支持上传/下载

技术栈：
- 后端：Node.js + Express
- 数据库：PostgreSQL 16（已从 MySQL 迁移）
- 前端：React + Material-UI
- 存储：AWS S3（附件存储）

## Goals / Non-Goals

**Goals:**
- 实现文档的层级目录管理（树形结构）
- 支持 Markdown 文档的在线创建、编辑、查看
- 支持 PDF 附件的上传和下载
- 实现基于 PostgreSQL tsvector 的全文检索
- 建立文档分块（chunk）机制，为未来 AI 集成做准备
- SYSTEM_ADMIN 角色拥有读写权限，其他已认证角色拥有只读权限

**Non-Goals:**
- 不支持在线预览 PDF 内容（仅支持下载）
- 不支持版本控制（version history）
- 不实现协同编辑功能
- 不支持软删除（物理删除）

## Decisions

### 1. 数据模型：单表存储所有文档类型

**Decision:** 使用 `t_document` 单表存储目录、Markdown 文档、PDF 附件，通过 `type` 字段区分。

**Rationale:**
- 统一管理文档路径和权限检查
- 简化树形结构查询（parent_id 指向同一张表）
- 减少表连接复杂度

**Alternatives Considered:**
- 分表存储（t_directory, t_file, t_attachment）：会增加路径计算和移动操作的复杂度

### 2. 路径计算：冗余存储路径字符串

**Decision:** 在 `path` 字段存储父级路径字符串（如 `/parent1/parent2`），而不是每次递归查询。

**Rationale:**
- 提高查询性能，避免递归 CTE
- 简化路径显示逻辑
- 路径变更时需要递归更新子节点，但变更频率远低于查询频率

### 3. 全文检索：PostgreSQL tsvector + GIN 索引（仅英文）

**Decision:** 使用 PostgreSQL 内置的 tsvector 和 GIN 索引实现全文检索，分词仅考虑英文（使用 `english` 配置）。

**Rationale:**
- 无需引入 Elasticsearch 等外部服务
- 仅需支持英文分词，使用 PostgreSQL 内置的 `english` text search configuration 即可
- 性能满足中小规模文档库需求（< 10万文档）
- 无需引入第三方中文分词扩展

**Alternatives Considered:**
- Elasticsearch：过于重量级，需要额外维护
- 简单的 LIKE 查询：无法满足全文检索性能要求

### 4. 文档分块：t_document_chunk 表

**Decision:** 创建 `t_document_chunk` 表，将文档内容按页/段落拆分。使用 `pdf-parse` 库提取 PDF 文本内容。

**Rationale:**
- 支持更精确的搜索结果（返回命中段落）
- 为未来 AI 集成（向量检索、RAG）预留扩展空间
- PDF 按页拆分（使用 `pdf-parse` 提取每页文本），Markdown 按标题拆分

### 5. S3 存储：仅用于 PDF 附件

**Decision:** 只有 `type=3`（attachment）时才上传到 S3，Markdown 内容存储在 `t_document.content` 字段。

**Rationale:**
- Markdown 内容需要在线编辑，存储在数据库更方便
- PDF 文件体积较大，存储在 S3 节省数据库空间
- S3 Object Key 使用 `${path}/${name}` 保证唯一性

**S3 配置参数（在 .env 中）：**
```
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### 6. 前端路由：基于当前目录路径

**Decision:** 文档列表页 URL 包含当前目录路径，如 `/knowledge/documents?path=/path1/path2`。

**Rationale:**
- 用户可以收藏或分享特定目录的链接
- 刷新页面时保持当前位置
- 面包屑导航更直观

## Risks / Trade-offs

### Risk 1: 路径冗余带来的数据一致性问题

**Risk:** 移动或重命名文档时，需要递归更新所有子节点的 `path` 字段，可能出现部分更新失败的情况。

**Mitigation:**
- 使用数据库事务确保原子性
- 移动操作前检查是否存在循环引用
- 添加唯一约束（name + parent_id）防止重复

### Risk 2: 英文分词覆盖范围

**Risk:** 仅支持英文分词，非英文内容将无法被有效检索。

**Mitigation:**
- 当前业务明确仅需英文检索
- 如果未来需要多语言支持，可扩展 text search configuration 或引入第三方工具

### Risk 3: S3 上传失败处理

**Risk:** PDF 上传到 S3 失败时，数据库记录已创建，导致数据不一致。

**Mitigation:**
- 先上传到 S3，成功后再插入数据库记录
- 失败时删除已上传的 S3 对象
- 定期清理孤立的 S3 对象（存在于 S3 但不在数据库中）

### Risk 4: 大文件上传超时

**Risk:** 大 PDF 文件（>10MB）上传可能超过 API 超时限制。

**Mitigation:**
- 设置合理的文件大小限制（如 50MB）
- 使用 multipart/form-data 流式上传
- 考虑后续支持 S3 预签名 URL 直传

## Migration Plan

1. **数据库迁移：**
   - 创建 `t_document` 和 `t_document_chunk` 表
   - 添加 GIN 索引到 `t_document_chunk.search_vector`
   - 初始化 ROOT 目录记录（id=0, parent_id=0）

2. **后端部署：**
   - 安装 AWS SDK 依赖（`aws-sdk` 或 `@aws-sdk/client-s3`）
   - 配置 `.env` 中的 S3 参数
   - 部署新的 API 端点

3. **前端部署：**
   - 添加 Knowledge 菜单入口
   - 部署文档管理页面

4. **Rollback 策略：**
   - 数据库回滚：执行 DROP TABLE 语句
   - 代码回滚：回退到上一个稳定版本
   - S3 回滚：清空 bucket（如果 bucket 是新创建的）

## Open Questions

（已全部解决）
