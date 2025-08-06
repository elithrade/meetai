export type GetManyAgentsParams = {
  userId: string;
  page: number;
  pageSize: number;
  search?: string | null;
};

export type GetManyAgentsResult = {
  items: Array<{
    meetingCount: number;
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  totalPages: number;
};
