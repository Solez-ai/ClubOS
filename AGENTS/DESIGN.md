# DESIGN.md — ClubOS Design System ("Quiet Luxury")

> Authority: this file is the single source of truth for all visuals. If anything in PLAN.md or a component library default disagrees with this file, **this file wins.**
> Mood: a private members' club, a boutique hotel, an art-gallery website. Calm, confident, expensive. **Restraint is the luxury.**

---

## 1. Principles

1. **Whitespace is a feature.** Fewer elements per screen, one focal point per section.
2. **Typography does the heavy lifting**, not color or effects.
3. **One accent (brass), used sparingly:** primary buttons, active states, key numbers, stamps, focus borders. Everything else is neutral.
4. **Structure through hairlines**, not shadows, glows, or blur.
5. **Tactile and printed:** paper, ink, foil, embossing. Strongest in the Passport.
6. **Slow, eased motion.** Nothing bounces, nothing flashes.
7. **Consistency over cleverness:** every color, size, radius, and duration comes from a token below.

## 2. Hard bans (grep for these before every release)

- Gradients on text, buttons, backgrounds, rings, or progress bars. (Only exception: a subtle vertical fade that blends an image into the page.)
- Purple, violet, indigo, neon cyan, any neon.
- Glow or colored box-shadows, blurred blobs, backdrop-blur glass cards, glassy navbar.
- Emoji as icons, sparkle (✨) icons, rainbow badges.
- Spring/bounce overshoot, shake, confetti.
- Large radii (`rounded-2xl/3xl`), fat pill buttons, everything centered.
- Untouched default shadcn styling. Every primitive is restyled to this file.
- Hard-coded hex values inside components. Tokens only.

---

## 3. Color

Defined as CSS variables in `app/globals.css`, mapped in `tailwind.config.ts` (e.g. `bg-bg`, `text-muted`, `border-border`, `bg-accent`). Dark is default; light via `next-themes` (`class` strategy).

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#0D0C0A` | `#F6F3EC` | page background (warm black / warm paper) |
| `--surface` | `#151411` | `#FBFAF6` | cards, panels, inputs |
| `--surface-2` | `#1D1B17` | `#EFEBE1` | hovers, table header, inner blocks, image placeholders |
| `--border` | `rgba(243,239,230,.10)` | `rgba(20,18,14,.12)` | all hairlines |
| `--border-strong` | `rgba(243,239,230,.22)` | `rgba(20,18,14,.28)` | input hover, secondary buttons |
| `--text` | `#F3EFE6` | `#14120E` | primary text (ivory / ink) |
| `--muted` | `#9B968A` | `#6F6A5F` | secondary text, labels |
| `--accent` | `#C9A96E` | `#8A6A2F` | brass: primary buttons, stamps, active, key figures |
| `--accent-fg` | `#14110B` | `#FBFAF6` | text on accent |
| `--accent-soft` | `rgba(201,169,110,.12)` | `rgba(138,106,47,.10)` | selected row, subtle highlight |
| `--success` | `#7FB08A` | `#3F7A52` | confirmed, checked in |
| `--warning` | `#D9B26A` | `#A8782A` | pending, closing soon |
| `--danger` | `#C8574C` | `#A93F35` | rejected, errors, cancel |

Rules:
- Body text on `--bg` must meet WCAG AA (verified for the pairs above). Never use `--muted` for text smaller than 13px.
- **Status colors are used as text + 1px border on a transparent background**, never as filled neon chips.
- Charts are monochrome (ivory/muted tints); brass marks the single highlighted series or latest point.
- Photos get one unified treatment (see §11), never color overlays.

## 4. Typography

Fonts via `next/font`:
- **Display:** `Fraunces` (soft, optical size axis) — fallback `Instrument Serif`. Weight 300–400. Used for headings, names, big numbers in hero areas.
- **UI/body:** `Geist` — fallback `Inter`. Weight 400/500.
- **Mono:** `Geist Mono` — fallback `JetBrains Mono`. Used for passport numbers, ticket codes, stats, dates in compact UI, section markers.

