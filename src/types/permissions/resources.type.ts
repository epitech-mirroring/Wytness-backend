import { Prisma } from '@prisma/client';

export type PrismaTableName = keyof Prisma.TypeMap['model'];

export abstract class Resource {
  id: number;
  actions: string;

  static resourceName: PrismaTableName;
}

export type ResourceType = typeof Resource & { resourceName: string };

export type IdOf<T> = T extends { id: infer U } ? U : never;
