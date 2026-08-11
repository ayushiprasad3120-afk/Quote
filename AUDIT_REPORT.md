# InsureDirect — Production Audit Report

**Scope:** Full-codebase audit and targeted fixes across code quality, accessibility, SEO, Google Ads
readiness, and the pay-per-call (CallButton/campaign) system. No architecture, folder structure, or design
system was regenerated — every change below is a fix or a wiring-up of already-built-but-unused code.

**Method:** Findings in this report are based on actual scripted checks run against the codebase (import
resolution, unused-import detection, WCAG contrast calculation, and dependency/usage grepping) — not
estimates. Where a check wasn't possible in this environment (see "What I could not verify" below), I say so
rather than assume.

---

## 1. Issues Found & Fixed

### Pay-per-call / campaign system

| Issue | Where | Fix |
|---|---|---|
| Sticky Call Bar, Floating Call Button, and the Footer's fine-print phone number were still wired to the older `useTrackingNumber`/`did-resolver` hook from Part 2–3, not the campaign-aware `useCallAction`/`resolveCallAction` system built in Part 3. Practically: if a campaign had a `trackingUrl` override, the header and CTA buttons would redirect correctly, but the mobile sticky bar, floating button, and footer number would still silently produce a plain `tel:` link. | `components/layout/sticky-call-bar.tsx`, `floating-call-button.tsx`, `footer.tsx` | Rewired all three through `useCallAction()`, with full `redirect` / `tel` / `disabled` handling (previously only `tel` existed on these three surfaces). Extracted a new `FooterPhoneLink` client component so `Footer` itself stays a Server Component. |
| `CallNowButton` was a legacy wrapper around `CallButton`, still used directly in Navbar, Hero, and CTASection instead of `CallButton` itself. | 3 files | Migrated all 3 call sites to `CallButton` directly; deleted `call-now-button.tsx` (dead code). |
| Legacy `useTrackingNumber` hook became fully orphaned once the above migrations landed. | `hooks/use-tracking-number.ts` | Deleted (zero remaining references, confirmed by grep before deletion). `resolveDID`/`did-resolver.ts` itself is still correctly used — it's the organic-traffic fallback inside `cta-resolver.ts`, not dead. |
| Hardcoded phone-number scan | whole codebase | Zero hardcoded phone numbers found outside `config/`. All phone numbers now resolve through `CallButton` → `useCallAction` → `resolveCallAction`, with no exceptions remaining. |

**Net result:** every phone-number-rendering surface on the site (Navbar, Hero, Sticky Call Bar, Floating
Call Button, Footer, service pages, state/city pages, campaign pages, Contact page) now goes through the
same single resolution function. This was **not** fully true before this audit — three surfaces were quietly
running on the older, campaign-unaware system.

### Accessibility (WCAG)

