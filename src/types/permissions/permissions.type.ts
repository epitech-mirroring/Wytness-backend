import { Resource, ResourceType } from './resources.type';
import { User } from '../user';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export type Effect = 'allow' | 'deny';

export type Condition<T extends Resource> = (
  user: User,
  resource: T | null,
  ctx?: any,
) => boolean;

@Entity('rules')
@Unique(['action', 'resourceType', 'effect'])
export abstract class Rule<T extends Resource> {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('text')
  action: string;
  @Column('text')
  resourceType: string;
  @Column('text')
  condition: Condition<T> | string;
  @Column('text')
  effect: Effect;

  @JoinColumn()
  @ManyToOne(() => Policy, (policy) => policy.rules)
  policy: any;
}

@Entity('policies')
export class Policy {
  @PrimaryColumn('text')
  id: string;
  @JoinColumn()
  @OneToMany(() => Rule, (rule) => rule.policy)
  rules: Rule<Resource>[];

  @ManyToMany(() => User, (user) => user.policies)
  @JoinTable({
    name: 'users_policies',
  })
  users: User[];
}
