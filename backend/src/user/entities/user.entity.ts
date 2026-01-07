import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Todo } from '../../todo/entities/todo.entity';
import { Report } from '../../report/entities/report.entity';
import { Exclude } from 'class-transformer';

export enum LoginType {
  PHONE = 'phone',
  EMAIL = 'email',
  WECHAT = 'wechat',
  GOOGLE = 'google',
  GITHUB = 'github',
}

export enum AccountType {
  FREE = 'free',
  PRO = 'pro',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  wechatOpenId: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true, unique: true })
  githubId: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: LoginType,
    default: LoginType.EMAIL,
  })
  loginType: LoginType;

  // 账户类型
  @Column({
    type: 'enum',
    enum: AccountType,
    default: AccountType.FREE,
  })
  accountType: AccountType;

  // 订阅状态
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.EXPIRED,
  })
  subscriptionStatus: SubscriptionStatus;

  // 订阅到期时间
  @Column({ type: 'timestamp', nullable: true })
  subscriptionExpireAt: Date;

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];

  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 检查是否是Pro用户且订阅有效
  isPro(): boolean {
    if (this.accountType !== AccountType.PRO) return false;
    if (this.subscriptionStatus !== SubscriptionStatus.ACTIVE) return false;
    if (!this.subscriptionExpireAt) return false;
    return new Date() < new Date(this.subscriptionExpireAt);
  }
}

