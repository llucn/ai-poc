# user-management Specification

## Purpose
Provide CRUD operations and UI for managing mock users in the demo authentication system. Allows SYSTEM_ADMIN users to create, view, edit, and delete users that appear on the mock login page.

## Requirements

### Requirement: Database table stores user records

The system SHALL maintain a `t_user` table in the MySQL database to store user records. The table MUST include columns for id (auto-increment primary key), name (unique), display_name, email, role, skill_matrix, is_available, created_on, created_by, updated_on, and updated_by. The role column MUST accept values from the set: 'SUPERVISOR', 'TECHNICIAN', 'SYSTEM_ADMIN', 'CUSTOMER'.

#### Scenario: User record is persisted in database

- **WHEN** a new user is created with name "bob", display_name "Bob Smith", email "bob@example.com", and role "TECHNICIAN"
- **THEN** the database contains a record in `t_user` with those values and an auto-generated id

#### Scenario: User name is unique

- **WHEN** attempting to insert a user with a name that already exists in `t_user`
- **THEN** the database rejects the insert with a unique constraint violation

### Requirement: API endpoint lists all users with pagination

The API SHALL provide a GET endpoint that returns a paginated list of all users. The endpoint MUST accept query parameters `page` and `pageSize` with default values of 1 and 20 respectively. The response MUST include the list of users for the requested page and pagination metadata (total count, total pages, current page).

#### Scenario: List users with default pagination

- **WHEN** a GET request is made to `/api/users` without pagination parameters
- **THEN** the API returns the first 20 users and pagination metadata

#### Scenario: List users with custom page size

- **WHEN** a GET request is made to `/api/users?page=2&pageSize=10`
- **THEN** the API returns users 11-20 and pagination metadata showing page 2

### Requirement: API endpoint retrieves a single user by ID

The API SHALL provide a GET endpoint that returns a single user by their ID. The endpoint MUST return the complete user record including all fields. If the user does not exist, the endpoint MUST return a 404 response.

#### Scenario: Retrieve existing user

- **WHEN** a GET request is made to `/api/users/5` and a user with id 5 exists
- **THEN** the API returns the full user record for user 5

#### Scenario: Retrieve non-existent user

- **WHEN** a GET request is made to `/api/users/999` and no user with id 999 exists
- **THEN** the API returns a 404 response

### Requirement: API endpoint creates a new user

The API SHALL provide a POST endpoint that creates a new user. The endpoint MUST accept a JSON body with name, display_name, email, role, skill_matrix, and is_available fields. The endpoint MUST validate that the name is unique and return a 409 response if a user with that name already exists. The endpoint MUST populate created_on and created_by fields automatically. On success, the endpoint MUST return the created user record including its generated id.

#### Scenario: Create user with valid data

- **WHEN** a POST request is made to `/api/users` with valid user data including a unique name
- **THEN** the API creates the user in the database, sets created_on to the current timestamp and created_by to the requesting user's name, and returns the created user with status 201

#### Scenario: Create user with duplicate name

- **WHEN** a POST request is made to `/api/users` with a name that already exists
- **THEN** the API returns a 409 response without creating the user

#### Scenario: Create user with missing required fields

- **WHEN** a POST request is made to `/api/users` with missing required fields like name or email
- **THEN** the API returns a 400 response with validation error details

### Requirement: API endpoint updates an existing user

The API SHALL provide a PUT endpoint that updates an existing user by ID. The endpoint MUST accept a JSON body with the fields to update. The endpoint MUST validate that if the name is being changed, the new name is unique. The endpoint MUST populate updated_on and updated_by fields automatically. If the user does not exist, the endpoint MUST return a 404 response.

#### Scenario: Update user with valid data

- **WHEN** a PUT request is made to `/api/users/5` with updated display_name and email
- **THEN** the API updates those fields in the database, sets updated_on to the current timestamp and updated_by to the requesting user's name, and returns the updated user record

#### Scenario: Update user with duplicate name

- **WHEN** a PUT request is made to `/api/users/5` changing the name to one that already exists for a different user
- **THEN** the API returns a 409 response without updating the user

#### Scenario: Update non-existent user

- **WHEN** a PUT request is made to `/api/users/999` and no user with id 999 exists
- **THEN** the API returns a 404 response

### Requirement: API endpoint deletes users by ID

