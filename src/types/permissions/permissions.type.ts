import { Resource, ResourceType } from './resources.type';
import { User } from '../user';

export type Effect = 'allow' | 'deny';

export type Condition<T extends Resource> = (
  user: Omit<User, 'actions'>,
  resource: T | null,
  ctx?: any,
) => boolean;

export interface Rule<T extends Resource> {
  id: number;
  action: T['actions'];
  resourceType: ResourceType;
  condition: Condition<T>;
  effect: Effect;
}

export interface Policy {
  id: string;
  rules: Rule<Resource>[];
}
