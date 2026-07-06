## 1. Database Setup

- [x] 1.1 Create migration file for t_document table
- [x] 1.2 Create migration file for t_document_chunk table
- [x] 1.3 Add GIN index on t_document_chunk.search_vector
- [x] 1.4 Add unique constraint on t_document (name, parent_id)
- [x] 1.5 Add unique constraint on t_document_chunk (document_id, chunk_index)
- [x] 1.6 Run migrations and verify table structure

## 2. Backend - S3 Integration

- [x] 2.1 Install AWS SDK dependency (@aws-sdk/client-s3)
- [x] 2.2 Add S3 configuration to .env file (AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
- [x] 2.3 Create S3 service module with upload/download/delete/move methods
- [x] 2.4 Implement S3 configuration validation on startup
- [x] 2.5 Add error handling for S3 operations

## 3. Backend - Document Model and Repository

- [x] 3.1 Create Document entity model (id, name, type, parent_id, path, tags, size, content, created_on, created_by, updated_on, updated_by)
- [x] 3.2 Create DocumentChunk entity model (id, document_id, document_name, document_type, document_path, document_tags, chunk_index, chunk_content, search_vector, created_on, created_by, updated_on, updated_by)
- [x] 3.3 Implement document repository with CRUD methods
- [x] 3.4 Implement path calculation and update logic for move/rename operations
- [x] 3.5 Implement circular reference check for move operations
- [x] 3.6 Implement recursive delete logic for directories

## 4. Backend - Content Chunking

- [x] 4.1 Install pdf-parse library for PDF text extraction
- [x] 4.2 Create Markdown chunking service (split by headers)
- [x] 4.3 Create PDF chunking service (split by page)
- [x] 4.4 Implement tsvector generation for search_vector field
- [x] 4.5 Create chunk repository with batch insert/update/delete methods

## 5. Backend - Document Management API

- [x] 5.1 Create POST /api/knowledge/directories endpoint (create directory)
- [x] 5.2 Create POST /api/knowledge/documents endpoint (create Markdown document)
- [x] 5.3 Create POST /api/knowledge/attachments endpoint (upload PDF)
- [x] 5.4 Create GET /api/knowledge/documents/:id endpoint (get document details)
- [x] 5.5 Create PUT /api/knowledge/documents/:id endpoint (update Markdown content)
- [x] 5.6 Create PUT /api/knowledge/documents/:id/rename endpoint (rename document)
- [x] 5.7 Create PUT /api/knowledge/documents/:id/move endpoint (move document)
- [x] 5.8 Create PUT /api/knowledge/documents/:id/tags endpoint (update tags)
- [x] 5.9 Create DELETE /api/knowledge/documents/:id endpoint (delete document)
- [x] 5.10 Create GET /api/knowledge/documents endpoint (list documents by parent_id)

## 6. Backend - Search API

- [x] 6.1 Create GET /api/knowledge/search endpoint with query parameter
- [x] 6.2 Implement tsvector search query using ts_rank for ranking
- [x] 6.3 Add tag filtering support (tags parameter)
- [x] 6.4 Implement pagination (page, pageSize parameters)
- [x] 6.5 Return matching chunks with document metadata

## 7. Backend - Authorization

- [x] 7.1 Add SYSTEM_ADMIN role check middleware to all knowledge endpoints
- [x] 7.2 Add current user context to created_by and updated_by fields

## 8. Frontend - Routing and Menu

- [x] 8.1 Add Knowledge menu item to navigation (visible for SYSTEM_ADMIN)
- [x] 8.2 Create route /knowledge/documents for document list page
- [x] 8.3 Create route /knowledge/documents/:id for document view page
- [x] 8.4 Add path query parameter handling for directory navigation

## 9. Frontend - Document List Page

- [x] 9.1 Create DocumentListPage component with table layout
- [x] 9.2 Implement breadcrumb navigation based on current path
- [x] 9.3 Add table columns: Name, Size, Created On, Updated On, Actions
- [x] 9.4 Implement column sorting (Name, Created On, Updated On)
- [x] 9.5 Add checkbox selection for bulk operations
- [x] 9.6 Add "Add" button with create Markdown dialog
- [x] 9.7 Add "Upload" button with PDF file picker
- [x] 9.8 Add "Delete" button for selected documents with confirmation
- [x] 9.9 Implement directory navigation (click to enter)
- [x] 9.10 Implement file navigation (click to view)

## 10. Frontend - Document Actions

- [x] 10.1 Create RenameDialog component with name input
- [x] 10.2 Create MoveDialog component with directory tree picker
- [x] 10.3 Add action buttons (Rename, Delete, Move) to each table row
- [x] 10.4 Implement rename document handler
- [x] 10.5 Implement move document handler
- [x] 10.6 Implement delete document handler with confirmation

## 11. Frontend - Markdown Document View Page

- [x] 11.1 Create MarkdownDocumentPage component
- [x] 11.2 Display document metadata section (ID, Name, Path, Size, Created On/By, Updated On/By)
- [x] 11.3 Add Markdown renderer for view mode
- [x] 11.4 Add Markdown editor for edit mode
- [x] 11.5 Add edit/save toggle for content editing
- [x] 11.6 Display tags with edit capability
- [x] 11.7 Add action buttons (Rename, Delete, Move) in header

## 12. Frontend - PDF Document View Page

- [x] 12.1 Create PdfDocumentPage component
- [x] 12.2 Display document metadata section
- [x] 12.3 Add download button with S3 URL handling
- [x] 12.4 Display tags with edit capability
- [x] 12.5 Add action buttons (Rename, Delete, Move) in header

## 13. Frontend - Tags Management

- [x] 13.1 Create TagsEditor component with add/remove operations
- [x] 13.2 Display tags as chips/badges
- [x] 13.3 Implement save tags handler
- [x] 13.4 Add tag validation (non-empty, unique)

## 14. Frontend - UI Feedback

- [x] 14.1 Add toast notifications for success/error messages
- [x] 14.2 Add loading spinners for async operations
- [x] 14.3 Add progress indicator for file uploads
- [x] 14.4 Implement error boundary for error handling

## 15. Testing and Documentation

- [x] 15.1 Test directory CRUD operations
- [x] 15.2 Test Markdown document CRUD and editing
- [x] 15.3 Test PDF upload, download, and deletion
- [x] 15.4 Test move/rename operations with path updates
- [x] 15.5 Test full-text search with various queries
- [x] 15.6 Test tag filtering and management
- [x] 15.7 Test SYSTEM_ADMIN authorization
- [x] 15.8 Update API documentation with new endpoints