| Issue | Measured contrast | Fix |
|---|---|---|
| `ink-faint` design token (#8A93A3) used as real body text — dates, "Last updated," author bylines, and the campaign page's legal advertiser disclosure — in ~14 places | **3.1:1** (fails AA's 4.5:1 minimum for normal text) | Changed the token itself to `#6B7485` (**4.71:1**) in `tailwind.config.ts`, fixing all ~14 usages from one change. |
| Footer legal disclaimer paragraph (`text-white/45` on navy) | **4.34:1** (fails) | Bumped to `white/60` (**6.68:1**) |
| Footer copyright line (`text-white/40` on navy) | **3.72:1** (fails) | Bumped to `white/60` (**6.68:1**) |
| Campaign page "open now" hours label (`text-white/50` on navy) | 5.03:1 (technically passes, but thin margin) | Bumped to `white/65` (**7.62:1**) for safety margin |
| Navbar "Insurance" dropdown had no Escape-to-close or click-outside-to-close — a keyboard/screen-reader trap once opened without a mouse | — | Added `keydown`(Escape) and `mousedown`(outside) listeners; dropdown also now closes on link click |
| Skip-to-content link lived inside the (now scroll-transforming) header, risking being carried off-screen with the header on scroll-hide | — | Moved to a fixed sibling in root `layout.tsx`, independent of header transform |

Colors verified as already passing AA and left unchanged (with actual computed ratios): navy-950 on white
16.6:1, emerald-700 on white 5.01:1, ink-muted on white 5.98:1, emerald-300 on navy-950 8.32:1, white/70 on
navy-950 8.68:1, emerald-700 on emerald-50 pill background 4.6:1.

### Code quality / dead code

| Issue | Fix |
|---|---|
| `getServiceBySlug` imported but never used in `app/blog/[slug]/page.tsx` (pre-existing bug from Part 4) | Removed |
| `lib/utils/slugify.ts` was planned in the Part 1 architecture doc but never actually created | Created, and put to real use (see below) |
| `next-mdx-remote` listed as a dependency but never imported anywhere — the project hand-parses MDX frontmatter via `gray-matter` and renders plain paragraphs, it never used the MDX-to-React compiler | Removed from `package.json` |
| `components/marketing/feature-grid.tsx`, `components/blog/table-of-contents.tsx`, and `hooks/use-scroll-direction.ts` were fully built in earlier parts but never called from any page | Wired in rather than deleted, since each fills a real gap: `TableOfContents` now powers a working sticky/inline TOC with anchor-linked headings on blog articles (uses the new `slugify` util); `useScrollDirection` now drives a hide-on-scroll-down Navbar; `FeatureGrid` now fills the About page's Mission/Vision/Consumer-First content that Part 5 asked for but was never actually broken out into its own section |
| `components/ui/modal.tsx` is still unused | Left as-is — it's a documented, ready-to-use primitive (same category as any design-system component built ahead of a concrete use case), not leftover cruft. Flagged below as optional. |
| Stale doc-comment reference to the just-deleted `CallNowButton` in `lib/campaign/cta-resolver.ts` | Updated |

**Verification method, not assertion:** I ran a script cross-checking every `@/...` import in every `.ts`/
`.tsx` file against the actual file tree (**0 missing**, both before and after all fixes), and a corrected
unused-named-import scanner across the whole codebase (**0 unused**, after fixing the one real instance it
found — a leftover `PhoneOff` icon import from my own `sticky-call-bar.tsx` rewrite, caught and removed in
the same pass). No `TODO` comments or lorem-ipsum content anywhere in the codebase.

### SEO / Google Ads

- Reviewed for duplicate metadata across all route `generateMetadata()`/`metadata` exports — titles are
  unique per page; legal pages pull unique titles from their MDX frontmatter (no fallback ever triggers
  since all 5 docs exist and match their slugs).
- Campaign pages remain `noindex` and excluded via `robots.ts` (protects message-match/Quality Score,
  unchanged from Part 4–6).
- No exaggerated or misleading claims found in a full-text scan of service/campaign copy — `services.config.ts`
  and `campaign.config.ts` copy was already written defensively in Parts 2–3 (no "lowest price,"
  "guaranteed approval," etc.), confirmed still true after this pass.
- Blog articles now have real internal-linking reinforcement via the working `TableOfContents` (anchor
  links into the article) in addition to the existing category/tag/related-article/service cross-links.

---

## 2. Files Modified

**Rewired to the campaign-aware call system:**
`components/layout/sticky-call-bar.tsx`, `components/layout/floating-call-button.tsx`,
`components/layout/footer.tsx`, `components/layout/navbar.tsx`, `components/marketing/hero.tsx`,
`components/marketing/cta-section.tsx`

**New files:**
`components/layout/footer-phone-link.tsx`, `lib/utils/slugify.ts`

**Deleted (dead code):**
`components/shared/call-now-button.tsx`, `hooks/use-tracking-number.ts`

**Accessibility fixes:**
`tailwind.config.ts` (ink-faint token), `components/layout/footer.tsx` (contrast),
`app/campaign/[campaignSlug]/page.tsx` (contrast), `components/layout/navbar.tsx` (keyboard/focus handling),
`app/layout.tsx` (skip-link placement)

**Wired-in previously dead components:**
`app/blog/[slug]/page.tsx` (TableOfContents + fixed unused import), `app/(marketing)/about/page.tsx`
(FeatureGrid), `hooks/use-scroll-direction.ts` (improved threshold logic + used by Navbar)

**Housekeeping:**
`package.json` (removed unused `next-mdx-remote`), `lib/campaign/cta-resolver.ts` (stale comment)

---

## 3. Remaining Optional Improvements

These are genuine, disclosed gaps — not fixed in this pass, either because they require assets/credentials
I don't have, or because they're reasonable "nice to have" rather than defects:

1. **`npm install` / `next build` have still not been run in this environment** (no package registry
   access here). Everything above was verified by static analysis (import graphs, contrast math, usage
   grepping), not by an actual TypeScript compile or a running Lighthouse audit. Run
   `npm install && npx tsc --noEmit && npm run build` before deploying, and treat any output as this
   audit's next action item.
2. **`components/ui/modal.tsx` remains unused.** It's a complete, accessible primitive (focus handling,
   Escape-to-close, `aria-modal`) — fine to keep for future use (e.g. a "how coverage tiers compare" info
   modal), or remove if you're confident you won't need it.
