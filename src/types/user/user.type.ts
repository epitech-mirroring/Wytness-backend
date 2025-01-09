import { PrismaTableName, Resource } from '../permissions';

export class User extends Resource {
  id: number;
  email: string;
  name: string;
  surname: string;
  createdAt: Date;
  updatedAt: Date;

  actions: 'read' | 'update' | 'delete';
  static resourceName: PrismaTableName = 'User';
}
