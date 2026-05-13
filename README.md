# Ripples

Ripples is an interactive literary simulation inspired by *Wings of Desire*.  
It stages interior monologues as dynamic, interdependent events within a shared space.

Characters (human or post-human) inhabit a scene.  
When one character thinks—or when a user “whispers” to them—their internal state shifts.  
That shift diffuses outward to other characters as a  psychic ripple.

The result is not dialogue but a cumulative confluence of voices and concerns.

---

## Concept

Ripples is built around three principles:

1. **Interior monologue as event**
2. **Affect state as simple signal**
3. **Thought as diffusion**

Each character has an internal affect state:

- `emotion` — a label: calm, nervous, sad, happy, hopeful, angry, or guarded
- `intensity` — a single value between 0 and 1

When a monologue is generated, it reflects the current affect state.
When a thought occurs — triggered by a click or a whisper — the generated text is read for emotional tone, and that signal diffuses across all characters in attenuated form.

The scene becomes a small dynamical system.

---

## How It Works

### API Mode
If a server-side or browser-session API key is available:

- A single model call generates a 40–60 word interior monologue.
- The affect signal is then inferred locally from the monologue text and diffused across all characters.

### Local Fallback
If generation is unavailable, Ripples falls back to predefined monologues stored in `js/scenes.js`.
The affect signal is inferred from those texts by the same local process.

### Dynamics Mode
`js/gpt.js` exposes a single switch:

- `DYNAMICS_MODE = "high"`: stronger whisper impact, lighter stabilization
- `DYNAMICS_MODE = "subtle"`: gentler whisper impact, stronger stabilization

This mode affects diffusion strength, stabilization, local fallback deltas, and prompt steering.

---

## Scenes

Scenes are defined in `js/scenes.js`.

Each scene contains:

- Grid dimensions
- Character definitions
- Initial affect state (`emotion` + `intensity`)
- Adjacency relations (used for layout; ripples now reach all characters)
- Prompt scaffolding
- Optional local monologue pools

Scenes can be human (library reading room) or post-human (forest entities).

---

## Interaction Model

- Click a character → generates a monologue.
- Type in the Whisper panel → press **Whisper**.
- The whisper influences the next monologue indirectly.
- A ripple animation visualizes psychic diffusion.

No dialogue. No explicit response. Only internal modulation.

---

## Running Locally

Recommended local workflow:

1. Install the Vercel CLI if you do not already have it.
2. Create a local `.env.local` file with `OPENAI_API_KEY=...`.
3. Run `vercel dev` from the repo root.
4. Open the local Vercel URL and explore.

This matches production: the browser talks to `/api/openai-responses`, and the key stays server-side.

If you open `index.html` directly or host the app somewhere without the Vercel API routes, Ripples will prompt for a browser-session API key instead.

---

## Deployment Notes

For Vercel deployment:

- Set `OPENAI_API_KEY` in the Vercel project environment.
- Deploy from `main`.
- The frontend will automatically detect the server proxy and stop prompting for a key.

For static hosting without serverless routes (for example GitHub Pages):

- The Vercel environment variable is not available to the browser.
- Users will still be prompted for their own browser-session key.
- Local fallback remains available only as an automatic recovery path if generation fails.

---

## Design Philosophy

Ripples is not a game and not a chatbot.

It is a small dynamical system in which language acts as a perturbation field.

The model does not answer the user.
It absorbs the whisper and settles.

Interior life is treated as atmosphere rather than conversation.

---

## Future Directions

- Multi-whisper memory compression
- Cross-scene diffusion
- Threshold-driven stylistic phase shifts
- Language switching (e.g., Portuguese mode)
- Scene-level global mood vectors

---