The API SHALL provide a DELETE endpoint that removes one or more users by their IDs. The endpoint MUST accept a JSON body with an array of user IDs to delete. The endpoint MUST delete all specified users that exist and return a count of deleted users. If any specified ID does not exist, the endpoint MUST skip that ID and continue deleting the others.

#### Scenario: Delete single user

- **WHEN** a DELETE request is made to `/api/users` with body `{ "ids": [5] }` and user 5 exists
- **THEN** the API deletes user 5 from the database and returns `{ "deleted": 1 }`

#### Scenario: Delete multiple users

- **WHEN** a DELETE request is made to `/api/users` with body `{ "ids": [5, 7, 9] }` and all three users exist
- **THEN** the API deletes all three users and returns `{ "deleted": 3 }`

#### Scenario: Delete with some non-existent IDs

- **WHEN** a DELETE request is made to `/api/users` with body `{ "ids": [5, 999] }` and only user 5 exists
- **THEN** the API deletes user 5 and returns `{ "deleted": 1 }`

### Requirement: All user API endpoints require SYSTEM_ADMIN role

All user management API endpoints (list, get, create, update, delete) SHALL be protected by the `@Roles('SYSTEM_ADMIN')` decorator. Only requests with `X-User-Role: SYSTEM_ADMIN` MUST be allowed to access these endpoints. Requests from users with other roles MUST receive a 403 response.

#### Scenario: SYSTEM_ADMIN can list users

- **WHEN** a GET request to `/api/users` includes `X-User-Role: SYSTEM_ADMIN`
- **THEN** the API returns the user list

#### Scenario: TECHNICIAN cannot list users

- **WHEN** a GET request to `/api/users` includes `X-User-Role: TECHNICIAN`
- **THEN** the API returns a 403 response

#### Scenario: SYSTEM_ADMIN can create user

- **WHEN** a POST request to `/api/users` includes `X-User-Role: SYSTEM_ADMIN` and valid user data
- **THEN** the API creates the user

#### Scenario: Non-admin cannot delete users

- **WHEN** a DELETE request to `/api/users` includes `X-User-Role: CUSTOMER`
- **THEN** the API returns a 403 response

### Requirement: Web app displays All Users page

The web app SHALL provide an "All Users" page accessible via Settings → Users menu. The page MUST display all users in a table with columns for checkbox, ID, name, display_name, email, role, available status (icon), and action (Edit link). The page MUST support pagination with 20 users per page by default. The page MUST be accessible only to users with SYSTEM_ADMIN role.

#### Scenario: All Users page displays user list

- **WHEN** a SYSTEM_ADMIN user navigates to Settings → Users
- **THEN** the page displays a table with all users showing their ID, name, display_name, email, role, available icon, and Edit link

#### Scenario: All Users page shows pagination controls

- **WHEN** there are more than 20 users and a SYSTEM_ADMIN views the All Users page
- **THEN** pagination controls are visible allowing navigation between pages

#### Scenario: Non-admin cannot access All Users page

- **WHEN** a TECHNICIAN user attempts to navigate to the All Users route
- **THEN** the route renders a 403 placeholder

### Requirement: Web app provides Add User page

The web app SHALL provide an "Add User" page accessible from the All Users page via a "+ Add" button. The page MUST include input fields for name, display_name, email, role (dropdown with SUPERVISOR, TECHNICIAN, SYSTEM_ADMIN, CUSTOMER options), skill_matrix (multiline text), and is_available (dropdown with Yes/No, default Yes). The page MUST validate that the name is unique as the user types and display an error if a duplicate is detected. The page MUST include Save (primary) and Cancel (secondary) buttons. On successful save, the page MUST navigate back to the All Users page.

#### Scenario: Add User page validates name uniqueness

- **WHEN** a user types a name that already exists into the name field
- **THEN** an error message is displayed indicating the name is already in use

#### Scenario: Save creates user and returns to All Users

- **WHEN** a user fills out the Add User form with valid data and clicks Save
- **THEN** the new user is created and the app navigates back to the All Users page

#### Scenario: Cancel returns to All Users without saving

- **WHEN** a user clicks Cancel on the Add User page
- **THEN** no user is created and the app navigates back to the All Users page

### Requirement: Web app provides User Detail page

