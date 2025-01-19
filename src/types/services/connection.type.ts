import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from './service.type';
import { User } from '../user';
import { columnTypeJson, useSqlite } from '../global';

@Entity('service_users')
export class ServiceUser {
  @PrimaryGeneratedColumn()
  id: number;
  @JoinColumn()
  @ManyToOne(() => Service, (service) => service.linkedUsers)
  service: Service;
  @JoinColumn()
  @ManyToOne(() => User, (user) => user.linkedServices)
  user: User;
  @Column({
    type: columnTypeJson(),
    default: useSqlite() ? '{}' : {},
  })
  customData: any;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
