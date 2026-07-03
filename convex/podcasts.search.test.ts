import { convexTest } from 'convex-test';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import schema from './schema';

// Load all Convex modules for the in-memory test backend.
const modules = import.meta.glob('./**/*.ts');

const DIM = 768;

// A unit vector pointing along axis `i` in 768-d space. Distinct axes are
// orthogonal, so cosine similarity cleanly separates seeded podcasts and the
// nearest one to a query is fully determined by which axis the query points at.
function axisVector(i: number): number[] {
  const v = new Array<number>(DIM).fill(0);
  v[i] = 1;
  return v;
}

// Stub Gemini's embedContent HTTP endpoint so semanticSearch never hits the
// network (PRD Seam-1: the embedder is the injected boundary). The fake returns
// whatever query embedding the current test wants.
function stubEmbedder(queryVector: number[]) {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify({ embedding: { values: queryVector } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

type SeedPodcast = {
  title: string;
  category: string;
  embedding?: number[];
  listenerCount?: number;
  status?: 'ready' | 'pending';
};

async function seed(t: ReturnType<typeof convexTest>, podcasts: SeedPodcast[]) {
  return t.run(async (ctx) => {
    const authorId = await ctx.db.insert('users', {
      clerkId: 'author_1',
      name: 'Test Author',
      email: 'author@test.dev',
    });
    const ids: Id<'podcasts'>[] = [];
    for (const p of podcasts) {
      const id = await ctx.db.insert('podcasts', {
        title: p.title,
        description: `${p.title} description`,
        category: p.category,
        authorId,
        topicPrompt: 'topic',
        speaker1Voice: 'alloy',
        status: p.status ?? 'ready',
        listenerCount: p.listenerCount ?? 0,
        embedding: p.embedding,
      });
      ids.push(id);
    }
    return ids;
  });
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key';
  // Neutralize the relevance cutoff by default so ranking/category/ready tests
  // see every seeded neighbor. The cutoff has its own dedicated tests below.
  // Margin is neutralized too (set huge) so it never clips a legitimate
  // neighbor purely for scoring lower than the top match in these tests.
  process.env.GEMINI_SEARCH_MIN_SCORE = '-1';
  process.env.GEMINI_SEARCH_SCORE_MARGIN = '2';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('semanticSearch', () => {
  test('returns results ranked by embedding similarity', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      { title: 'Alpha', category: 'Technology', embedding: axisVector(0) },
      { title: 'Beta', category: 'Business', embedding: axisVector(1) },
      { title: 'Gamma', category: 'Science', embedding: axisVector(2) },
    ]);

    // Query points mostly along axis 0 (Alpha), with a small lean toward axis 1
    // (Beta) so the expected order is Alpha, then Beta, then Gamma.
    const queryVector = axisVector(0);
    queryVector[1] = 0.4;
    stubEmbedder(queryVector);

    const results = await t.action(api.podcasts.semanticSearch, {
      query: 'machines',
    });

    expect(results.map((r) => r.title)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  test('category filter narrows results to that category', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      { title: 'Alpha', category: 'Technology', embedding: axisVector(0) },
      { title: 'Beta', category: 'Business', embedding: axisVector(1) },
      { title: 'Gamma', category: 'Business', embedding: axisVector(2) },
    ]);
    1;
    // Query is closest to Alpha (Technology) overall, but the category filter
    // restricts the vector search to Business, so Alpha must not appear.
    const queryVector = axisVector(0);
    stubEmbedder(queryVector);

    const results = await t.action(api.podcasts.semanticSearch, {
      query: 'business things',
      category: 'Business',
    });

    expect(results.length).toBe(2);
    expect(results.every((r) => r.category === 'Business')).toBe(true);
    expect(results.map((r) => r.title)).not.toContain('Alpha');
  });

  test('a no-match query (category with nothing in it) yields an empty result', async () => {
    const t = convexTest(schema, modules);
    // Index is non-empty (one Technology podcast), but the category filter points
    // at a category no indexed podcast belongs to, so the result is empty.
    await seed(t, [
      { title: 'OnlyTech', category: 'Technology', embedding: axisVector(0) },
    ]);
    stubEmbedder(axisVector(0));

    const results = await t.action(api.podcasts.semanticSearch, {
      query: 'anything',
      category: 'Comedy',
    });
    expect(results).toEqual([]);
  });

  test('only ready podcasts are returned', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      {
        title: 'ReadyOne',
        category: 'Technology',
        embedding: axisVector(0),
        status: 'ready',
      },
      {
        title: 'PendingOne',
        category: 'Technology',
        embedding: axisVector(1),
        status: 'pending',
      },
    ]);
    // Query leans toward the pending one, but it must be filtered out.
    const queryVector = axisVector(1);
    stubEmbedder(queryVector);

    const results = await t.action(api.podcasts.semanticSearch, { query: 'x' });
    expect(results.map((r) => r.title)).toEqual(['ReadyOne']);
  });

  test('excludes off-topic matches below the relevance threshold', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      { title: 'OnTopic', category: 'Technology', embedding: axisVector(0) },
      { title: 'OffTopic', category: 'Technology', embedding: axisVector(1) },
    ]);
    // Query points exactly at OnTopic (cosine 1.0); OffTopic is orthogonal
    // (cosine 0.0) and must be dropped by the cutoff — this is the "saas query
    // returned the Ozempic podcast" bug, in miniature.
    process.env.GEMINI_SEARCH_MIN_SCORE = '0.5';
    stubEmbedder(axisVector(0));

    const results = await t.action(api.podcasts.semanticSearch, {
      query: 'tech',
    });
    expect(results.map((r) => r.title)).toEqual(['OnTopic']);
  });

  test('drops a near-miss that clears the floor but falls outside the margin of the top match', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      { title: 'OnTopic', category: 'Technology', embedding: axisVector(0) },
      // Not orthogonal (cosine ~0.707 with the query) — clears a flat 0.5
      // floor on its own, but sits well below the top match (1.0), which is
      // exactly the "health related podcasts also surfaces a SaaS episode"
      // shape of bug: a mediocre-but-passable score sneaking through.
      {
        title: 'NearMiss',
        category: 'Technology',
        embedding: axisVector(0).map((v, i) => (i === 1 ? 1 : v)),
      },
    ]);
    process.env.GEMINI_SEARCH_MIN_SCORE = '0.5';
    process.env.GEMINI_SEARCH_SCORE_MARGIN = '0.15';
    stubEmbedder(axisVector(0));

    const results = await t.action(api.podcasts.semanticSearch, { query: 'tech' });
    expect(results.map((r) => r.title)).toEqual(['OnTopic']);
  });

  test('strips filler from the query before embedding, same as the keyword half', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [{ title: 'Anything', category: 'Technology', embedding: axisVector(0) }]);
    const fetchMock = stubEmbedder(axisVector(0));

    // "podcasts" is filler (STOP_WORDS) that dilutes the embedding toward
    // generic "this is a podcast" phrasing shared by every episode — measured
    // on real data, that's what let an unrelated SaaS episode score close
    // enough to a true health match to sneak past any cutoff. Only "health"
    // should reach the embedder.
    await t.action(api.podcasts.semanticSearch, { query: 'health related podcasts' });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.content.parts[0].text).toBe('health related');
  });

  test('a stop-word-only query returns nothing without calling the embedder', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [{ title: 'Anything', category: 'Technology', embedding: axisVector(0) }]);
    const fetchMock = stubEmbedder(axisVector(0));

    const results = await t.action(api.podcasts.semanticSearch, { query: 'is the' });
    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('searchPodcasts (keyword)', () => {
  test('stop words do not match an unrelated title', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      { title: 'saas dying in 2027', category: 'Technology' },
      { title: 'Is it for weight loss', category: 'Health' },
    ]);
    // "is" overlaps the Ozempic-style title, but it's a stop word and must be
    // stripped before searching — only the real term "saas" should match.
    const results = await t.query(api.podcasts.searchPodcasts, {
      query: 'saas is dead',
    });
    expect(results.map((r) => r.title)).toEqual(['saas dying in 2027']);
  });

  test('a stop-word-only query returns nothing', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [{ title: 'Is it for weight loss', category: 'Health' }]);
    const results = await t.query(api.podcasts.searchPodcasts, {
      query: 'is the',
    });
    expect(results).toEqual([]);
  });
});

