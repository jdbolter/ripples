(() => {
  "use strict";

  function buildOpenAIUserPrompt(opts = {}) {
    const sc = opts.sc || {};
    const ch = opts.ch || {};
    const whisperText = String(opts.whisperText || "").trim();
    const recentThoughts = Array.isArray(opts.recentThoughts) ? opts.recentThoughts : [];
    const thoughtWordMin = Math.max(1, Number(opts.thoughtWordMin) || 40);
    const thoughtWordMax = Math.max(thoughtWordMin, Number(opts.thoughtWordMax) || 60);
    const dynamicsDeltaGuidance = String(opts.dynamicsDeltaGuidance || "");
    const psyche = (opts.psyche && typeof opts.psyche === "object") ? opts.psyche : {
      arousal: 0.5, valence: 0.5, agency: 0.5, permeability: 0.5, coherence: 0.5
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

    // Psyche — intensity modulation only
    const psycheBlock = [
      "Internal state (use only to modulate tone and intensity, not as subject matter):",
      `arousal ${Number(psyche.arousal || 0).toFixed(2)}, valence ${Number(psyche.valence || 0).toFixed(2)}, agency ${Number(psyche.agency || 0).toFixed(2)}, permeability ${Number(psyche.permeability || 0).toFixed(2)}, coherence ${Number(psyche.coherence || 0).toFixed(2)}`
    ].join("\n");

    const parts = [
      `Generate an interior monologue. Length: ${thoughtWordMin}–${thoughtWordMax} words. Sentence fragments allowed.`,
      style ? `Style: ${style}` : "",
      samplesBlock,
      "Character (background only — do not summarize this directly):",
      dossier,
      sceneFrame,
      whisperBlock,
      continuityBlock,
      psycheBlock,
      dynamicsDeltaGuidance,
      "Hard constraints:",
      "- No direct second-person reply to a whisper.",
      "- No meta-commentary (no mention of prompts, models, AI, system).",
      "- No metaphors or poetic analogies.",
      "- No biography summaries or exposition.",
      "- Plain interior thought only — not dialogue.",
      "",
      'Return JSON only: { "monologue": "...", "delta": { "arousal": 0, "valence": 0, "agency": 0, "permeability": 0, "coherence": 0 } }',
      "Delta represents how this moment alters the character's internal state.",
      "Range: arousal/permeability in [-0.15,0.15], valence in [-0.12,0.12], agency/coherence in [-0.10,0.10].",
      "If no whisper, delta should be near 0."
    ].filter(Boolean).join("\n\n");

    return { sys, userPrompt: parts, packetContext: { promptBlock: "" } };
  }

  window.RipplesPromptBuilder = Object.freeze({
    buildOpenAIUserPrompt
  });
})();
