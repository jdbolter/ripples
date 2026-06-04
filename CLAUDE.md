# Ripples — Claude Context

## What the project is
A literary simulation inspired by *Wings of Desire*. Characters sit in a shared space (train to Berlin, library reading room). Users click characters to generate interior monologues, or whisper text to perturb a character's internal state — which diffuses outward to adjacent characters as "ripples." Built on OpenAI structured JSON output. Deployed on Vercel.

## Key files
- `js/scenes.js` — scene and character definitions (dossiers, style, samples, psyche vectors)
- `js/gpt.prompt.js` — prompt builder
- `js/gpt.js` — composition root, dynamics, auto-thought timer
- `js/gpt.engine.js` — psyche vectors, diffusion, state
- `js/gpt.ui.js` — DOM, rendering, overlays
- `api/openai-responses.js` — Vercel serverless proxy for OpenAI key

## Branches
- `dev-jdb` — main working branch
- `jdb-dev-rethink` — character redesign experiments (branched March 2026)
- `main` — Vercel deployment branch

## Running locally
```
vercel dev
```
Needs `.env.local` in repo root with `OPENAI_API_KEY=sk-...`.

---

## Refactor — March 2026

### Problem
Monologues were too focused on defined character problems, too poetic (forced analogies), felt mechanical rather than naturally associative. Root cause: a heavy `packet` system (pressure_profile, life_threads, disclosure_plan, anti_repeat, prompt_contract) was over-constraining the LLM into satisfying a spec rather than generating authentic prose. The psyche-vector-to-style mapping was especially harmful.

### Solution applied
- Removed all `packet` and `prompt_policy` blocks from every character in `scenes.js`
- Added `style` field per character (one-line literary texture reference)
- Added `samples` field per character (array of 15–30 word example monologues written by the author)
- Slimmed dossiers to 4–5 tight background sentences
- Rewrote `gpt.prompt.js` from ~350 lines to ~70 lines — uses style + samples as primary guide; psyche vector only for intensity modulation
- Kept psyche vectors and delta return for diffusion/ripple mechanics

### Key principle
Samples do more work than rules. 2–3 author-written examples per character teach rhythm, vocabulary, and associativity better than 50 constraints. **Sample length should match output length: 15–30 words.**

---

## Character style references

**Train to Berlin:**
| Character | Style |
|---|---|
| mother_returning | Bernhard — obsessive return to practical detail, stops before emotional conclusion |
| student_alone (Kim) | Self-interrupting, lightly ironic, dry humor that deflates itself |
| worried_boyfriend (Daniel) | Carver-flat, analytical mind that can't convert to honesty |
| retired_analyst | Flat/precise, technical memory alongside domestic warmth, no confession or self-pity |
| woman_leaving | Modiano-sparse, displaced from own present tense, calm practicality with sudden vertigo |

**Library Reading Room:**
| Character | Style |
|---|---|
| old_man | Slow/measured, attention to physical sensation, patience as texture |
| young_woman | Woolf-influenced, perception/thought blur, restless self-correction |
| student | Restless/self-correcting, spare humor that deflates, Kafka-adjacent impostor feeling |
| librarian | Observational/procedural, Perec-like, quiet unease under maintenance language |
| man_in_hat | Beckett-adjacent drift, plainspoken metaphysical recoil, short unresolved turns |

---

## What still needs doing
- Write tighter dossiers for all characters (specific and concrete, not spec-sheet language)
- Write 2–3 samples for every character except `student_alone` (Kim has 3) and `retired_analyst` (has 3)
- Samples should be written by the author, 15–30 words, in the character's voice
- `jdb-dev-rethink` branch: replacing train characters with more varied/resonant figures; `retired_analyst` (Stasi signals analyst) replaces `retired_widower` (literature professor); `woman_leaving` (moving to Lisbon) replaces `nurse_on_shift`