describe('hybridSearch', () => {
  test('merges keyword and semantic results, deduping a doc matched by both', async () => {
    const t = convexTest(schema, modules);
    // "Startup Guide" matches BOTH the keyword "startup" and the query vector
    // (axis 0). It must appear exactly once.
    await seed(t, [
      { title: 'Startup Guide', category: 'Business', embedding: axisVector(0) },
    ]);
    stubEmbedder(axisVector(0));

    const results = await t.action(api.podcasts.hybridSearch, { query: 'startup' });
    expect(results.map((r) => r.title)).toEqual(['Startup Guide']);
  });

  test('surfaces a keyword-only match and a semantic-only match', async () => {
    const t = convexTest(schema, modules);
    // KeywordOnly: title contains "startup" but its embedding is orthogonal to
    // the query (dropped by the semantic cutoff). SemanticOnly: title shares no
    // words with the query but its embedding points at the query vector.
    await seed(t, [
      { title: 'Startup Diaries', category: 'Business', embedding: axisVector(9) },
      { title: 'Founder Wisdom', category: 'Business', embedding: axisVector(0) },
    ]);
    // Cutoff active so the orthogonal keyword match is excluded from the
    // SEMANTIC half (it still arrives via the keyword half).
    process.env.GEMINI_SEARCH_MIN_SCORE = '0.5';
    stubEmbedder(axisVector(0));

    const results = await t.action(api.podcasts.hybridSearch, { query: 'startup' });
    const titles = results.map((r) => r.title);
    // Keyword hits lead, then semantic-only.
    expect(titles[0]).toBe('Startup Diaries');
    expect(titles).toContain('Founder Wisdom');
    expect(titles.length).toBe(2);
  });

  test('RRF ranks a both-methods consensus hit above a keyword-only lexical coincidence', async () => {
    const t = convexTest(schema, modules);
    // The real-world bug in miniature: query "saas trajectory".
    //  - 'SaaS Growth Playbook' matches the keyword "saas" AND its embedding
    //    points at the query vector (axis 0) → found by BOTH methods.
    //  - 'Trajectory of Flight 447' matches ONLY the shared keyword "trajectory";
    //    its embedding is orthogonal to the query (dropped by the semantic cutoff)
    //    → found by the keyword half only.
    // Under naive concatenation their order was undefined / lexical. Under RRF the
    // consensus hit must rank FIRST and the coincidence LAST.
    await seed(t, [
      { title: 'Trajectory of Flight 447', category: 'News', embedding: axisVector(9) },
      { title: 'SaaS Growth Playbook', category: 'Business', embedding: axisVector(0) },
    ]);
    process.env.GEMINI_SEARCH_MIN_SCORE = '0.5';
    stubEmbedder(axisVector(0));

    const results = await t.action(api.podcasts.hybridSearch, { query: 'saas trajectory' });
    const titles = results.map((r) => r.title);
    expect(titles.length).toBe(2);
    expect(titles[0]).toBe('SaaS Growth Playbook'); // ranked by both → wins
    expect(titles[titles.length - 1]).toBe('Trajectory of Flight 447'); // keyword-only → sinks
  });

  test('respects the category filter on both halves', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      { title: 'Startup Business', category: 'Business', embedding: axisVector(0) },
      { title: 'Startup Tech', category: 'Technology', embedding: axisVector(0) },
    ]);
    stubEmbedder(axisVector(0));

    const results = await t.action(api.podcasts.hybridSearch, {
      query: 'startup',
      category: 'Business',
    });
    expect(results.every((r) => r.category === 'Business')).toBe(true);
    expect(results.map((r) => r.title)).not.toContain('Startup Tech');
  });

  test('a stop-word-only query returns nothing without calling the embedder', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [{ title: 'Anything', category: 'Technology', embedding: axisVector(0) }]);
    const fetchMock = stubEmbedder(axisVector(0));

    const results = await t.action(api.podcasts.hybridSearch, { query: 'is the' });
    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('rejects once the global rate-limit bucket is drained', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [{ title: 'Startup', category: 'Business', embedding: axisVector(0) }]);
    stubEmbedder(axisVector(0));

    let rejected = false;
    for (let i = 0; i < 40; i++) {
      try {
        await t.action(api.podcasts.hybridSearch, { query: `startup ${i}` });
      } catch (err) {
        const msg = String((err as { data?: { code?: string } })?.data?.code ?? err);
        expect(
          msg.includes('RATE_LIMITED') || String(err).includes('RATE_LIMITED'),
        ).toBe(true);
        rejected = true;
        break;
      }
    }
    expect(rejected).toBe(true);
  });
});

