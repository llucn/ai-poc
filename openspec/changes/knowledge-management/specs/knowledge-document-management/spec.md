## ADDED Requirements

### Requirement: Create directory
The system SHALL allow SYSTEM_ADMIN users to create a new directory within the knowledge base hierarchy.

#### Scenario: Create directory successfully
- **WHEN** SYSTEM_ADMIN user provides a valid directory name and parent directory ID
- **THEN** system creates a new directory record with type=1 and returns the directory ID

#### Scenario: Prevent duplicate directory names
- **WHEN** user attempts to create a directory with a name that already exists under the same parent
- **THEN** system rejects the request and returns an error message

#### Scenario: Create directory at root level
- **WHEN** SYSTEM_ADMIN user creates a directory with parent_id=0
- **THEN** system creates a directory at the root level with path="/"

#### Scenario: Read-only users cannot create directory
- **WHEN** a non-SYSTEM_ADMIN authenticated user attempts to create a directory
- **THEN** system rejects the request with a 403 forbidden error

### Requirement: Add Markdown document
The system SHALL allow SYSTEM_ADMIN users to create a new Markdown document within a directory.

#### Scenario: Create Markdown document successfully
- **WHEN** user provides document name, parent directory ID, and Markdown content
- **THEN** system creates a document record with type=2, stores content in the database, and returns the document ID

#### Scenario: Generate document chunks
- **WHEN** a Markdown document is created or updated
- **THEN** system splits the content by headers and creates corresponding chunk records in t_document_chunk with English tsvector search vectors

### Requirement: Upload PDF attachment
The system SHALL allow SYSTEM_ADMIN users to upload PDF files as attachments to the knowledge base.

#### Scenario: Upload PDF successfully
- **WHEN** user uploads a PDF file with name and parent directory ID
- **THEN** system uploads the file to S3, creates a document record with type=3, content=S3_key, and returns the document ID

#### Scenario: Extract PDF text for search
- **WHEN** a PDF is uploaded
- **THEN** system uses `pdf-parse` library to extract text content per page, creates chunks in t_document_chunk with English tsvector search vectors

#### Scenario: Reject oversized files
- **WHEN** user uploads a PDF file exceeding 50MB
- **THEN** system rejects the upload and returns an error message

### Requirement: Rename document
The system SHALL allow SYSTEM_ADMIN users to rename documents and directories.

#### Scenario: Rename document successfully
- **WHEN** user provides document ID and new name
- **THEN** system updates the document name and updates path for all descendant nodes if it's a directory

#### Scenario: Update S3 object key on rename
- **WHEN** user renames a PDF attachment
- **THEN** system renames the S3 object to match the new path and name

### Requirement: Move document
The system SHALL allow SYSTEM_ADMIN users to move documents and directories to a different parent directory.

#### Scenario: Move document successfully
- **WHEN** user provides document ID and target parent directory ID
- **THEN** system updates parent_id, recalculates path, and updates all descendant nodes recursively

#### Scenario: Prevent circular references
- **WHEN** user attempts to move a directory to its own descendant
- **THEN** system rejects the request and returns an error message

#### Scenario: Update S3 object key on move
- **WHEN** user moves a PDF attachment
- **THEN** system moves the S3 object to reflect the new path

### Requirement: Delete document
The system SHALL allow SYSTEM_ADMIN users to delete documents and directories.

#### Scenario: Delete single document
- **WHEN** user deletes a document with no children
- **THEN** system removes the document record, its chunks, and S3 object (if PDF)

#### Scenario: Delete directory recursively
- **WHEN** user deletes a directory containing children
- **THEN** system removes the directory and all descendant documents and directories

#### Scenario: Clean up S3 objects on delete
- **WHEN** user deletes a PDF attachment
- **THEN** system deletes the corresponding S3 object

### Requirement: View document details
The system SHALL allow all authenticated users to view detailed information about a document.

#### Scenario: View Markdown document
- **WHEN** any authenticated user requests a document with type=2
- **THEN** system returns document metadata, content, and tags

#### Scenario: View PDF document
- **WHEN** any authenticated user requests a document with type=3
- **THEN** system returns document metadata, tags, and a download URL

### Requirement: Edit Markdown content
The system SHALL allow SYSTEM_ADMIN users to edit the content of Markdown documents.

#### Scenario: Update Markdown content successfully
- **WHEN** SYSTEM_ADMIN user provides document ID and new content
- **THEN** system updates the content field, regenerates chunks with updated English tsvector search vectors, and updates updated_on timestamp

### Requirement: Manage document tags
The system SHALL allow SYSTEM_ADMIN users to add, remove, and update tags on documents.

#### Scenario: Add tags to document
- **WHEN** user provides document ID and tag array
- **THEN** system updates the tags JSON field and propagates tags to all chunk records

#### Scenario: Search by tags
- **WHEN** user searches documents by tag
- **THEN** system filters documents where tags JSON array contains the specified tag

### Requirement: List documents in directory
The system SHALL allow all authenticated users to view all documents within a directory.

#### Scenario: List directory contents
- **WHEN** any authenticated user requests documents for a parent directory ID
- **THEN** system returns all documents (directories, files, attachments) sorted by name

#### Scenario: Navigate directory tree
- **WHEN** user clicks on a directory in the list
- **THEN** system displays contents of that directory with updated path in breadcrumb

### Requirement: Calculate document size
The system SHALL track the size of each document.

#### Scenario: Store Markdown document size
- **WHEN** a Markdown document is created or updated
- **THEN** system calculates byte size of content and stores in size field

#### Scenario: Store PDF file size
- **WHEN** a PDF is uploaded
- **THEN** system stores the file size in bytes in the size field
