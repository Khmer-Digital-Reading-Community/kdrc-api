import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { UserAchievement } from './user-achievement.entity';

@Entity('achievements')
export class Achievement extends BaseEntity {
  @Column()
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  icon!: string;

  @Column()
  color!: string;

  @Column()
  category!: string;

  @OneToMany(() => UserAchievement, (ua) => ua.achievement)
  userAchievements?: UserAchievement[];
}
