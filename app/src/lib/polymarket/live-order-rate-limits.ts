import "server-only";

export type LiveOrderRateLimitPhase = "prepare" | "submit";

export type LiveOrderRateLimitDecision =
  | { allowed: true; remaining: number; resetAt: string | null }
  | {
      allowed: false;
      code: "rate_limited" | "cooldown_active";
      resetAt: string;
    };

export type LiveOrderRateLimitStore = {
  check(input: {
    phase: LiveOrderRateLimitPhase;
    walletAddress: string;
    now: number;
  }): Promise<LiveOrderRateLimitDecision>;
  checkCooldown(input: {
    walletAddress: string;
    now: number;
  }): Promise<LiveOrderRateLimitDecision>;
  recordFailedSubmit(input: { walletAddress: string; now: number }): Promise<void>;
};

const POLICIES: Record<
  LiveOrderRateLimitPhase,
  { limit: number; windowMs: number }
> = {
  prepare: { limit: 30, windowMs: 60_000 },
  submit: { limit: 5, windowMs: 60_000 }
};

const FAILED_SUBMIT_COOLDOWN = {
  limit: 3,
  windowMs: 15 * 60_000
};

function resetAt(now: number, windowMs: number) {
  return new Date(now + windowMs).toISOString();
}

export class PolymarketLiveOrderRateLimitError extends Error {
  constructor(
    public readonly code: "rate_limited" | "cooldown_active",
    public readonly resetAt: string
  ) {
    super(code);
  }
}

export function createMemoryLiveOrderRateLimitStore(): LiveOrderRateLimitStore {
  const buckets = new Map<string, number[]>();
  const failures = new Map<string, number[]>();

  function readBucket(key: string, now: number, windowMs: number) {
    const cutoff = now - windowMs;
    const values = (buckets.get(key) ?? []).filter((value) => value > cutoff);
    buckets.set(key, values);
    return values;
  }

  return {
    async check(input) {
      const policy = POLICIES[input.phase];
      const key = `${input.phase}:${input.walletAddress.toLowerCase()}`;
      const values = readBucket(key, input.now, policy.windowMs);

      if (values.length >= policy.limit) {
        return {
          allowed: false,
          code: "rate_limited",
          resetAt: resetAt(values[0] ?? input.now, policy.windowMs)
        };
      }

      values.push(input.now);
      buckets.set(key, values);
      return {
        allowed: true,
        remaining: Math.max(policy.limit - values.length, 0),
        resetAt: values[0] ? resetAt(values[0], policy.windowMs) : null
      };
    },
    async checkCooldown(input) {
      const key = input.walletAddress.toLowerCase();
      const cutoff = input.now - FAILED_SUBMIT_COOLDOWN.windowMs;
      const values = (failures.get(key) ?? []).filter((value) => value > cutoff);
      failures.set(key, values);

      if (values.length >= FAILED_SUBMIT_COOLDOWN.limit) {
        return {
          allowed: false,
          code: "cooldown_active",
          resetAt: resetAt(values[0] ?? input.now, FAILED_SUBMIT_COOLDOWN.windowMs)
        };
      }

      return {
        allowed: true,
        remaining: Math.max(FAILED_SUBMIT_COOLDOWN.limit - values.length, 0),
        resetAt: values[0]
          ? resetAt(values[0], FAILED_SUBMIT_COOLDOWN.windowMs)
          : null
      };
    },
    async recordFailedSubmit(input) {
      const key = input.walletAddress.toLowerCase();
      failures.set(key, [...(failures.get(key) ?? []), input.now]);
    }
  };
}

const defaultRateLimitStore = createMemoryLiveOrderRateLimitStore();

export async function assertPolymarketLiveOrderRateLimit(input: {
  phase: LiveOrderRateLimitPhase;
  walletAddress: string;
  store?: LiveOrderRateLimitStore;
  now?: number;
}) {
  const decision = await (input.store ?? defaultRateLimitStore).check({
    phase: input.phase,
    walletAddress: input.walletAddress,
    now: input.now ?? Date.now()
  });
  if (!decision.allowed) {
    throw new PolymarketLiveOrderRateLimitError(
      decision.code,
      decision.resetAt
    );
  }
  return decision;
}

export async function assertPolymarketFailedSubmitCooldown(input: {
  walletAddress: string;
  store?: LiveOrderRateLimitStore;
  now?: number;
}) {
  const decision = await (input.store ?? defaultRateLimitStore).checkCooldown({
    walletAddress: input.walletAddress,
    now: input.now ?? Date.now()
  });
  if (!decision.allowed) {
    throw new PolymarketLiveOrderRateLimitError(
      decision.code,
      decision.resetAt
    );
  }
  return decision;
}

export async function recordPolymarketFailedSubmitForCooldown(input: {
  walletAddress: string;
  store?: LiveOrderRateLimitStore;
  now?: number;
}) {
  await (input.store ?? defaultRateLimitStore).recordFailedSubmit({
    walletAddress: input.walletAddress,
    now: input.now ?? Date.now()
  });
}

export function isLiveOrderRateLimitError(
  error: unknown
): error is PolymarketLiveOrderRateLimitError {
  return error instanceof PolymarketLiveOrderRateLimitError;
}
