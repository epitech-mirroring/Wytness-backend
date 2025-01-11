import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workflow } from '../workflow';
import { Actions, Policy, Resource } from '../permissions';
import { ServiceUser } from '../services';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@Entity('users')
@Actions('read', 'list', 'update', 'delete')
@Index(['firebaseId'], { unique: true })
export class User extends Resource {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('text')
  firebaseId: string;
  @Column('text', { unique: true })
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

  @JoinColumn()
  @OneToMany(() => ServiceUser, (serviceUser) => serviceUser.user)
  linkedServices: ServiceUser[];

  static resourceName: string = 'users';
}

@ApiSchema({
  name: 'FullUser',
  description:
    "The full user object, available for users you have the 'read' authorization on.",
})
export class FullUser {
  @ApiProperty({
    type: 'number',
    description: 'The internal ID of the user',
  })
  id: number;
  @ApiProperty({
    type: 'string',
    description: 'The email of the user',
  })
  email: string;
  @ApiProperty({
    type: 'string',
    description: 'The name of the user',
  })
  name: string;
  @ApiProperty({
    type: 'string',
    description: 'The surname of the user',
  })
  surname: string;
}

export class ListUser {
  id: number;
  name: string;
}
