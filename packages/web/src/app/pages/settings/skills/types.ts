// A Skill is a top-level resource.
export interface Skill {
  id: number;
  name: string;
  description: string | null;
  content: string | null;
  // Number of agents currently referencing this skill (for delete warnings).
  agentCount: number;
  createdOn: string;
  createdBy: string;
  updatedOn?: string | null;
  updatedBy?: string | null;
}
