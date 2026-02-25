/**
 * MarketingHome.tsx
 * V2 Phase 1.1B — Marketing landing page at /home-marketing
 *
 * Uses LandingPageTemplate + Swiss Precision marketing components.
 * Simulates resume/JD analysis with a progress bar + typewriter reveal.
 * Does NOT call real scoring logic or paywall logic.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  FAQAccordion,
  FeatureCard,
  LandingPageTemplate,
  SectionHeader,
  StepCard,
  TestimonialCard,
} from "@/components/marketing";
import {
  MKT_ACCENT,
  MKT_ACCENT_BG,
  MKT_ACCENT_BORDER,
  MKT_BG,
  MKT_BODY,
  MKT_BTN_GHOST,
  MKT_BTN_PRIMARY,
  MKT_CARD_BG,
  MKT_CONTAINER,
  MKT_DIVIDER,
  MKT_HEADING,
  MKT_MONO,
  MKT_MUTED,
  MKT_RULE,
  MKT_SECTION_PAD,
  MKT_SHADOW,
  MKT_TEXT,
} from "@/components/marketing/MarketingStyles";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

// ─── Types ────────────────────────────────────────────────────────────────────
type AnalysisState = "idle" | "loading" | "done" | "error";

interface SimulatedResult {
  matchBand: string;
  matchScore: number;
  gaps: string[];
  quickFixes: string[];
}

// ─── Simulated data ───────────────────────────────────────────────────────────
const SIMULATED_RESULT: SimulatedResult = {
  matchBand: "Strong Match",
  matchScore: 78,
  gaps: [
    "Missing 3+ years of cloud infrastructure experience (AWS/GCP/Azure)",
    "No mention of CI/CD pipeline ownership or DevOps tooling",
    "Leadership or mentorship experience not demonstrated",
    "Quantified impact statements absent from most bullet points",
    "Certifications listed in JD (PMP, AWS SAA) not present in resume",
  ],
  quickFixes: [
    "Add a 2-line summary at the top that mirrors the JD's core role description",
    "Quantify at least 3 bullet points with metrics (%, $, time saved)",
    "List any cloud or CI/CD tools used, even if briefly, in a Skills section",
  ],
};

const FAQ_ITEMS = [
  {
    id: "q1",
    question: "Is my resume data stored or shared?",
    answer:
      "No. Your resume and job description are processed in memory and never stored on our servers. We do not train models on your data.",
  },
  {
    id: "q2",
    question: "How accurate is the match score?",
    answer:
      "The free preview uses keyword and semantic matching against the job description. The full report adds rubric-based scoring, ATS simulation, and recruiter-perspective analysis for higher accuracy.",
  },
  {
    id: "q3",
    question: "What does the full report include?",
    answer:
      "The full report includes a detailed rubric breakdown, ATS keyword density analysis, section-by-section rewrite suggestions, a tailored cover letter draft, and a prioritized action plan.",
  },
  {
    id: "q4",
    question: "Do I need to create an account for the free preview?",
    answer:
      "No account is needed for the free preview. Create a free account to unlock the full report, save your results, and track improvements over time.",
  },
  {
    id: "q5",
    question: "Which job markets are supported?",
    answer:
      "Resupify currently supports job markets in Canada, the Philippines, Vietnam, the United States, and global remote roles. More markets are being added.",
  },
  {
    id: "q6",
    question: "How long does the analysis take?",
    answer:
      "The free preview typically completes in 5–10 seconds. The full report may take up to 30 seconds depending on resume length and job description complexity.",
  },
  {
    id: "q7",
    question: "Can I use Resupify for multiple job applications?",
    answer:
      "Yes. Each analysis is independent. You can paste a different job description each time to get a tailored score and gap analysis for every role you apply to.",
  },
  {
    id: "q8",
    question: "Is there a free plan?",
    answer:
      "Yes. The free preview (match band + top gaps + quick fixes) is always free. The full report and saved history require a free account. Premium plans unlock unlimited reports and advanced features.",
  },
];

// ─── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(text: string, active: boolean, speed = 28) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);
  return displayed;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!active) {
      setWidth(0);
      return;
    }
    setWidth(0);
    const steps = [
      { target: 30, delay: 0 },
      { target: 55, delay: 600 },
      { target: 75, delay: 1400 },
      { target: 88, delay: 2200 },
      { target: 95, delay: 3000 },
    ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const s of steps) {
      timers.push(setTimeout(() => setWidth(s.target), s.delay));
    }
    return () => timers.forEach(clearTimeout);
  }, [active]);

  if (!active && width === 0) return null;

  return (
    <div
      data-testid="progress-bar"
      className="w-full h-1 rounded-full bg-[#1A1A2E]/10 overflow-hidden"
      role="progressbar"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[#00D4AA] transition-all duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ─── Hero section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [state, setState] = useState<AnalysisState>("idle");
  const [result, setResult] = useState<SimulatedResult | null>(null);
  const [error, setError] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const matchLabel = useTypewriter(
    result ? `${result.matchBand} — ${result.matchScore}% alignment` : "",
    state === "done"
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resume.trim() || !jd.trim()) {
        setError("Please paste both your resume and the job description.");
        return;
      }
      setError("");
      setState("loading");
      setResult(null);
      // Simulate async analysis (3.8 s)
      await new Promise((r) => setTimeout(r, 3800));
      setResult(SIMULATED_RESULT);
      setState("done");
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    },
    [resume, jd]
  );

  return (
    <section
      data-testid="hero-section"
      className={`${MKT_BG} ${MKT_SECTION_PAD} border-b ${MKT_RULE}`}
    >
      <div className={MKT_CONTAINER}>
        {/* Headline */}
        <div className="max-w-3xl mb-10">
          <p
            className={`${MKT_MONO} text-xs uppercase tracking-widest mb-3`}
          >
            Free Resume · JD Match Preview
          </p>
          <h1
            data-testid="hero-headline"
            className={`${MKT_HEADING} text-4xl sm:text-5xl lg:text-6xl leading-[1.08] mb-5`}
          >
            Know exactly where your resume{" "}
            <span className={MKT_ACCENT}>falls short</span>{" "}
            before you apply.
          </h1>
          <p className={`${MKT_BODY} text-lg sm:text-xl max-w-2xl`}>
            Paste your resume and the job description. Get a free match score,
            your top 5 gaps, and 3 quick fixes — in under 10 seconds. No
            account required.
          </p>
        </div>

        {/* Form */}
        <form
          data-testid="hero-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="resume-input"
              className={`${MKT_MONO} text-xs uppercase tracking-widest`}
            >
              Your Resume
            </label>
            <textarea
              id="resume-input"
              data-testid="resume-input"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume text here…"
              rows={12}
              disabled={state === "loading"}
              className={`w-full rounded-lg border ${MKT_RULE} ${MKT_BG} ${MKT_TEXT} ${MKT_BODY} text-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40 disabled:opacity-50`}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="jd-input"
              className={`${MKT_MONO} text-xs uppercase tracking-widest`}
            >
              Job Description
            </label>
            <textarea
              id="jd-input"
              data-testid="jd-input"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here…"
              rows={12}
              disabled={state === "loading"}
              className={`w-full rounded-lg border ${MKT_RULE} ${MKT_BG} ${MKT_TEXT} ${MKT_BODY} text-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/40 disabled:opacity-50`}
            />
          </div>

          {/* CTA row */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {error && (
              <p
                data-testid="hero-error"
                className={`text-sm text-red-500 ${MKT_BODY}`}
              >
                {error}
              </p>
            )}
            <ProgressBar active={state === "loading"} />
            <div className="flex items-center gap-4">
              <button
                type="submit"
                data-testid="hero-cta"
                disabled={state === "loading"}
                className={`${MKT_BTN_PRIMARY} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {state === "loading" ? "Analysing…" : "Get Free Preview"}
              </button>
              {state === "loading" && (
                <span className={`${MKT_MUTED} text-sm ${MKT_BODY}`}>
                  Scanning resume against JD…
                </span>
              )}
            </div>
          </div>
        </form>

        {/* Results */}
        {state === "done" && result && (
          <div
            ref={resultsRef}
            data-testid="results-block"
            className="mt-8 flex flex-col gap-6"
          >
            {/* Match band */}
            <div
              data-testid="match-band-card"
              className={`${MKT_CARD_BG} rounded-xl border ${MKT_RULE} ${MKT_SHADOW} p-6`}
            >
              <p className={`${MKT_MONO} text-xs uppercase tracking-widest mb-2`}>
                Match Score
              </p>
              <p
                data-testid="match-band-label"
                className={`${MKT_HEADING} text-2xl sm:text-3xl`}
              >
                {matchLabel}
                <span className="animate-pulse">|</span>
              </p>
            </div>

            {/* Gaps */}
            <div className={`${MKT_CARD_BG} rounded-xl border ${MKT_RULE} ${MKT_SHADOW} p-6`}>
              <p className={`${MKT_MONO} text-xs uppercase tracking-widest mb-4`}>
                Biggest Gaps
              </p>
              <ul className="flex flex-col gap-3">
                {result.gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`${MKT_MONO} text-xs mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#1A1A2E]/8 flex items-center justify-center`}
                    >
                      {i + 1}
                    </span>
                    <span className={`${MKT_BODY} text-sm`}>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick fixes */}
            <div className={`${MKT_CARD_BG} rounded-xl border ${MKT_RULE} ${MKT_SHADOW} p-6`}>
              <p className={`${MKT_MONO} text-xs uppercase tracking-widest mb-4`}>
                Quick Fixes
              </p>
              <ul className="flex flex-col gap-3">
                {result.quickFixes.map((fix, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`${MKT_ACCENT} text-lg leading-none shrink-0`}>✓</span>
                    <span className={`${MKT_BODY} text-sm`}>{fix}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Locked full report */}
            <div
              data-testid="locked-report-block"
              className={`rounded-xl border-2 ${MKT_ACCENT_BORDER} bg-[#00D4AA]/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4`}
            >
              <div className="flex-1">
                <p className={`${MKT_HEADING} text-lg mb-1`}>
                  🔒 Unlock the Full Report
                </p>
                <p className={`${MKT_BODY} text-sm`}>
                  Section-by-section rewrites, ATS keyword density, cover
                  letter draft, and a prioritised action plan.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/onboarding"
                  data-testid="create-account-link"
                  className={MKT_BTN_PRIMARY}
                >
                  Create free account
                </Link>
                <Link
                  href="/"
                  data-testid="sign-in-link"
                  className={MKT_BTN_GHOST}
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const { containerRef, getItemClass } = useRevealOnScroll();
  return (
    <section className={MKT_SECTION_PAD}>
      <div className={MKT_CONTAINER}>
        <SectionHeader
          eyebrow="How it works"
          heading="Three steps to a stronger application"
          subheading="No account needed for the free preview. Upgrade when you're ready for the full report."
          align="center"
          size="lg"
          className="mb-12"
        />
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          <div className={getItemClass(0)}>
            <StepCard
              step={1}
              title="Paste your resume"
              description="Copy and paste your resume text. No PDF upload needed — plain text works best for accurate analysis."
            />
          </div>
          <div className={getItemClass(1)}>
            <StepCard
              step={2}
              title="Add the job description"
              description="Paste the full job posting. The more detail you include, the more precise your gap analysis will be."
            />
          </div>
          <div className={getItemClass(2)}>
            <StepCard
              step={3}
              title="Get your free preview"
              description="Receive a match score, your top 5 gaps, and 3 quick fixes in seconds. Create a free account to unlock the full report."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social proof ─────────────────────────────────────────────────────────────
function SocialProofSection() {
  const { containerRef, getItemClass } = useRevealOnScroll();
  return (
    <section className={`${MKT_SECTION_PAD} bg-[#1A1A2E]`}>
      <div className={MKT_CONTAINER}>
        <SectionHeader
          eyebrow="What job seekers say"
          heading="Real results from real applicants"
          align="center"
          size="md"
          className="mb-10 [&_*]:!text-white [&_.text-\\[\\#1A1A2E\\]\\/60]:!text-white/60"
        />
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          <div className={getItemClass(0)}>
            <TestimonialCard
              quote="I applied to 12 jobs with no callbacks. After using Resupify to fix my resume, I got 3 interviews in the first week."
              authorName="Priya M."
              authorTitle="Software Engineer, Toronto"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className={getItemClass(1)}>
            <TestimonialCard
              quote="The gap analysis showed me exactly why I kept getting ghosted. Turns out I was missing 4 keywords the ATS was filtering on."
              authorName="Carlos R."
              authorTitle="Product Manager, Manila"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className={getItemClass(2)}>
            <TestimonialCard
              quote="I used the quick fixes to rewrite my bullet points in 20 minutes. My response rate went from 5% to 28%."
              authorName="Linh T."
              authorTitle="Data Analyst, Ho Chi Minh City"
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Problem section ──────────────────────────────────────────────────────────
function ProblemSection() {
  return (
    <section className={MKT_SECTION_PAD}>
      <div className={`${MKT_CONTAINER} max-w-3xl`}>
        <SectionHeader
          eyebrow="The problem"
          heading="Most resumes are rejected before a human reads them."
          subheading="75% of resumes are filtered out by ATS before reaching a recruiter. Even strong candidates lose out because their resume doesn't mirror the language of the job description — not because they're underqualified."
          align="left"
          size="lg"
        />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { stat: "75%", label: "of resumes filtered by ATS" },
            { stat: "6 sec", label: "average recruiter scan time" },
            { stat: "3×", label: "more interviews with tailored resumes" },
          ].map((item) => (
            <div
              key={item.stat}
              className={`${MKT_CARD_BG} rounded-xl border ${MKT_RULE} ${MKT_SHADOW} p-5 text-center`}
            >
              <p className={`${MKT_MONO} text-3xl mb-1`}>{item.stat}</p>
              <p className={`${MKT_BODY} text-sm`}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Solution section ─────────────────────────────────────────────────────────
function SolutionSection() {
  return (
    <section className={`${MKT_SECTION_PAD} bg-[#F0FDF9]`}>
      <div className={`${MKT_CONTAINER} max-w-3xl`}>
        <SectionHeader
          eyebrow="The solution"
          heading="Resupify reads the job description so you don't have to guess."
          subheading="Our engine compares your resume against the exact language of each job posting — identifying gaps, missing keywords, and weak bullet points — then gives you a prioritised fix list."
          align="left"
          size="lg"
        />
      </div>
    </section>
  );
}

// ─── Features section ─────────────────────────────────────────────────────────
function FeaturesSection() {
  const { containerRef, getItemClass } = useRevealOnScroll();
  const features = [
    {
      title: "Match Score",
      description:
        "A percentage score showing how well your resume aligns with the job description's language, requirements, and tone.",
      metric: "Free preview",
    },
    {
      title: "Gap Analysis",
      description:
        "Your top 5 missing skills, experiences, or keywords that are costing you callbacks — ranked by impact.",
      metric: "Free preview",
    },
    {
      title: "Quick Fixes",
      description:
        "Three high-leverage edits you can make in under 30 minutes to meaningfully improve your match score.",
      metric: "Free preview",
    },
    {
      title: "ATS Simulation",
      description:
        "See exactly which keywords the ATS is scanning for and whether your resume passes the filter.",
      metric: "Full report",
    },
    {
      title: "Section Rewrites",
      description:
        "AI-generated rewrites for each resume section, tailored to the specific job description.",
      metric: "Full report",
    },
    {
      title: "Cover Letter Draft",
      description:
        "A tailored cover letter draft built from your resume and the job description — ready to personalise.",
      metric: "Full report",
    },
  ];

  return (
    <section className={MKT_SECTION_PAD}>
      <div className={MKT_CONTAINER}>
        <SectionHeader
          eyebrow="Features & benefits"
          heading="Everything you need to land the interview"
          subheading="The free preview gives you the signal. The full report gives you the plan."
          align="center"
          size="lg"
          className="mb-12"
        />
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f, i) => (
            <div key={f.title} className={getItemClass(i)}>
              <FeatureCard
                title={f.title}
                description={f.description}
                metric={f.metric}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Full report teaser ───────────────────────────────────────────────────────
function FullReportTeaserSection() {
  return (
    <section className={`${MKT_SECTION_PAD} bg-[#1A1A2E]`}>
      <div className={`${MKT_CONTAINER} max-w-3xl text-center`}>
        <p className={`${MKT_MONO} text-xs uppercase tracking-widest text-[#00D4AA] mb-4`}>
          Full report
        </p>
        <h2 className="font-['DM_Sans'] font-bold text-white text-3xl sm:text-4xl tracking-tight mb-5">
          Go beyond the preview. Get the complete picture.
        </h2>
        <p className="font-['Work_Sans'] text-white/70 text-lg leading-relaxed mb-8">
          The full report includes ATS keyword density, section-by-section
          rewrites, a tailored cover letter, and a prioritised action plan with
          estimated impact scores for each fix.
        </p>
        <Link href="/onboarding" className={MKT_BTN_PRIMARY}>
          Create free account
        </Link>
      </div>
    </section>
  );
}

// ─── Trust & privacy ──────────────────────────────────────────────────────────
function TrustSection() {
  return (
    <section className={MKT_SECTION_PAD}>
      <div className={`${MKT_CONTAINER} max-w-3xl`}>
        <SectionHeader
          eyebrow="Trust & privacy"
          heading="Your data stays yours."
          subheading="We process your resume and job description in memory only. Nothing is stored, logged, or used for model training. You can verify this in our open privacy policy."
          align="center"
          size="md"
        />
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {[
            "No data stored",
            "No model training on your data",
            "No account required for preview",
            "Open privacy policy",
          ].map((item) => (
            <div
              key={item}
              className={`flex items-center gap-2 ${MKT_BODY} text-sm`}
            >
              <span className="text-[#00D4AA] text-base">✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ section ──────────────────────────────────────────────────────────────
function FAQSection() {
  return (
    <section className={`${MKT_SECTION_PAD} bg-[#FAFAFA]`}>
      <div className={`${MKT_CONTAINER} max-w-3xl`}>
        <SectionHeader
          eyebrow="FAQ"
          heading="Common questions"
          align="center"
          size="md"
          className="mb-10"
        />
        <FAQAccordion items={FAQ_ITEMS} />
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTASection() {
  return (
    <section className={`${MKT_SECTION_PAD} border-t ${MKT_RULE}`}>
      <div className={`${MKT_CONTAINER} max-w-2xl text-center`}>
        <p className={`${MKT_MONO} text-xs uppercase tracking-widest mb-4`}>
          Ready?
        </p>
        <h2 className={`${MKT_HEADING} text-3xl sm:text-4xl mb-5`}>
          Get your free match score now.
        </h2>
        <p className={`${MKT_BODY} text-lg mb-8`}>
          No account. No credit card. Results in under 10 seconds.
        </p>
        <a
          href="#hero-section"
          onClick={(e) => {
            e.preventDefault();
            document
              .querySelector("[data-testid='hero-section']")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className={MKT_BTN_PRIMARY}
          data-testid="final-cta"
        >
          Try the free preview
        </a>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function MarketingFooter() {
  return (
    <footer className={`border-t ${MKT_RULE} py-8 ${MKT_BG}`}>
      <div
        className={`${MKT_CONTAINER} flex flex-col sm:flex-row items-center justify-between gap-4`}
      >
        <p className={`${MKT_MONO} text-xs`}>
          Resupify © {new Date().getFullYear()}
        </p>
        <div className="flex gap-6">
          <Link href="/" className={`${MKT_MUTED} text-sm hover:text-[#1A1A2E] transition-colors`}>
            Sign in
          </Link>
          <Link
            href="/onboarding"
            className={`${MKT_MUTED} text-sm hover:text-[#1A1A2E] transition-colors`}
          >
            Create account
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MarketingHome() {
  return (
    <LandingPageTemplate
      hero={<HeroSection />}
      sections={[
        { key: "how-it-works", content: <HowItWorksSection />, divider: false },
        { key: "social-proof", content: <SocialProofSection />, divider: false },
        { key: "problem", content: <ProblemSection />, divider: true },
        { key: "solution", content: <SolutionSection />, divider: false },
        { key: "features", content: <FeaturesSection />, divider: true },
        { key: "full-report", content: <FullReportTeaserSection />, divider: false },
        { key: "trust", content: <TrustSection />, divider: true },
        { key: "faq", content: <FAQSection />, divider: true },
        { key: "final-cta", content: <FinalCTASection />, divider: true },
      ]}
      footer={<MarketingFooter />}
    />
  );
}