3. **Binary assets are still placeholders-by-reference.** Logo files, OG images, blog cover images, and
   author avatars are referenced by config/content but not included as actual image files.
4. **Per-vertical state/city route files are intentionally near-duplicate.** Each is a ~10-line wrapper
   differing only in one `SERVICE_SLUG` constant, with all real logic in the shared
   `StatePageTemplate`/`CityPageTemplate`. This is Next.js App Router's normal file-system-routing
   boilerplate, not harmful duplication — further collapsing it into a catch-all route would trade away
   route-level type safety and `generateStaticParams` clarity for a marginal DRY win. Reviewed and left as-is.
5. **Real Lighthouse/Core Web Vitals numbers are unmeasured** — I applied the standard levers (ISR on
   state/city pages, `loading.tsx` streaming, `next/font`, `next/image`, dynamic-imported cookie banner,
   minimized client-component surface) but have no running environment here to produce an actual score.
6. **CSP is a documented starting point, not hardened.** `next.config.js`'s Content-Security-Policy still
   needs `'unsafe-inline'` on `script-src` for the inline GTM/Meta Pixel/Clarity loader snippets in
   `analytics-scripts.tsx`. Tightening this to a nonce-based policy is real, worthwhile follow-up work, not
   done here.

---

## 4. Scores

These are my honest assessment based on what I could actually check in this sandbox (static analysis,
manual review, computed contrast ratios) — not a substitute for a real `next build`, a live Lighthouse run,
or a human QA pass on a deployed preview. I'd treat these as "where a careful reviewer would rate the code
today," not as ground truth about a live site.

| Category | Score | Basis |
|---|---|---|
| **Production readiness** | 78/100 | Codebase is structurally complete and internally consistent (0 broken imports, 0 unused imports, 0 dead call-routing paths after this pass), but has never been through an actual `npm install`/`next build`/browser test cycle. That gap is the main thing standing between this and a higher score. |
| **Google Ads readiness** | 85/100 | Campaign pages are noindexed, message-matched, single-CTA, disclose "This is an advertisement" and non-affiliation clearly, and now render their disclosure text at passing contrast. Docked points for: unmeasured real-world page speed, and because Google's actual landing-page-experience review also weighs signals (real user reviews, real business verification) this audit can't produce. |
| **SEO readiness** | 82/100 | Metadata, canonical URLs, JSON-LD (Organization/FAQPage/BreadcrumbList/Article), sitemap, robots.txt, and internal linking (including the newly-wired blog TOC) are all in place and config-driven. Docked points for zero real Search Console/crawl data and for the site currently shipping only 3 blog articles and 5 states — thin by volume, not by structure. |
| **Accessibility** | 84/100 | Fixed 3 real contrast failures (one at the design-token level, affecting ~14 usages) and a real keyboard-trap in the Navbar dropdown. All checked color pairs now pass AA with computed ratios ≥4.5:1. Docked points because I could not run an actual screen-reader session or an automated tool like axe-core in this environment — my review was manual/code-level, not tool-verified. |
| **Performance** | 70/100 | Standard levers are applied (ISR, streaming, next/font, next/image, dynamic import for the cookie banner, minimized "use client" surface) but zero real Lighthouse/CWV numbers exist for this build. I'm not comfortable claiming a 90+ without having measured anything. |
| **Security** | 80/100 | Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, starter CSP) are in place; no secrets or sensitive hardcoded values found anywhere in the codebase; all analytics config correctly uses `NEXT_PUBLIC_`-prefixed (client-safe) environment variables. Docked points because the CSP still needs `unsafe-inline` for inline analytics loaders — real hardening work remains. |

### Is it ready for production deployment?

**Not yet, and I don't think it's honest to say otherwise.** The code is in materially better shape after
this audit — the pay-per-call system is now actually consistent everywhere instead of quietly broken on 3
surfaces, real contrast failures are fixed, and dead code is gone. But nobody has run `npm install`, a real
TypeScript compile, a real build, or opened this in a browser. That's the gating step, not a nice-to-have:
run `npm install && npx tsc --noEmit && npm run build` first, fix whatever that surfaces (most likely
small React 19/Next 15 typing issues), do a manual pass through the Final QA checklist in `MAINTENANCE.md`,
and then it's a reasonable candidate for a staged/preview deployment before going live.
