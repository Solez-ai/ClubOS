/**
 * PostgREST slug/id resolution helpers.
 *
 * Problem: `.or(\`slug.eq.${slug},id.eq.${slug}\`)` makes Postgres type-infer
 * the shared comparison value as uuid (because of the `id` clause), so a
 * plain slug like "my-event-abc123" throws
 * `22P02 invalid input syntax for type uuid` and the whole query fails.
 *
 * Fix: only combine slug+id when the value actually looks like a UUID;
 * otherwise filter by slug alone (a single-clause `.or()` is valid PostgREST).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveSlugFilter(slug: string): string {
  return UUID_RE.test(slug)
    ? `slug.eq.${slug},id.eq.${slug}`
    : `slug.eq.${slug}`;
}
