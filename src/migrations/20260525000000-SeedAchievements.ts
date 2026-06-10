import { MigrationInterface, QueryRunner } from 'typeorm';

const ACHIEVEMENTS = [
  {
    id: 'f1111111-1111-4111-8111-111111111111',
    name: 'First Review',
    description: 'Awarded after posting the first review.',
    icon: '⭐',
    color: '#f59e0b',
    category: 'contribution',
  },
  {
    id: 'f2222222-2222-4222-8222-222222222222',
    name: 'Streak Reader',
    description: 'Granted for reading on multiple consecutive days.',
    icon: '🔥',
    color: '#ef4444',
    category: 'streak',
  },
  {
    id: 'a1000001-0000-4000-8000-000000000001',
    name: 'First Chapter',
    description: 'Read your first book.',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
    color: '#c5a050',
    category: 'milestone',
  },
  {
    id: 'a1000001-0000-4000-8000-000000000002',
    name: 'Bookworm',
    description: 'Read 10 books.',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path stroke-linecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>',
    color: '#1c3a2e',
    category: 'milestone',
  },
  {
    id: 'a1000001-0000-4000-8000-000000000003',
    name: 'Bibliophile',
    description: 'Read 25 books.',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v12c0 .552.224 1.052.586 1.414C4.964 20.776 5.464 21 6 21h14M4 7c0-.552.224-1.052.586-1.414C4.964 5.224 5.464 5 6 5h14v14H6c-.536 0-1.036-.224-1.414-.586C4.224 18.052 4 17.552 4 17z"/></svg>',
    color: '#1c3a2e',
    category: 'milestone',
  },
  {
    id: 'a1000001-0000-4000-8000-000000000004',
    name: '7-Day Streak',
    description: 'Read 7 days in a row.',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    color: '#c5a050',
    category: 'streak',
  },
  {
    id: 'a1000001-0000-4000-8000-000000000005',
    name: '30-Day Streak',
    description: 'Read 30 days in a row.',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    color: '#c5a050',
    category: 'streak',
  },
  {
    id: 'a1000001-0000-4000-8000-000000000006',
    name: 'Khmer Lit Enthusiast',
    description: 'Read 5 Khmer books.',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    color: '#c5a050',
    category: 'genre',
  },
  {
    id: 'a1000001-0000-4000-8000-000000000007',
    name: 'Reviewer',
    description: 'Write 10 reviews.',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>',
    color: '#c5a050',
    category: 'contribution',
  },
  {
    id: 'a1000001-0000-4000-8000-000000000008',
    name: 'Community Voice',
    description: 'Write 50 reviews.',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
    color: '#c5a050',
    category: 'contribution',
  },
  {
    id: 'a1000001-0000-4000-8000-000000000009',
    name: 'Night Owl',
    description: 'Read after midnight 10 times.',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>',
    color: '#3a5fa5',
    category: 'special',
  },
  {
    id: 'a1000001-0000-4000-8000-000000000010',
    name: 'Weekend Reader',
    description: 'Read on 10 weekends.',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg>',
    color: '#0f6e56',
    category: 'special',
  },
];

export class SeedAchievements20260525000000 implements MigrationInterface {
  name = 'SeedAchievements20260525000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const a of ACHIEVEMENTS) {
      await queryRunner.query(
        `INSERT INTO achievements (id, name, description, icon, color, category, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           icon = EXCLUDED.icon,
           color = EXCLUDED.color,
           category = EXCLUDED.category`,
        [a.id, a.name, a.description, a.icon, a.color, a.category],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const a of ACHIEVEMENTS) {
      await queryRunner.query(`DELETE FROM achievements WHERE id = $1`, [a.id]);
    }
  }
}
