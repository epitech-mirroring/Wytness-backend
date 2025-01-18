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

export const base64_urlencode = (str: string | ArrayBuffer) => {
  const uint8 =
    typeof str === 'string'
      ? new TextEncoder().encode(str)
      : new Uint8Array(str);
  return btoa(String.fromCharCode.apply(null, uint8))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const columnTypeTimestamp = () => {
  return useSqlite() ? 'bigint' : 'timestamp';
};

export const columnTypeJson = () => {
  return useSqlite() ? 'simple-json' : 'jsonb';
};

export const columnTypeEnum = () => {
  return useSqlite() ? 'simple-enum' : 'enum';
};

export const useSqlite = () => {
  return getNodeEnv() === 'test';
};

export const getNodeEnv = () => {
  return process.env.NODE_ENV;
};

export const isProduction = () => {
  return getNodeEnv() !== 'development' && getNodeEnv() !== 'test';
};
