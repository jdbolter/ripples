(() => {
  "use strict";

  function buildOpenAIUserPrompt(opts = {}) {
    const sc = opts.sc || {};
    const ch = opts.ch || {};
    const whisperText = String(opts.whisperText || "").trim();
    const recentThoughts = Array.isArray(opts.recentThoughts) ? opts.recentThoughts : [];
    const thoughtWordMin = Math.max(1, Number(opts.thoughtWordMin) || 40);
    const thoughtWordMax = Math.max(thoughtWordMin, Number(opts.thoughtWordMax) || 60);
    const psyche = (opts.psyche && typeof opts.psyche === "object") ? opts.psyche : {
      emotion: "guarded", intensity: 0.3
    };

    const sys = (sc.prompts && sc.prompts.system)
      ? sc.prompts.system
      : "You write short interior monologues. Plain text, no metaphors, no poetry.";

    const sceneFrame = (sc.prompts && sc.prompts.scene)
      ? sc.prompts.scene
      : (sc.meta && sc.meta.baseline) || "";

    const whisperRule = (sc.prompts && sc.prompts.whisperRule)
      ? sc.prompts.whisperRule
      : "If a whisper is present, let it alter the thought immediately and indirectly. Do not answer it directly.";

    const ambientThread = String(opts.ambientThread || "").trim();
    const fingerprint = String(ch.fingerprint || "").trim();
    const dossier = String(ch.dossier || "");
    const style = String(ch.style || "");
    const samples = Array.isArray(ch.samples) && ch.samples.length ? ch.samples : [];

    // Samples block
    const samplesBlock = samples.length
      ? [
          "Example monologues for this character — match their rhythm, vocabulary, and how thought moves:",
          ...samples.map((s, i) => `${i + 1}. ${s}`)
        ].join("\n")
      : "";

    // Continuity
    const continuityBlock = recentThoughts.length
      ? [
          "Recent thoughts by this character (avoid repeating the same images or topics):",
          ...recentThoughts.map((entry, i) => `${i + 1}. ${entry.text || entry}`)
        ].join("\n")
      : "";

    // Whisper
    const whisperBlock = whisperText
      ? `A whisper has reached this character: "${whisperText}"\n${whisperRule}`
      : "(No whisper present.)";

    const emotion = String(psyche.emotion || "guarded").trim().toLowerCase() || "guarded";
    const intensity = Math.max(0, Math.min(1, Number(psyche.intensity || 0)));
    const psycheBlock = [
      "Current affect state (guidance only; do not name it explicitly unless the thought naturally implies it):",
      `${emotion} at intensity ${intensity.toFixed(2)}`
    ].join("\n");

    const ambientLine = ambientThread
      ? `Ordinary thought field this turn (a passing detail the mind may wander into — use lightly, let it be incidental, do not force it): ${ambientThread}.`
      : "";

    const parts = [
      `Generate an interior monologue. Length: ${thoughtWordMin}–${thoughtWordMax} words. Sentence fragments are allowed internally, but the monologue must end with a complete sentence.`,
      style ? `Style: ${style}` : "",
      samplesBlock,
      fingerprint
        ? "Character — draw on this as a fund of memories and detail; do not summarize it or recite it; let it surface obliquely:"
        : "Character (background only — do not summarize this directly):",
      fingerprint || dossier,
      sceneFrame,
      whisperBlock,
      continuityBlock,
      ambientLine,
      psycheBlock,
      "Hard constraints:",
      "- No direct second-person reply to a whisper.",
      "- No meta-commentary (no mention of prompts, models, AI, system).",
      "- No metaphors or poetic analogies.",
      "- No biography summaries or exposition.",
      "- Plain interior thought only — not dialogue.",
      "- Each image, phrase, or idea appears once; do not repeat or rephrase it within this monologue.",
      "- The monologue must end on a complete sentence.",
      "- If the monologue ends in '...', the ellipsis must come after a complete sentence, not after a fragment.",
      "",
      'Return JSON only: { "monologue": "..." }'
    ].filter(Boolean).join("\n\n");

    return { sys, userPrompt: parts, packetContext: { promptBlock: "" } };
  }

  window.RipplesPromptBuilder = Object.freeze({
    buildOpenAIUserPrompt
  });
})();
