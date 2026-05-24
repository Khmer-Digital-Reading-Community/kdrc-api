import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { UserChallenge } from './user-challenge.entity';

@Entity('challenges')
export class Challenge extends BaseEntity {
  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'int' })
  targetBooks!: number;

  @Column({ type: 'date', nullable: true })
  deadline?: Date;

  @Column()
  color!: string;

  @Column({ type: 'text' })
  icon!: string;

  @OneToMany(() => UserChallenge, (uc) => uc.challenge)
  userChallenges?: UserChallenge[];
}
