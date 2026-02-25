/**
 * marketing-home-v2-phase1b.test.ts
 * V2 Phase 1.1B — Tests for /home-marketing route and MarketingHome.tsx
 *
 * Tests are source-file checks (no DOM renderer available in vitest).
 * Covers: route exists, headline, CTA, progress bar, results block, locked report.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const appSrc = readFileSync(resolve(ROOT, "client/src/App.tsx"), "utf-8");
const pageSrc = readFileSync(
  resolve(ROOT, "client/src/pages/marketing/MarketingHome.tsx"),
  "utf-8"
);

// ─── A: Route registration ────────────────────────────────────────────────────
describe("A: /home-marketing route registration", () => {
  it("A1: App.tsx imports MarketingHome", () => {
    expect(appSrc).toContain('import MarketingHome from "./pages/marketing/MarketingHome"');
  });

  it("A2: App.tsx registers /home-marketing route", () => {
    expect(appSrc).toContain('path="/home-marketing"');
    expect(appSrc).toContain("component={MarketingHome}");
  });

  it("A3: /home-marketing route does not replace /", () => {
    // The / route must still map to Home, not MarketingHome
    const homeRoute = appSrc.match(/path="\/"[^>]*component=\{(\w+)\}/);
    expect(homeRoute).not.toBeNull();
    expect(homeRoute![1]).toBe("Home");
  });

  it("A4: MarketingHome is not imported as the default / component", () => {
    // Ensure MarketingHome is not used on the / route
    expect(appSrc).not.toMatch(/path="\/"\s[^>]*component=\{MarketingHome\}/);
  });
});

// ─── B: Hero section ──────────────────────────────────────────────────────────
describe("B: Hero section content", () => {
  it("B1: hero-headline data-testid exists", () => {
    expect(pageSrc).toContain('data-testid="hero-headline"');
  });

  it("B2: headline contains 'falls short'", () => {
    expect(pageSrc).toContain("falls short");
  });

  it("B3: hero-cta button exists", () => {
    expect(pageSrc).toContain('data-testid="hero-cta"');
  });

  it("B4: CTA button text is 'Get Free Preview'", () => {
    expect(pageSrc).toContain("Get Free Preview");
  });

  it("B5: resume-input textarea exists", () => {
    expect(pageSrc).toContain('data-testid="resume-input"');
  });

  it("B6: jd-input textarea exists", () => {
    expect(pageSrc).toContain('data-testid="jd-input"');
  });

  it("B7: hero-form data-testid exists", () => {
    expect(pageSrc).toContain('data-testid="hero-form"');
  });

  it("B8: hero-section data-testid exists", () => {
    expect(pageSrc).toContain('data-testid="hero-section"');
  });
});

// ─── C: Progress bar ─────────────────────────────────────────────────────────
describe("C: Progress bar (no spinner)", () => {
  it("C1: ProgressBar component is defined", () => {
    expect(pageSrc).toContain("function ProgressBar");
  });

  it("C2: progress-bar data-testid exists", () => {
    expect(pageSrc).toContain('data-testid="progress-bar"');
  });

  it("C3: ProgressBar uses role=progressbar (accessible)", () => {
    expect(pageSrc).toContain('role="progressbar"');
  });

  it("C4: ProgressBar is active during loading state", () => {
    expect(pageSrc).toContain("<ProgressBar active={state === \"loading\"}");
  });

  it("C5: No spinner element (no animate-spin class)", () => {
    expect(pageSrc).not.toContain("animate-spin");
  });

  it("C6: Progress bar uses teal accent color #00D4AA", () => {
    expect(pageSrc).toContain("bg-[#00D4AA]");
  });

  it("C7: Progress bar has smooth transition", () => {
    expect(pageSrc).toContain("transition-all");
  });
});

// ─── D: Results block ─────────────────────────────────────────────────────────
describe("D: Results block (simulated)", () => {
  it("D1: results-block data-testid exists", () => {
    expect(pageSrc).toContain('data-testid="results-block"');
  });

  it("D2: match-band-card data-testid exists", () => {
    expect(pageSrc).toContain('data-testid="match-band-card"');
  });

  it("D3: match-band-label data-testid exists", () => {
    expect(pageSrc).toContain('data-testid="match-band-label"');
  });

  it("D4: results block shown only when state === 'done'", () => {
    expect(pageSrc).toContain("state === \"done\" && result");
  });

  it("D5: SIMULATED_RESULT contains 5 gaps", () => {
    const gapsMatch = pageSrc.match(/gaps:\s*\[([^\]]+)\]/s);
    expect(gapsMatch).not.toBeNull();
    const gapItems = gapsMatch![1].match(/"/g);
    // Each gap string has 2 quotes (open + close), so 5 gaps = 10 quotes
    expect(gapItems!.length).toBeGreaterThanOrEqual(10);
  });

  it("D6: SIMULATED_RESULT contains 3 quick fixes", () => {
    const fixesMatch = pageSrc.match(/quickFixes:\s*\[([^\]]+)\]/s);
    expect(fixesMatch).not.toBeNull();
    const fixItems = fixesMatch![1].match(/"/g);
    // Each fix string has 2 quotes, so 3 fixes = 6 quotes
    expect(fixItems!.length).toBeGreaterThanOrEqual(6);
  });

  it("D7: typewriter reveal used for match band label", () => {
    expect(pageSrc).toContain("useTypewriter");
    expect(pageSrc).toContain("matchLabel");
  });

  it("D8: simulated delay is ~3.8 seconds", () => {
    expect(pageSrc).toContain("3800");
  });
});

// ─── E: Locked full report block ─────────────────────────────────────────────
describe("E: Locked full report block", () => {
  it("E1: locked-report-block data-testid exists", () => {
    expect(pageSrc).toContain('data-testid="locked-report-block"');
  });

  it("E2: create-account-link points to /onboarding", () => {
    expect(pageSrc).toContain('data-testid="create-account-link"');
    expect(pageSrc).toContain('href="/onboarding"');
  });

  it("E3: sign-in-link exists", () => {
    expect(pageSrc).toContain('data-testid="sign-in-link"');
  });

  it("E4: locked report uses teal accent border", () => {
    expect(pageSrc).toContain(MKT_ACCENT_BORDER_MARKER);
  });

  it("E5: locked report block shown inside results block (state=done)", () => {
    // locked-report-block must appear after results-block in the source
    const resultsIdx = pageSrc.indexOf('data-testid="results-block"');
    const lockedIdx = pageSrc.indexOf('data-testid="locked-report-block"');
    expect(resultsIdx).toBeGreaterThan(-1);
    expect(lockedIdx).toBeGreaterThan(resultsIdx);
  });
});

// ─── F: Sections present ─────────────────────────────────────────────────────
describe("F: All required sections present", () => {
  it("F1: HowItWorksSection defined", () => {
    expect(pageSrc).toContain("function HowItWorksSection");
  });

  it("F2: SocialProofSection defined", () => {
    expect(pageSrc).toContain("function SocialProofSection");
  });

  it("F3: ProblemSection defined", () => {
    expect(pageSrc).toContain("function ProblemSection");
  });

  it("F4: SolutionSection defined", () => {
    expect(pageSrc).toContain("function SolutionSection");
  });

  it("F5: FeaturesSection defined", () => {
    expect(pageSrc).toContain("function FeaturesSection");
  });

  it("F6: FullReportTeaserSection defined", () => {
    expect(pageSrc).toContain("function FullReportTeaserSection");
  });

  it("F7: TrustSection defined", () => {
    expect(pageSrc).toContain("function TrustSection");
  });

  it("F8: FAQSection defined", () => {
    expect(pageSrc).toContain("function FAQSection");
  });

  it("F9: FinalCTASection defined", () => {
    expect(pageSrc).toContain("function FinalCTASection");
  });

  it("F10: final-cta data-testid exists", () => {
    expect(pageSrc).toContain('data-testid="final-cta"');
  });
});

// ─── G: FAQ content ───────────────────────────────────────────────────────────
describe("G: FAQ items", () => {
  it("G1: FAQ_ITEMS array defined with 8 items", () => {
    const faqMatch = pageSrc.match(/FAQ_ITEMS\s*=\s*\[/);
    expect(faqMatch).not.toBeNull();
    // Count id: "q1" through "q8"
    const ids = pageSrc.match(/id:\s*"q\d+"/g);
    expect(ids).not.toBeNull();
    expect(ids!.length).toBeGreaterThanOrEqual(8);
  });

  it("G2: FAQ covers privacy question", () => {
    expect(pageSrc).toContain("stored or shared");
  });

  it("G3: FAQ covers accuracy question", () => {
    expect(pageSrc).toContain("accurate");
  });
});

// ─── H: Marketing components used ────────────────────────────────────────────
describe("H: Marketing components integration", () => {
  it("H1: LandingPageTemplate used", () => {
    expect(pageSrc).toContain("LandingPageTemplate");
  });

  it("H2: SectionHeader used", () => {
    expect(pageSrc).toContain("SectionHeader");
  });

  it("H3: StepCard used", () => {
    expect(pageSrc).toContain("StepCard");
  });

  it("H4: FeatureCard used", () => {
    expect(pageSrc).toContain("FeatureCard");
  });

  it("H5: TestimonialCard used", () => {
    expect(pageSrc).toContain("TestimonialCard");
  });

  it("H6: FAQAccordion used", () => {
    expect(pageSrc).toContain("FAQAccordion");
  });

  it("H7: useRevealOnScroll used", () => {
    expect(pageSrc).toContain("useRevealOnScroll");
  });
});

// ─── I: Teal-only accent ─────────────────────────────────────────────────────
describe("I: Teal accent only on CTA + highlights", () => {
  it("I1: Primary CTA uses teal #00D4AA", () => {
    expect(pageSrc).toContain("MKT_BTN_PRIMARY");
  });

  it("I2: No blue accent colors used directly", () => {
    // Should not have hardcoded blue tailwind classes
    expect(pageSrc).not.toMatch(/bg-blue-[0-9]+|text-blue-[0-9]+/);
  });
});

// ─── J: Protected areas untouched ────────────────────────────────────────────
describe("J: Protected areas untouched", () => {
  it("J1: MarketingHome does not import scoring logic modules", () => {
    // Should not import scoring/rubric modules (content strings are OK)
    expect(pageSrc).not.toMatch(/import.*scoring/i);
    expect(pageSrc).not.toMatch(/from.*rubric/i);
  });

  it("J2: MarketingHome does not import Stripe or payment modules", () => {
    // Should not import Stripe SDK or paywall modules
    expect(pageSrc).not.toMatch(/import.*stripe/i);
    expect(pageSrc).not.toMatch(/from.*paywall/i);
    expect(pageSrc).not.toMatch(/loadStripe|StripeProvider/i);
  });

  it("J3: MarketingHome does not call real tRPC procedures for analysis", () => {
    // Should not call any real analysis procedure
    expect(pageSrc).not.toContain("trpc.analysis");
    expect(pageSrc).not.toContain("trpc.resume");
    expect(pageSrc).not.toContain("trpc.scoring");
  });

  it("J4: Results are simulated (SIMULATED_RESULT constant used)", () => {
    expect(pageSrc).toContain("SIMULATED_RESULT");
  });
});

// Helper constant for E4 test
const MKT_ACCENT_BORDER_MARKER = "MKT_ACCENT_BORDER";
