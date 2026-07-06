Knowledge Management
===

# 功能

知识库管理，功能：
- 管理知识目录
- 在目录内管理知识文件，包括标题、内容、标签
- 附件附件（支持 PDF 文件）
- 全文检索（提供后台 API ）

# 数据库

## Table: `t_document`

| Name          | Type         | Description                          | Nullable | PK  | Index  |
|---------------|--------------|--------------------------------------|----------|-----|--------|
| id            | int          | Auto increment                       | No       | Yes |        |
| name          | varchar(255) |                                      | No       |     | Unique |
| type          | int          | 1: directory, 2: file, 3: attachment | No       |     |        |
| parent_id     | int          | Link to `id`, `0` for ROOT           | No       |     | Index  |
| path          | varchar(255) | Parents' names                       | No       |     | Unique |
| tags          | json         | `{"tags": ["tag1", "tag2"]}`         | Yes      |     |        |
| size          | int          |                                      | No       |     |        |
| content       | text         | S3 key for attachment                | Yes      |     |        |
| created_on    | timestamp    |                                      | No       |     |        |
| created_by    | varchar(255) |                                      | No       |     |        |
| updated_on    | timestamp    |                                      | Yes      |     |        |
| updated_by    | varchar(255) |                                      | Yes      |     |        |

## Table: `t_document_chunk`

| Name          | Type         | Description                          | Nullable | PK  | Index  |
|---------------|--------------|--------------------------------------|----------|-----|--------|
| id            | int          | Auto increment                       | No       | Yes |        |
| document_id   | int          | Link to `t_document.id`              | No       |     | Index  |
| document_name | varchar(255) |                                      | No       |     | Unique |
| document_type | int          | 1: directory, 2: file, 3: attachment | No       |     |        |
| document_path | varchar(255) | Parents' names                       | No       |     | Unique |
| document_tags | json         | `{"tags": ["tag1", "tag2"]}`         | Yes      |     |        |
| chunk_index   | int          | Zero base                            | No       |     |        |
| chunk_content | text         | PDF Page or Markdown section         | Yes      |     |        |
| search_vector | tsvector     | 只考虑英文分词                        | Yes      |     | Gin    |
| created_on    | timestamp    |                                      | No       |     |        |
| created_by    | varchar(255) |                                      | No       |     |        |
| updated_on    | timestamp    |                                      | Yes      |     |        |
| updated_by    | varchar(255) |                                      | Yes      |     |        |

# S3 Object

- 当 `type=3` (attachment) 时，文件存储到 AWS S3
- Bucket Name: 全局固定，在 `.env` 文件设置
- Object Key: `${path}/${name}`

# 操作界面

## 文档列表

权限：
- SYSTEM_ADMIN（读写）
- 其他角色（只读）

菜单入口：Knowledge -> Documents

标题：目录位置，例如: `/path1/path2`

Head Buttons：
- Add: 添加 Markdown 文档
- Upload：上传 PDF 文档
- Mkdir: 创建目录
- Delete：删除选中的文档
- Move：移动文档

Table Columns：
- Name: 点击查看文档
- Size
- Create On
- Update On
- Action Button：Rename, Delete, Move

表格不分页，全部显示。可以按照 Name、Create At、Update At 排序

## 查看文档（Markdown）

权限：
- SYSTEM_ADMIN（读写）
- 其他角色（只读）

标题：文档位置，例如: `/path1/path2/document_name`

Head Buttons：
- Rename
- Delete
- Move

文档信息：
- ID
- Name
- Path
- Size
- Created On
- Created By
- Updated On
- Updated By

Content: Markdown 格式，点击编辑图标可以编辑

Tags: 显示文档标签，点击编辑图标可以编辑

## 查看文档（PDF）

权限：
- SYSTEM_ADMIN（读写）
- 其他角色（只读）

标题：文档位置，例如：`/path1/path2/document_name`

Head Buttons：
- Rename
- Delete
- Move

文档信息：
- ID
- Name
- Path
- Size
- Created On
- Created By
- Updated On
- Updated By

Content: 不显示文档内容，显示 Download 图标，点击下载文件

Tags: 显示文档标签，点击编辑图标可以编辑

# 技术选型

- 附件存储使用 AWS S3
- S3 连接参数包括 `aws_access_key_id`, `aws_secret_access_key`, 我想在 `.env` 文件中配置这两个参数，请给出建议

# API Endpoints

Base path: `/api/knowledge`

## Read (Any authenticated user)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/documents` | List documents by parentId, sortBy, sortOrder |
| GET | `/documents/:id` | Get document details (with downloadUrl for PDF) |
| GET | `/search` | Full-text search (params: q, tags, page, pageSize) |

## Write (SYSTEM_ADMIN only)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/directories` | Create directory (body: name, parentId) |
| POST | `/documents` | Create Markdown document (body: name, parentId, content, tags?) |
| POST | `/attachments` | Upload PDF (multipart: file, parentId) |
| PUT | `/documents/:id` | Update Markdown content (body: content) |
| PUT | `/documents/:id/rename` | Rename document (body: name) |
| PUT | `/documents/:id/move` | Move document (body: parentId) |
| PUT | `/documents/:id/tags` | Update tags (body: tags[]) |
| DELETE | `/documents/:id` | Delete single document |
| DELETE | `/documents` | Bulk delete (body: ids[]) |

## .env Configuration

```
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```
