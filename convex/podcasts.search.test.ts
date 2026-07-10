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

// Route-aware network stub for the full hybrid pipeline: embedding (Gemini),
// LLM judge (Gemini generateContent), and Cohere rerank. Each stage's response
// is configurable so tests can put any stage up, down, or rate-limited.
function stubSearchNetwork(stub: {
  queryVector?: number[];
  // 200 → respond with these pool indices as the verdict; anything else → that HTTP status
  judge?: { status: number; indices?: number[] };
  // 200 → score pool doc i as scores[i]; anything else → that HTTP status
  cohere?: { status: number; scores?: number[] };
}) {
  const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });

    if (u.includes(':embedContent')) {
      return json({ embedding: { values: stub.queryVector ?? axisVector(0) } });
    }
    if (u.includes(':generateContent')) {
      const judge = stub.judge ?? { status: 429 };
      if (judge.status !== 200) return new Response('quota exceeded', { status: judge.status });
      return json({
        candidates: [
          { content: { parts: [{ text: JSON.stringify(judge.indices ?? []) }] } },
        ],
      });
    }
    if (u.includes('api.cohere.com')) {
      const cohere = stub.cohere ?? { status: 500 };
      if (cohere.status !== 200) return new Response('error', { status: cohere.status });
      const body = JSON.parse(String(init?.body)) as { documents: string[] };
      const results = body.documents
        .map((_, i) => ({ index: i, relevance_score: cohere.scores?.[i] ?? 0.001 }))
        .sort((a, b) => b.relevance_score - a.relevance_score);
      return json({ results });
    }
    throw new Error(`Unexpected fetch in test: ${u}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// Count the judge (generateContent) calls a fetch mock has served.
function judgeCallCount(fetchMock: ReturnType<typeof vi.fn>): number {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes(':generateContent')).length;
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
  // The judge and reranker stages are opt-in via env. Tests enable them
  // explicitly; they must not leak in from the host env or a previous test.
  delete process.env.SEARCH_LLM_JUDGE;
  delete process.env.COHERE_API_KEY;
  delete process.env.COHERE_RERANK_MIN_SCORE;
  delete process.env.COHERE_RERANK_TOP_RATIO;
  delete process.env.COHERE_RERANK_JUNK_TOP;
  delete process.env.GEMINI_JUDGE_MODEL;
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

describe('hybridSearch LLM judge', () => {
  // Seeded so vector similarity strictly orders Alpha > Beta > Gamma for a
  // query vector leaning [1, 0.6, 0.3] — deterministic pool order. Titles and
  // categories share no tokens with the query, so the keyword and category
  // halves stay empty and the judge pool is exactly the semantic list.
  const JUDGE_SEEDS: SeedPodcast[] = [
    { title: 'Alpha Show', category: 'Technology', embedding: axisVector(0) },
    { title: 'Beta Show', category: 'Business', embedding: axisVector(1) },
    { title: 'Gamma Show', category: 'Science', embedding: axisVector(2) },
  ];
  const judgeQueryVector = () => {
    const v = axisVector(0);
    v[1] = 0.6;
    v[2] = 0.3;
    return v;
  };

  test('returns the judge verdict in judge order', async () => {
    const t = convexTest(schema, modules);
    await seed(t, JUDGE_SEEDS);
    process.env.SEARCH_LLM_JUDGE = 'true';
    // Judge keeps Beta (pool index 1) and Alpha (0), most relevant first.
    stubSearchNetwork({ queryVector: judgeQueryVector(), judge: { status: 200, indices: [1, 0] } });

    const results = await t.action(api.podcasts.hybridSearch, { query: 'entrepreneurship advice' });
    expect(results.map((r) => r.title)).toEqual(['Beta Show', 'Alpha Show']);
  });

  test('an identical repeat search is served from the verdict cache without a judge call', async () => {
    const t = convexTest(schema, modules);
    await seed(t, JUDGE_SEEDS);
    process.env.SEARCH_LLM_JUDGE = 'true';
    const fetchMock = stubSearchNetwork({
      queryVector: judgeQueryVector(),
      judge: { status: 200, indices: [0] },
    });

    const first = await t.action(api.podcasts.hybridSearch, { query: 'entrepreneurship advice' });
    const second = await t.action(api.podcasts.hybridSearch, { query: 'entrepreneurship advice' });

    expect(first.map((r) => r.title)).toEqual(['Alpha Show']);
    expect(second.map((r) => r.title)).toEqual(['Alpha Show']);
    expect(judgeCallCount(fetchMock)).toBe(1);
  });

  test('a changed candidate pool invalidates the cached verdict', async () => {
    const t = convexTest(schema, modules);
    await seed(t, JUDGE_SEEDS);
    process.env.SEARCH_LLM_JUDGE = 'true';
    const fetchMock = stubSearchNetwork({
      queryVector: judgeQueryVector(),
      judge: { status: 200, indices: [0] },
    });

    await t.action(api.podcasts.hybridSearch, { query: 'entrepreneurship advice' });
    // A new ready podcast joins the vector neighbourhood → pool hash changes.
    await seed(t, [{ title: 'Delta Show', category: 'Health', embedding: axisVector(3) }]);
    await t.action(api.podcasts.hybridSearch, { query: 'entrepreneurship advice' });

    expect(judgeCallCount(fetchMock)).toBe(2);
  });
});

describe('hybridSearch degraded mode (judge down → Cohere fallback)', () => {
  const SEEDS: SeedPodcast[] = [
    { title: 'Alpha Show', category: 'Technology', embedding: axisVector(0) },
    { title: 'Beta Show', category: 'Business', embedding: axisVector(1) },
    { title: 'Gamma Show', category: 'Science', embedding: axisVector(2) },
  ];
  const queryVector = () => {
    const v = axisVector(0);
    v[1] = 0.6;
    v[2] = 0.3;
    return v;
  };

  test('drops the loosely-related tail below the relative score cutoff', async () => {
    const t = convexTest(schema, modules);
    await seed(t, SEEDS);
    process.env.SEARCH_LLM_JUDGE = 'true'; // judge stage active…
    process.env.COHERE_API_KEY = 'test-cohere-key';
    // …but rate-limited (429) → falls back to Cohere. Pool order is Alpha,
    // Beta, Gamma; Gamma's 0.01 sits at 2% of the 0.5 top score — the exact
    // shape of the live junk tails — and must be dropped by the 25% ratio.
    stubSearchNetwork({
      queryVector: queryVector(),
      judge: { status: 429 },
      cohere: { status: 200, scores: [0.5, 0.3, 0.01] },
    });

    const results = await t.action(api.podcasts.hybridSearch, { query: 'entrepreneurship advice' });
    expect(results.map((r) => r.title)).toEqual(['Alpha Show', 'Beta Show']);
  });

  test('an all-junk score band (top below the junk floor) returns the honest empty state', async () => {
    const t = convexTest(schema, modules);
    await seed(t, SEEDS);
    process.env.SEARCH_LLM_JUDGE = 'true';
    process.env.COHERE_API_KEY = 'test-cohere-key';
    // No genuine match: every score is junk-level ("cooking recipes" on the
    // live catalog topped at 0.047). The whole set must be treated as noise.
    stubSearchNetwork({
      queryVector: queryVector(),
      judge: { status: 429 },
      cohere: { status: 200, scores: [0.04, 0.03, 0.02] },
    });

    const results = await t.action(api.podcasts.hybridSearch, { query: 'entrepreneurship advice' });
    expect(results).toEqual([]);
  });

  test('judge AND reranker both down still degrades to RRF results, not an error', async () => {
    const t = convexTest(schema, modules);
    await seed(t, SEEDS);
    process.env.SEARCH_LLM_JUDGE = 'true';
    process.env.COHERE_API_KEY = 'test-cohere-key';
    stubSearchNetwork({
      queryVector: queryVector(),
      judge: { status: 429 },
      cohere: { status: 500 },
    });

    const results = await t.action(api.podcasts.hybridSearch, { query: 'entrepreneurship advice' });
    expect(results.map((r) => r.title)).toEqual(['Alpha Show', 'Beta Show', 'Gamma Show']);
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
