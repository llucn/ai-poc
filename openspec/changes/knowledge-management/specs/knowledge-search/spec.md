## ADDED Requirements

### Requirement: Full-text search API
The system SHALL provide a REST API endpoint for searching documents by content using English text search configuration.

#### Scenario: Search by content successfully
- **WHEN** user provides a search query string
- **THEN** system searches t_document_chunk.search_vector using PostgreSQL tsvector (english configuration) and returns matching chunks with document metadata

#### Scenario: Highlight search matches
- **WHEN** search results are returned
- **THEN** system includes the matching chunk content with document path, name, and chunk_index

#### Scenario: Return empty results for no matches
- **WHEN** search query matches no documents
- **THEN** system returns an empty result array

### Requirement: Search by tags
The system SHALL allow searching documents by tags.

#### Scenario: Search by single tag
- **WHEN** user searches for documents with a specific tag
- **THEN** system returns all documents where the tags JSON array contains the specified tag

#### Scenario: Search by multiple tags
- **WHEN** user provides multiple tags
- **THEN** system returns documents matching any of the tags (OR logic)

### Requirement: Combined content and tag search
The system SHALL support searching by both content and tags simultaneously.

#### Scenario: Search with content and tags filter
- **WHEN** user provides search query and tag filters
- **THEN** system returns documents matching the content query AND containing at least one of the specified tags

### Requirement: Search result ranking
The system SHALL rank search results by relevance.

#### Scenario: Rank by ts_rank
- **WHEN** search results are returned
- **THEN** system orders results by PostgreSQL ts_rank score (highest first)

### Requirement: Search performance
The system SHALL use GIN index and English text search configuration for efficient full-text search.

#### Scenario: Query uses GIN index
- **WHEN** a search query is executed
- **THEN** PostgreSQL query planner uses the GIN index on search_vector column with `english` configuration

### Requirement: Search pagination
The system SHALL support pagination for search results.

#### Scenario: Paginate search results
- **WHEN** user provides page and pageSize parameters
- **THEN** system returns results for the specified page with total count

#### Scenario: Default pagination
- **WHEN** user does not specify pagination parameters
- **THEN** system returns first 20 results by default
