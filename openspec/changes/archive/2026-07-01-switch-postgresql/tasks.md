# Implementation Tasks

## 1. Dependency swap

- [x] 1.1 Remove `mysql2` from `package.json` dependencies
- [x] 1.2 Add `pg` to `package.json` dependencies
- [x] 1.3 Run `npm install` to update `node_modules` and lockfile

## 2. TypeORM configuration

- [x] 2.1 Update `packages/api/src/app/database/database.module.ts`: change `type: 'mysql'` to `type: 'postgres'`

## 3. Entity column type updates

- [x] 3.1 `user.entity.ts`: change `is_available` from `{ type: 'int', default: 1 }` to `{ type: 'boolean', default: true }`; update TypeScript field type from `number` to `boolean`
- [x] 3.2 `agent.entity.ts`: change `is_default` from `{ type: 'int', default: 0 }` to `{ type: 'boolean', default: false }`; update field type. Change `system_prompt` from `'longtext'` to `'text'`. Change `model_config` from `'json'` to `'jsonb'`
- [x] 3.3 `message.entity.ts`: change `is_thought` from `{ type: 'int', default: 0 }` to `{ type: 'boolean', default: false }`; update field type. Change `content` from `'longtext'` to `'text'`. Change `native_content` from `'json'` to `'jsonb'`
- [x] 3.4 `tool.entity.ts`: change `mcp_schema` from `'json'` to `'jsonb'`
- [x] 3.5 `skill.entity.ts`: change `content` from `'longtext'` to `'text'`
- [x] 3.6 `pending-client-call.entity.ts`: change `params` from `'json'` to `'jsonb'`. Change `message_context` from `'json'` to `'jsonb'`

## 4. Application code adjustments for boolean fields

- [x] 4.1 Search for all usages of `isAvailable`, `isDefault`, `isThought` in service/controller code; update any `=== 1` / `=== 0` comparisons to `=== true` / `=== false` (or truthy/falsy)
- [x] 4.2 Update any DTOs or response serialization that depend on these fields being `number` to use `boolean`

## 5. DDL schema rewrite

- [x] 5.1 Rewrite `docs/database.sql` to PostgreSQL 16 syntax: replace `CREATE DATABASE` charset/collation with PostgreSQL equivalent, use `SERIAL PRIMARY KEY`, `TEXT` instead of `LONGTEXT`, `JSONB` instead of `JSON`, `BOOLEAN` instead of `INT 0/1`, `DEFAULT NOW()` instead of `DEFAULT CURRENT_TIMESTAMP`, remove `ON UPDATE CURRENT_TIMESTAMP`, remove `ENGINE=InnoDB` and charset clauses, use separate `CREATE INDEX` statements
- [x] 5.2 Update seed `INSERT` statements for boolean values (`TRUE`/`FALSE` instead of `1`/`0`)
- [x] 5.3 Remove or rewrite `migrations/002_parallel_tool_use.sql` to PostgreSQL syntax (or mark as superseded since the new DDL already includes the composite index)

## 6. Environment and documentation

- [x] 6.1 Update `packages/api/.env.example`: change `DB_PORT=3306` to `DB_PORT=5432`
- [x] 6.2 Update any README or docs referencing MySQL to mention PostgreSQL 16

## 7. Verification

- [x] 7.1 Confirm TypeScript compiles cleanly: `tsc --noEmit`
- [x] 7.2 Confirm build passes: `nx build api`
- [ ] 7.3 Connect to a local PostgreSQL 16 instance, run the new `docs/database.sql`, verify all tables and indexes are created
- [ ] 7.4 Start the API server against the PostgreSQL instance, verify startup with no TypeORM errors
- [ ] 7.5 Smoke-test basic CRUD operations (create user, create session, send message) to verify entity mappings work correctly
