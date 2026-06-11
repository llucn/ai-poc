// Create a Skill. name must be kebab-case and globally unique.
export interface CreateSkillDto {
  name: string;
  description?: string | null;
  content?: string | null;
}

// Update a Skill. name (if provided) must remain kebab-case and unique.
export interface UpdateSkillDto {
  name?: string;
  description?: string | null;
  content?: string | null;
}

export interface DeleteSkillsDto {
  ids: number[];
}
