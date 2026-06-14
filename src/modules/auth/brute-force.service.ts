import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

// ── Thresholds ────────────────────────────────────────────────────────────────

/** Max failed login attempts before blocking (exclusive — count > this = block). */
const LOGIN_MAX_ATTEMPTS = 5;

/** Time window for counting login failures (seconds). */
const LOGIN_WINDOW_SECONDS = 900; // 15 min

/** Duration to block after exceeding LOGIN_MAX_ATTEMPTS (seconds). */
const LOGIN_BLOCK_SECONDS = 900; // 15 min

/** Max total failures from a single IP across all emails. */
const IP_MAX_ATTEMPTS = 15;

/** Time window for IP-wide counting (seconds). */
const IP_WINDOW_SECONDS = 900; // 15 min

/** Duration to block an IP after exceeding IP_MAX_ATTEMPTS (seconds). */
const IP_BLOCK_SECONDS = 1800; // 30 min

/** Max registrations per IP in the configured window. */
const REGISTER_MAX_PER_WINDOW = 5;

/** Time window for counting registrations (seconds). */
const REGISTER_WINDOW_SECONDS = 3600; // 1 hour

/**
 * Progressive delay per attempt number (1-indexed).
 * Index 0 = attempt 1, index 1 = attempt 2, etc.
 * Attempt 6+ falls through to the block path so no entry needed.
 */
const DELAY_MS: number[] = [0, 0, 0, 3000, 10000]; // 1→0, 2→0, 3→0, 4→3s, 5→10s

// ── Cache key helpers ─────────────────────────────────────────────────────────

const keyLogin = (ip: string, email: string) =>
  `bf:login:${ip}:${email}`;

const keyIp = (ip: string) => `bf:ip:${ip}`;

const keyRegister = (ip: string) => `bf:register:${ip}`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoginAttemptRecord {
  count: number;
  blockedUntil: number | null; // epoch ms
  lastAttempt: number; // epoch ms
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class BruteForceService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  // ── Login helpers ─────────────────────────────────────────────────────────

  /**
   * Check whether a login attempt is allowed.
   * - Throws `UnauthorizedException('Invalid credentials')` if blocked.
   * - Awaits a progressive delay before returning when the caller is near the limit.
   *
   * **Important:** The error message is identical to a normal credential failure
   * so attackers cannot distinguish "blocked" from "wrong password."
   */
  async checkLoginAllowed(ip: string, email: string): Promise<void> {
    const normEmail = this.normalizeEmail(email);

    // 1. Per-IP+email check
    const record = await this.cache.get<LoginAttemptRecord>(
      keyLogin(ip, normEmail),
    );

    if (record) {
      // Blocked?
      if (record.blockedUntil && record.blockedUntil > Date.now()) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Was previously blocked but now expired → reset the window
      if (record.blockedUntil && record.blockedUntil <= Date.now()) {
        await this.cache.del(keyLogin(ip, normEmail));
      }
    }

    // 2. IP-wide check
    const ipCount = (await this.cache.get<number>(keyIp(ip))) ?? 0;
    if (ipCount >= IP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Progressive delay (only if not blocked and not first attempt)
    if (record && record.count > 0 && record.count <= DELAY_MS.length) {
      const delay = DELAY_MS[record.count - 1] ?? 0;
      if (delay > 0) {
        await this.sleep(delay);
      }
    }
  }

  /**
   * Record a failed login attempt. Must be called AFTER the credential check fails.
   */
  async recordLoginFailure(ip: string, email: string): Promise<void> {
    const normEmail = this.normalizeEmail(email);
    const loginKey = keyLogin(ip, normEmail);

    const existing = await this.cache.get<LoginAttemptRecord>(loginKey);
    const count = (existing?.count ?? 0) + 1;
    const blockedUntil =
      count > LOGIN_MAX_ATTEMPTS
        ? Date.now() + LOGIN_BLOCK_SECONDS * 1000
        : null;

    const record: LoginAttemptRecord = {
      count,
      blockedUntil,
      lastAttempt: Date.now(),
    };

    const ttlMs =
      (blockedUntil
        ? LOGIN_BLOCK_SECONDS + LOGIN_WINDOW_SECONDS
        : LOGIN_WINDOW_SECONDS) * 1000;

    await this.cache.set(loginKey, record, ttlMs);

    // Also increment IP-wide counter
    const ipCount = (await this.cache.get<number>(keyIp(ip))) ?? 0;
    await this.cache.set(
      keyIp(ip),
      ipCount + 1,
      IP_WINDOW_SECONDS * 1000,
    );
  }

  /**
   * Clear all failure records for an IP+email pair. Called on successful login.
   * Also decrements the IP-wide counter by the number of cleared attempts.
   */
  async clearLoginAttempts(ip: string, email: string): Promise<void> {
    const normEmail = this.normalizeEmail(email);
    const loginKey = keyLogin(ip, normEmail);

    const record = await this.cache.get<LoginAttemptRecord>(loginKey);
    const clearedCount = record?.count ?? 0;

    await this.cache.del(loginKey);

    // Decrement IP-wide counter
    if (clearedCount > 0) {
      const ipCount = (await this.cache.get<number>(keyIp(ip))) ?? 0;
      const remaining = ipCount - clearedCount;
      if (remaining <= 0) {
        await this.cache.del(keyIp(ip));
      } else {
        await this.cache.set(keyIp(ip), remaining, IP_WINDOW_SECONDS * 1000);
      }
    }
  }

  // ── Register helpers ──────────────────────────────────────────────────────

  /**
   * Check whether a registration is allowed from this IP.
   * Throws `BadRequestException` if the limit is exceeded.
   */
  async checkRegisterAllowed(ip: string): Promise<void> {
    const count = (await this.cache.get<number>(keyRegister(ip))) ?? 0;
    if (count >= REGISTER_MAX_PER_WINDOW) {
      throw new BadRequestException(
        'Too many registration attempts. Please try again later.',
      );
    }
  }

  /**
   * Record a successful registration from this IP.
   */
  async recordRegistration(ip: string): Promise<void> {
    const key = keyRegister(ip);
    const count = (await this.cache.get<number>(key)) ?? 0;
    await this.cache.set(key, count + 1, REGISTER_WINDOW_SECONDS * 1000);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