describe('getSimilar', () => {
  test('returns vector-nearest podcasts and excludes the source itself', async () => {
    const t = convexTest(schema, modules);
    const [sourceId] = await seed(t, [
      { title: 'Source', category: 'Technology', embedding: axisVector(0) },
      {
        title: 'Near',
        category: 'Technology',
        embedding: axisVector(0).map((x, i) => (i === 1 ? 0.9 : x)),
      },
      { title: 'Far', category: 'Technology', embedding: axisVector(5) },
    ]);

    // No fetch stub needed: getSimilar reuses the STORED embedding (no Gemini).
    const results = await t.action(api.podcasts.getSimilar, {
      podcastId: sourceId,
      limit: 4,
    });

    const titles = results.map((r) => r.title);
    expect(titles).not.toContain('Source');
    expect(titles[0]).toBe('Near');
  });

  test('falls back to popularity when the source has no embedding', async () => {
    const t = convexTest(schema, modules);
    const [sourceId] = await seed(t, [
      { title: 'Source', category: 'Technology' }, // no embedding
      {
        title: 'Popular',
        category: 'Technology',
        embedding: axisVector(1),
        listenerCount: 999,
      },
      {
        title: 'Quiet',
        category: 'Technology',
        embedding: axisVector(2),
        listenerCount: 1,
      },
    ]);

    const results = await t.action(api.podcasts.getSimilar, {
      podcastId: sourceId,
      limit: 4,
    });
    const titles = results.map((r) => r.title);
    expect(titles).not.toContain('Source');
    expect(titles[0]).toBe('Popular'); // most-listened first
  });
});

describe('rate limiting', () => {
  test('semanticSearch rejects once the global bucket is drained', async () => {
    const t = convexTest(schema, modules);
    await seed(t, [
      { title: 'Alpha', category: 'Technology', embedding: axisVector(0) },
    ]);
    stubEmbedder(axisVector(0));

    // Capacity is 30 (burst). Drain it, then the next call must be rejected.
    // Calls run back-to-back so refill (0.5/sec) is negligible within the loop.
    let rejected = false;
    for (let i = 0; i < 40; i++) {
      try {
        await t.action(api.podcasts.semanticSearch, { query: `q${i}` });
      } catch (err) {
        const msg = String(
          (err as { data?: { code?: string } })?.data?.code ?? err,
        );
        expect(
          msg.includes('RATE_LIMITED') || String(err).includes('RATE_LIMITED'),
        ).toBe(true);
        rejected = true;
        break;
      }
    }
    expect(rejected).toBe(true);
  });
});
