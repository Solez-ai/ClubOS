# Brag Plan: ClubOS

## What is this app?

ClubOS is a smart club operations ecosystem for campus fests in Bangladesh: organizers publish fests and events with bKash/Nagad paid segments, participants register, pay, and collect a digital Participant Passport with stamps, XP, and badges.

## The angle

Every campus fest in Bangladesh runs its payments through bKash screenshots and participant lists in scattered spreadsheets. ClubOS plays it straight: it is the operations system that replaces that mess — and it never loses the fun, because every event you attend earns you a literal ink stamp in a collectible digital passport. The video sells the seriousness of the ops layer and the delight of the passport in one arc. "One passport for every fest" is the spine.

## Hook (first 2-3 seconds)

Big serif type on the brand's near-black background: "One passport for every fest." — the product's own tagline, stated at full scale. No logo animation, no build-up. The tagline IS the hook.

## Key moments (the middle)

1. The organizer side, stated as fact: "5 fests. 60 events. One dashboard." (grounded: the demo organizer account owns exactly 5 published fests and 60 published events, managed from the organizer dashboard).
2. The payment moment every Bangladeshi student knows: a registration card showing "bKash — BDT 200" with a transaction ID being submitted, then flipping to "Payment verified" with a check. (grounded: real flow, real copy — bKash/Nagad Send Money/Pay Bill, payment verification table).
3. The passport payoff: the collectible card with "CL-2026-XXXXXX" ticket codes and ink stamps landing one by one. (grounded: passport stamps, XP, badge system in the product).

## Outro / punchline

"ClubOS — Smart Club Operations Ecosystem." then the tagline returns small: "One passport for every fest." Logo beat on the brass accent color.

## User flow worth showing

entry → key action → result:
1. Discover: fests directory with capacity meters and category tags (entry)
2. Register + pay: event registration with bKash transaction submission (key action)
3. Collect: passport stamp + XP + payment verified (result)

## Tone

- Preset: polished
- Creative direction: quiet premium product film for a fest-operations platform
- Interpretation: fewer scenes, longer holds, restrained motion; the brass-on-near-black palette and serif type do the talking; humor stays out, confidence stays in.

## Format: landscape — 1920x1080
## Duration: 20 seconds

## Visual identity (from the project)

- Background: #0D0C0A (dark mode `--bg`)
- Surface: #1A1815 (`--surface`), elevated #151411
- Accent: #C9A96E (brass, dark mode `--accent`)
- Text: #F3EFE6 (`--text`)
- Muted text: #9B968A
- Display font: Fraunces (serif, `--font-serif`)
- Body font: Geist Sans (`--font-sans`)
- Strongest visual element: the serif display type on near-black with brass accents; the passport card concept; segmented progress/capacity meters.

## Share copy (draft)

ClubOS: one passport for every fest. Fests, events, bKash/Nagad payments, verification, check-in — and a collectible passport that earns a stamp at every door. Built for campus fests in Bangladesh.

## Audio direction

- Role: cinematic support with a clean, steady bed
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3 (bundled, steady and clean, matched to `polished` tone)
- Music treatment: start at 0s, volume 0.3, gentle fade-out over the final logo hold
- Music cue guidance: bundled preset at launch-video/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json — tempo 109.96 BPM. Strong cues in the 0-25s window: 8.74s, 13.11s, 17.47s. Beat grid spacing ~0.55s. Use strong cues for the payment-verified flip and the passport reveal; keep the hook on natural timing.
- Audio-reactive treatment: subtle; music RMS gently swells the brass glow behind the headline and the passport card's presence. No waveform/equalizer visuals.
- SFX posture: minimal but present (2-4 cues), professional restraint
- Audio-coupled moments: payment verification flip (success cue at the moment the check lands), passport stamps (soft stamp/place cue per stamp, snapped to the beat grid), final logo (one soft bell over the music)
- Restraint rule: nothing aggressive, no glitch/error sounds, SFX at low-to-mid volume; the music bed stays the loudest element until the final logo.

