# Hyperframes Composition Brief: ClubOS

## Objective
Create a short launch-style brag video for ClubOS — a fest-operations platform for campus clubs in Bangladesh.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `site/` (Next.js app; this skill lives in `launch-video/`)
- Primary files read: `site/src/app/page.tsx`, `site/src/app/globals.css`, `site/src/app/layout.tsx`, `site/README.md`, root `README.md`
- Product name: ClubOS
- Tagline / strongest claim: "One passport for every fest."
- Key UI or visual moment to recreate: organizer dashboard fest card with capacity meter; bKash payment verification row; collectible passport card with ink stamps
- Copy that must appear verbatim:
  - "One passport for every fest."
  - "Smart Club Operations Ecosystem"
  - "One platform for every club event."
  - "bKash — BDT 200", "Payment verified"
  - "ClubOS"

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium product film for a fest-operations platform
- Interpretation: 5 scenes, longer holds, restrained motion; brass-on-near-black palette and Fraunces serif carry the identity; confidence through restraint, no jokes, no SaaS filler.
- Angle: ClubOS replaces spreadsheet-and-screenshot fest operations — and never loses the fun, because every door you walk through earns a stamp in a collectible passport. Serious ops layer, delightful passport payoff.
- Hook: the tagline "One passport for every fest." at full scale, first frame.
- Outro / punchline: ClubOS + "Smart Club Operations Ecosystem" + the tagline returns small; brass underline sweep; soft bell.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign
  - Glitch/error/chaotic sounds

## Visual Identity
- Background: #0D0C0A
- Text: #F3EFE6
- Accent: #C9A96E (brass)
- Surface: #1A1815; border rgba(243,239,230,.10); muted text #9B968A
- Display font: Fraunces (serif; fallback Georgia/serif)
- Body font: Geist Sans (fallback system-ui/sans-serif)
- Visual references from the project: serif display headlines on near-black; brass accent chips/eyebrows; rounded cards with hairline borders; capacity meters; monospace for IDs/ticket codes (Geist Mono).

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 4s — tagline "One passport for every fest." full scale, serif, brass glow breathing behind it; eyebrow "CLUBOS"
2. The Ops Layer — 5s — fest card "Aurora Tech Carnival", capacity meter to 85%, lines "5 fests. 60 events." / "One dashboard." arriving one by one
3. Paid, Verified — 5s — payment card "AI Model Showdown — Team Entry", "bKash — BDT 200", mono transaction ID "TRX8H2K9Q1P4", simulated click on verify, flip to "Payment verified" with check (beat-locked ~13.11s)
4. The Passport — 4s — passport card slides in, three brass ink stamps land on consecutive beats ("AURORA CARNIVAL", "ROBORUMBLE", "CULTURAL UTSOB"), +XP counter ticks
5. Outro — 2s — "ClubOS" serif + brass underline sweep, "Smart Club Operations Ecosystem", "One passport for every fest." small; music fades

## Audio
- Audio role: cinematic support with a clean, steady bed
- Audio arc: bed enters immediately at low volume, slight lift through scene 2, restrained SFX accents in scenes 2-4, bell over the final logo, fade under outro
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3 (already copied to brag-output/composition/assets/music/)
- Music treatment: data-start 0, data-volume 0.3, fade-out over the final ~2s
- Music cue guidance: bundled preset at `launch-video/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json` — tempo 109.96 BPM, beat grid ~0.55s spacing. Strong cues: 8.74s, 13.11s, 17.47s. Lock the payment-verified flip near 13.11s and the logo landing near 17.47s (±0.15s). Stamps snap to consecutive beats (±0.10s). Scene 2 text lines on every other beat (readability floor).
- Audio-reactive treatment: subtle; music RMS/bass gently swells the brass radial glow behind the hook headline and the passport card presence. No waveform/equalizer visuals.
- Audio-coupled moments:
  - Scene 2 — meter fill lands: one soft drop/place cue
  - Scene 2 — two text lines: quiet arrival cues on alternating beats
  - Scene 3 — simulated click on "Verify payment": ui click/mouseclick family
  - Scene 3 — "Payment verified" flip: success cue exactly at the flip (beat-locked)
  - Scene 4 — each stamp: soft physical place/stamp cue per stamp on the beat grid; XP counter ticks with stamps
  - Scene 5 — logo landing: one soft bell (impactBell family), music fading
- SFX selection guidance: low high-frequency-risk picks for the repeated stamp moments; sparse overall — fewer cues, better timing
- SFX analysis guidance: `launch-video/assets/sfx/sfx-analysis.md` (+ .json)
- Exact SFX choice: Hyperframes chooses filenames, timestamps, density, and volume based on the implemented animation
- Audio files: music already in `brag-output/composition/assets/music/`; Hyperframes copies its SFX picks into `brag-output/composition/assets/sfx/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, and `hyperframes-cli`. /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project (dashboard card, payment row, passport card all qualify).
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds (planned: 20s).
- Include the planned music/SFX layer.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints; ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks.
- Use SFX to support motion and interaction; restraint when the edit is already busy.
- Honor planned music treatment: fade-out under the final logo, beat-aligned reveals.
- When music is present, consider Hyperframes audio-reactive workflow: extract audio data and use RMS/frequency bands for subtle, brand-specific motion (glow, card presence). Avoid waveform/equalizer visuals, strobing, heavy pulsing.
- Use local assets for audio and any required runtime/media dependencies.
- Run `hyperframes check` before render — it is brag's single gate.
- Keep creation and rendering local. Remote or publishing workflows require a separate explicit user request.
