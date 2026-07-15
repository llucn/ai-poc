export class CreateJobDto {
  name!: string;
  agentId!: number;
  content!: string;
}

export class UpdateJobDto {
  name?: string;
  agentId?: number;
  content?: string;
}

export class DeleteJobsDto {
  ids!: number[];
}
