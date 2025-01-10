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

@Entity('service_users')
export class ServiceUser {
  @PrimaryGeneratedColumn()
  id: number;
  @JoinColumn()
  @ManyToOne(() => Service)
  service: Service;
  @JoinColumn()
  @ManyToOne(() => User)
  user: User;
  @Column('simple-json')
  customData: any;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
