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
