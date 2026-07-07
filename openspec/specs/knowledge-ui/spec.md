# knowledge-ui Specification

## Purpose
TBD - created by archiving change knowledge-management. Update Purpose after archive.
## Requirements
### Requirement: Knowledge menu entry
The system SHALL display a Knowledge menu item in the navigation for all authenticated users.

#### Scenario: Show Knowledge menu for all authenticated users
- **WHEN** any authenticated user logs in
- **THEN** system displays "Knowledge" menu item in the navigation bar

#### Scenario: Navigate to documents list
- **WHEN** user clicks on "Knowledge" menu
- **THEN** system navigates to the documents list page at /knowledge/documents

### Requirement: Document list page
The system SHALL provide a document list page showing contents of the current directory.

#### Scenario: Display directory contents
- **WHEN** user navigates to document list page
- **THEN** system displays all documents in the current directory with columns: Name, Size, Created On, Updated On, Actions

#### Scenario: Show breadcrumb navigation
- **WHEN** user is viewing a directory
- **THEN** system displays breadcrumb navigation showing the current path (e.g., / > path1 > path2)

#### Scenario: Navigate via breadcrumb
- **WHEN** user clicks on a breadcrumb segment
- **THEN** system navigates to that directory level

#### Scenario: Click directory to enter
- **WHEN** user clicks on a directory name in the list
- **THEN** system navigates to that directory and displays its contents

#### Scenario: Click file to view
- **WHEN** user clicks on a file or attachment name
- **THEN** system navigates to the document view page

### Requirement: Add document button
The system SHALL provide an "Add" button to create new Markdown documents, visible only to SYSTEM_ADMIN users.

#### Scenario: Show Add button for SYSTEM_ADMIN
- **WHEN** SYSTEM_ADMIN user views the document list
- **THEN** system displays the "Add" button

#### Scenario: Hide Add button for read-only users
- **WHEN** a non-SYSTEM_ADMIN authenticated user views the document list
- **THEN** system hides the "Add" button

#### Scenario: Create Markdown document
- **WHEN** user submits the create dialog with valid data
- **THEN** system creates the document and refreshes the list

### Requirement: Upload PDF button
The system SHALL provide an "Upload" button to upload PDF attachments, visible only to SYSTEM_ADMIN users.

#### Scenario: Show Upload button for SYSTEM_ADMIN
- **WHEN** SYSTEM_ADMIN user views the document list
- **THEN** system displays the "Upload" button

#### Scenario: Hide Upload button for read-only users
- **WHEN** a non-SYSTEM_ADMIN authenticated user views the document list
- **THEN** system hides the "Upload" button

#### Scenario: Upload PDF file
- **WHEN** user selects a PDF file and confirms
- **THEN** system uploads the file, shows progress indicator, and refreshes the list on completion

### Requirement: Delete selected documents
The system SHALL allow SYSTEM_ADMIN users to bulk delete selected documents, hidden for read-only users.

#### Scenario: Select multiple documents
- **WHEN** SYSTEM_ADMIN user checks checkboxes for multiple documents
- **THEN** system enables the "Delete" button

#### Scenario: Delete selected documents
- **WHEN** user clicks "Delete" button with documents selected
- **THEN** system prompts for confirmation, deletes selected documents, and refreshes the list

### Requirement: Move document action
The system SHALL provide a "Move" action for documents.

#### Scenario: Open move dialog
- **WHEN** user clicks "Move" action on a document
- **THEN** system displays a dialog with a directory tree picker

#### Scenario: Move document to new location
- **WHEN** user selects a target directory and confirms
- **THEN** system moves the document and refreshes the list

### Requirement: Rename document action
The system SHALL provide a "Rename" action for documents.

#### Scenario: Open rename dialog
- **WHEN** user clicks "Rename" action on a document
- **THEN** system displays a dialog with the current name pre-filled

#### Scenario: Rename document
- **WHEN** user enters a new name and confirms
- **THEN** system renames the document and refreshes the list

### Requirement: Sort document list
The system SHALL allow sorting the document list by columns.

#### Scenario: Sort by name
- **WHEN** user clicks on "Name" column header
- **THEN** system sorts documents alphabetically by name (toggle asc/desc)

#### Scenario: Sort by date
- **WHEN** user clicks on "Created On" or "Updated On" column headers
- **THEN** system sorts documents by the selected date column (toggle asc/desc)

### Requirement: Markdown document view page
The system SHALL provide a view page for Markdown documents accessible to all authenticated users, with edit capability only for SYSTEM_ADMIN.

#### Scenario: Display Markdown content
- **WHEN** any authenticated user navigates to a Markdown document
- **THEN** system displays document metadata and renders the Markdown content

#### Scenario: Edit Markdown content
- **WHEN** SYSTEM_ADMIN user clicks the edit icon next to content
- **THEN** system switches to edit mode with a Markdown editor

#### Scenario: Hide edit button for read-only users
- **WHEN** a non-SYSTEM_ADMIN user views a Markdown document
- **THEN** system hides the edit icon

#### Scenario: Save Markdown changes
- **WHEN** user edits content and clicks save
- **THEN** system updates the document content and switches back to view mode

### Requirement: PDF document view page
The system SHALL provide a view page for PDF attachments.

#### Scenario: Display PDF metadata
- **WHEN** user navigates to a PDF attachment
- **THEN** system displays document metadata without rendering PDF content

#### Scenario: Download PDF
- **WHEN** user clicks the download icon
- **THEN** system downloads the PDF file from S3

### Requirement: Document tags display
The system SHALL display document tags to all authenticated users and allow editing only for SYSTEM_ADMIN.

#### Scenario: Display tags
- **WHEN** any authenticated user views a document
- **THEN** system displays the document's tags as chips/badges

#### Scenario: Edit tags
- **WHEN** SYSTEM_ADMIN user clicks the edit icon next to tags
- **THEN** system displays a tag editor allowing add/remove operations

#### Scenario: Hide tag edit for read-only users
- **WHEN** a non-SYSTEM_ADMIN user views a document
- **THEN** system hides the edit icon next to tags

#### Scenario: Save tag changes
- **WHEN** user modifies tags and saves
- **THEN** system updates the document tags and refreshes the display

### Requirement: Document action buttons
The system SHALL provide action buttons on document view pages, visible only to SYSTEM_ADMIN users.

#### Scenario: Rename from view page
- **WHEN** SYSTEM_ADMIN user clicks "Rename" button on document view page
- **THEN** system displays rename dialog

#### Scenario: Delete from view page
- **WHEN** SYSTEM_ADMIN user clicks "Delete" button on document view page
- **THEN** system prompts for confirmation, deletes the document, and navigates to parent directory

#### Scenario: Move from view page
- **WHEN** SYSTEM_ADMIN user clicks "Move" button on document view page
- **THEN** system displays move dialog with directory tree picker

#### Scenario: Hide action buttons for read-only users
- **WHEN** a non-SYSTEM_ADMIN user views a document
- **THEN** system hides Rename, Delete, Move buttons

### Requirement: Error handling and feedback
The system SHALL provide user feedback for all operations.

#### Scenario: Show success message
- **WHEN** an operation completes successfully
- **THEN** system displays a success toast message

#### Scenario: Show error message
- **WHEN** an operation fails
- **THEN** system displays an error toast message with details

#### Scenario: Show loading indicator
- **WHEN** performing async operations (upload, move, delete)
- **THEN** system displays a loading spinner or progress indicator

