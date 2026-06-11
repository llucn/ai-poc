import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// McpToolSchema now lives with the Tool resource; re-exported here so existing
// imports (`from '../agent/agent-tool.entity'`) keep working.
export type { McpToolSchema } from '../tool/tool.entity';

// Association table linking an Agent to a Tool (many-to-many). The Tool
// resource itself (server_name / server_url / mcp_schema) lives in t_tool.
//
// Plain columns linking to t_agent.id and t_tool.id. No DB foreign keys —
// referential integrity is enforced in the application layer (see AgentService
// / ToolService).
@Entity({ name: 't_agent_tool' })
export class AgentToolEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'agent_id', type: 'int' })
  agentId!: number;

  @Column({ name: 'tool_id', type: 'int' })
  toolId!: number;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
