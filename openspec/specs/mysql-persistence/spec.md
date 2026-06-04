# mysql-persistence Specification

## Purpose
The shared MySQL connection layer used by @wo-poc/api — env-driven config (no hardcoded credentials), TypeORM DataSource initialization, and the docs/database.sql bootstrap script that every developer runs once. Future persistence features plug into this same connection.

## Requirements

### Requirement: MySQL connection parameters are loaded from the environment

The API SHALL obtain its MySQL connection parameters exclusively from environment variables. The required keys are `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. The API MUST refuse to start if any of these keys is missing or empty, and MUST log which key is missing so the operator can fix it. No connection parameter value SHALL appear hardcoded in any file under `packages/api/src/`.

#### Scenario: All required keys are set

- **WHEN** the API process starts with all five `DB_*` environment variables set to non-empty values and the credentials are valid
- **THEN** the process opens a connection to the configured MySQL server and begins serving requests

#### Scenario: A required key is missing

- **WHEN** the API process starts with `DB_PASSWORD` unset
- **THEN** the process exits with a non-zero status and the log contains the substring `DB_PASSWORD`

#### Scenario: `DB_PORT` is not a number

- **WHEN** the API process starts with `DB_PORT` set to `not-a-number`
- **THEN** the process exits with a non-zero status and the log identifies `DB_PORT` as the failing key

#### Scenario: No hardcoded credentials in source

- **WHEN** a developer searches `packages/api/src/` for the literal values present in `packages/api/.env.example` for `DB_USER`, `DB_PASSWORD`, or `DB_NAME`
- **THEN** no matches are found in any `.ts` file

### Requirement: An example environment file documents every required key

The repository SHALL contain `packages/api/.env.example` listing every environment variable the API needs to start, including the new database keys. The example file MUST include safe local-development defaults so that a new developer can copy the file to `.env`, run the bootstrap SQL script, and start the API without further editing. The example file MUST NOT contain production credentials.

#### Scenario: New developer copies the example to start the API

- **WHEN** a developer runs `cp packages/api/.env.example packages/api/.env` and starts MySQL locally with the matching defaults
- **THEN** `npx nx serve @wo-poc/api` boots successfully and connects to the database

#### Scenario: Example file lists every key

- **WHEN** a developer reads `packages/api/.env.example`
- **THEN** the file contains entries for `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` (in addition to any previously documented keys)

### Requirement: A single SQL script bootstraps the local schema

The repository SHALL contain `docs/database.sql` as the canonical source for the local database schema. The script MUST be idempotent — running it twice MUST NOT fail. It MUST create the database (if missing) with `utf8mb4` character set and create every table the API expects at the version reflected in this change.

#### Scenario: Fresh database bootstrap

- **WHEN** a developer runs `mysql -u <user> -p < docs/database.sql` against a MySQL instance with no `wo_poc` database
- **THEN** the script creates the `wo_poc` database with `utf8mb4` and creates the `t_issue_category` table

#### Scenario: Re-running the script does not error

- **WHEN** a developer runs `mysql -u <user> -p < docs/database.sql` a second time against a database where the schema already exists
- **THEN** the script completes without error and leaves the existing data untouched

### Requirement: The API exposes a shared connection module that feature modules consume

The API SHALL provide a single application-level `DatabaseModule` that establishes the TypeORM connection from `ConfigService`. Feature modules MUST register their entities through `TypeOrmModule.forFeature` against this single connection, not by creating their own connection. The connection MUST be created with `synchronize: false` so that the schema in `docs/database.sql` remains the single source of truth.

#### Scenario: Application starts the shared connection once

- **WHEN** the API boots
- **THEN** exactly one TypeORM `DataSource` is initialized and registered globally; no module opens a second connection

#### Scenario: TypeORM does not mutate the schema

- **WHEN** the API boots against a database where `t_issue_category` is missing a column declared on the entity
- **THEN** TypeORM does not add the column; queries that reference the missing column fail with a SQL error rather than silently succeeding
