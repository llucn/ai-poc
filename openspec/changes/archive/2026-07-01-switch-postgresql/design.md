## Context

The project uses MySQL 8 with the `mysql2` driver. TypeORM is configured with
`type: 'mysql'` in `database.module.ts`. The schema lives in `docs/database.sql`
(224 lines, 9 tables). All entities use `INT AUTO_INCREMENT` primary keys,
`LONGTEXT` for large text fields, `JSON` for structured data, and MySQL-specific
`TIMESTAMP ... ON UPDATE CURRENT_TIMESTAMP` for audit columns. There are no
stored procedures, triggers, or views — the schema is pure DDL with seed inserts.

TypeORM `synchronize` is `false`; schema management is manual via SQL scripts.
Connection params come from environment variables: `DB_HOST`, `DB_PORT`,
`DB_USER`, `DB_PASSWORD`, `DB_NAME`.

Target: **PostgreSQL 16.14** with the `pg` driver.

## Goals / Non-Goals

**Goals:**
- Replace MySQL with PostgreSQL 16 as the only supported database.
- Rewrite the DDL schema to idiomatic PostgreSQL.
- Update TypeORM config and all entity column annotations.
- Swap `mysql2` dependency for `pg` + `@types/pg`.
- Maintain identical application behavior (no API contract changes).
- Provide a working PostgreSQL setup script (CREATE DATABASE + tables + seed).

**Non-Goals:**
- No data migration tooling from existing MySQL instances (fresh deploy assumed).
- No support for running both MySQL and PostgreSQL simultaneously.
- No introduction of PostgreSQL-specific features beyond what the schema needs
  (e.g., no switch to UUID primary keys, no JSONB operators in app code yet).
- No change to the application code beyond database layer (entities, config, DDL).

## Decisions

### Decision 1: Column type mappings
| MySQL | PostgreSQL | Notes |
|-------|-----------|-------|
| `INT AUTO_INCREMENT` | `SERIAL` (or `INTEGER GENERATED ALWAYS AS IDENTITY`) | Use `SERIAL` for brevity |
| `VARCHAR(n)` | `VARCHAR(n)` | Identical |
| `TEXT` | `TEXT` | Identical |
| `LONGTEXT` | `TEXT` | PostgreSQL TEXT has no length limit |
| `JSON` | `JSONB` | Binary JSON for better indexing/query |
| `INT NOT NULL DEFAULT 0/1` (booleans) | `BOOLEAN NOT NULL DEFAULT FALSE/TRUE` | Idiomatic PG; entity uses `boolean` type |
| `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMP DEFAULT NOW()` | Equivalent |
| `TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | (removed; app-layer handles it) | PG has no `ON UPDATE`; TypeORM `@UpdateDateColumn` already manages this |

- **Why JSONB over JSON**: JSONB is the standard choice in PostgreSQL for stored
  JSON — it's indexable, supports containment operators, and slightly more
  efficient for reads. The app doesn't use MySQL JSON functions, so no code change.
- **Why SERIAL over IDENTITY**: simpler syntax, widely used, and TypeORM maps
  `@PrimaryGeneratedColumn()` to SERIAL by default for postgres.

### Decision 2: Boolean columns
MySQL uses `INT 0/1` for `is_available`, `is_default`, `is_thought`. In
PostgreSQL, use native `BOOLEAN` with `DEFAULT FALSE`/`DEFAULT TRUE`.

Entity decorators change from `{ type: 'int', default: 0 }` to
`{ type: 'boolean', default: false }`. Application code already treats these as
truthy/falsy, so the TypeScript interfaces remain `number` → `boolean` (or keep
as number if entity layer coerces — decision: switch to `boolean` in entities for
correctness).

- **Why**: idiomatic PostgreSQL; avoids confusion about integer-as-boolean; TypeORM
  handles the mapping automatically.

### Decision 3: Audit column `updated_on` without ON UPDATE
MySQL `ON UPDATE CURRENT_TIMESTAMP` auto-sets `updated_on` on any row change.
PostgreSQL has no equivalent built-in. Two options:
1. A trigger (`BEFORE UPDATE SET updated_on = NOW()`)
2. Let the application layer (TypeORM `@UpdateDateColumn()`) handle it

Choice: **TypeORM `@UpdateDateColumn()`** — it already exists on `updatedOn`
fields in the entities. The MySQL `ON UPDATE` was redundant with TypeORM's
behavior. No trigger needed.

- **Why**: simpler, no PL/pgSQL dependency, already handled in app code.

### Decision 4: Index and constraint naming
Keep the same logical index names (e.g., `idx_user_name`, `idx_pending_call_id`).
PostgreSQL uses `CREATE INDEX` rather than inline `INDEX` in `CREATE TABLE`, so
the DDL structure changes but names stay the same.

### Decision 5: Dependency swap
Remove `mysql2` from `package.json`, add `pg` (runtime). No `@types/pg` needed
as TypeORM handles the driver internally.

- **Why**: `pg` is the standard PostgreSQL driver for Node.js; TypeORM requires
  it when `type: 'postgres'`.

### Decision 6: Default port change
`DB_PORT` default expectation changes from 3306 (MySQL) to 5432 (PostgreSQL).
The config module (`app-config.ts`) reads it from env, so no code change — just
documentation and `.env.example` update.

## Risks / Trade-offs

- **[Boolean type change breaks existing code]** → low risk: entity fields that
  were `number` (0/1) become `boolean`. TypeScript compiler will catch mismatches.
  Any `=== 1` or `=== 0` comparisons must change to `=== true`/`=== false`.
- **[JSONB vs JSON compatibility]** → no risk for writes (accepts same input).
  JSONB normalizes key order and deduplicates keys, but the app doesn't depend on
  key ordering. Reads return identical JavaScript objects.
- **[Existing migration scripts]** → the migration `002_parallel_tool_use.sql`
  uses MySQL `ALTER TABLE` syntax. Must be rewritten or marked as superseded
  (since the new DDL already includes the composite unique index).
- **[Seed data]** → MySQL `INSERT INTO ... VALUES` syntax is compatible with
  PostgreSQL. Only difference: string escaping (both use single quotes). No issue.

## Migration Plan

1. Swap dependency: remove `mysql2`, add `pg` in `package.json`.
2. Update `database.module.ts`: change `type: 'mysql'` to `type: 'postgres'`.
3. Rewrite `docs/database.sql` to PostgreSQL 16 DDL.
4. Update all entity files: adjust column type annotations for PG compatibility
   (LONGTEXT→text, JSON→jsonb, INT booleans→boolean).
5. Update `.env.example` with PostgreSQL defaults (port 5432).
6. Rewrite/remove MySQL migration scripts.
7. Verify: `tsc --noEmit`, `nx build api`, connect to a local PG 16 instance.
