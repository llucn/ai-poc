import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// A single tool parsed from an MCP server's registration info.
export interface McpToolSchema {
  name: string;
  description?: string | null;
  parameters?: unknown | null;
}

// A Tool is a top-level resource representing one MCP server. It is associated
// with Agents through t_agent_tool (many-to-many). server_name is kebab-case
// and globally unique.
@Entity({ name: 't_tool' })
export class ToolEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'server_name', type: 'varchar', length: 255, unique: true })
  serverName!: string;

  @Column({ name: 'server_url', type: 'varchar', length: 2048 })
  serverUrl!: string;

  // Parsed MCP registration info: array of { name, description, parameters }.
  @Column({ name: 'mcp_schema', type: 'json', nullable: true })
  mcpSchema!: McpToolSchema[] | null;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
