## Why

The project currently uses MySQL 8 as its database. Switching to PostgreSQL 16
aligns with team infrastructure decisions and provides:

- Better JSON query capabilities (JSONB with indexing, path operators)
- Richer data type support (arrays, enums, UUID, interval)
- Superior concurrency model (MVCC without gap locks)
- More flexible indexing options (GIN, partial indexes, expression indexes)
- Better standards compliance and extensibility

The migration is a full replacement: the project drops mysql2 in favor of the pg
driver, rewrites the DDL schema, updates TypeORM configuration, and adjusts any
MySQL-specific SQL or column type annotations.

## What Changes

- Replace the `mysql2` npm dependency with `pg` (PostgreSQL driver for Node.js).
- Rewrite `docs/database.sql` from MySQL DDL to PostgreSQL 16 DDL (schema, types,
  indexes, constraints).
- Update `packages/api/src/app/database/database.module.ts` to configure TypeORM
  with `type: 'postgres'` and PostgreSQL connection defaults (port 5432).
- Update all entity files to use PostgreSQL-compatible column type annotations
  where MySQL-specific types were used (e.g., `LONGTEXT` → `text`,
  `INT AUTO_INCREMENT` → `serial` or `generated always as identity`).
- Update migration scripts to use PostgreSQL syntax.
- Update `.env.example` and documentation to reflect PostgreSQL connection params.
- Update `package.json` to swap `mysql2` for `pg`.

## Capabilities

### Modified Capabilities
- `mysql-persistence`: renamed/replaced to PostgreSQL persistence — same logical
  capability (session, message, user, agent, tool, skill persistence) but
  implemented against PostgreSQL 16.

## Impact

- **API**: `database.module.ts`, all 9 entity files, migration scripts.
- **Config**: `.env`, `.env.example`, `package.json` dependencies.
- **Docs**: `docs/database.sql` completely rewritten.
- **Infrastructure**: requires a PostgreSQL 16 instance instead of MySQL 8.
- **Data migration**: existing MySQL data must be exported and re-imported into
  PostgreSQL (out of scope for this change — assumes fresh deployment or manual
  data migration).
