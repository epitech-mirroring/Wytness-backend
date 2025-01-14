export type ListOptions = Partial<{
  limit: number;
  offset: number;
  sort: string;
  order: 'ASC' | 'DESC';
  timeframe: Partial<{
    start: Date;
    end: Date;
  }>;
}>;