| Style | Font | Desktop | Mobile | Weight | Leading | Tracking |
|---|---|---|---|---|---|---|
| `display-xl` (hero) | Display | 96px | 48px | 300 | 1.02 | -0.03em |
| `display-l` | Display | 64px | 40px | 300 | 1.05 | -0.025em |
| `h1` | Display | 48px | 34px | 400 | 1.1 | -0.02em |
| `h2` | Display | 32px | 26px | 400 | 1.15 | -0.015em |
| `h3` | Display | 22px | 20px | 400 | 1.25 | -0.01em |
| `body-l` | UI | 18px | 17px | 400 | 1.6 | 0 |
| `body` | UI | 16px | 15px | 400 | 1.6 | 0 |
| `small` | UI | 14px | 14px | 400 | 1.5 | 0 |
| `eyebrow` | UI | 12px | 11px | 500 | 1.3 | 0.14em, UPPERCASE, `--muted` |
| `mono` | Mono | 13–14px | 13px | 400 | 1.5 | 0 |
| `stat` | Mono or Display | 56px | 40px | 300 | 1 | -0.02em |

Section markers like `01 — Fests` use `mono` + `eyebrow` style. Use `tabular-nums` for all numerals in tables and stats.

## 5. Layout, spacing, breakpoints

- Spacing scale (8px base): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160.
- Section vertical padding: **96–160px desktop, 64–80px mobile.**
- Max content width **1200px**, side gutters 24px (mobile 16px). Wide editorial sections may go 1320px.
- 12-column grid desktop, 4-column mobile. Prefer **asymmetric splits** (5/7, 4/8) over centered stacks.
- Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Test at 360, 768, 1280.
- Mobile nav: fixed bottom bar with 5 slots — Home, Fests, **Scan (center, brass ring button)**, Passport, Menu. Respect safe-area insets.
- Tables collapse into stacked cards below `md`. No horizontal page scroll anywhere.

## 6. Shape, borders, elevation

- Radius: **inputs/buttons 6px, cards/dialogs 10px, avatars full.** Nothing larger.
- Borders: 1px `--border` everywhere; dividers between list rows, table rows, sections (visible grid feel).
- **No shadows.** Elevation = surface step (`--bg` → `--surface` → `--surface-2`) + border. Only exception: dialogs/drawers get a scrim (`rgba(0,0,0,.6)`).
- Global grain: SVG noise overlay on `body::before`, 3–4% opacity, `pointer-events:none`, `mix-blend-mode: overlay`.

## 7. Iconography

`lucide-react`, `strokeWidth` 1.25–1.5, size 18 (16 in dense UI), color `--muted` unless active (`--text` or `--accent`). Never inside colored circles. Use sparingly; prefer text labels.

## 8. Motion

Tokens:
- `--ease: cubic-bezier(0.22, 1, 0.36, 1)` for everything.
- Durations: `fast 150ms` (hover/press), `base 250ms` (state changes, page fade), `slow 500ms` (reveals), `slower 700ms` (hero/headline).

Patterns:
- **Reveal:** fade + 12px translate-up, stagger 60ms per child; headlines reveal line-by-line with an overflow mask slide-up.
- **Hover:** card border → brass at 40%; cover image `scale(1.03)` over 600ms; links draw an underline left→right.
- **Press:** buttons `scale(0.985)` only.
- **Count-up:** stats animate in mono, ease-out, 1.2s, once on view.
- **Page transition:** crossfade 250ms.
- **Success moment (registration):** a thin brass check draws itself (SVG stroke-dashoffset, 600ms), then the ticket slides up 16px with fade.
- **Stamp earned:** see §10.
- Must respect `prefers-reduced-motion` (replace with instant opacity changes).

## 9. Components

**Button** — height 44 (36 compact). Primary: solid `--accent`, `--accent-fg` text, 6px radius, 14px medium, sentence case. Secondary: transparent, 1px `--border-strong`, hover `--surface-2`. Ghost: text only, underline on hover. Destructive: transparent, `--danger` border/text. Loading = text replaced by a thin 16px spinner line (no layout shift). Focus: 2px `--accent` outline, 2px offset.

**Input/Select/Textarea** — 44px tall, `--surface` bg, 1px `--border`, hover `--border-strong`, focus: 1px `--accent` border (no glow ring). Label above (13px, `--muted`), helper below, error text in `--danger` with a 1px `--danger` border.

**Card** — `--surface`, 1px border, 10px radius, no shadow, padding 24. Interactive cards get the hover pattern from §8.

**Event card anatomy:** cover image (4:3, treated) with category label top-left (mono eyebrow on `--bg` 80% backing) → fest name eyebrow → serif title (h3) → meta row (date · time · venue in small/muted) → hairline → footer row: capacity meter (left) + status pill (right) → XP reward in mono ("+100 XP", brass). Bookmark = outline bookmark icon top-right of cover.

