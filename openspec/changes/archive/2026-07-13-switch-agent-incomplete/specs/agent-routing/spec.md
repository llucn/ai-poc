## ADDED Requirements

### Requirement: Classify user intent
The selector agent MUST analyze the first user message and determine which target agent is most appropriate based on the request type.

#### Scenario: Operational task classification
- **WHEN** user message indicates a business task (e.g., "创建工作单", "报销申请", "采购审批")
- **THEN** selector classifies as `operational` agent with confidence score

#### Scenario: Knowledge retrieval classification
- **WHEN** user message requests information from documentation or knowledge base (e.g., "查询管理制度", "设备维护手册", "工作流程")
- **THEN** selector classifies as `rag` agent with confidence score

#### Scenario: General query classification
- **WHEN** user message does not clearly match operational or rag categories
- **THEN** selector classifies as `general` agent with confidence score

#### Scenario: Ambiguous intent handling
- **WHEN** user message could match multiple agent types
- **THEN** selector selects the most likely agent and includes confidence score below 0.8

### Requirement: Generate confidence score
The selector agent MUST provide a confidence score between 0.0 and 1.0 for each classification decision.

#### Scenario: High confidence classification
- **WHEN** user intent clearly matches one agent category
- **THEN** confidence score is 0.8 or higher

#### Scenario: Low confidence classification
- **WHEN** user intent is ambiguous or matches multiple categories
- **THEN** confidence score is below 0.8

### Requirement: Forward simplified prompt
The selector agent MUST generate a `prompt_forward` parameter that simplifies or clarifies the user's original request for the target agent.

#### Scenario: Direct prompt forwarding
- **WHEN** user message is clear and specific
- **THEN** `prompt_forward` contains the original message without modification

#### Scenario: Simplified prompt forwarding
- **WHEN** user message contains unnecessary context or ambiguity
- **THEN** `prompt_forward` contains a simplified version focusing on the core request
