import { mutation } from './_generated/server';

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    // Skip only if demo data was already seeded (not if the user has their own podcasts)
    const demoUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', 'demo_user_1'))
      .first();
    if (demoUser) return { skipped: true, inserted: 0 };

    const user1 = await ctx.db.insert('users', {
      clerkId: 'demo_user_1',
      name: 'Alex Rivera',
      email: 'alex@podcastr.demo',
      imageUrl: undefined,
    });
    const user2 = await ctx.db.insert('users', {
      clerkId: 'demo_user_2',
      name: 'Sarah Chen',
      email: 'sarah@podcastr.demo',
      imageUrl: undefined,
    });

    const podcasts = [
      {
        title: 'The AI Frontier',
        description:
          'Exploring how artificial intelligence is reshaping every industry, from healthcare to creative work.',
        category: 'Technology',
        topicPrompt:
          'How large language models are changing knowledge work and what skills will matter in the next decade',
        speaker1Voice: 'alloy',
        listenerCount: 32400,
        authorId: user1,
        transcript: `Artificial intelligence is no longer a distant promise — it is the operating system of modern life. Every industry from healthcare diagnostics to supply chain logistics is being rearchitected around machine learning pipelines, and the pace of change is accelerating faster than most institutions can adapt.

What makes this moment genuinely unprecedented is the convergence of three forces: compute that finally scales economically, datasets large enough to capture real-world complexity, and architectures flexible enough to generalize across tasks. The result is systems that can draft legal briefs, synthesize research, and write production code — not perfectly, but well enough to reshape entire job categories.

The workers who thrive in this environment are not necessarily those with the deepest technical expertise. They are the ones who understand how to collaborate with AI systems, how to evaluate their outputs critically, and how to ask the right questions. Prompt engineering is not a parlor trick — it is a genuine skill that compounds over time.

What's coming in the next five years will make today's models look like calculators. Multimodal reasoning, long-context memory, and agentic systems that can plan and execute multi-step tasks autonomously — these are not science fiction. They are active research priorities at every major lab right now. The question is not whether they will arrive. The question is whether you will be ready.`,
      },
      {
        title: 'Build Better Software',
        description:
          'Practical engineering wisdom for developers who care about craft, performance, and shipping things that last.',
        category: 'Technology',
        topicPrompt:
          'Why boring technology choices win in production and how to resist the pull of shiny new frameworks',
        speaker1Voice: 'echo',
        listenerCount: 18700,
        authorId: user2,
        transcript: `There is a joke in the software industry that the best engineers are the laziest ones. Not because they avoid work, but because they have an almost physical aversion to unnecessary complexity. They reach for boring tools not out of ignorance but out of hard-won wisdom.

PostgreSQL is fifteen years old. Redis has been around for over a decade. Linux is older than most working developers. And yet these tools power the infrastructure behind some of the most successful companies on the planet. Not because they are perfect, but because they are understood. Their failure modes are documented. Their operational characteristics are predictable.

Compare this to the new framework that appeared on Hacker News last week with a beautiful landing page and a promise to eliminate all the pain of the old way. Maybe it will. But right now, if it breaks at 3am, there are no Stack Overflow threads, no battle-tested runbooks, no colleagues who have seen that specific error before.

The advice is deceptively simple: match the scale of your tools to the scale of your problem. A SQLite database will handle more traffic than most startups will ever see. A monolith deployed to a single server is easier to debug than a distributed system with twelve microservices. You can always add complexity later. You cannot easily subtract it.`,
      },
      {
        title: 'Startup Signals',
        description:
          'What early-stage founders actually need to know about fundraising, product-market fit, and not running out of runway.',
        category: 'Business',
        topicPrompt:
          'The real reasons most seed-stage startups fail to raise a Series A and what changes when you fix them',
        speaker1Voice: 'onyx',
        listenerCount: 44800,
        authorId: user1,
        transcript: `Most founders who fail to raise a Series A are not rejected because their product is bad. They are rejected because they cannot answer one question convincingly: why is growth accelerating? Investors at the A stage are not buying potential. They are buying evidence of inevitability.

The seed round is about learning. The Series A is about proving that what you learned is actually a business. The gap between those two things trips up the majority of funded startups, and it is not for lack of effort. Founders work incredibly hard. The problem is usually that they are optimizing for the wrong signals.

Vanity metrics are everywhere at the seed stage. Downloads, registered users, press mentions — these tell a story but not the story investors need to see. What Series A investors want is retention curves that flatten, not decay. They want cohorts that expand revenue over time. They want a repeatable sales motion that a new hire can learn in their first month.

If you are six months from your current runway ending and you do not have those things yet, the answer is not to start fundraising harder. The answer is to cut burn aggressively, focus on one ICP until you crack retention, and treat the next 180 days as a discovery sprint. The founders who raise strong A rounds are almost always the ones who waited until they had something worth showing.`,
      },
      {
        title: 'Planet in Focus',
        description:
          'Science-backed conversations about climate, energy, and the real technologies that could change our trajectory.',
        category: 'Science',
        topicPrompt:
          'The surprising physics of why nuclear fusion energy is closer than ever and what still stands in the way',
        speaker1Voice: 'nova',
        listenerCount: 9300,
        authorId: user2,
        transcript: `For seventy years, nuclear fusion has been thirty years away. It is the punchline of every energy conversation, the technology that is always almost here. But something has shifted in the last five years that is not hype — it is physics made manufacturable.

The fundamental promise of fusion is staggering: a single kilogram of hydrogen fuel contains the energy equivalent of ten million kilograms of coal, and the primary byproduct is helium. No long-lived radioactive waste, no carbon emissions, no geopolitical supply chain. If you could harness it at scale, you would solve the energy problem for centuries.

What has changed is the convergence of high-temperature superconducting magnets, AI-assisted plasma control, and private capital willing to back decade-long research cycles. Companies like Commonwealth Fusion and TAE Technologies are not university experiments anymore. They are engineering organizations with deadlines, investors, and specific technical milestones.

The remaining challenges are real. Sustaining plasma at the temperatures required — hotter than the core of the sun — for long enough to achieve net energy gain is genuinely hard. The engineering tolerances are extreme. But the pace of progress over the last three years has been faster than the previous twenty combined. The question is no longer whether fusion will work. It is whether it will arrive in time to matter.`,
      },
      {
        title: 'The Unsolved Files',
        description:
          'Cold cases, forensic breakthroughs, and the investigators who never stopped looking.',
        category: 'True Crime',
        topicPrompt:
          'How genetic genealogy databases cracked cold cases that DNA alone could not solve for decades',
        speaker1Voice: 'shimmer',
        listenerCount: 23100,
        authorId: user1,
        transcript: `In April 2018, investigators announced that they had identified the Golden State Killer, a serial murderer and rapist who had evaded law enforcement for over forty years. The breakthrough did not come from a confessional, a witness, or a surveillance camera. It came from a genealogy website and a family tree.

The technique is called investigative genetic genealogy. Investigators upload crime scene DNA to public databases like GEDmatch, where it is compared against profiles uploaded voluntarily by people who want to find their relatives. When a partial match appears, it suggests a common ancestor. From there, genealogists build family trees, working forward through generations until they identify suspects who match other evidence.

The ethical questions are significant. Millions of people who uploaded their DNA to find cousins never consented to having that data used in criminal investigations. The relatives of a suspect have no say in whether their genetic material implicates a family member. Law is struggling to catch up with what the technology can already do.

What is undeniable is the outcome. Hundreds of cold cases that had been dormant for decades — cases where the DNA existed but no match could be found in law enforcement databases — have now been solved. Families have received answers they thought they would never get. The technology is not going away. The question is how society decides to govern it.`,
      },
      {
        title: 'Sleep Science Unlocked',
        description:
          'The research behind rest, recovery, and why most of what you think you know about sleep is wrong.',
        category: 'Health',
        topicPrompt:
          'What happens in the brain during deep sleep and why cutting it short is more damaging than missing a workout',
        speaker1Voice: 'fable',
        listenerCount: 17800,
        authorId: user2,
        transcript: `If you had to choose between skipping a workout and skipping a full night of sleep, the research is unambiguous: skip the workout. Not because exercise is unimportant, but because the cost of sleep deprivation on nearly every system in your body is catastrophic in ways that are invisible until they are not.

During deep sleep — specifically slow-wave sleep — your brain does something extraordinary. The glymphatic system, a network of channels that surrounds your brain's blood vessels, essentially washes itself. Cerebrospinal fluid flows in pulses, clearing out metabolic byproducts that accumulate during waking hours. Among those byproducts is amyloid-beta, the protein most associated with Alzheimer's disease.

This is not a metaphor. Sleep-deprived brains accumulate measurably more amyloid-beta overnight compared to well-rested ones. Chronic sleep restriction — consistently getting six hours when you need eight — is not a minor inconvenience. It is a progressive insult to your neural architecture that compounds over years.

The practical implications are simple even if the habits are hard. Consistency matters more than duration. Going to bed and waking up at the same time every day, including weekends, anchors your circadian rhythm in ways that sporadic catch-up sleep cannot. Alcohol, which many people use to fall asleep faster, suppresses REM sleep and fragments sleep architecture in the second half of the night. The feeling of a good night's sleep after a glass of wine is largely an illusion.`,
      },
      {
        title: 'The Laugh Lab',
        description:
          'Comedy theory, improv philosophy, and why the funniest people in the room are also the most present.',
        category: 'Comedy',
        topicPrompt:
          'The cognitive science of why things are funny and what improvisers know that most people spend years figuring out',
        speaker1Voice: 'alloy',
        listenerCount: 6400,
        authorId: user1,
        transcript: `Humor is pattern recognition at speed. The reason something is funny — when it is actually funny and not just labeled as such — is that your brain predicts one thing and receives another. The gap between expectation and reality, delivered at exactly the right moment, triggers a response that is almost involuntary. You do not decide to find something funny. It lands or it does not.

Improvisers understand this intuitively, which is why the best improv comedy feels like watching people think in real time. The foundational rule — yes, and — is not just a technique for keeping scenes moving. It is a philosophy of radical acceptance. Whatever your partner offers, you receive it as true and build on it. No blocking, no correcting, no steering toward your preferred ending. Just presence and forward motion.

What takes years to learn is that the funniest choices are almost never the loudest ones. Beginners try to be funny. Experienced improvisers try to be real, and the funny emerges from specificity. A character who orders a very specific sandwich in a very specific nervous way is funnier than a character who announces they are nervous. Show, do not tell — the same advice that makes good writing makes good comedy.

The psychological research on humor points to the same conclusion. Laughter in social settings is almost never about jokes. It is about connection, recognition, and the shared pleasure of noticing the same thing at the same moment. The funniest people in any room are usually the most observant.`,
      },
      {
        title: 'Learn Faster',
        description:
          'Evidence-based strategies for accelerating skill acquisition and making knowledge stick.',
        category: 'Education',
        topicPrompt:
          'Why spaced repetition and retrieval practice outperform traditional studying by a factor of five and how to actually use them',
        speaker1Voice: 'echo',
        listenerCount: 11500,
        authorId: user2,
        transcript: `The way most people study is almost perfectly designed to create the feeling of learning without producing the reality of it. Re-reading notes, highlighting textbooks, watching lecture recordings at 1.5x speed — these strategies feel productive because they feel fluent. Familiar material flows easily. That ease is exactly the problem.

The brain does not store information by exposure. It stores information by retrieval. Every time you pull something out of memory — even imperfectly, even with struggle — you strengthen the neural pathways associated with that knowledge. The difficulty is not a sign that the technique is not working. The difficulty is the technique working.

Spaced repetition exploits this with a simple algorithm: review information at intervals that start short and grow longer as your recall improves. When something is easy to remember, you can wait longer before reviewing it again. When you fail to recall it, the interval resets. The result is a system that permanently extends the horizon of what you know.

Retrieval practice, which means testing yourself rather than reviewing material, produces learning effects that are two to five times larger than passive re-study, according to decades of research in cognitive psychology. The practical implementation is straightforward: close your notes and write down everything you can remember about what you just read. It feels harder. It is harder. It also works dramatically better. The science has been clear on this for thirty years. The challenge is that effective learning strategies feel inefficient in the moment, even when they are not.`,
      },
    ];

    for (const podcast of podcasts) {
      await ctx.db.insert('podcasts', {
        ...podcast,
        thumbnailPrompt: undefined,
        transcript: podcast.transcript,
        audioUrl: undefined,
        audioStorageId: undefined,
        thumbnailUrl: undefined,
        thumbnailStorageId: undefined,
        embedding: undefined,
        status: 'ready',
        failedStep: undefined,
        errorMsg: undefined,
      });
    }

    return { skipped: false, inserted: podcasts.length };
  },
});