**Fest card:** wide 16:9 cover, serif title, date range in mono, event count, "Registration open" status pill, participant count.

**Status pill** — 24px tall, 1px border + text in status color, transparent bg, 12px mono uppercase tracked 0.08em, radius 4px. Mapping: Open → success, Closing soon → warning, Full/Waitlist → muted→warning, Closed → muted, Confirmed → success, Pending → warning, Waitlisted → warning, Cancelled/Rejected → danger, Checked in → accent.

**Capacity meter** — 2px hairline track, solid brass fill, text "34 / 50 · 16 left" in mono small. Turns `--warning` when ≥ 85% full. On event page also shown as a thin circular ring (1.5px stroke, brass).

**Tabs** — text tabs with a 1px bottom border; active tab text `--text` with a 2px brass underline that slides between tabs (shared `layoutId`).

**Table** — sticky header on `--surface-2`, 12px eyebrow headers, rows separated by hairlines, row hover `--surface-2`, selected row `--accent-soft`, no zebra, numerals tabular mono, row height 56.

**Dialog/Drawer** — `--surface`, 10px radius (drawer: top corners only), scrim, fade+8px rise on open. Bottom sheet on mobile for filters and forms.

**Toast (sonner)** — `--surface`, hairline border, small serif title, no icons except a 1px colored left rule for state.

**Tooltip** — `--surface-2`, 12px, 6px radius, 150ms delay.

**KPI tile** — large `stat` number (serif or mono), eyebrow label under it, optional muted delta ("+12 this week"), optional 24px-high monochrome sparkline with brass last point. No icons.

**Charts (recharts)** — no grid fill, hairline horizontal gridlines at 6% opacity, axis labels mono 11px muted, tooltip styled as Tooltip, lines 1.5px, bars with 2px radius, single brass highlight.

**Empty state** — one serif sentence ("No events match yet."), one muted line, a text-link CTA. No illustrations.

**Skeleton** — `--surface-2` blocks with a very slow (2s) opacity pulse 0.6↔1, shapes matching final layout.

**Navbar (desktop)** — solid `--bg`, bottom hairline, height 72. Left: wordmark in Fraunces (e.g. "ClubOS" with a small brass dot). Center: Fests · Events · Leaderboard. Right: search (Ctrl+K), notification bell, Scan, Passport avatar. Sticky; hairline appears after scroll.

**Footer** — large serif sign-off line, three link columns, mono legal row, hairline top.

---

## 10. Passport design (the showpiece)

- **Cover/front card (3:2 on desktop, full-width on mobile):** near-black `--bg` panel with an SVG guilloche line pattern at 6% ivory, 1px brass border inset 10px, brass foil title "PASSPORT" in Fraunces small caps, member name large in serif, `@handle` and institution in muted small, passport number in mono, level shown as a Roman numeral + title ("IV · Veteran"). On hover: a very faint diagonal highlight sweep (6% white, 900ms). No rainbow/holographic effect. Flip (rotateY 180°, 700ms, `--ease`) reveals the back.
- **Back:** personal passport QR (ivory on `--surface`, brass corner marks), member-since date in mono, "Show this to connect" caption.
- **XP bar:** 2px hairline track + solid brass fill; "1,240 XP · 160 to Level V" in mono small.
- **Inner pages (tabs):** warm paper feel — `--surface` panels, hairline form fields, serif names, mono data.
- **Stamp design:** monochrome ink, brass (dark) / deep brass (light) at 85% opacity. Circular (events) or rectangular (fests) with a double border; event name uppercase along the arc, date in mono at center, small category glyph. Random rotation between -6° and +6° (stable per stamp id), rough-edge SVG `feTurbulence` displacement filter for an ink feel. Unearned slots: dashed 1px `--border` outline with the event name in muted eyebrow.
- **Stamp earned animation:** scale 1.15→1 over 280ms ease-out with opacity 0→0.85, ink-spread via filter intensity; no shake, no confetti.
- **Badges:** circular medallion with 1px brass ring (rarity = number of rings: 1 common, 2 uncommon, 3 rare, 4 legendary), simple line icon in center, name in small below. Locked: ring in `--border`, icon at 30% opacity, tooltip shows how to earn.
- **Scanner:** full-screen near-black, thin brass corner brackets, 1px brass scan line sweeping top↔bottom every 3s, centered muted hint text. Success: a soft brass ring expands once, stamp lands, XP gain shown as a mono "+100 XP". Error: brackets turn `--danger` for 600ms with a clear text reason (no shake).

