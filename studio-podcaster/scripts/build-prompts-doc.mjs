// Writes docs/blog/image-prompts.md from the launch posts.
import {writeFileSync} from 'node:fs'
import {blogPosts} from '../../src/content/blogPosts.ts'

const out = [
  '# Blog image prompts',
  '',
  'One prompt per launch post. Give each to your image agent, then upload the result as the',
  'post’s **Main image** in Sanity Studio (add a short alt text). The same prompt is stored on the',
  'post in the **Image prompt** field.',
  '',
  'Rendering notes: 16:9 landscape, photographic, no text or logos in the image.',
  '',
  ...blogPosts.flatMap((p, i) => [
    `## ${i + 1}. ${p.title}`,
    '',
    `Slug: \`${p.slug}\``,
    '',
    '```text',
    p.imagePrompt,
    '```',
    '',
  ]),
  '## Publishing the posts to Sanity',
  '',
  '```bash',
  'cd studio-podcaster',
  'node scripts/build-seed.mjs',
  'npx sanity login',
  'npx sanity dataset import seed/posts.ndjson production --replace',
  '```',
  '',
  'Until the posts are imported, the site shows the same seven posts from `src/content/blogPosts.ts`.',
  'Once Sanity has any published post, the site shows only what is in Sanity.',
  '',
]
writeFileSync(new URL('../../docs/blog/image-prompts.md', import.meta.url), out.join('\n'))
console.log('ok')
