import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workflow } from '../workflow';
import { Actions, Policy, Resource } from '../permissions';

@Entity('users')
@Actions('read', 'list', 'update', 'delete')
export class User extends Resource {
  @PrimaryGeneratedColumn()
  id: number;
  @PrimaryColumn('text')
  firebaseId: string;
  @PrimaryColumn('text')
  email: string;
  @Column('text')
  name: string;
  @Column('text')
  surname: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  @JoinColumn()
  @OneToMany(() => Workflow, (workflow) => workflow.owner)
  workflows: Workflow[];

  @JoinColumn()
  @ManyToMany(() => Policy, (policy) => policy.users)
  policies: Policy[];

  static resourceName: string = 'users';
}

export type FullUser = {
  id: number;
  email: string;
  name: string;
  surname: string;
};

export type ListUser = {
  id: number;
  name: string;
};
