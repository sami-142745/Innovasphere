import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FlaskConical,
  GraduationCap,
  Handshake,
  Lightbulb,
  Presentation,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
  Zap
} from 'lucide-react';
import { projectService } from '../../services/projects';
import { setProjectCache, getCacheKey, getProjectCache } from '../../utils/projectCache';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const FEATURES = [
  {
    icon: GraduationCap,
    title: 'For students',
    accent: 'from-brand-500 to-indigo-600 shadow-glow',
    points: [
      'Discover real research projects across every domain',
      'Join teams that match your skills and interests',
      'Request mentorship from faculty working in your field'
    ]
  },
  {
    icon: Presentation,
    title: 'For faculty',
    accent: 'from-accent-500 to-brand-600 shadow-glow-cyan',
    points: [
      'Publish research projects and open problems',
      'Review student teams and mentorship requests',
      'Guide projects from idea to publication'
    ]
  }
];

const STEPS = [
  {
    icon: Lightbulb,
    step: '01',
    title: 'Publish a project',
    description: 'Students and faculty describe a research idea, define the skills it needs and set its goals.',
    accent: 'from-brand-500 to-indigo-600'
  },
  {
    icon: Users,
    step: '02',
    title: 'Build a team',
    description: 'Candidates find projects by domain and skill, join teams and collaborate in one workspace.',
    accent: 'from-accent-500 to-brand-600'
  },
  {
    icon: Handshake,
    step: '03',
    title: 'Get mentored',
    description: 'Faculty mentors review progress and guide the team from first prototype to final submission.',
    accent: 'from-orchid-500 to-brand-600'
  }
];

const STATS = [
  { value: 'AI-matched', label: 'projects & mentors' },
  { value: '0 mocks', label: '— real research only' },
  { value: '1 platform', label: 'students → publication' }
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }
};

