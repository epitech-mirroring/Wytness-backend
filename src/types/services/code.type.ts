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
import { columnTypeJson } from '../global';

@Entity('codes')
export class Code {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('int')
  code: number;
  @Column('text')
  source: string;
  @Column({
    type: columnTypeJson(),
  })
  customData: any;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
