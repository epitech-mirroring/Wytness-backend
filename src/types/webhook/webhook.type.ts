import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Service, ServiceWithWebhooks } from '../services';
import { WorkflowNode } from '../workflow';
import { User } from '../user';

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('boolean', { default: false })
  managed?: boolean;

  @JoinColumn()
  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  public owner: User;

  @JoinColumn()
  @ManyToOne(() => Service, {
    nullable: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  manager: ServiceWithWebhooks | null;

  @JoinColumn()
  @OneToOne(() => WorkflowNode, {
    nullable: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  node: WorkflowNode | null;
}
