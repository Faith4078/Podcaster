// Blog content for Podcaster. This is the single source of truth for the seven
// launch posts: the app falls back to it when Sanity has no posts yet, and
// `studio-podcaster/scripts/build-seed.mjs` turns it into a Sanity import file.
//
// Style rule: no dashes of any kind in post copy (no em dashes, en dashes or
// double hyphens). Use commas, colons and full stops instead.

export type Block =
  | { t: 'h2' | 'h3' | 'p' | 'quote'; text: string }
  | { t: 'ul'; items: string[] }

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  category: string
  publishedAt: string // ISO date
  // Prompt to give an image agent. Also stored on the Sanity post so it lives
  // next to the post it belongs to.
  imagePrompt: string
  // Resolved image URL (from Sanity). Absent for the local fallback content.
  imageUrl?: string
  body: Block[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'from-idea-to-episode',
    title: 'From Idea to Episode: Making Your First Podcast With Podcaster',
    excerpt:
      'You do not need a studio, a microphone or an editing suite. Here is the whole path from a rough idea to a finished episode, step by step.',
    category: 'Getting started',
    publishedAt: '2026-09-08',
    imagePrompt:
      'Realistic editorial photograph of a person at a tidy wooden desk by a window in soft morning light, writing a few ideas in a notebook next to an open laptop and a mug of coffee, shallow depth of field, warm natural tones with a subtle orange accent from a desk lamp, candid and unposed, 16:9 landscape, no text, no logos, no watermark.',
    body: [
      {
        t: 'p',
        text: 'Most people who want to start a podcast never do. The reasons are always the same: they think they need expensive gear, a quiet room, a confident speaking voice, or hours of editing time. Podcaster removes all four. You bring the idea, and the app handles the writing, the voice and the cover art.',
      },
      { t: 'h2', text: 'Start with one clear idea' },
      {
        t: 'p',
        text: 'Open the create page and give your show a title and a category. Pick from Technology, Business, Education, Entertainment, Health, Science, Sports, True Crime, Comedy or News. The category matters more than it seems, because it is how listeners browse and how search understands what your episode is about.',
      },
      {
        t: 'p',
        text: 'Then write a short description. Think of it as the sentence you would say to a friend who asks what your podcast is. If it takes more than two sentences, your idea is probably two episodes.',
      },
      { t: 'h2', text: 'Choose a voice and describe the topic' },
      {
        t: 'p',
        text: 'Pick one of the six AI voices, then fill in the topic prompt. This is the most important field on the page. You are not writing the script yourself. You are telling the AI what the episode should be about, and it writes a conversational monologue of roughly four hundred to six hundred words.',
      },
      { t: 'h2', text: 'Review the script before any audio is made' },
      {
        t: 'p',
        text: 'This is where Podcaster is different from a one click generator. After you submit, you land on a script editor instead of a finished episode. Read it, fix anything that sounds off, trim what drags, and only then approve it. Nothing is voiced until you say so. We cover this step in detail in our post on reading your script before you generate.',
      },
      { t: 'h2', text: 'Let the cover art happen' },
      {
        t: 'p',
        text: 'You can describe the thumbnail you want in a sentence, or leave it blank and let the app design one from your title and description. Pro creators can also upload their own image.',
      },
      { t: 'h2', text: 'A simple checklist for episode one' },
      {
        t: 'ul',
        items: [
          'Pick a topic you could talk about for five minutes without notes.',
          'Write a title a stranger would understand at a glance.',
          'Choose the category a listener would actually browse.',
          'Describe the topic in two or three specific sentences.',
          'Edit the script until it sounds like something you would say.',
        ],
      },
      {
        t: 'p',
        text: 'Your first episode will not be perfect, and that is the point. Free accounts can generate three episodes, which is enough to find your style. Make the first one small, publish it, and learn from what comes back.',
      },
    ],
  },
  {
    slug: 'read-your-script-before-you-generate',
    title: 'Why You Should Read Your AI Script Before You Press Generate',
    excerpt:
      'AI can write a good first draft in seconds. It cannot know what you meant. A two minute edit is the difference between an episode that sounds generic and one that sounds like you.',
    category: 'Craft',
    publishedAt: '2026-09-15',
    imagePrompt:
      'Realistic close up photograph of a pair of hands holding a printed script page with handwritten pencil corrections and underlines, a pair of over ear headphones and a pencil resting on the desk beside it, soft directional window light, shallow depth of field, calm focused mood, 16:9 landscape, no readable text, no logos, no watermark.',
    body: [
      {
        t: 'p',
        text: 'An AI script is a very good first draft. It is structured, fluent and on topic. It is also written by something that has never met your audience, never heard you speak and never made the mistake of repeating a fact that turned out to be wrong. That gap is exactly what the script editor is for.',
      },
      { t: 'h2', text: 'What the editor gives you' },
      {
        t: 'p',
        text: 'When you create an episode, Podcaster writes the script and then pauses. You see the full text in an editor with a live word count and an estimate of how many minutes of audio it will become. From there you can edit freely, save a draft and come back later, ask for a brand new script, or approve it and start the audio.',
      },
      { t: 'h2', text: 'Five things worth checking' },
      {
        t: 'ul',
        items: [
          'Facts. Names, dates and numbers should be checked before they are spoken aloud in your voice.',
          'The opening. Cut any line that warms up instead of starting. The best episodes begin with the interesting part.',
          'Sentences you would never say. If you stumble reading it, a listener will stumble hearing it.',
          'Length. Shorter is usually better. Remove the paragraph that repeats the one before it.',
          'The ending. A clear last sentence feels finished. A trailing summary feels padded.',
        ],
      },
      { t: 'h2', text: 'Write for the ear, not the eye' },
      {
        t: 'p',
        text: 'Spoken language is looser than written language. Use contractions. Break long sentences in two. Read a paragraph out loud once, and wherever you run out of breath, add a full stop. These small changes make synthetic voices sound noticeably more natural, because the voice follows the rhythm you give it.',
      },
      { t: 'h2', text: 'It also protects your quota' },
      {
        t: 'p',
        text: 'Audio generation is the expensive step, and free accounts have a limited number of episodes. Catching a problem in the script costs you nothing. Catching it after the audio is made means spending a generation to fix a typo. The editor lets you spend your episodes only on scripts you are happy with.',
      },
      { t: 'h2', text: 'When to start over' },
      {
        t: 'p',
        text: 'Sometimes the draft is simply off. Rather than patching it line by line, use the new script option and sharpen your topic prompt first. A more specific prompt almost always beats heavier editing.',
      },
      {
        t: 'quote',
        text: 'The goal is not to rewrite what the AI wrote. It is to make sure every sentence is one you are happy to put your name next to.',
      },
    ],
  },
  {
    slug: 'get-your-podcast-on-apple-and-spotify',
    title: 'How to Get Your Podcast on Apple Podcasts and Spotify With One Link',
    excerpt:
      'Every podcast app runs on the same simple technology: an RSS feed. Podcaster gives you one, so you can publish once and appear everywhere.',
    category: 'Distribution',
    publishedAt: '2026-09-22',
    imagePrompt:
      'Realistic photograph of a smartphone resting on a clean desk showing a generic podcast player screen with colorful abstract cover art, a pair of wireless earbuds and a small potted plant beside it, soft natural light, shallow depth of field, modern and inviting, 16:9 landscape, no brand logos, no readable text, no watermark.',
    body: [
      {
        t: 'p',
        text: 'When you listen to a show in Apple Podcasts, Spotify or Pocket Casts, the app is not hosting that show. It is reading a feed, a plain web address that lists every episode, its title, its description and where to find the audio. That feed is called RSS, and it is the reason a podcast can live in a dozen apps at once.',
      },
      { t: 'h2', text: 'Your feed is already waiting' },
      {
        t: 'p',
        text: 'Every creator on Podcaster has a public RSS feed. Open the analytics page and scroll to the distribution section. You will see your feed address with a copy button and a link to preview it. Each episode you publish is added to the feed automatically, with its title, description, cover art and transcript.',
      },
      { t: 'h2', text: 'Submitting your show' },
      {
        t: 'p',
        text: 'The process is nearly identical on every platform. You create a creator account with the directory, choose the option to add a podcast, and paste your feed address. The directory checks the feed, asks you to confirm you own it, and then reviews it.',
      },
      {
        t: 'ul',
        items: [
          'Apple Podcasts: submit through Apple Podcasts Connect.',
          'Spotify: submit through Spotify for Creators.',
          'Pocket Casts: use their submit page.',
        ],
      },
      {
        t: 'p',
        text: 'Approval can take anywhere from a few hours to a few days, so submit early and keep creating while you wait.',
      },
      { t: 'h2', text: 'You only do this once' },
      {
        t: 'p',
        text: 'This is the part that surprises people. After the directory accepts your feed, you never submit again. Publish a new episode in Podcaster and the apps pick it up on their own the next time they check your feed.',
      },
      { t: 'h2', text: 'Before you submit, do a quick check' },
      {
        t: 'ul',
        items: [
          'Make sure you have at least one finished episode with audio.',
          'Give your show a clear title and a description that explains the topic.',
          'Open the feed preview and confirm your episode appears.',
          'Think about your cover art. Directories like square, high quality images.',
        ],
      },
      { t: 'h2', text: 'Measuring what happens next' },
      {
        t: 'p',
        text: 'Downloads from podcast apps are counted in your analytics as RSS downloads, so you can see whether your distribution is working without leaving the app. A rise in that number after a directory approves your show is the clearest sign that people are finding you.',
      },
    ],
  },
  {
    slug: 'podcast-analytics-for-beginners',
    title: 'Podcast Analytics for Beginners: The Five Numbers Worth Watching',
    excerpt:
      'A dashboard full of charts is easy to stare at and hard to act on. These are the few numbers that actually tell you how your show is doing.',
    category: 'Growth',
    publishedAt: '2026-09-29',
    imagePrompt:
      'Realistic photograph over the shoulder of a creator reviewing a clean analytics dashboard with simple bar charts on a laptop screen, notebook and pen to the side, evening desk lamp glow with soft warm highlights, shallow depth of field, thoughtful and optimistic mood, 16:9 landscape, screen content abstract with no readable text, no logos, no watermark.',
    body: [
      {
        t: 'p',
        text: 'When you publish your first few episodes, every number feels important. Resist that. A small show does not need a data team. It needs a handful of numbers, checked regularly, that answer one question: is more of the right audience finding my episodes?',
      },
      { t: 'h2', text: '1. Unique listeners' },
      {
        t: 'p',
        text: 'This is the headline number. On Podcaster, a listener is counted once per episode, and only after they have played at least thirty seconds. Clicking play and leaving does not inflate it. That makes it a fair measure of people who genuinely started listening.',
      },
      { t: 'h2', text: '2. Listeners in the last seven days' },
      {
        t: 'p',
        text: 'Lifetime totals only ever go up, which makes them flattering and not very useful. The recent window tells you whether an episode still has life in it, and whether the one you published this week is landing better than the one before.',
      },
      { t: 'h2', text: '3. RSS downloads' },
      {
        t: 'p',
        text: 'These count the times a podcast app fetched your audio through your feed. It is your signal that distribution is working. One caution: apps sometimes fetch an episode more than once, so treat the number as a direction rather than an exact headcount.',
      },
      { t: 'h2', text: '4. Saves' },
      {
        t: 'p',
        text: 'A save means someone wanted to come back to your episode. It is a small act with a lot of meaning, and it often predicts loyal listeners better than a raw play count does.',
      },
      { t: 'h2', text: '5. Downloads' },
      {
        t: 'p',
        text: 'People download episodes they want to keep. Compare this against your listeners. An episode that gets many downloads relative to plays is one people treat as reference material, which tells you what kind of content to make more of.',
      },
      { t: 'h2', text: 'How to read the 30 day chart' },
      {
        t: 'p',
        text: 'The daily chart shows new listeners and RSS downloads side by side. Look for spikes and match them to what you did that day. Did you share a link? Publish an episode? Get approved by a directory? Over a few weeks you will learn which actions move the numbers.',
      },
      { t: 'h2', text: 'A weekly habit' },
      {
        t: 'ul',
        items: [
          'Check your analytics once a week, not once an hour.',
          'Note which episode had the most recent listeners and ask why.',
          'Look at saves and downloads to find your most useful topics.',
          'Decide on one change to try before the next episode.',
        ],
      },
      {
        t: 'p',
        text: 'Analytics are a mirror, not a verdict. Use them to learn what your audience values, then make more of it.',
      },
    ],
  },
  {
    slug: 'choosing-an-ai-voice-for-your-show',
    title: 'How to Choose an AI Voice That Fits Your Show',
    excerpt:
      'The voice is the first thing a listener judges and the last thing most creators think about. A few minutes of deliberate choosing pays off in every episode.',
    category: 'Craft',
    publishedAt: '2026-10-01',
    imagePrompt:
      'Realistic photograph of a modern podcast microphone on a boom arm in a softly lit home studio with acoustic foam panels in warm neutral tones, a pair of headphones hanging on the arm, shallow depth of field, a gentle orange glow from a small lamp in the background, calm and professional, 16:9 landscape, no text, no logos, no watermark.',
    body: [
      {
        t: 'p',
        text: 'Before a listener has taken in your title, your topic or your cover art, they have heard your voice. It sets expectations in a second: serious or playful, warm or authoritative, calm or energetic. With an AI show, the voice is a creative decision you get to make deliberately.',
      },
      { t: 'h2', text: 'Six voices to choose from' },
      {
        t: 'p',
        text: 'Podcaster offers six voices: Alloy, Echo, Fable, Onyx, Nova and Shimmer. They differ in tone and pitch, and the same script can feel quite different depending on who reads it. The names are not labels you can trust blindly, so the only reliable method is to listen.',
      },
      { t: 'h2', text: 'Match the voice to the subject' },
      {
        t: 'ul',
        items: [
          'Serious topics such as news, true crime or health usually reward a steady, measured voice.',
          'Lighter topics such as comedy or entertainment can carry more energy and brightness.',
          'Educational and science episodes benefit from a clear voice that does not hurry.',
          'Business and technology can go either way, so think about your audience.',
        ],
      },
      { t: 'h2', text: 'Think about who is listening, and where' },
      {
        t: 'p',
        text: 'People listen while commuting, cooking, exercising and falling asleep. A voice that is lively on a morning walk can feel tiring at night. If your show is meant to be a calm companion, choose something smooth. If it is meant to wake people up, choose something with more life.',
      },
      { t: 'h2', text: 'Test with a short script' },
      {
        t: 'p',
        text: 'Your free generations are limited, so be thoughtful. Write a tight topic prompt, review the script, and generate your first episode with the voice you think fits. Listen on headphones and on a phone speaker, because voices can sound different on each. If something feels off, you can change the voice when you edit the episode and regenerate it.',
      },
      { t: 'h2', text: 'Consistency builds recognition' },
      {
        t: 'p',
        text: 'Once you find a voice you like, stay with it. Regular listeners build a feeling of familiarity with the sound of a show, and changing voices every episode breaks that. Treat your voice the way a brand treats a logo: pick it carefully, then keep it.',
      },
      {
        t: 'quote',
        text: 'The right voice does not call attention to itself. It makes the content feel like it was meant to be heard that way.',
      },
    ],
  },
  {
    slug: 'write-topic-prompts-that-make-better-episodes',
    title: 'Write Topic Prompts That Make Better Episodes',
    excerpt:
      'The topic prompt is the only instruction the AI gets. A vague one produces a vague episode. Here is how to write one that gets you something worth hearing.',
    category: 'Craft',
    publishedAt: '2026-10-03',
    imagePrompt:
      'Realistic overhead photograph of a desk with an open notebook showing a hand drawn mind map of connected ideas with no readable words, sticky notes in muted colors, a pen, and a cup of tea, soft daylight from the left, warm tones with a hint of orange, tidy and inspiring, 16:9 landscape, no readable text, no logos, no watermark.',
    body: [
      {
        t: 'p',
        text: 'Everything in a Podcaster episode starts from one box on the create page: the topic prompt. The AI reads it and writes a script of roughly four hundred to six hundred words. It cannot ask you follow up questions, so the quality of the episode depends on how much useful direction you put into that one field.',
      },
      { t: 'h2', text: 'Vague in, vague out' },
      {
        t: 'p',
        text: 'Compare two prompts. The first says: talk about remote work. The second says: explain why some teams get more done when they work remotely and others fall apart, using everyday examples, for managers who are skeptical about it. The second gives the AI a point of view, an audience and a shape. The result will be sharper in every way.',
      },
      { t: 'h2', text: 'Four things to include' },
      {
        t: 'ul',
        items: [
          'The angle. What is the specific question or argument of this episode?',
          'The audience. Who is listening, and what do they already know?',
          'The tone. Friendly, serious, curious, funny?',
          'The takeaway. What should a listener remember when it ends?',
        ],
      },
      { t: 'h2', text: 'Narrow beats broad' },
      {
        t: 'p',
        text: 'A five minute episode cannot cover the history of space travel, but it can cover why one particular mission mattered. When in doubt, choose the smaller topic. You can always make a second episode, and a series of focused episodes builds an audience better than one sprawling overview.',
      },
      { t: 'h2', text: 'Say what to avoid' },
      {
        t: 'p',
        text: 'If there is a cliché in your field, tell the AI to skip it. If you do not want jargon, say so. If you want a particular example included, name it. Clear boundaries help as much as clear goals.',
      },
      { t: 'h2', text: 'Use the script review as part of the process' },
      {
        t: 'p',
        text: 'Treat the first draft as feedback on your prompt. If the script wanders, your topic was too wide. If it sounds generic, your angle was missing. Tighten the prompt, write a new script, and compare. A couple of rounds usually gets you to something you are proud of.',
      },
      { t: 'h2', text: 'A prompt you can copy' },
      {
        t: 'quote',
        text: 'Explain why most people give up on learning a language after the first month, and what the few who succeed do differently. Speak to busy adults, keep it encouraging and practical, and end with one small habit to try this week.',
      },
    ],
  },
  {
    slug: 'cover-art-that-earns-the-click',
    title: 'Cover Art That Earns the Click: Designing a Thumbnail for Your Podcast',
    excerpt:
      'Listeners decide in a glance whether to press play. Your cover art is the only thing they see before they hear a word, so it deserves a little thought.',
    category: 'Branding',
    publishedAt: '2026-10-05',
    imagePrompt:
      'Realistic photograph of a grid of several square podcast cover art prints with bold abstract colorful designs laid out on a light wooden table, a hand arranging one print, soft natural light from above, shallow depth of field, creative studio atmosphere with warm orange accents, 16:9 landscape, covers show abstract shapes only with no readable text, no logos, no watermark.',
    body: [
      {
        t: 'p',
        text: 'Scroll through any podcast app and you will see rows of small squares. Each one is competing for a fraction of a second of attention. Your cover art is your storefront, and unlike the rest of your show, it is judged before anyone listens to anything.',
      },
      { t: 'h2', text: 'Two ways to get a thumbnail' },
      {
        t: 'p',
        text: 'On the create page you can let AI design your cover, either from a short description you write or automatically from your title, category and description. If you are on the Pro plan you can also upload your own image. Both routes are valid. The AI route is fast, and the upload route gives you full control.',
      },
      { t: 'h2', text: 'Describing the cover you want' },
      {
        t: 'p',
        text: 'The thumbnail prompt works best when it is concrete. Instead of something about technology, try a glowing circuit board shaped like a microphone on a dark blue background. Name the main object, the colors and the mood. You are describing a picture, not a theme.',
      },
      { t: 'h2', text: 'Design for small sizes' },
      {
        t: 'ul',
        items: [
          'Keep one clear focal point. Busy images turn to mud at thumbnail size.',
          'Use strong contrast between the subject and the background.',
          'Choose two or three colors rather than many.',
          'Avoid tiny details that will disappear on a phone screen.',
        ],
      },
      { t: 'h2', text: 'Make it match the content' },
      {
        t: 'p',
        text: 'A cover is a promise. A bright, playful image for a serious investigative episode sets the wrong expectation and makes the listener feel misled. Let the mood of the art follow the mood of the show, and let your category guide the palette.',
      },
      { t: 'h2', text: 'Stay consistent across episodes' },
      {
        t: 'p',
        text: 'If you plan to publish a series, keep a shared style: similar colors, a similar composition, the same kind of subject. When a listener sees a row of your episodes together, they should feel they belong to one show. That recognition is worth more than any single clever image.',
      },
      { t: 'h2', text: 'Check it the way a listener will' },
      {
        t: 'p',
        text: 'Before you settle, view the cover at the size of a small app icon, on a phone, next to other shows. If it still reads clearly and still makes you curious, it is doing its job. If not, adjust the prompt and generate it again. A better cover is one of the cheapest improvements you can make to a show.',
      },
    ],
  },
]

export function getLocalPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}

// Rough reading time at 220 words per minute.
export function readingMinutes(post: Pick<BlogPost, 'body'>): number {
  const words = post.body
    .map((b) => (b.t === 'ul' ? b.items.join(' ') : b.text))
    .join(' ')
    .split(/\s+/).length
  return Math.max(1, Math.round(words / 220))
}
