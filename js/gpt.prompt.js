(() => {
  "use strict";

  function buildOpenAIUserPrompt(opts = {}) {
    const sc = opts.sc || {};
    const ch = opts.ch || {};
    const sceneId = String(opts.sceneId || "");
    const whisperText = String(opts.whisperText || "");
    const openingLead = String(opts.openingLead || "");
    const openingLeadSource = String(opts.openingLeadSource || "none");
    const recentThoughts = Array.isArray(opts.recentThoughts) ? opts.recentThoughts : [];
    const priorMonologueCount = Math.max(0, Number(opts.priorMonologueCount) || 0);
    const toneSteeringBlock = String(opts.toneSteeringBlock || "");
    const focusSteeringBlock = String(opts.focusSteeringBlock || "");
    const thoughtWordMin = Math.max(1, Number(opts.thoughtWordMin) || 20);
    const thoughtWordMax = Math.max(thoughtWordMin, Number(opts.thoughtWordMax) || 40);
    const dynamicsPromptLine = String(opts.dynamicsPromptLine || "");
    const dynamicsDeltaGuidance = String(opts.dynamicsDeltaGuidance || "");
    const psyche = (opts.psyche && typeof opts.psyche === "object") ? opts.psyche : {
      arousal: 0.5, valence: 0.5, agency: 0.5, permeability: 0.5, coherence: 0.5
    };

    const classifyWhisperTone = opts.classifyWhisperTone;
    const trimForPrompt = opts.trimForPrompt;
    const buildPacketPromptContext = opts.buildPacketPromptContext;
    const normalizeWhitespace = opts.normalizeWhitespace;
    const uniqList = opts.uniqList;
    if (typeof classifyWhisperTone !== "function") throw new Error("buildOpenAIUserPrompt: missing classifyWhisperTone()");
    if (typeof trimForPrompt !== "function") throw new Error("buildOpenAIUserPrompt: missing trimForPrompt()");
    if (typeof buildPacketPromptContext !== "function") throw new Error("buildOpenAIUserPrompt: missing buildPacketPromptContext()");
    if (typeof normalizeWhitespace !== "function") throw new Error("buildOpenAIUserPrompt: missing normalizeWhitespace()");
    if (typeof uniqList !== "function") throw new Error("buildOpenAIUserPrompt: missing uniqList()");

    const sceneLabel = String(sc?.meta?.label || "");
    const isPosthuman = /forest|post[- ]?human/i.test(sceneLabel);

    const sys = (sc.prompts && sc.prompts.system) ? sc.prompts.system :
      "You write short interior monologues.";

    const sceneFrame = (sc.prompts && sc.prompts.scene) ? sc.prompts.scene : (sc.meta?.baseline || "");
    const whisperRule = (sc.prompts && sc.prompts.whisperRule) ? sc.prompts.whisperRule :
      "If a whisper is present, it bends mood indirectly; do not answer it directly.";

    const dossier = (ch && ch.dossier) ? ch.dossier : "";
    const voice = uniqList(ch?.voice || []);
    const characterMotifSeeds = uniqList(ch?.motifSeeds || []);
    const sceneMotifPalette = uniqList(sc?.motifs || []);

    const psycheBlock = [
      "Current psychic state (0–1):",
      `- arousal: ${Number(psyche.arousal || 0).toFixed(2)}`,
      `- valence: ${Number(psyche.valence || 0).toFixed(2)}`,
      `- agency: ${Number(psyche.agency || 0).toFixed(2)}`,
      `- permeability: ${Number(psyche.permeability || 0).toFixed(2)}`,
      `- coherence: ${Number(psyche.coherence || 0).toFixed(2)}`
    ].join("\n");

    const stateStyleMap = [
      "State-to-style mapping (follow):",
      "- Higher arousal => more immediate pressure, urgency, and sharper cuts between images.",
      "- Lower valence => heavier interpretations, but retain one neutral or constructive anchor.",
      "- Higher agency => firmer verbs, self-directed intention, less passivity.",
      "- Higher permeability => stronger influence from surrounding atmosphere and others.",
      "- Lower coherence => fragmented transitions, associative leaps, and unresolved turns.",
      dynamicsPromptLine,
      "Do not mention these numbers explicitly."
    ].join("\n");

    const whisperClean = String(whisperText || "").trim();
    const whisperTone = classifyWhisperTone(whisperClean);
    const disclosurePhase =
      priorMonologueCount <= 3 ? "early" :
      priorMonologueCount <= 7 ? "middle" :
      "late";
    const disclosureGuidance = disclosurePhase === "early"
      ? [
          "- Vary openings unpredictably (object detail, body sensation, admin/money task, stray memory, abstract dread).",
          "- Keep core conflict mostly indirect; at most one brief allusive signal.",
          "- Stay with one dominant concern; avoid piling multiple concern threads.",
          "- Do not name the character's deepest fear or full backstory directly yet."
        ]
      : disclosurePhase === "middle"
        ? [
            "- Keep one dominant concern in view; a second concern can appear briefly if it returns to the core thread.",
            "- Allow at most one modestly clearer backstory signal, still indirect and understated.",
            "- Avoid full explanations, timelines, or confessional summaries."
          ]
        : [
            "- Deepen emotional clarity, but remain allusive rather than fully explanatory.",
            "- Leave some core material implied; avoid exhaustive disclosure.",
            "- Keep the thought centered; avoid introducing extra side-concerns."
          ];
    const continuityBlock = recentThoughts.length
      ? [
          "Continuity context (same character, oldest to newest):",
          ...recentThoughts.map((entry, i) =>
            `${i + 1}. ${entry.kind}: ${trimForPrompt(entry.text, 240)}`
          ),
          `Disclosure phase: ${disclosurePhase.toUpperCase()} (prior thoughts: ${priorMonologueCount}).`,
          "Disclosure pacing rules:",
          ...disclosureGuidance,
          "Associative movement rules:",
          "- Keep one dominant concern thread; optional secondary pivot is brief.",
          "- If a secondary pivot appears, return quickly to the primary concern."
        ].join("\n")
      : [
          "Continuity context: none yet for this character.",
          "Disclosure phase: EARLY (first thought).",
          "Disclosure pacing rules:",
          "- Start with a surprising angle; do not default to biography summary.",
          "- Keep first thought focused on one concern thread.",
          "- Hint at deeper history indirectly; avoid explicit backstory exposition.",
          "Associative movement rules:",
          "- Optional brief side association is allowed, but keep a single dominant concern."
        ].join("\n");

    const openingModes = [
      "begin with a concrete object and stay with one concern",
      "begin vague and atmospheric, then snap to one practical detail",
      "begin practical and precise, then deepen the same concern",
      "begin mid-thought as a fragment, no setup sentence"
    ];
    const openingMode = openingModes[Math.floor(Math.random() * openingModes.length)];
    const earlyRandomnessBlock = priorMonologueCount <= 1
      ? [
          "Early-thought variability (priority):",
          `- Opening mode for this thought: ${openingMode}.`,
          "- Sentence fragments are welcome.",
          "- Coherence can be loose as long as tone and stakes remain human."
        ].join("\n")
      : "Variability: keep images and topics fresh; avoid repeating your last opening move.";

    const antiExpositionBlock = [
      "Anti-exposition constraints:",
      "- Do not front-load biography.",
      "- Do not summarize the character's life or dossier.",
      "- Prefer implication, fragments, and oblique references over explicit explanation."
    ].join("\n");

    const lifeThreadBlock = [
      "Life-thread breadth constraints:",
      "- Keep each monologue focused on one dominant life thread.",
      "- At most one secondary thread is allowed, and only as a brief pivot.",
      "- Hard cap: no more than two concern threads in a single thought.",
      "- Rotate additional concerns across later thoughts (progressive disclosure), not within the same thought."
    ].join("\n");

    const packetContext = buildPacketPromptContext({
      sceneId,
      scene: sc,
      character: ch,
      whisperText: whisperClean,
      priorMonologueCount,
      disclosurePhase
    });

    const openingLeadClean = normalizeWhitespace(openingLead);
    const openingContinuityBlock = openingLeadClean
      ? [
          "Opening continuity (MANDATORY):",
          openingLeadSource === "whisper"
            ? `- Begin with this whisper-derived phrase, more or less intact: ${openingLeadClean}`
            : `- Riff on this carried-over phrase from the previous thought: ${openingLeadClean}`,
          openingLeadSource === "whisper"
            ? "- Keep meaning and wording close; small variation is allowed."
            : "- Reuse 2-5 distinctive words, but do NOT repeat the full phrase verbatim.",
          openingLeadSource === "whisper"
            ? "- This opening rule overrides default opening randomness."
            : "- Keep the emotional direction, but vary syntax and imagery."
        ].join("\n")
      : "Opening continuity: none.";
    const carryoverRiffBlock = (openingLeadClean && openingLeadSource !== "whisper")
      ? [
          "Carry-over riff persistence (MANDATORY):",
          "- Let carried-over anchor words recur beyond the opening.",
          "- Reintroduce at least one carried-over anchor in the middle of the thought.",
          "- End with at least one carried-over anchor still present (not necessarily the same anchor)."
        ].join("\n")
      : "Carry-over riff persistence: n/a.";

    const whisperImpact = whisperClean
      ? [
          "WHISPER IMPACT (MANDATORY):",
          openingLeadSource === "whisper"
            ? "- Start from the whisper-derived opening phrase, then continue as interior thought; do not address the whisperer."
            : "- Do NOT quote the whisper and do NOT address the whisperer.",
          "- Let the whisper clearly bend mood and imagery.",
          "- The bend must be visible in the opening clause and still present at the end.",
          "- Include one concrete bodily response influenced by the whisper.",
          "- Incorporate ONE concrete image implied by the whisper (object/place/bodily sensation/sound).",
          "- If the whisper is repetitive, echo a sense of repetition rhythm without quoting it.",
          "- Keep it human and plausible, but not faint.",
          ""
        ].join("\n")
      : [
          "(No whisper present.)",
          ""
        ].join("\n");

    const whisperSpecificBlock = whisperClean
      ? whisperTone.tone === "calm"
        ? [
            "Whisper-specific rule:",
            "- Because this whisper is calming, include a concrete de-escalation attempt (breath, jaw, shoulders, pulse, or pacing).",
            "- If calming fails, show the failure in concrete body language."
          ].join("\n")
        : whisperTone.tone === "urgent"
          ? [
              "Whisper-specific rule:",
              "- Because this whisper is urgent, show immediate compression of timing and decisions.",
              "- Include one body signal of urgency (pulse, breath rate, muscle tension, or narrowed attention)."
            ].join("\n")
          : whisperTone.tone === "threat"
            ? [
                "Whisper-specific rule:",
                "- Because this whisper is threatening, show vigilance/risk-scanning in concrete terms.",
                "- Include one protective or avoidant micro-action."
              ].join("\n")
            : whisperTone.tone === "tender"
              ? [
                  "Whisper-specific rule:",
                  "- Because this whisper is tender, show softening without sentimentality.",
                  "- Include one concrete memory or body shift tied to that softening."
                ].join("\n")
              : [
                  "Whisper-specific rule:",
                  "- Show a concrete cognitive or bodily aftereffect of the whisper."
                ].join("\n")
      : "No whisper-specific rule.";

    const concernConstraint = isPosthuman
      ? "- Include one immediate embodied concern (shelter, hunger, injury risk, weather, territory, energy, predation, mating pressure, seasonal survival)."
      : "- Include one immediate personal concern (status, work, money, health, aging, regret, belonging, obligation, reputation, deadline, body discomfort).";

    const userPrompt = [
      "Generate an interior monologue.",
      `Length: ${thoughtWordMin}-${thoughtWordMax} words.`,
      "Tense may be present, past, or near-future depending on pressure and anticipation.",
      "Grounded and immediate with a light allusive layer.",
      "Explicit first-person references should stay sparse (target <=20% of words using I/me/my/mine/myself).",
      "Prioritize concrete stakes over decorative abstraction.",
      "Sentence fragments are allowed.",
      "At most ONE clause may lean strongly lyrical/metaphoric.",
      "Do not rely on dust, light, shadow, air, or silence as primary imagery.",
      "Introduce at least one concrete anchor (object, admin task, bodily sensation, sound, or memory shard).",
      concernConstraint,
      "Output must be JSON only (no markdown, no extra text).",
      "Avoid repeating imagery or nouns from recent monologues, except deliberate carried-over riff anchors.",
      "Hard constraints:",
      "- No direct second-person reply to a whisper.",
      "- No meta-talk (no mention of prompts, models, AI, system).",
      "- No dialogue formatting; this is interior thought.",
      "- Keep backstory allusive, not explanatory.",
      "- Across successive turns for a character, maintain at least a 50/50 balance of neutral-or-gently-hopeful thoughts versus darker thoughts.",
      "",
      "Tone steering for this turn (hard constraints):",
      toneSteeringBlock,
      "",
      "Attention steering for this turn (hard constraints):",
      focusSteeringBlock,
      "",
      openingContinuityBlock,
      carryoverRiffBlock,
      "",
      "Scene:",
      sceneFrame,
      "",
      "Character:",
      dossier,
      voice.length ? `Voice tags: ${voice.join(", ")}.` : "Voice tags: (none).",
      characterMotifSeeds.length ? `Character motif seeds: ${characterMotifSeeds.join(", ")}.` : "Character motif seeds: (none).",
      sceneMotifPalette.length ? `Scene motif palette: ${sceneMotifPalette.slice(0, 14).join(", ")}.` : "Scene motif palette: (none).",
      "",
      "Packet steering (apply exactly as constraints):",
      packetContext.promptBlock,
      "",
      continuityBlock,
      "",
      whisperSpecificBlock,
      "",
      earlyRandomnessBlock,
      "",
      antiExpositionBlock,
      "",
      lifeThreadBlock,
      "",
      psycheBlock,
      "",
      stateStyleMap,
      "",
      whisperRule,
      "",
      whisperImpact,
      `Whisper input: ${whisperClean || "(none)"}`,
      "",
      "Return JSON with:",
      `- monologue: string (${thoughtWordMin}-${thoughtWordMax} words)`,
      "- delta: object with numeric fields arousal, valence, agency, permeability, coherence",
      "Delta semantics:",
      "- Interpret the whisper holistically (meaning, tone, implication), not keywords.",
      "- The delta represents how the whisper alters the character’s internal state.",
      "- Range guidance: arousal/permeability in [-0.15,0.15], valence in [-0.12,0.12], agency/coherence in [-0.10,0.10].",
      dynamicsDeltaGuidance,
      "- If whisper is empty/none, delta should be near 0."
    ].join("\n");

    return { sys, userPrompt, packetContext };
  }

  window.RipplesPromptBuilder = Object.freeze({
    buildOpenAIUserPrompt
  });
})();
