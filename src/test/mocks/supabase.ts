import { vi } from "vitest";

/**
 * Creates a chainable Supabase query builder mock.
 *
 * Each builder method returns `this` so calls like
 *   supabase.from("t").select("*").eq("id", 1).order(...)
 * work without extra configuration.
 *
 * Call `mockResolvedData(data)` or `mockResolvedError(error)` on the
 * returned builder to control what `.select()` / `.upsert()` etc. resolve to.
 */
export function createMockQueryBuilder(
  resolvedValue: { data: unknown; error: unknown } = { data: null, error: null }
) {
  const builder: Record<string, ReturnType<typeof vi.fn>> & {
    _resolved: { data: unknown; error: unknown };
  } = {
    _resolved: resolvedValue,
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    gt: vi.fn(),
    lt: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    like: vi.fn(),
    ilike: vi.fn(),
    in: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    range: vi.fn(),
    filter: vi.fn(),
    match: vi.fn(),
    or: vi.fn(),
    not: vi.fn(),
  };

  // Make every method chainable and resolve to the stored value when awaited
  for (const key of Object.keys(builder)) {
    if (key.startsWith("_")) continue;
    builder[key] = vi.fn().mockImplementation(() => {
      // Return a thenable that also carries the chain methods
      const thenable = {
        ...builder,
        then: (resolve: (v: unknown) => void) =>
          resolve(builder._resolved),
      };
      return thenable;
    });
  }

  return builder;
}

/**
 * Creates a mock of the supabase client that is compatible with the real
 * `@supabase/supabase-js` client interface used in this project.
 */
export function createMockSupabaseClient() {
  const defaultQueryBuilder = createMockQueryBuilder();

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue(defaultQueryBuilder),
    // Expose the default builder so tests can configure it
    _defaultQueryBuilder: defaultQueryBuilder,
  };

  return client;
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
