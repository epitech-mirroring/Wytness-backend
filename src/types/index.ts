export type IdOf<T> = T extends { id: infer U } ? U : never;

export * from './user';
export * from './services';
export * from './auth';