## Storyboard

### Scene 1 — Hook — 4s
Full-bleed near-black background. The tagline "One passport for every fest." in Fraunces serif, entering with a slow, confident fade+rise. A soft brass radial glow breathes behind the text (audio-reactive target). Small eyebrow above: "CLUBOS".
Sequential/interaction: none
Audio intent: establish calm confidence; music bed starts immediately at low volume.
Audio-coupled idea: glow breathes with music RMS (subtle audio-reactive).
Music: steady clean bed (vol-12), 0.3
Transition mood: soft crossfade → Scene 2

### Scene 2 — The Ops Layer — 5s
A recreated organizer dashboard fragment: "Aurora Tech Carnival" fest card with a capacity meter filling to 85%, flanked by two supporting lines: "5 fests. 60 events." and "One dashboard." appearing one by one (hold each to the reading floor; reveal on alternating beats, not every beat).
Sequential/interaction: yes — three text/meter elements arrive one by one (meter animates 0→85%, then two lines snap in on alternating beats).
Audio intent: steady build; the bed carries, one soft drop cue as the meter lands.
Audio-coupled idea: meter fill + card arrivals snapped to the beat grid (every other beat for readable text).
Music: same bed, slight energy lift
Transition mood: soft crossfade → Scene 3

### Scene 3 — Paid, Verified — 5s (beat-locked reveal)
Recreate a registration payment card: "AI Model Showdown — Team Entry" with "bKash — BDT 200" and a monospace transaction ID "TRX8H2K9Q1P4" (the real seeded demo transaction reference). A cursor clicks "Verify payment" (ui click sound); the row flips to a green-accented "Payment verified" state with a check. This flip lands on the strong cue at ~13.11s.
Sequential/interaction: yes — simulated click on the verify button, then the state flip.
Audio intent: small tension, small payoff; the click and the verified flip are the only prominent sounds in the video.
Audio-coupled idea: simulated click (ui/mouseclick family) + success cue exactly at the flip.
Music: bed continues
Transition mood: soft crossfade → Scene 4

### Scene 4 — The Passport — 4s (beat-grid stamps)
The collectible passport card (rounded rectangle, serif monogram "C", brass border) slides in; three ink stamps land one by one — "AURORA CARNIVAL", "ROBORUMBLE", "CULTURAL UTSOB" — each a rough circular stamp in brass ink, snapped to consecutive beats (~0.55s apart). Under the card: "+XP" counter ticks up with each stamp.
Sequential/interaction: yes — three stamps land one by one with sound, XP counter increments.
Audio intent: playful but restrained; each stamp is a soft, physical cue.
Audio-coupled idea: stamp landings on the beat grid; counter ticks with each stamp.
Music: bed at fullness
Transition mood: soft crossfade → Scene 5

### Scene 5 — Outro — 2s
"ClubOS" in large Fraunces serif with a brass underline sweep; below, small muted: "Smart Club Operations Ecosystem" then "One passport for every fest." Music fades under; one soft bell cue rings over the fade.
Sequential/interaction: none
Audio intent: resolution; the video ends on the bell's decay.
Audio-coupled idea: underline sweep synced to the logo entrance; final bell at logo landing (strong cue ~17.47s region).
Music: fade-out over this hold
Transition mood: none (end)

**Music mood for this video:** clean/steady (vol-12), cinematic-support posture
**Audio summary:** a steady clean bed from 0s at low volume, three restrained SFX moments (meter drop, verified flip, stamps), one soft bell at the logo, music fading under the outro.

## Beat-lock plan (summary)

- 1-3 strong cue locks: payment-verified flip → ~13.11s; final logo → ~17.47s region (±0.15s).
- Beat grid (~0.55s spacing at 109.96 BPM): passport stamps on consecutive beats; scene 2's two text lines on alternating beats (readable-hold floor respected).
