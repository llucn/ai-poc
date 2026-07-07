# knowledge-storage Specification

## Purpose
TBD - created by archiving change knowledge-management. Update Purpose after archive.
## Requirements
### Requirement: S3 bucket configuration
The system SHALL read AWS S3 configuration from environment variables.

#### Scenario: Load S3 configuration from .env
- **WHEN** application starts
- **THEN** system reads AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION from .env file

#### Scenario: Validate S3 configuration
- **WHEN** S3 configuration is missing or invalid
- **THEN** system logs an error and prevents PDF upload operations

### Requirement: Upload PDF to S3
The system SHALL upload PDF files to AWS S3.

#### Scenario: Upload PDF successfully
- **WHEN** user uploads a PDF file
- **THEN** system uploads the file to S3 with object key format `${path}/${name}`

#### Scenario: Generate unique S3 object key
- **WHEN** a PDF is uploaded
- **THEN** system uses the document's full path and name to ensure uniqueness

#### Scenario: Handle upload failures
- **WHEN** S3 upload fails
- **THEN** system returns an error and does not create the document record in the database

### Requirement: Download PDF from S3
The system SHALL generate download URLs for PDF files.

#### Scenario: Generate presigned URL for download
- **WHEN** user requests to download a PDF attachment
- **THEN** system generates a presigned S3 URL valid for 15 minutes and returns it to the client

#### Scenario: Direct download via API
- **WHEN** user requests to download a PDF
- **THEN** system streams the file from S3 through the API endpoint

### Requirement: Move S3 object on document move
The system SHALL update S3 object keys when PDF documents are moved or renamed.

#### Scenario: Move S3 object on document move
- **WHEN** a PDF attachment's path changes (move or rename)
- **THEN** system copies the S3 object to the new key and deletes the old object

#### Scenario: Handle S3 move failures
- **WHEN** S3 object move fails
- **THEN** system rolls back the database transaction and keeps the original S3 object

### Requirement: Delete S3 object on document delete
The system SHALL delete S3 objects when PDF documents are deleted.

#### Scenario: Delete S3 object on document delete
- **WHEN** a PDF attachment is deleted
- **THEN** system deletes the corresponding S3 object

#### Scenario: Orphaned object cleanup
- **WHEN** document deletion fails after S3 deletion
- **THEN** system logs the orphaned S3 object key for manual cleanup

### Requirement: S3 object validation
The system SHALL validate S3 operations.

#### Scenario: Verify object exists before operations
- **WHEN** performing move or delete operations on PDF attachments
- **THEN** system verifies the S3 object exists before proceeding

#### Scenario: Handle missing S3 objects
- **WHEN** S3 object is missing during database operations
- **THEN** system logs a warning but allows database operations to proceed

