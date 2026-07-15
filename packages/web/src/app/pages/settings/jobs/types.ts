export interface Job {
  id: number;
  agentId: number;
  agentName?: string;
  name: string;
  content: string | null;
  cronExp: string | null;
  jobDetail: string | null;
  createdOn: string;
  createdBy: string;
  updatedOn: string | null;
  updatedBy: string | null;
}

export interface JobLog {
  id: number;
  jobId: number;
  jobLog: string | null;
  jobStatus: number | null;
  createdOn: string;
  createdBy: string;
  updatedOn: string | null;
  updatedBy: string | null;
}
