## Why

项目需要一个知识库管理模块，让系统管理员能够组织和检索内部文档。当前系统缺少结构化的文档存储和全文检索能力，无法有效管理 Markdown 文档和 PDF 附件。

## What Changes

- 新增知识目录树结构，支持嵌套目录管理
- 新增 Markdown 文档的创建、编辑、查看功能
- 新增 PDF 附件的上传、下载、存储功能（通过 AWS S3）
- 新增文档标签系统
- 新增基于 PostgreSQL tsvector 的全文检索 API
- 新增文档分块（chunk）机制，用于检索和未来的 AI 集成
- 新增文档的移动、重命名、删除操作

## Capabilities

### New Capabilities

- `knowledge-document-management`: 文档和目录的 CRUD 操作，包括创建目录、添加 Markdown 文档、上传 PDF 附件、重命名、移动、删除
- `knowledge-search`: 基于 PostgreSQL tsvector 的全文检索 API，支持按内容和标签搜索文档
- `knowledge-storage`: AWS S3 附件存储集成，包括 PDF 文件的上传和下载
- `knowledge-ui`: 知识库前端界面，包括文档列表页、Markdown 文档查看/编辑页、PDF 文档查看页

### Modified Capabilities

（无需修改现有 capability）

## Impact

- 数据库：新增 `t_document` 和 `t_document_chunk` 两张表
- 后端 API：新增知识库相关的 REST API 端点
- 前端：新增 Knowledge 菜单入口及相关页面
- 外部依赖：引入 AWS S3 SDK 用于附件存储
- 配置：`.env` 中新增 S3 相关配置项（bucket name, access key, secret key）
- 权限：所有操作需要 SYSTEM_ADMIN 角色