## 11. Imagery

- Real photography for fest/event covers (Unsplash/Pexels; record attribution in README). Unified treatment via CSS: `filter: saturate(.75) contrast(1.05) sepia(.12)`, plus grain overlay at 5%, plus a bottom fade to `--surface`.
- No image? Flat `--surface-2` block with a huge serif initial at 8% opacity and a hairline frame. Never a colorful gradient.
- Avatars: circular, 1px border; fallback = serif initials on `--surface-2`.

## 12. Copywriting tone

Short, confident, understated. No exclamation marks, no emoji, no hype verbs.
Examples: "Your passport." · "Collect the evening." · "Registration closes in 2 days." · "You're on the list." · "Stamp collected." · "No events match yet."

## 13. Page blueprints

- **Landing:** (1) hero — left: eyebrow + `display-xl` headline ("One passport for every fest."), body-l, two buttons; right: the passport card slowly tilting on pointer move. (2) marquee-free stat strip (4 mono stats with count-up, hairline-separated). (3) `01 — Fests` editorial list/cards. (4) `02 — How it works` three numbered columns (Get your passport / Register / Scan & collect). (5) `03 — Upcoming events` 3-up. (6) organizer CTA block, then footer.
- **Fest/Event directories:** left sticky filter column (desktop) with hairline sections; right results grid (3-up desktop, 1-up mobile); top bar with search, sort, result count in mono.
- **Event page:** full-bleed treated cover → 8/4 split: left = serif title, meta rows (hairline-separated), description, rules, prizes; right (sticky) = registration card (capacity ring, countdown in mono, deadline, fee, XP reward, primary button). Mobile: registration becomes a bottom bar.
- **Passport:** passport card top-left (5 cols), tabs and content right (7 cols); mobile stacks.
- **Organizer:** left sidebar (hairline, text links with a brass marker on active), content area with KPI strip, charts, tables. Dense but airy.

## 14. Accessibility & responsive rules

AA contrast, visible focus (brass outline), 44px minimum touch targets, labels on all inputs, `aria-live` for toasts and scanner results, keyboard-operable tabs/dialogs/command palette, motion reduced when requested, QR codes always accompanied by the text ticket code.

## 15. Implementation notes

`globals.css` skeleton:
```css
:root[data-theme="dark"], .dark {
  --bg:#0D0C0A; --surface:#151411; --surface-2:#1D1B17;
  --border:rgba(243,239,230,.10); --border-strong:rgba(243,239,230,.22);
  --text:#F3EFE6; --muted:#9B968A; --accent:#C9A96E; --accent-fg:#14110B;
  --accent-soft:rgba(201,169,110,.12);
  --success:#7FB08A; --warning:#D9B26A; --danger:#C8574C;
  --ease:cubic-bezier(.22,1,.36,1);
}
:root, .light {
  --bg:#F6F3EC; --surface:#FBFAF6; --surface-2:#EFEBE1;
  --border:rgba(20,18,14,.12); --border-strong:rgba(20,18,14,.28);
  --text:#14120E; --muted:#6F6A5F; --accent:#8A6A2F; --accent-fg:#FBFAF6;
  --accent-soft:rgba(138,106,47,.10);
  --success:#3F7A52; --warning:#A8782A; --danger:#A93F35;
}
body { background:var(--bg); color:var(--text); font-family:var(--font-ui); }
body::before { content:""; position:fixed; inset:0; pointer-events:none; opacity:.035;
  background-image:url("/grain.svg"); mix-blend-mode:overlay; z-index:50; }
```
Build a `components/ui` layer (Button, Input, Card, StatusPill, CapacityMeter, Stat, Tabs, Table, Eyebrow, SectionMarker, Stamp, Medallion, PassportCard, Reveal) first; pages only compose these.

## 16. Design QA checklist

- [ ] `grep -riE "gradient|blur|shadow-|purple|violet|indigo|cyan|✨|animate-bounce|rounded-(2xl|3xl)"` returns nothing in `app/` and `components/`.
- [ ] Only tokens used for color; no raw hex in components.
- [ ] Serif headings, Geist body, mono numerals everywhere.
- [ ] Dark and light both polished at 360 / 768 / 1280.
- [ ] Every page has a loading skeleton, empty state, error state.
- [ ] Motion feels slow and calm; reduced-motion works.
- [ ] Passport flip, stamp, badge, scanner states all match §10.
- [ ] No page looks like a default component-library demo.