export default function Landing() {
  useEffect(() => {
    // Prefetch projects for instant browse page load
    const query = { page: 0, size: 9, sort: 'createdAt,desc' };
    const cached = getProjectCache(query);
    
    if (!cached) {
      projectService.search({
        page: 0,
        size: 9,
        sort: 'createdAt,desc',
      }).then((data) => {
        setProjectCache(query, data);
      }).catch(() => {
        // Ignore prefetch errors
      });
    }
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* ---- Hero ---- */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="blob blob-purple -left-24 -top-24 h-[480px] w-[480px] animate-float-slow" />
          <div className="blob blob-cyan right-0 top-16 h-[420px] w-[420px] animate-float" />
          <div className="blob blob-orchid bottom-0 left-1/3 h-96 w-96 opacity-70 animate-float-slow" />
          <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_75%_65%_at_50%_30%,black,transparent)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mx-auto max-w-3xl text-center">
            <span className="glass-chip inline-flex items-center gap-2 rounded-full border-brand-200/70 px-4 py-1.5 text-xs font-medium text-brand-700 dark:border-brand-400/25 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              University research collaboration, reimagined
            </span>

            <h1 className="mt-7 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-slate-50">
              Research projects, teams &{' '}
              <span className="gradient-text-cyan">faculty mentors</span>, in one place.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              INNOVASPHERE connects students and faculty around publishable research. Discover AI-matched projects, assemble
              teams by skill, and get guided by experienced mentors from idea to completion.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/browse">
                <button className="gradient-animated group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-7 text-base font-medium text-white shadow-[0_14px_36px_-10px_rgb(109_94_245/0.65)] transition sm:w-auto">
                  Browse projects
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
              </Link>
              <Link to="/register">
                <button className="glass inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-7 text-base font-medium text-slate-800 transition hover:border-brand-300 sm:w-auto dark:text-slate-100 dark:hover:border-brand-400/40">
                  Create an account
                </button>
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mx-auto mt-12 flex max-w-xl flex-wrap items-center justify-center gap-x-8 gap-y-3"
            >
              {STATS.map((s) => (
                <div key={s.value} className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.value}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---- Features ---- */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ delay: i * 0.1, ...fadeUp.transition }}
              className="glass-panel group relative overflow-hidden rounded-panel p-7"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-brand opacity-[0.08] blur-3xl transition group-hover:opacity-20" aria-hidden="true" />
              <div className="relative flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white transition-transform duration-300 group-hover:scale-110 ${f.accent}`}>
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{f.title}</h2>
              </div>
              <ul className="relative mt-5 space-y-3">
                {f.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-brand" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="text-center">
          <motion.span {...fadeUp} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
            <Wand2 className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
            The pipeline
          </motion.span>
          <motion.h2 {...fadeUp} className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            From idea to <span className="gradient-text">completed research</span>
          </motion.h2>
          <motion.p {...fadeUp} className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            Three simple steps take a research idea from pitch to completed, mentored project.
          </motion.p>
        </div>

        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <div className="pointer-events-none absolute inset-x-16 top-10 hidden h-px bg-gradient-to-r from-brand-500/40 via-accent-500/40 to-orchid-500/40 md:block" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              {...fadeUp}
              transition={{ delay: i * 0.12, ...fadeUp.transition }}
              className="glass relative overflow-hidden rounded-panel p-6 transition-all duration-300 hover:-translate-y-1"
            >
              <span className="text-5xl font-black tracking-tight bg-gradient-to-b from-slate-200 to-slate-100 bg-clip-text text-transparent dark:from-white/10 dark:to-white/5">
                {s.step}
              </span>
              <div className={`mt-4 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-card ${s.accent}`}>
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- AI match spotlight ---- */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <motion.div {...fadeUp} className="glass-panel relative overflow-hidden rounded-panel p-8 sm:p-10">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="blob blob-cyan -right-16 -top-16 h-64 w-64" />
            <div className="blob blob-purple -bottom-20 -left-16 h-72 w-72" />
          </div>
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300/60 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700 dark:border-accent-400/25 dark:bg-accent-500/10 dark:text-accent-300">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                AI-powered matching
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                Perfect-fit projects & mentors, scored just for you
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Our recommendation engine scores projects and faculty against your skills, interests and research domains — so
                you spend less time searching and more time researching.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Skill overlap', 'Domain affinity', 'Missing-skills guide', 'Live match rings'].map((t) => (
                  <span key={t} className="glass-chip rounded-full px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative h-52 w-full max-w-sm">
                <div className="glass absolute left-4 top-6 w-56 rounded-card-sm p-4 animate-float">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Neural Interface Design</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white"><FlaskConical className="h-4 w-4" aria-hidden="true" /></span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div className="h-full w-[92%] rounded-full bg-gradient-brand" />
                    </div>
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-300">92</span>
                  </div>
                </div>
                <div className="glass absolute bottom-2 right-2 w-56 rounded-card-sm p-4 animate-float-slow">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Prof. Grace Hopper</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-cyan text-white"><GraduationCap className="h-4 w-4" aria-hidden="true" /></span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div className="h-full w-[88%] rounded-full bg-gradient-cyan" />
                    </div>
                    <span className="text-sm font-bold text-accent-600 dark:text-accent-300">88</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---- Testimonial ---- */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <motion.blockquote {...fadeUp} className="glass-panel relative mx-auto max-w-3xl rounded-panel p-8 text-center sm:p-10">
          <Quote className="mx-auto h-8 w-8 text-brand-400/60" aria-hidden="true" />
          <p className="mt-5 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
            &ldquo;INNOVASPHERE matched our lab with students who already knew the stack — and the mentorship loop kept the
            project funded and focused. It changed how we run undergraduate research.&rdquo;
          </p>
          <footer className="mt-6 flex items-center justify-center gap-3">
            <span className="h-10 w-10 rounded-full bg-gradient-brand" aria-hidden="true" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Prof. Ada Lovelace</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Department of Computer Science</p>
            </div>
          </footer>
        </motion.blockquote>
      </section>

      {/* ---- CTA ---- */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <motion.div
          {...fadeUp}
          className="gradient-animated relative overflow-hidden rounded-panel px-6 py-14 text-center shadow-[0_20px_60px_-20px_rgb(109_94_245/0.6)] sm:px-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" aria-hidden="true" />
          <div className="relative">
            <ShieldCheck className="mx-auto h-10 w-10 text-white/80" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to start your research journey?</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/90">
              Create a free account to publish a project, join a team and connect with faculty mentors.
            </p>
            <Link to="/register">
              <button className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-brand-700 shadow-card transition-transform hover:scale-[1.03]">
                <Rocket className="h-4 w-4" aria-hidden="true" />
                Get started free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}