The web app SHALL provide a "User Detail" page accessible by clicking a user's name in the All Users table. The page MUST display all user fields (ID, name, display_name, email, role, skill_matrix, available) in read-only format. The page MUST include Edit and Delete buttons in the header. The Delete button MUST show a confirmation dialog with text "Delete User #id?" before deleting. On successful delete, the page MUST navigate back to the All Users page.

#### Scenario: User Detail page displays user information

- **WHEN** a user clicks on user "alice" in the All Users table
- **THEN** the User Detail page displays all of alice's information including ID, name, display_name, email, role, skill_matrix, and available status

#### Scenario: Edit button navigates to Edit User page

- **WHEN** a user clicks the Edit button on the User Detail page
- **THEN** the app navigates to the Edit User page for that user

#### Scenario: Delete button shows confirmation dialog

- **WHEN** a user clicks the Delete button on User Detail page for user with id 5
- **THEN** a confirmation dialog appears with text "Delete User #5?"

#### Scenario: Confirmed delete removes user and returns to list

- **WHEN** a user confirms deletion on the User Detail page
- **THEN** the user is deleted and the app navigates back to the All Users page

### Requirement: Web app provides Edit User page

The web app SHALL provide an "Edit User" page accessible from the User Detail page via the Edit button or from the All Users table via the Edit action link. The page MUST include input fields for all editable user fields (ID shown but disabled, name, display_name, email, role dropdown, skill_matrix multiline text, is_available dropdown). The page MUST validate name uniqueness excluding the current user. The page MUST include Save (primary) and Cancel (secondary) buttons. On successful save, the page MUST navigate back to the User Detail page.

#### Scenario: Edit User page populates with existing data

- **WHEN** a user navigates to the Edit User page for user with id 5
- **THEN** all form fields are pre-filled with user 5's current data

#### Scenario: Name validation excludes current user

- **WHEN** editing user "alice" and the name field contains "alice" (unchanged)
- **THEN** no duplicate name error is shown

#### Scenario: Name validation detects other duplicates

- **WHEN** editing user "alice" and the name field is changed to "bob" (an existing user)
- **THEN** a duplicate name error is displayed

#### Scenario: Save updates user and returns to User Detail

- **WHEN** a user modifies fields and clicks Save on the Edit User page
- **THEN** the user record is updated and the app navigates back to the User Detail page showing updated values

#### Scenario: Cancel returns to User Detail without saving

- **WHEN** a user clicks Cancel on the Edit User page
- **THEN** no changes are saved and the app navigates back to the User Detail page

### Requirement: Web app provides bulk delete on All Users page

The All Users page SHALL allow selecting multiple users via checkboxes and deleting them via a "- Delete" button in the header. When the Delete button is clicked, a confirmation dialog MUST appear with text "Delete Users?". On confirmation, all selected users MUST be deleted and the page MUST refresh to show the updated list.

#### Scenario: Select and delete multiple users

- **WHEN** a user selects checkboxes for users 5, 7, and 9 and clicks the "- Delete" button
- **THEN** a confirmation dialog appears with text "Delete Users?"

#### Scenario: Confirmed bulk delete removes all selected users

- **WHEN** a user confirms bulk delete for selected users 5, 7, and 9
- **THEN** all three users are deleted and the All Users page refreshes showing the remaining users

#### Scenario: Cancel bulk delete leaves users unchanged

- **WHEN** a user cancels the bulk delete confirmation dialog
- **THEN** no users are deleted and the All Users page remains unchanged

### Requirement: Settings menu includes Users entry for SYSTEM_ADMIN

The sidebar's Settings group SHALL include a "Users" child link routed to `/settings/users` (the All Users page). The link MUST be visible only to users with SYSTEM_ADMIN role. The link MUST be highlighted when the current route matches any user management page (list, detail, add, edit).

#### Scenario: SYSTEM_ADMIN sees Users entry under Settings

- **WHEN** a SYSTEM_ADMIN user expands the Settings group in the sidebar
- **THEN** a "Users" child link is visible

#### Scenario: Users entry is highlighted on user management pages

- **WHEN** a SYSTEM_ADMIN is on the All Users, User Detail, Add User, or Edit User page
- **THEN** the "Users" entry in the Settings menu is highlighted as active

#### Scenario: Non-admin does not see Users entry

- **WHEN** a TECHNICIAN user expands the Settings group
- **THEN** the "Users" child link is not rendered
