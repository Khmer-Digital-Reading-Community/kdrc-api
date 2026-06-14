import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import { databaseConfig } from '../common/config/database.config';
import { SubscriptionPlan } from '../modules/subscriptions/subscription-plan.entity';

const plans = [
  {
    name: 'Free',
    description:
      'Start your reading journey at no cost. Access our curated library of free books including classic Khmer literature, educational content, and public domain works. Write and publish your own stories and share them with the community.',
    price: 0,
    durationDays: 36500,
    features: [
      'Access free book library',
      'Read classic & public domain books',
      'Write and publish stories',
      'Basic author profile',
      'Community access',
    ],
    isActive: true,
  },
  {
    name: 'Premium',
    description:
      'Unlock the full KDRC experience. Get unlimited access to premium stories, exclusive chapters, and early access to new releases. Support your favorite authors and elevate your reading and writing journey.',
    price: 5,
    durationDays: 30,
    features: [
      'Everything in Free',
      'Unlimited premium stories',
      'Exclusive chapters',
      'Early access to new books',
      'Ad-free reading experience',
    ],
    isActive: true,
  },
];

async function seed() {
  const dataSource = new DataSource(databaseConfig as any);
  await dataSource.initialize();

  const repo = dataSource.getRepository(SubscriptionPlan);

  // Deactivate all existing plans first
  await repo.createQueryBuilder()
    .update(SubscriptionPlan)
    .set({ isActive: false })
    .execute();

  for (const plan of plans) {
    const existing = await repo.findOne({ where: { name: plan.name } });
    if (existing) {
      await repo.update(existing.id, plan);
      console.log(`Updated plan: ${plan.name}`);
    } else {
      await repo.save(repo.create(plan));
      console.log(`Created plan: ${plan.name}`);
    }
  }

  console.log('Subscription plans seeded successfully.');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
