# Ripples

Ripples is an interactive literary simulation inspired by *Wings of Desire*.  
It stages interior monologues as dynamic, interdependent events within a shared space.

Characters (human or post-human) inhabit a scene.  
When one character thinks—or when a user “whispers” to them—their internal state shifts.  
That shift diffuses outward to adjacent entities as a measurable psychic ripple.

The result is not dialogue but atmosphere:  
a cumulative field of interior drift.

---

## Concept

Ripples is built around three principles:

1. **Interior monologue as event**
2. **Psychic state as measurable vector**
3. **Adjacency as diffusion network**

Each character has a bounded internal state:

- `tension`
- `clarity`
- `openness`
- `drift`

All values are normalized between 0 and 1.

When a monologue is generated, it reflects the current psychic state.
When a whisper occurs, it produces a semantic delta that modifies that state.
That delta diffuses to adjacent characters in attenuated form.

The scene becomes a small dynamical system.

---

## How It Works

### Local Mode
If no API key is entered, Ripples uses predefined monologues stored in `scenes.js`.
Psychic deltas are estimated heuristically.

### API Mode
If a valid OpenAI API key is entered:

- A single model call generates:
  - a 75–100 word interior monologue
  - a semantic `delta` to the psyche vector

The delta is bounded and diffused across the scene.

---

## Scenes

Scenes are defined in `scenes.js`.

Each scene contains:

- Grid dimensions
- Character definitions
- Initial psychic vectors
- Adjacency relations
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

1. Clone the repository.
2. Open `index.html` in a browser.
3. Enter your OpenAI API key when prompted (optional).
4. Explore.

No server required.

---

## Deployment Notes

The application is entirely client-side.

For public deployment (e.g., GitHub Pages):

- The API key is never stored.
- Users must provide their own key.
- If no key is provided, local mode is used.

---

## Design Philosophy

Ripples is not a game and not a chatbot.

It is a small dynamical system in which language acts as a perturbation field.

The model does not answer the user.
It absorbs the whisper and drifts.

Interior life is treated as atmosphere rather than conversation.

---

## Future Directions

- Multi-whisper memory compression
- Cross-scene diffusion
- Threshold-driven stylistic phase shifts
- Language switching (e.g., Portuguese mode)
- Scene-level global mood vectors

---
