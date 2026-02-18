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

Each character has a persistent psyche vector with four normalized values between 0 and 1:

tension
clarity
openness
drift

These values represent internal affective conditions and influence how monologues are generated.

The psyche is:
	•	Persistent within a scene
	•	Reset when the scene changes
	•	Modified by whispers
	•	Diffused via adjacency
	•	Clamped to prevent runaway escalation

This creates a bounded dynamical system.

⸻

	3.	Delta Semantics

When a whisper occurs and API mode is active, the model returns structured JSON containing:
	•	A monologue string
	•	A delta object with numeric adjustments to tension, clarity, openness, and drift

Each delta value is constrained to a small range (approximately −0.15 to +0.15).

Processing sequence:
	1.	Delta values are coerced to numbers.
	2.	Values are clamped to a maximum magnitude (±0.20).
	3.	Delta is applied to the source character’s psyche.
	4.	Delta is attenuated and applied to adjacent characters.
	5.	All resulting psyche values are clamped to the 0–1 range.

This ensures stability and prevents chaotic divergence.

⸻

	4.	Diffusion Model

Ripples propagate according to adjacency relationships defined in scenes.js.

The diffusion model is:

Source character receives full delta.
Adjacent characters receive attenuated delta.

A small stabilization drift is applied globally after each event:
	•	drift slightly increases
	•	clarity slightly decreases

This produces slow atmospheric change over time.

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
	•	Produce a 75–100 word interior monologue
	•	Avoid direct second-person reply
	•	Avoid meta-commentary
	•	Express psychic state indirectly through style
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
	•	delta (object containing tension, clarity, openness, drift as numbers)

If the API call fails or structured output is invalid, the system falls back to local mode.

⸻

	7.	Local Mode

If no API key is provided:
	•	Monologues are drawn from predefined arrays in scenes.js.
	•	Delta values are estimated using lightweight keyword heuristics.
	•	The diffusion and rendering systems remain identical.

This guarantees that the simulation remains functional offline.

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
	•	Trace panel logs events and psyche values.

The UI is intentionally restrained and atmospheric.

⸻

	10.	Stability Properties

The system is mathematically bounded:
	•	Psyche values remain in 0–1 range.
	•	Deltas are constrained.
	•	No runaway escalation occurs.
	•	Cumulative drift is gradual and legible.

This makes Ripples a stable small-scale dynamical aesthetic system.

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
The system absorbs and drifts.