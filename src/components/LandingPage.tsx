import {
  ArrowRight,
  ArrowUpRight,
  BookmarkSimple,
  Check,
  Headphones,
  MagicWand,
  MicrophoneStage,
  Play,
  Waveform,
} from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import './landing.css'
import { Brand, SiteFooter, SiteHeader } from './SiteChrome'

const features = [
  {
    icon: MagicWand,
    number: '01',
    title: 'Start with an idea',
    copy: 'Bring a topic or script. We help turn your words into an episode that is ready to hear.',
  },
  {
    icon: MicrophoneStage,
    number: '02',
    title: 'Find your voice',
    copy: 'Choose the AI voice that fits your story, then give your show a title, category, and cover.',
  },
  {
    icon: Headphones,
    number: '03',
    title: 'Press play and share',
    copy: 'Publish to a place made for listening. Discover new shows and save the ones you love.',
  },
]

const waveBars = [
  '8a',
  '16b',
  '10c',
  '24d',
  '15e',
  '30f',
  '19g',
  '12h',
  '27i',
  '36j',
  '22k',
  '13l',
  '29m',
  '18n',
  '10o',
  '23p',
  '32q',
  '15r',
  '25s',
  '11t',
  '20u',
  '8v',
]

function PrimaryCta({ children = 'Start creating' }: { children?: React.ReactNode }) {
  return (
    <Link to="/sign-up" className="landing-button landing-button-primary">
      {children}
      <ArrowRight size={18} weight="bold" aria-hidden="true" />
    </Link>
  )
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <SiteHeader />

      <main>
        <section className="landing-hero landing-container" aria-labelledby="landing-heading">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow">
              <span className="landing-eyebrow-dot" /> YOUR IDEAS SOUND BETTER HERE
            </div>
            <h1 id="landing-heading">
              Make a podcast <em>worth hearing.</em>
            </h1>
            <p className="landing-hero-description">
              Turn the ideas in your head into audio people can connect with. Create with AI, find
              your voice, and share your story with the world.
            </p>
            <div className="landing-hero-actions">
              <PrimaryCta>Create your podcast</PrimaryCta>
              <Link to="/discover" className="landing-button landing-button-outline">
                <Play size={17} weight="fill" aria-hidden="true" />
                Explore podcasts
              </Link>
            </div>
            <p className="landing-hero-note">
              <Check size={16} weight="bold" aria-hidden="true" /> Start free with 3 podcast
              generations
            </p>
          </div>
          <div className="landing-hero-visual">
            <img
              src="/assets/podcaster-hero.webp"
              alt="Podcast creator recording an episode in a warm, professional studio"
              fetchPriority="high"
            />
            <div className="landing-image-shade" />
            <div className="landing-on-air">
              <span /> ON AIR
            </div>
            <div className="landing-audio-card">
              <div className="landing-audio-play">
                <Play size={18} weight="fill" aria-hidden="true" />
              </div>
              <div className="landing-audio-detail">
                <span className="landing-audio-label">A STORY IN THE MAKING</span>
                <strong>Ideas sound different out loud.</strong>
                <div className="landing-waveform" aria-hidden="true">
                  {waveBars.map((bar) => (
                    <i key={bar} style={{ height: Number.parseInt(bar, 10) }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-process-band" aria-label="The creation process">
          <div className="landing-container landing-process-items">
            <span>ONE IDEA</span>
            <i aria-hidden="true" />
            <span>YOUR VOICE</span>
            <i aria-hidden="true" />
            <span>A WHOLE NEW WAY TO BE HEARD</span>
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-container">
          <div className="landing-section-intro">
            <div>
              <p className="landing-kicker">THE SIMPLE WAY TO START</p>
              <h2>
                From thought to <span>podcast.</span>
              </h2>
            </div>
            <p>
              No studio setup. No complicated software. Just a simple path from what you want to say
              to something worth listening to.
            </p>
          </div>
          <div className="landing-steps">
            {features.map(({ icon: Icon, number, title, copy }) => (
              <article className="landing-step" key={number}>
                <div className="landing-step-top">
                  <span className="landing-step-icon">
                    <Icon size={26} weight="duotone" aria-hidden="true" />
                  </span>
                  <span className="landing-step-number">{number} / 03</span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="landing-feature-section">
          <div className="landing-container landing-feature-grid">
            <div className="landing-feature-demo">
              <div className="landing-demo-top">
                <Brand light />
                <span>
                  <span /> CREATOR STUDIO
                </span>
              </div>
              <div className="landing-demo-body">
                <div className="landing-demo-eyebrow">
                  <Waveform size={18} weight="bold" aria-hidden="true" /> YOUR NEXT EPISODE
                </div>
                <h3>Start with your story.</h3>
                <div className="landing-demo-field">
                  <small>EPISODE TITLE</small>
                  <span>The ideas that change everything</span>
                </div>
                <div className="landing-demo-field landing-demo-field-large">
                  <small>WHAT'S YOUR EPISODE ABOUT?</small>
                  <span>Every great idea begins with a question...</span>
                  <div className="landing-demo-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="landing-demo-footer">
                  <span>
                    <MicrophoneStage size={17} weight="fill" aria-hidden="true" /> Choose your voice
                  </span>
                  <span className="landing-demo-generate">
                    Generate episode <ArrowRight size={15} weight="bold" aria-hidden="true" />
                  </span>
                </div>
              </div>
              <div className="landing-demo-float">
                <span>
                  <Waveform size={21} weight="bold" aria-hidden="true" />
                </span>
                <div>
                  <strong>Made to be heard</strong>
                  <small>From first thought to first listen</small>
                </div>
              </div>
            </div>
            <div className="landing-feature-copy">
              <p className="landing-kicker">BUILT FOR THE STORYTELLERS</p>
              <h2>Everything you need to get your voice out there.</h2>
              <p>
                Podcaster brings the creative parts together so you can focus on your message. Shape
                an episode, choose how it sounds, and publish when it feels right.
              </p>
              <div className="landing-feature-list">
                <div>
                  <span>
                    <MagicWand size={20} weight="duotone" aria-hidden="true" />
                  </span>
                  <div>
                    <strong>AI assisted creation</strong>
                    <small>Turn a topic or script into an audio episode.</small>
                  </div>
                </div>
                <div>
                  <span>
                    <Headphones size={20} weight="duotone" aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Voices that fit your story</strong>
                    <small>Pick from a range of AI voices for your show.</small>
                  </div>
                </div>
                <div>
                  <span>
                    <BookmarkSimple size={20} weight="duotone" aria-hidden="true" />
                  </span>
                  <div>
                    <strong>A home for good listening</strong>
                    <small>Explore, bookmark, and come back to favorites.</small>
                  </div>
                </div>
              </div>
              <Link to="/sign-up" className="landing-text-link">
                Create your first episode{' '}
                <ArrowUpRight size={19} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-final-section landing-container">
          <div className="landing-final-glow" aria-hidden="true" />
          <p className="landing-kicker">THE MIC IS YOURS</p>
          <h2>
            Someone needs to hear <em>your story.</em>
          </h2>
          <p>Start creating today. Your first great episode begins with a single idea.</p>
          <PrimaryCta>Get started for free</PrimaryCta>
          <span>No credit card required to start</span>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
