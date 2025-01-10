import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user';

@Entity('codes')
export class Code {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('int')
  code: number;
  @Column('text')
  source: string;
  @Column('simple-json')
  customData: any;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
