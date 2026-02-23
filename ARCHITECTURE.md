Ripples — Architecture

This document describes the internal structure and design philosophy of the Ripples simulation.

Ripples is a bounded psycho-dynamic literary simulation implemented entirely in client-side JavaScript. It combines interior monologue generation, measurable psychic state, adjacency-based diffusion, and structured LLM output.

The system is intentionally minimal, explicit, and modular.

⸻

	1.	System Overview

Ripples consists of four primary files:
	•	index.html — UI scaffold and layout
	•	gpt.js — engine logic, state model, OpenAI integration
	•	scenes.js — declarative scene definitions and prompt materials
	•	gpt.css — visual styling and animation layer

All computation occurs in the browser. No server is required.

The application can operate in two modes:

Local Mode (no API key)
API Mode (OpenAI Responses API)

⸻

	2.	Core State Model

Each character has a persistent psyche vector with five normalized values between 0 and 1:

arousal
valence
agency
permeability
coherence

These values represent complementary dimensions of internal state and influence monologue style.

The psyche is:
	•	Persistent within a scene
	•	Reset when the scene changes
	•	Modified by whispers/listens
	•	Diffused via adjacency
	•	Clamped to prevent runaway escalation

Backward compatibility:
	•	Legacy 4D seeds (`tension`, `clarity`, `openness`, `drift`) are still accepted.
	•	`gpt.js` migrates legacy shape into the 5D model at load time.

⸻

	3.	Delta Semantics

When a whisper occurs and API mode is active, the model returns structured JSON containing:
	•	A monologue string
	•	A delta object with numeric adjustments to arousal, valence, agency, permeability, coherence

Per-axis delta bounds are intentionally uneven:
	•	arousal: ±0.15
	•	valence: ±0.12
	•	agency: ±0.10
	•	permeability: ±0.15
	•	coherence: ±0.10

Processing sequence:
	1.	Delta values are coerced to numbers.
	2.	Values are clamped to axis-specific magnitudes.
	3.	Delta is applied to the source character’s psyche.
	4.	Delta is attenuated and applied to adjacent characters (axis-specific attenuation).
	5.	All resulting psyche values are clamped to the 0–1 range.

This ensures stability while preserving immediate local shifts.

⸻

	4.	Diffusion Model

Ripples propagate according to adjacency relationships defined in scenes.js.

The diffusion model is:

Source character receives full delta.
Adjacent characters receive attenuated delta, with stronger spread in arousal/permeability and weaker spread in agency/coherence.

High-immediacy profile:
	•	Source shifts are intentionally stronger and quickly visible in style.
	•	Global stabilization is light (small arousal decrease + small coherence recovery).
	•	This keeps whisper impact legible before slow settling.

Runtime switch:
	•	`gpt.js` exposes a single `DYNAMICS_MODE` config (`"high"` or `"subtle"`).
	•	The mode controls diffusion strength, stabilization, local fallback deltas, and prompt steering.

No global broadcast diffusion is currently implemented beyond adjacency.

⸻

	5.	Prompt Architecture

Each OpenAI request includes:
	•	A system prompt defining aesthetic and behavioral constraints
	•	A scene-level baseline description
	•	A character dossier
	•	Current psyche values
	•	Whisper text (if present)
	•	Stylistic mapping instructions
	•	Hard constraints requiring JSON output

The model is instructed to:
	•	Produce a 50–75 word interior monologue
	•	Avoid direct second-person reply
	•	Avoid meta-commentary
	•	Express psychic state indirectly through style
	•	Make whisper bends noticeable in high-immediacy mode
	•	Return structured JSON only

The schema enforces the presence of both monologue and delta fields.

⸻

	6.	Structured Output

Ripples uses the OpenAI Responses API with structured JSON schema output.

The request specifies a text format with:

type = json_schema
name = ripples_monologue
strict = true

The schema requires:
	•	monologue (string)
	•	delta (object containing arousal, valence, agency, permeability, coherence as numbers)

If the API call fails or structured output is invalid, the system falls back to local mode.

⸻

	7.	Local Mode

If no API key is provided:
	•	Monologues are drawn from predefined arrays in scenes.js.
	•	Delta values are estimated using lightweight keyword heuristics.
	•	The diffusion and rendering systems remain identical.

Local heuristics also target the same 5D state shape, so behavior is consistent across modes.

⸻

	8.	Rendering Flow

The runtime flow is:
	1.	User selects character.
	2.	Current psyche is read.
	3.	Model is invoked (or local monologue selected).
	4.	Delta is applied.
	5.	Trace is recorded.
	6.	Grid and adjacency links re-render.
	7.	Ripple animation is triggered.

Whispers follow the same flow, with additional semantic perturbation.

⸻

	9.	Visual Layer

The visual interface encodes system structure:
	•	Grid represents spatial topology.
	•	SVG lines represent adjacency.
	•	Ripple animations represent diffusion.
	•	Focus overlay provides immersive character view.
	•	Trace panel logs events and psyche snapshots.

The UI is intentionally restrained and atmospheric.

⸻

	10.	Stability Properties

The system is mathematically bounded:
	•	Psyche values remain in 0–1 range.
	•	Deltas are constrained by axis-specific limits.
	•	No runaway escalation occurs.
	•	Light stabilization prevents drift collapse.

This makes Ripples a stable small-scale dynamical aesthetic system with stronger short-term response.

⸻

	11.	Design Intent

Ripples is not:
	•	A chatbot
	•	A branching narrative engine
	•	A dialogue system

It is a perturbation field.

The user does not converse with characters.
The user alters their interior weather.

Language functions as disturbance rather than exchange.

⸻

	12.	Extension Possibilities

Future expansions may include:
	•	Mode toggles (high-immediacy vs subtle)
	•	Multi-whisper memory compression
	•	Scene-level global mood vectors
	•	Threshold-triggered stylistic phase shifts
	•	Cross-scene diffusion
	•	Lexical entropy management
	•	Multi-language support
	•	Server-side key proxy

The architecture is modular and supports incremental extension.

⸻

	13.	Conceptual Position

Ripples can be understood as:
	•	A minimal affect diffusion simulator
	•	A constrained LLM narrative field
	•	A post-chatbot literary interface
	•	A bounded psycho-dynamic system

It treats interior life as atmosphere rather than conversation.

The user perturbs the system.
The system absorbs, bends, and settles.
