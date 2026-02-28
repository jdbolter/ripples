/* gpt.js
   RIPPLES — End-User Interface (2-column layout)

   Interaction model:
   - Click a character => opens photo + immediately produces a monologue (DEFAULT channel)
   - Whisper text + click Whisper => re-generates monologue; whisper causes visible ripple
   - Traces log records both "LISTEN" and "WHISPER" events + psyche snapshot per trace
   - API mode: a SINGLE OpenAI call returns BOTH monologue + psyche delta (semantic)
   - Local fallback: deterministic monologue rotation + heuristic delta when generation is unavailable

   Depends on: js/scenes.js providing window.SCENES and window.SCENE_ORDER
   Requires index.html elements:
     #scenarioSelect, #grid, #linkLayer, #worldtext, #auditLog, #selectedPill
     #focusOverlay, #focusImage, #focusMessage
     #whisperInput, #whisperSend
     #apiModal, #apiKeyInput, #apiSubmit
*/

(() => {
  "use strict";

  // Build marker (helps confirm browser is loading this exact file)
  const __RIPPLES_BUILD__ = "2026-02-28-vercel-proxy";
  console.log("[RIPPLES] gpt.js loaded", __RIPPLES_BUILD__);

  if (!window.SCENES || !window.SCENE_ORDER) {
    throw new Error("Missing SCENES/SCENE_ORDER. Ensure js/scenes.js is loaded before js/gpt.js.");
  }
  if (!window.RipplesTextUtils) {
    throw new Error("Missing RipplesTextUtils. Ensure js/gpt.text-utils.js is loaded before js/gpt.js.");
  }
  if (!window.RipplesPromptBuilder) {
    throw new Error("Missing RipplesPromptBuilder. Ensure js/gpt.prompt.js is loaded before js/gpt.js.");
  }
  if (!window.RipplesEngine) {
    throw new Error("Missing RipplesEngine. Ensure js/gpt.engine.js is loaded before js/gpt.js.");
  }
  if (!window.RipplesUI) {
    throw new Error("Missing RipplesUI. Ensure js/gpt.ui.js is loaded before js/gpt.js.");
  }

  const {
    stripOuterQuotes,
    normalizeWhitespace,
    cleanSpacing,
    splitWords,
    wordCount,
    canonicalToken,
    splitClauses,
    truncateToWordCount,
    trimDanglingEnding,
    ensureTerminalPunctuation,
    randInt,
    clampWordRange
  } = window.RipplesTextUtils;
  const { buildOpenAIUserPrompt } = window.RipplesPromptBuilder;
  const { createEngine } = window.RipplesEngine;
  const { createUIController } = window.RipplesUI;

  // Single implicit channel for now
  const DEFAULT_CHANNEL = "THOUGHTS";
  const EVENT_KIND = { LISTEN: "LISTEN", WHISPER: "WHISPER" };
  const THOUGHT_WORD_MIN = 20;
  const THOUGHT_WORD_MAX = 40;
  const CONTINUITY_LEAD_MAX_WORDS = 16;
  const FIRST_PERSON_MAX_RATIO = 0.20;
  const CONTINUITY_STOPWORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "if", "in", "into",
    "is", "it", "its", "of", "on", "or", "so", "than", "that", "the", "their", "there", "they",
    "this", "to", "up", "was", "were", "with", "you", "your"
  ]);
  const FOCUSED_PRESSURE_CHARACTER_IDS = new Set([
    "mother_returning",
    "student_alone"
  ]);
  const OPEN_PROFILE_AMBIENT_THREADS = Object.freeze([
    "passing landscape details and weather changes",
    "ordinary body comfort adjustments in the seat",
    "small practical rituals like checking pockets, tickets, or notes",
    "mundane observations about strangers and shared space",
    "quiet memory flashes with no urgent problem attached",
    "food, coffee, or simple sensory cravings",
    "tiny plans for the next stop, meal, or evening",
    "neutral curiosity about objects, sounds, and routines nearby"
  ]);
  const AUTO_THOUGHT = {
    enabled: true,
    intervalMs: 30_000,
    retryWhileBusyMs: 1_200
  };

  // Single switch for system dynamics:
  // - "intense": strongest whisper impact + wider propagation
  // - "high": stronger whisper impact, lighter stabilization
  // - "subtle": gentler whisper impact, stronger settling
  const DYNAMICS_MODE = "high"; // change to "intense" or "subtle" to alter tonal pressure
  const DYNAMICS_PROFILES = {
    intense: {
      neighborScale: {
        arousal: 0.80,
        valence: 0.58,
        agency: 0.32,
        permeability: 0.76,
        coherence: 0.28
      },
      stabilization: { arousal: -0.0002, coherence: 0.0003 },
      whisperBase: { arousal: 0.16, permeability: 0.14, coherence: -0.05 },
      listenBase: { arousal: -0.008, valence: 0.010, agency: 0.004, permeability: 0.012, coherence: 0.008 },
      promptLine: "- Intense mode: after a whisper, make the tonal bend immediate and dominant in the monologue.",
      deltaGuidance: "- In WHISPER events, favor clear, upper-range-but-bounded shifts over mild deltas."
    },
    high: {
      neighborScale: {
        arousal: 0.62,
        valence: 0.45,
        agency: 0.25,
        permeability: 0.58,
        coherence: 0.22
      },
      stabilization: { arousal: -0.0005, coherence: 0.0006 },
      whisperBase: { arousal: 0.12, permeability: 0.10, coherence: -0.03 },
      listenBase: { arousal: -0.01, valence: 0.01, agency: 0.005, permeability: 0.015, coherence: 0.01 },
      promptLine: "- High-immediacy mode: after a whisper, make the tonal bend unmistakable within 1-2 sentences.",
      deltaGuidance: "- In WHISPER events, prefer visible-but-bounded shifts over near-zero deltas."
    },
    subtle: {
      neighborScale: {
        arousal: 0.45,
        valence: 0.35,
        agency: 0.20,
        permeability: 0.42,
        coherence: 0.20
      },
      stabilization: { arousal: -0.0025, coherence: 0.0030 },
      whisperBase: { arousal: 0.07, permeability: 0.06, coherence: -0.02 },
      listenBase: { arousal: -0.015, valence: 0.012, agency: 0.008, permeability: 0.012, coherence: 0.013 },
      promptLine: "- Subtle mode: let whispers bend tone gradually rather than sharply.",
      deltaGuidance: "- In WHISPER events, keep shifts perceptible but restrained."
    }
  };
  const DYNAMICS = DYNAMICS_PROFILES[DYNAMICS_MODE] || DYNAMICS_PROFILES.high;
  const TONE_BALANCER = {
    windowSize: 6,
    minNonDarkRatio: 0.50,
    variationLenses: [
      {
        id: "practical",
        instruction: "Use a practical/logistical lens (task, sequence, concrete next action).",
        opener: "Checklist first:"
      },
      {
        id: "sensory",
        instruction: "Use a sensory lens (touch, posture, sound, object detail) before interpretation.",
        opener: "At the edge of the table,"
      },
      {
        id: "social",
        instruction: "Use a social lens (another person in view, shared space, belonging signal).",
        opener: "Across the room,"
      },
      {
        id: "future",
        instruction: "Use a near-future lens (the next hour/day and one feasible outcome).",
        opener: "By evening,"
      },
      {
        id: "body",
        instruction: "Use a body-regulation lens (breath, jaw, shoulders, pace) tied to agency.",
        opener: "Shoulders settle,"
      }
    ],
    steadyLifts: [
      "Still, one useful step is clear and manageable.",
      "Not resolved, but the next action is concrete and possible.",
      "The room offers one steady point to work from."
    ],
    hopefulLifts: [
      "A small relief arrives: this part can be handled.",
      "Something steadies, and the next step feels possible.",
      "There is room for one decent outcome."
    ]
  };
  const ATTENTION_BALANCER = {
    windowSize: 4,
    maxSelfFocusedInWindow: 2,
    worldCueWords: [
      "window", "glass", "table", "chair", "page", "book", "shelf", "desk",
      "door", "aisle", "coat", "hands", "light", "floor", "steps", "air", "room"
    ],
    selfCueWords: [
      "i", "me", "my", "myself", "worry", "fear", "panic", "regret", "shame",
      "doubt", "afraid", "confused", "collapse", "fail", "failing", "ruined"
    ],
    sceneFallbackAnchors: [
      "The room stays still for a second.",
      "A chair shifts nearby.",
      "Light sits on the table.",
      "Pages move in small sounds."
    ],
    simpleWordReplacements: {
      however: "but",
      therefore: "so",
      nevertheless: "still",
      consequently: "so",
      perhaps: "maybe",
      utilize: "use",
      regarding: "about"
    }
  };

  const API_ACCESS_MODE = Object.freeze({
    PROXY: "proxy",
    MANUAL: "manual"
  });
  const RUNTIME_ENDPOINTS = Object.freeze({
    config: "/api/runtime-config",
    responses: "/api/openai-responses"
  });

  // OpenAI access state
  let userApiKey = null;
  let apiAccessMode = API_ACCESS_MODE.MANUAL;
  let isGenerating = false;
  const apiNarrativeState = {};
  let autoThoughtTimer = null;

  let isApiKeyChecking = false;

  // -----------------------------
  // ENGINE (scene state + rotation + psyche)
  // -----------------------------
  const engine = createEngine({
    scenes: window.SCENES,
    sceneOrder: window.SCENE_ORDER,
    eventKind: EVENT_KIND,
    dynamics: DYNAMICS,
    resetApiNarrativeState,
    extractLastSentenceOrFragment,
    continuityLeadMaxWords: CONTINUITY_LEAD_MAX_WORDS
  });

  const ui = createUIController({
    eventKind: EVENT_KIND,
    getScene: () => engine.getScene()
  });

  function clearAutoThoughtTimer() {
    if (autoThoughtTimer) {
      clearTimeout(autoThoughtTimer);
      autoThoughtTimer = null;
    }
  }

  function scheduleAutoThought(delayMs = AUTO_THOUGHT.intervalMs) {
    clearAutoThoughtTimer();
    if (!AUTO_THOUGHT.enabled) return;

    const selectedId = engine.getSelectedId();
    if (!selectedId) return;

    autoThoughtTimer = window.setTimeout(async () => {
      const activeId = engine.getSelectedId();
      if (!activeId) return;

      if (isGenerating) {
        scheduleAutoThought(AUTO_THOUGHT.retryWhileBusyMs);
        return;
      }

      await requestMonologue({
        characterId: activeId,
        channel: DEFAULT_CHANNEL,
        kind: EVENT_KIND.LISTEN,
        whisperText: null
      });
    }, Math.max(250, Number(delayMs) || AUTO_THOUGHT.intervalMs));
  }

  // -----------------------------
  // Init
  // -----------------------------
  async function init() {
    ui.populateScenes(engine.listScenes());
    bindUI();

    const firstSceneId = engine.listScenes()[0]?.id || Object.keys(window.SCENES)[0];
    const snap = engine.loadScene(firstSceneId);

    ui.preloadSceneImages(engine.getScene());

    ui.render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
    showSelectPromptIfNeeded();
    clearAutoThoughtTimer();

    const runtimeConfig = await detectRuntimeConfig();
    apiAccessMode = runtimeConfig.useServerProxy ? API_ACCESS_MODE.PROXY : API_ACCESS_MODE.MANUAL;
    window.__ripplesRuntimeConfig = runtimeConfig;

    if (apiAccessMode === API_ACCESS_MODE.PROXY) {
      ui.hideApiModal();
      setApiKeyStatus("", false);
    } else {
      setApiKeyStatus("Enter an API key to continue.", false);
      ui.showApiModal();
    }
  }

  function bindUI() {
    ui.bindUI({
      onScenarioChange: (sceneId) => {
        clearAutoThoughtTimer();
        ui.closeFocus();
        const snap = engine.loadScene(sceneId);
        ui.preloadSceneImages(engine.getScene());
        ui.render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
        showSelectPromptIfNeeded();
      },
      onApiSubmit: async () => {
        if (isApiKeyChecking) return;
        const val = String(ui.getApiKeyInputValue() || "").trim();
        if (!val) {
          setApiKeyStatus("Enter an API key to continue.", true);
          return;
        }

        setApiKeyChecking(true);
        setApiKeyStatus("Validating key...", false);

        try {
          const ok = await validateApiKey(val);
          if (!ok) return;

          userApiKey = val;
          ui.hideApiModal();
          ui.clearApiKeyInput();
          setApiKeyStatus("", false);
        } finally {
          setApiKeyChecking(false);
        }
      },
      onWhisperSend,
      onCycleScene: cycleScene,
      onSelectCharacter,
      onResize: () => {
        ui.renderLinks(engine.snapshot());
      }
    });
  }

  // -----------------------------
  // Actions
  // -----------------------------
  function onSelectCharacter(id) {
    clearAutoThoughtTimer();
    engine.selectCharacter(id);
    const sc = engine.getScene();
    const ch = sc.characters.find((c) => c.id === id);

    ui.setSelectedPillText(
      ch?.label
        ? ch.label.toUpperCase()
        : (id ? String(id).toUpperCase() : ui.getDefaultSelectedPillText())
    );

    if (ui.getFocusMode() === "prompt") ui.closeFocus();

    // Open photo slightly delayed (aesthetic)
    if (ch?.image) {
      window.setTimeout(() => ui.openFocusImage(ch.image, ch.label || ch.id), 220);
    } else {
      ui.closeFocus();
    }

    void requestMonologue({
      characterId: id,
      channel: DEFAULT_CHANNEL,
      kind: EVENT_KIND.LISTEN,
      whisperText: null
    });
  }

  function onWhisperSend() {
    const selectedId = engine.getSelectedId();
    if (!selectedId) {
      ui.openPrompt("Select a character");
      return;
    }

    const whisper = String(ui.getWhisperValue() || "").trim();
    if (!whisper) return;

    engine.recordWhisper(selectedId, whisper);
    clearAutoThoughtTimer();

    // Begin generating new monologue (API or local)
    void requestMonologue({
      characterId: selectedId,
      channel: DEFAULT_CHANNEL,
      kind: EVENT_KIND.WHISPER,
      whisperText: whisper
    });

    // TEMPORARILY HIDE PHOTO → SHOW RIPPLE → RESTORE (slow cinematic cycle)
    let restorePhoto = null;

    if (ui.getFocusMode() === "photo") {
      restorePhoto = ui.getFocusImageState();
      ui.closeFocus();
    }

    window.setTimeout(() => {
      ui.flashRippleFor(selectedId);

      if (restorePhoto && restorePhoto.src) {
        window.setTimeout(() => {
          ui.openFocusImage(restorePhoto.src, restorePhoto.alt);
        }, 1900);
      }
    }, 240);

    ui.clearWhisperValue();
  }

  async function requestMonologue({ characterId, channel, kind, whisperText }) {
    if (isGenerating) return;
    isGenerating = true;

    const whisperLead = (kind === EVENT_KIND.WHISPER && String(whisperText || "").trim())
      ? extractFirstSentenceOrFragment(whisperText, CONTINUITY_LEAD_MAX_WORDS)
      : "";
    const carriedLead = whisperLead ? "" : engine.getOpeningBuffer();
    const openingLead = whisperLead || carriedLead;
    const openingLeadSource = whisperLead ? "whisper" : (carriedLead ? "carryover" : "none");

    const priorMonologueCount = engine.getMonologueCount(characterId);
    const toneSteering = buildToneSteering({
      characterId,
      kind,
      whisperText,
      priorMonologueCount
    });
    const focusSteering = buildFocusSteering({
      characterId,
      kind,
      whisperText,
      priorMonologueCount,
      scene: engine.getScene()
    });
    let text = "";
    let usedLocalPool = false;
    let generatedFromApi = false;

    ui.setWorldtext("…", { mode: "baseline" });

    // Drift update strategy:
    // - Local mode (no API): applyRipple BEFORE selecting from pool.
    // - API mode + WHISPER: model returns a delta; applyRipple AFTER generation using that delta.
    const canUseOpenAI = hasApiAccess();
    const useModelDelta = canUseOpenAI && kind === EVENT_KIND.WHISPER;
    if (!useModelDelta) {
      engine.applyRipple({ sourceId: characterId, kind, whisperText });
    }

    try {
      if (canUseOpenAI) {
        const out = await generateFromOpenAI({
          characterId,
          channel,
          whisperText,
          kind,
          openingLead,
          openingLeadSource,
          toneSteering,
          focusSteering
        });
        text = out.text;
        generatedFromApi = true;

        if (useModelDelta && out.delta) {
          engine.applyRipple({
            sourceId: characterId,
            kind,
            whisperText,
            deltaOverride: out.delta
          });
        }
      } else {
        text = engine.nextMonologue(characterId, channel);
        usedLocalPool = true;
      }
    } catch (err) {
      console.error("OpenAI generation failed; falling back to local.", err);
      text = engine.nextMonologue(characterId, channel);
      usedLocalPool = true;
    } finally {
      isGenerating = false;
    }

    if (kind === EVENT_KIND.WHISPER && String(whisperText || "").trim()) {
      text = enforceWhisperBend(text, whisperText, engine.getPsyche(characterId), {
        strict: generatedFromApi
      });
    }
    text = enforceToneSteering(text, toneSteering);
    text = enforceFocusSteering(text, focusSteering);

    text = constrainThoughtText(text, {
      minWords: THOUGHT_WORD_MIN,
      maxWords: THOUGHT_WORD_MAX,
      maxFirstPersonRatio: FIRST_PERSON_MAX_RATIO,
      preferRandomWindow: usedLocalPool
    });
    text = enforceToneSteering(text, toneSteering);
    text = enforceFocusSteering(text, focusSteering);
    text = constrainThoughtText(text, {
      minWords: THOUGHT_WORD_MIN,
      maxWords: THOUGHT_WORD_MAX,
      maxFirstPersonRatio: FIRST_PERSON_MAX_RATIO,
      preferRandomWindow: false
    });
    const continuityMode = (openingLeadSource === "carryover" || openingLeadSource === "whisper")
      ? "riff"
      : "literal";
    text = enforceContinuityLead(text, openingLead, { mode: continuityMode });
    text = finalizeWithContinuityLead(text, openingLead, {
      minWords: THOUGHT_WORD_MIN,
      maxWords: THOUGHT_WORD_MAX,
      mode: continuityMode
    });
    if (openingLeadSource === "whisper") {
      text = dedupeWhisperLeadRepetition(text, openingLead, {
        minWords: THOUGHT_WORD_MIN,
        maxWords: THOUGHT_WORD_MAX
      });
    }
    if (continuityMode === "riff") {
      text = enforceCarryoverRiffPersistence(text, openingLead, {
        minWords: THOUGHT_WORD_MIN,
        maxWords: THOUGHT_WORD_MAX
      });
    }

    engine.newTrace({
      kind,
      characterId,
      channel,
      whisperText: whisperText || "",
      text
    });
    engine.setOpeningBufferFromThought(text);

    ui.setWorldtext(text, { mode: "ripple" });
    const snap = engine.snapshot();
    ui.renderReplay(snap);
    ui.renderGrid(snap);
    ui.renderLinks(snap);
    scheduleAutoThought(AUTO_THOUGHT.intervalMs);
  }

  function cycleScene(dir) {
    clearAutoThoughtTimer();
    const scenes = engine.listScenes();
    const cur = ui.getScenarioValue();
    const idx = scenes.findIndex(s => s.id === cur);
    const next = (idx + dir + scenes.length) % scenes.length;
    ui.setScenarioValue(scenes[next].id);

    ui.closeFocus();
    const snap = engine.loadScene(scenes[next].id);

    ui.preloadSceneImages(engine.getScene());

    ui.render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
    showSelectPromptIfNeeded();
  }

  function showSelectPromptIfNeeded() {
    const snap = engine.snapshot();
    if (!snap.selection.characterId) ui.openPrompt("Select a character");
  }

  async function detectRuntimeConfig() {
    if (window.location?.protocol === "file:") {
      return { useServerProxy: false, source: "file" };
    }

    try {
      const resp = await fetch(RUNTIME_ENDPOINTS.config, {
        method: "GET",
        cache: "no-store"
      });

      if (!resp.ok) {
        return { useServerProxy: false, source: `status:${resp.status}` };
      }

      const data = await resp.json();
      return {
        useServerProxy: !!data?.useServerProxy,
        source: "runtime-config"
      };
    } catch (_) {
      return { useServerProxy: false, source: "unavailable" };
    }
  }

  function hasApiAccess() {
    return apiAccessMode === API_ACCESS_MODE.PROXY || !!userApiKey;
  }

  // -----------------------------
  // Utilities
  // -----------------------------
  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function trimForPrompt(str, maxLen) {
    const oneLine = String(str || "").replace(/\s+/g, " ").trim();
    const max = Math.max(32, Number(maxLen) || 240);
    if (oneLine.length <= max) return oneLine;
    return `${oneLine.slice(0, max - 3)}...`;
  }

  function isFocusedPressureCharacter(characterId) {
    const id = String(characterId || "").trim();
    return !!id && FOCUSED_PRESSURE_CHARACTER_IDS.has(id);
  }

  function getCharacterPressureProfile(characterId, packetProfile = "") {
    const explicit = String(packetProfile || "").trim().toLowerCase();
    if (explicit === "focused" || explicit === "open") return explicit;
    return isFocusedPressureCharacter(characterId) ? "focused" : "open";
  }

  function resetApiNarrativeState(sceneId) {
    const id = String(sceneId || "").trim();
    if (!id) return;
    apiNarrativeState[id] = {};
  }

  function getApiCharacterState(sceneId, characterId) {
    const sid = String(sceneId || "").trim();
    const cid = String(characterId || "").trim();
    if (!sid || !cid) {
      return {
        turnIndex: 0,
        recentTopics: [],
        recentOpenings: [],
        recentNgrams: [],
        threadLastUsed: {}
      };
    }

    if (!apiNarrativeState[sid]) apiNarrativeState[sid] = {};
    if (!apiNarrativeState[sid][cid]) {
      apiNarrativeState[sid][cid] = {
        turnIndex: 0,
        recentTopics: [],
        recentOpenings: [],
        recentNgrams: [],
        threadLastUsed: {}
      };
    }
    return apiNarrativeState[sid][cid];
  }

  function buildPacketPromptContext({ sceneId, scene, character, whisperText, priorMonologueCount, disclosurePhase }) {
    const packet = normalizeCharacterPacket(character);
    const state = getApiCharacterState(sceneId, character?.id);
    const turnNumber = state.turnIndex + 1;
    const pressureProfile = packet.pressureProfile;
    const toneCadenceDirective = pressureProfile === "focused"
      ? (
          (turnNumber % 2 === 0)
            ? "- Tonal cadence (required this turn): keep the overall thought neutral-to-gently-hopeful. Include one concrete stabilizing or competence cue."
            : "- Tonal cadence: darker pressure is allowed, but retain one concrete anchor of agency or steadiness."
        )
      : "- Tonal cadence (required this turn): keep the overall thought mostly neutral, curious, or gently pleasant; pressure can appear, but do not let it dominate.";

    const activeThread = pickLifeThread({
      threads: packet.lifeThreads,
      state,
      cooldown: packet.antiRepeat.topicCooldownTurns
    });
    const ambientThread = pickAmbientThread({ scene, state, turnNumber });
    const shouldSurfaceLongTermThread = pressureProfile === "focused" || (turnNumber % 3 === 0);

    const phase = disclosurePhase || (
      priorMonologueCount <= 3 ? "early" :
      priorMonologueCount <= 7 ? "middle" : "late"
    );
    const phaseDirectives = packet.disclosurePlan[phase] || [];
    const includeSecondaryThread = pressureProfile === "focused" && shouldIncludeSecondaryThread(phase, state.turnIndex);
    const secondaryThread = includeSecondaryThread
      ? pickLifeThread({
          threads: packet.lifeThreads.filter((t) => t !== activeThread),
          state,
          cooldown: Math.max(1, packet.antiRepeat.topicCooldownTurns - 1)
        })
      : null;

    const openingAvoid = state.recentOpenings
      .slice(-packet.antiRepeat.openingCooldownTurns)
      .map((s) => trimForPrompt(s, 72));
    const topicAvoid = state.recentTopics
      .slice(-packet.antiRepeat.topicCooldownTurns)
      .map((s) => trimForPrompt(s, 64));
    const phraseAvoid = state.recentNgrams
      .slice(-packet.antiRepeat.bannedRecentNgrams)
      .map((s) => trimForPrompt(s, 56));

    const longTermThreadLines = pressureProfile === "focused"
      ? [
          `- Preserve central conflict: ${packet.core.centralConflict}.`,
          `- Preserve contradiction: ${packet.core.contradiction}.`,
          `- Primary life thread (required, concrete): ${activeThread}.`
        ]
      : [
          `- Long-term life thread to keep in background: ${activeThread}.`,
          shouldSurfaceLongTermThread
            ? "- Mention the long-term thread in at most one short clause this turn."
            : "- Keep the long-term thread implicit this turn unless naturally needed.",
          `- Primary thread this turn (required, ordinary/everyday): ${ambientThread}.`
        ];

    const mustIncludeLine = pressureProfile === "focused"
      ? (
          packet.promptContract.mustInclude.length
            ? `- Must include this turn: ${packet.promptContract.mustInclude.join("; ")}.`
            : "- Must include this turn: one practical stake, one body cue, one concrete anchor."
        )
      : "- Must include this turn: one ordinary concrete detail and one small agency, ease, or pleasant cue.";

    const mustAvoidLine = pressureProfile === "focused"
      ? (
          packet.promptContract.mustAvoid.length
            ? `- Must avoid this turn: ${packet.promptContract.mustAvoid.join("; ")}.`
            : "- Must avoid this turn: direct whisper reply; life-summary exposition."
        )
      : "- Must avoid this turn: direct whisper reply; problem-only monologue; life-summary exposition.";

    const promptBlock = [
      `- Turn index in this scene for this character: ${turnNumber}.`,
      toneCadenceDirective,
      `- Character premise anchor: ${packet.core.premise}.`,
      ...longTermThreadLines,
      secondaryThread
        ? `- Optional secondary thread (at most one brief clause): ${secondaryThread}.`
        : "- No secondary thread this turn; stay with the primary thread.",
      pressureProfile === "focused"
        ? "- Hard cap: keep this thought to one dominant concern, with at most one brief secondary pivot."
        : "- Hard cap: keep this thought to one dominant thread; if long-term pressure appears, keep it brief and non-dominant.",
      "- Do not introduce a third concern thread in this thought.",
      pressureProfile === "focused"
        ? "- Associative range: stay grounded in immediate detail while tension remains plausible."
        : "- Associative range: allow mild randomness and everyday drift (travel, landscape, ordinary life observations).",
      `- Voice texture: ${packet.voiceRules.texture.join(", ")}.`,
      `- Syntax bias: ${packet.voiceRules.syntaxBias.join(", ")}.`,
      `- Taboo stylistic moves: ${packet.voiceRules.tabooMoves.join("; ")}.`,
      phaseDirectives.length
        ? `- Disclosure directives (${phase.toUpperCase()}): ${phaseDirectives.join(" | ")}.`
        : `- Disclosure directives (${phase.toUpperCase()}): keep incremental and allusive.`,
      mustIncludeLine,
      mustAvoidLine,
      openingAvoid.length
        ? `- Opening cooldown: do not reuse these recent openings: ${openingAvoid.join(" || ")}.`
        : "- Opening cooldown: use a fresh opening shape.",
      topicAvoid.length
        ? `- Topic cooldown: avoid centering these recently used topics: ${topicAvoid.join(", ")}.`
        : "- Topic cooldown: rotate primary concern across turns, not multiple concerns within one thought.",
      phraseAvoid.length
        ? `- Phrase suppression: avoid close variants of these recent fragments: ${phraseAvoid.join(" || ")}.`
        : "- Phrase suppression: keep noun/imagery set fresh."
    ].join("\n");

    return {
      promptBlock,
      selection: {
        packet,
        activeThread,
        secondaryThread
      }
    };
  }

  function normalizeCharacterPacket(character) {
    const packet = (character && typeof character.packet === "object" && character.packet) ? character.packet : {};
    const core = (packet.core && typeof packet.core === "object") ? packet.core : {};
    const voiceRules = (packet.voice_rules && typeof packet.voice_rules === "object") ? packet.voice_rules : {};
    const disclosurePlan = (packet.disclosure_plan && typeof packet.disclosure_plan === "object") ? packet.disclosure_plan : {};
    const antiRepeat = (packet.anti_repeat && typeof packet.anti_repeat === "object") ? packet.anti_repeat : {};
    const promptContract = (packet.prompt_contract && typeof packet.prompt_contract === "object") ? packet.prompt_contract : {};

    const fallbackPremise = trimForPrompt(character?.dossier || "A person under pressure in a shared public interior.", 120);
    const lifeThreads = uniqList(packet.life_threads || []).length
      ? uniqList(packet.life_threads || [])
      : [
          "immediate practical obligations",
          "relationship or social pressure",
          "money/admin constraints",
          "body-state management",
          "future identity uncertainty"
        ];

    const profileHint = String(packet.pressure_profile || packet.tone_profile || "").toLowerCase();
    const pressureProfile = getCharacterPressureProfile(character?.id, profileHint);

    return {
      core: {
        premise: String(core.premise || fallbackPremise),
        centralConflict: String(core.central_conflict || "conflicting obligations under uncertainty"),
        contradiction: String(core.contradiction || "wants stability but keeps drifting toward risk")
      },
      lifeThreads,
      recurringStakes: uniqList(packet.recurring_stakes || []),
      voiceRules: {
        texture: uniqList(voiceRules.texture || character?.voice || ["plainspoken"]).slice(0, 6),
        syntaxBias: uniqList(voiceRules.syntax_bias || ["concrete clauses", "occasional fragment"]).slice(0, 5),
        tabooMoves: uniqList(voiceRules.taboo_moves || ["direct whisper reply", "biography summary"]).slice(0, 5)
      },
      pressureProfile,
      disclosurePlan: {
        early: uniqList(disclosurePlan.early || []),
        middle: uniqList(disclosurePlan.middle || []),
        late: uniqList(disclosurePlan.late || [])
      },
      antiRepeat: {
        bannedRecentNgrams: Math.max(1, Number(antiRepeat.banned_recent_ngrams) || 3),
        topicCooldownTurns: Math.max(1, Number(antiRepeat.topic_cooldown_turns) || 2),
        openingCooldownTurns: Math.max(1, Number(antiRepeat.opening_cooldown_turns) || 3),
        motifRepeatLimitPer4Turns: Math.max(1, Number(antiRepeat.motif_repeat_limit_per_4_turns) || 2)
      },
      promptContract: {
        mustInclude: uniqList(promptContract.must_include || []),
        mustAvoid: uniqList(promptContract.must_avoid || [])
      }
    };
  }

  function pickLifeThread({ threads, state, cooldown }) {
    const pool = uniqList(threads || []).filter(Boolean);
    if (!pool.length) return "immediate practical obligation";

    const scored = pool.map((thread) => {
      const key = String(thread);
      const last = Number.isFinite(state.threadLastUsed[key]) ? state.threadLastUsed[key] : -999;
      const age = state.turnIndex - last;
      const penalty = age <= cooldown ? 2 : 0;
      const jitter = Math.random() * 0.25;
      return { thread: key, score: age - penalty + jitter };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].thread;
  }

  function pickAmbientThread({ scene, state, turnNumber }) {
    const sceneLabel = normalizeWhitespace(String(scene?.meta?.label || "")).toLowerCase();
    const sceneSpecific = sceneLabel.includes("train")
      ? [
          "window views, tracks, stations, and winter light",
          "the carriage rhythm and small passenger movements",
          "arrival logistics, platform timing, and simple next-step planning"
        ]
      : sceneLabel.includes("reading room") || sceneLabel.includes("library")
        ? [
            "page texture, shelf order, and room acoustics",
            "quiet human choreography across tables and aisles",
            "small reading rituals and attention resets"
          ]
        : [];

    const pool = uniqList(sceneSpecific.concat(OPEN_PROFILE_AMBIENT_THREADS));
    if (!pool.length) return "ordinary present-moment details";
    const idx = (Math.max(1, Number(turnNumber) || 1) + Math.max(0, Number(state?.turnIndex) || 0)) % pool.length;
    return pool[idx];
  }

  function shouldIncludeSecondaryThread(phase, turnIndex) {
    const p = String(phase || "").toLowerCase();
    const t = Math.max(0, Number(turnIndex) || 0);

    if (p === "middle") return t % 2 === 0; // about half of turns
    if (p === "late") return t % 3 === 1;   // occasional late-stage pivot
    return false; // early thoughts stay single-threaded
  }

  function updateApiNarrativeState({ sceneId, characterId, text, packetContext }) {
    const clean = normalizeWhitespace(String(text || ""));
    if (!sceneId || !characterId || !clean) return;

    const state = getApiCharacterState(sceneId, characterId);
    state.turnIndex += 1;

    const selection = (packetContext && packetContext.selection) ? packetContext.selection : null;
    if (selection) {
      if (selection.activeThread) {
        rememberRecent(state.recentTopics, selection.activeThread, 10);
        state.threadLastUsed[selection.activeThread] = state.turnIndex;
      }
      if (selection.secondaryThread) {
        rememberRecent(state.recentTopics, selection.secondaryThread, 10);
        state.threadLastUsed[selection.secondaryThread] = state.turnIndex;
      }
    }

    const opening = extractOpeningStem(clean);
    if (opening) rememberRecent(state.recentOpenings, opening, 10);

    for (const topic of extractTopicKeywords(clean, 5)) {
      rememberRecent(state.recentTopics, topic, 10);
    }
    for (const phrase of extractNgramPhrases(clean, 3, 12)) {
      rememberRecent(state.recentNgrams, phrase, 24);
    }
  }

  function rememberRecent(arr, value, limit) {
    const clean = normalizeWhitespace(String(value || ""));
    if (!clean) return;
    const idx = arr.findIndex((x) => x === clean);
    if (idx >= 0) arr.splice(idx, 1);
    arr.push(clean);
    while (arr.length > Math.max(1, Number(limit) || 1)) arr.shift();
  }

  function extractOpeningStem(text) {
    const first = splitClauses(text)[0] || "";
    const words = splitWords(first).slice(0, 8);
    return normalizeWhitespace(words.join(" ")).toLowerCase();
  }

  function extractTopicKeywords(text, limit = 4) {
    const stop = new Set([
      "about", "after", "again", "along", "around", "because", "before", "between", "could", "every", "their",
      "there", "these", "those", "through", "under", "where", "which", "while", "with", "would", "still",
      "this", "that", "from", "into", "over", "than", "only", "just", "very", "really", "have", "been", "were",
      "what", "when", "then", "them", "they", "feel", "feels", "felt", "like", "into", "onto", "your"
    ]);
    const counts = new Map();
    for (const tok of splitWords(text)) {
      const c = canonicalToken(tok);
      if (!c || c.length < 4 || stop.has(c)) continue;
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))
      .slice(0, Math.max(1, Number(limit) || 1))
      .map(([k]) => k);
  }

  function extractNgramPhrases(text, n = 3, limit = 8) {
    const size = Math.max(2, Number(n) || 3);
    const tokens = splitWords(text)
      .map((tok) => canonicalToken(tok))
      .filter((tok) => tok && tok.length >= 3);
    const seen = new Set();
    const out = [];
    for (let i = 0; i <= tokens.length - size; i++) {
      const phrase = tokens.slice(i, i + size).join(" ");
      if (!phrase || seen.has(phrase)) continue;
      seen.add(phrase);
      out.push(phrase);
      if (out.length >= Math.max(1, Number(limit) || 1)) break;
    }
    return out;
  }

  function uniqList(values) {
    const out = [];
    const seen = new Set();
    for (const v of (Array.isArray(values) ? values : [])) {
      const s = normalizeWhitespace(String(v || ""));
      if (!s) continue;
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  }

  function setApiKeyChecking(loading) {
    isApiKeyChecking = !!loading;
    ui.setApiKeyChecking(isApiKeyChecking);
  }

  function setApiKeyStatus(message, isError) {
    ui.setApiKeyStatus(message, isError);
  }

  async function validateApiKey(key) {
    try {
      const resp = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${key}`
        }
      });

      if (resp.ok) return true;

      if (resp.status === 401) {
        setApiKeyStatus("Invalid API key. Please check it and try again.", true);
        return false;
      }

      if (resp.status === 403) {
        setApiKeyStatus("Key recognized but lacks permission for this project.", true);
        return false;
      }

      setApiKeyStatus(`API check failed (${resp.status}). Try again.`, true);
      return false;
    } catch (_) {
      setApiKeyStatus("Could not validate key (network error). Try again.", true);
      return false;
    }
  }

  function getResponsesRequestTarget() {
    if (apiAccessMode === API_ACCESS_MODE.PROXY) {
      return {
        url: RUNTIME_ENDPOINTS.responses,
        headers: {
          "Content-Type": "application/json"
        }
      };
    }

    return {
      url: "https://api.openai.com/v1/responses",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userApiKey}`
      }
    };
  }

  // -----------------------------
  // OpenAI (Responses API) — single call returns {monologue, delta}
  //
  // CRITICAL FIX FOR YOUR 400:
  // `name` must be at text.format.name (NOT inside a json_schema wrapper).
  // -----------------------------
  async function generateFromOpenAI({
    characterId,
    channel,
    whisperText,
    kind,
    openingLead = "",
    openingLeadSource = "none",
    toneSteering = null,
    focusSteering = null
  }) {
    const sc = engine.getScene();
    const sceneId = engine.getSceneId();
    const ch = sc.characters.find(c => c.id === characterId);
    const whisperClean = String(whisperText || "").trim();
    const recentThoughts = engine.getRecentMonologues(characterId, 3);
    const priorMonologueCount = engine.getMonologueCount(characterId);
    const steering = toneSteering || buildToneSteering({
      characterId,
      kind,
      whisperText: whisperClean,
      priorMonologueCount
    });
    const toneSteeringBlock = buildToneSteeringBlock(steering);
    const focusPlan = focusSteering || buildFocusSteering({
      characterId,
      kind,
      whisperText: whisperClean,
      priorMonologueCount,
      scene: sc
    });
    const focusSteeringBlock = buildFocusSteeringBlock(focusPlan);
    const { sys, userPrompt, packetContext } = buildOpenAIUserPrompt({
      sc,
      ch,
      sceneId,
      whisperText: whisperClean,
      openingLead,
      openingLeadSource,
      recentThoughts,
      priorMonologueCount,
      toneSteeringBlock,
      focusSteeringBlock,
      thoughtWordMin: THOUGHT_WORD_MIN,
      thoughtWordMax: THOUGHT_WORD_MAX,
      dynamicsPromptLine: DYNAMICS.promptLine,
      dynamicsDeltaGuidance: DYNAMICS.deltaGuidance,
      psyche: engine.getPsyche(characterId),
      classifyWhisperTone,
      trimForPrompt,
      buildPacketPromptContext,
      normalizeWhitespace,
      uniqList
    });

    const requestPayload = {
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: sys },
        { role: "user", content: userPrompt }
      ],

      // ✅ Correct structured output shape for Responses:
      //    name is directly under format (text.format.name)
      text: {
        format: {
          type: "json_schema",
          name: "ripples_monologue",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["monologue", "delta"],
            properties: {
              monologue: { type: "string" },
              delta: {
                type: "object",
                additionalProperties: false,
                required: ["arousal", "valence", "agency", "permeability", "coherence"],
                properties: {
                  arousal: { type: "number" },
                  valence: { type: "number" },
                  agency: { type: "number" },
                  permeability: { type: "number" },
                  coherence: { type: "number" }
                }
              }
            }
          }
        }
      },

      max_output_tokens: 200
    };

    // Debug: inspect in DevTools
    window.__lastOpenAIRequest = requestPayload;
    console.log("[RIPPLES] sending request text.format", requestPayload?.text?.format);

    const requestTarget = getResponsesRequestTarget();
    const resp = await fetch(requestTarget.url, {
      method: "POST",
      headers: requestTarget.headers,
      body: JSON.stringify(requestPayload)
    });

    if (!resp.ok) {
      const errText = await safeReadText(resp);
      throw new Error(`OpenAI HTTP ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    window.__lastOpenAIResponse = data; // Debug: inspect raw response
    const payload = extractResponseJson(data);

    const monologue = postprocessMonologue(payload?.monologue);
    const delta = payload?.delta || null;

    updateApiNarrativeState({
      sceneId,
      characterId,
      text: monologue,
      packetContext
    });

    return { text: monologue, delta };
  }

  function extractResponseJson(data) {
    const candidates = [];

    try {
      const out = data && data.output;
      if (Array.isArray(out)) {
        for (const item of out) {
          const content = item && item.content;
          if (!Array.isArray(content)) continue;
          for (const part of content) {
            // Responses commonly use {type:"output_text", text:"..."}
            if (part && typeof part.text === "string" && part.text.trim()) {
              candidates.push(part.text.trim());
            }
          }
        }
      }
    } catch (_) {}

    if (typeof data?.output_text === "string" && data.output_text.trim()) {
      candidates.push(data.output_text.trim());
    }

    for (const s of candidates) {
      const txt = s.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      try {
        const obj = JSON.parse(txt);
        if (obj && typeof obj === "object") return obj;
      } catch (_) {}
    }

    return {
      monologue: "(No JSON returned.)",
      delta: { arousal: 0, valence: 0, agency: 0, permeability: 0, coherence: 0 }
    };
  }

  function postprocessMonologue(text) {
    return stripOuterQuotes(text);
  }

  function constrainThoughtText(text, opts = {}) {
    const minWords = Number.isFinite(opts.minWords) ? opts.minWords : THOUGHT_WORD_MIN;
    const maxWords = Number.isFinite(opts.maxWords) ? opts.maxWords : THOUGHT_WORD_MAX;
    const maxFirstPersonRatio = Number.isFinite(opts.maxFirstPersonRatio)
      ? opts.maxFirstPersonRatio
      : FIRST_PERSON_MAX_RATIO;
    const preferRandomWindow = !!opts.preferRandomWindow;

    const raw = normalizeWhitespace(stripOuterQuotes(text));
    if (!raw) return raw;

    let out = raw;
    if (preferRandomWindow) {
      out = pickRandomClauseWindow(out, minWords, maxWords);
    }

    out = reduceFirstPersonReferences(out, maxFirstPersonRatio, minWords);
    out = clampWordRange(out, { minWords, maxWords, fallback: raw });
    out = finalizeThoughtEnding(out, { minWords, maxWords, fallback: raw });
    return cleanSpacing(out);
  }

  function normalizeLeadFragment(fragment, maxWords, { keepHead = true } = {}) {
    let out = normalizeWhitespace(stripOuterQuotes(fragment))
      .replace(/^[`"'“”‘’\s]+/, "")
      .replace(/[`"'“”‘’\s]+$/, "")
      .replace(/[.!?…]+$/, "");
    if (!out) return "";

    const words = splitWords(out);
    const cap = Math.max(4, Number(maxWords) || CONTINUITY_LEAD_MAX_WORDS);
    if (wordCount(words) > cap) {
      out = keepHead
        ? words.slice(0, cap).join(" ")
        : words.slice(-cap).join(" ");
    } else {
      out = words.join(" ");
    }

    out = trimDanglingEnding(out, 0);
    return normalizeWhitespace(out);
  }

  function extractFirstSentenceOrFragment(text, maxWords = CONTINUITY_LEAD_MAX_WORDS) {
    const clean = normalizeWhitespace(stripOuterQuotes(text));
    if (!clean) return "";

    const pieces = clean
      .split(/(?<=[.!?])\s+/)
      .map((s) => normalizeWhitespace(s))
      .filter(Boolean);
    const candidate = pieces[0] || clean;

    let lead = normalizeLeadFragment(candidate, maxWords, { keepHead: true });
    if (wordCount(lead) < 2) {
      lead = normalizeLeadFragment(clean, maxWords, { keepHead: true });
    }
    return lead;
  }

  function extractLastSentenceOrFragment(text, maxWords = CONTINUITY_LEAD_MAX_WORDS) {
    const clean = normalizeWhitespace(stripOuterQuotes(text));
    if (!clean) return "";

    const pieces = clean
      .split(/(?<=[.!?])\s+/)
      .map((s) => normalizeWhitespace(s))
      .filter(Boolean);
    const candidate = pieces.length ? pieces[pieces.length - 1] : clean;

    let lead = normalizeLeadFragment(candidate, maxWords, { keepHead: false });
    if (wordCount(lead) < 2) {
      lead = normalizeLeadFragment(clean, maxWords, { keepHead: false });
    }
    return lead;
  }

  function canonicalizeForLeadMatch(text) {
    return normalizeWhitespace(text)
      .toLowerCase()
      .replace(/[’]/g, "'")
      .replace(/[^a-z0-9'\s]/g, "");
  }

  function startsWithApproxLead(text, lead) {
    const body = canonicalizeForLeadMatch(text);
    const seed = canonicalizeForLeadMatch(lead);
    if (!body || !seed) return false;
    if (body.startsWith(seed)) return true;

    const bodyTokens = body.split(" ").filter(Boolean);
    const seedTokens = seed.split(" ").filter(Boolean);
    const sample = Math.min(6, seedTokens.length, bodyTokens.length);
    if (sample < 3) return false;

    let exact = 0;
    for (let i = 0; i < sample; i++) {
      if (bodyTokens[i] === seedTokens[i]) exact += 1;
    }
    return exact >= Math.max(3, sample - 1);
  }

  function extractLeadAnchorTokens(lead, { maxTokens = 5 } = {}) {
    const seed = normalizeLeadFragment(lead, CONTINUITY_LEAD_MAX_WORDS, { keepHead: true });
    if (!seed) return [];
    const tokens = splitWords(seed);
    const out = [];

    function pushUnique(tok) {
      if (!tok || out.includes(tok)) return;
      out.push(tok);
    }

    for (const token of tokens) {
      const canon = canonicalToken(token);
      if (!canon) continue;
      if (canon.length <= 2) continue;
      if (CONTINUITY_STOPWORDS.has(canon)) continue;
      pushUnique(canon);
      if (out.length >= maxTokens) return out;
    }

    for (const token of tokens) {
      const canon = canonicalToken(token);
      if (!canon) continue;
      if (canon.length <= 1) continue;
      pushUnique(canon);
      if (out.length >= maxTokens) return out;
    }

    return out;
  }

  function hasAnchorOverlapAtOpening(text, anchors, { minHits = 2, windowWords = 20 } = {}) {
    const bodyTokens = splitWords(text)
      .map(canonicalToken)
      .filter(Boolean)
      .slice(0, Math.max(6, windowWords));
    if (!bodyTokens.length || !anchors.length) return false;

    let hits = 0;
    for (const anchor of anchors) {
      if (bodyTokens.includes(anchor)) hits += 1;
    }
    return hits >= Math.min(minHits, anchors.length);
  }

  function buildLeadRiffPrefix(lead) {
    const anchors = extractLeadAnchorTokens(lead, { maxTokens: 4 });
    if (!anchors.length) return "";
    const picked = anchors.slice(0, anchors.length >= 3 ? 3 : anchors.length);
    return picked
      .map((tok) => tok.replace(/^./, (m) => m.toUpperCase()))
      .join(". ");
  }

  function buildWhisperLeadRiffClause(lead) {
    const anchors = extractLeadAnchorTokens(lead, { maxTokens: 3 });
    if (anchors.length >= 2) {
      const a = anchors[0].replace(/^./, (m) => m.toUpperCase());
      const b = anchors[1];
      return `${a} shifts against ${b}`;
    }
    if (anchors.length === 1) {
      const a = anchors[0].replace(/^./, (m) => m.toUpperCase());
      return `${a} changes cadence`;
    }
    return "the cadence changes";
  }

  function dedupeWhisperLeadRepetition(text, lead, { minWords, maxWords }) {
    const base = normalizeWhitespace(stripOuterQuotes(text));
    const seed = normalizeLeadFragment(lead, CONTINUITY_LEAD_MAX_WORDS, { keepHead: true });
    if (!base || !seed) return base;

    const seedWords = splitWords(seed).filter(Boolean);
    if (seedWords.length < 2) return base;

    const pattern = seedWords
      .map((w) => escapeRegExp(w))
      .join("[\\s\\W_]+");
    const phraseRegex = new RegExp(pattern, "ig");
    const riffClause = buildWhisperLeadRiffClause(seed);

    let seen = 0;
    let replaced = false;
    let out = base.replace(phraseRegex, (match) => {
      seen += 1;
      if (seen === 1) return match;
      replaced = true;
      return riffClause;
    });
    if (!replaced) return base;

    out = cleanSpacing(out);
    out = truncateToWordCount(out, maxWords);
    if (wordCount(out) < minWords) {
      out = clampWordRange(out, {
        minWords,
        maxWords,
        fallback: `${out} ${riffClause}`.trim()
      });
    }
    out = trimDanglingEnding(out, minWords);
    out = ensureTerminalPunctuation(out);
    return cleanSpacing(out);
  }

  function enforceContinuityLead(text, lead, opts = {}) {
    const mode = opts.mode === "riff" ? "riff" : "literal";
    const base = normalizeWhitespace(stripOuterQuotes(text));
    const seed = normalizeLeadFragment(lead, CONTINUITY_LEAD_MAX_WORDS, { keepHead: true });
    if (!seed) return base;
    if (!base) {
      if (mode === "riff") return buildLeadRiffPrefix(seed) || seed;
      return seed;
    }

    if (mode === "literal") {
      if (startsWithApproxLead(base, seed)) return base;
      return normalizeWhitespace(`${seed}. ${base}`);
    }

    const anchors = extractLeadAnchorTokens(seed, { maxTokens: 5 });
    if (hasAnchorOverlapAtOpening(base, anchors, { minHits: 2, windowWords: 20 })) return base;

    const riffPrefix = buildLeadRiffPrefix(seed);
    if (!riffPrefix) return base;
    return normalizeWhitespace(`${riffPrefix}. ${base}`);
  }

  function finalizeWithContinuityLead(text, lead, { minWords, maxWords, mode = "literal" }) {
    const seed = normalizeLeadFragment(lead, CONTINUITY_LEAD_MAX_WORDS, { keepHead: true });
    const fallbackSeed = mode === "riff"
      ? normalizeWhitespace(buildLeadRiffPrefix(seed).replace(/[.]/g, " "))
      : seed;
    let out = enforceContinuityLead(text, seed, { mode });
    if (!out) return out;

    out = truncateToWordCount(out, maxWords);
    if (wordCount(out) < minWords) {
      out = clampWordRange(out, {
        minWords,
        maxWords,
        fallback: `${fallbackSeed || seed} ${out}`.trim()
      });
    }
    out = trimDanglingEnding(out, minWords);
    out = ensureTerminalPunctuation(out);
    return cleanSpacing(out);
  }

  function hasAnchorInText(text, anchors) {
    const tokens = splitWords(text).map(canonicalToken).filter(Boolean);
    if (!tokens.length || !anchors.length) return false;
    return anchors.some((a) => tokens.includes(a));
  }

  function formatAnchorClause(anchor, flavor = "middle") {
    const clean = String(anchor || "").replace(/^./, (m) => m.toUpperCase());
    if (!clean) return "";
    if (flavor === "tail") return `${clean} stays in the frame.`;
    return `${clean} keeps returning.`;
  }

  function enforceCarryoverRiffPersistence(text, lead, { minWords, maxWords }) {
    let out = normalizeWhitespace(stripOuterQuotes(text));
    if (!out) return out;

    const anchors = extractLeadAnchorTokens(lead, { maxTokens: 5 });
    if (!anchors.length) return out;

    const clauses = splitClauses(out);
    if (!clauses.length) return out;

    if (clauses.length >= 3) {
      const middleIdx = Math.floor(clauses.length / 2);
      if (!hasAnchorInText(clauses[middleIdx], anchors)) {
        const midAnchor = anchors[0];
        const add = formatAnchorClause(midAnchor, "middle");
        if (add) clauses.splice(middleIdx + 1, 0, add);
      }
    }

    const tailIdx = clauses.length - 1;
    if (!hasAnchorInText(clauses[tailIdx], anchors)) {
      const tailAnchor = anchors[Math.min(1, anchors.length - 1)] || anchors[0];
      const add = formatAnchorClause(tailAnchor, "tail");
      if (add) clauses.push(add);
    }

    out = normalizeWhitespace(clauses.join(" "));
    out = truncateToWordCount(out, maxWords);
    if (wordCount(out) < minWords) {
      out = clampWordRange(out, {
        minWords,
        maxWords,
        fallback: `${out} ${formatAnchorClause(anchors[0], "tail")}`.trim()
      });
    }
    out = trimDanglingEnding(out, minWords);
    out = ensureTerminalPunctuation(out);
    return cleanSpacing(out);
  }

  function isFirstPersonToken(token) {
    const t = canonicalToken(token);
    return (
      t === "i" || t === "me" || t === "my" || t === "mine" || t === "myself" ||
      t === "i'm" || t === "ive" || t === "i've" || t === "id" || t === "i'd" ||
      t === "ill" || t === "i'll" || t === "im"
    );
  }

  function firstPersonRatio(words) {
    const tokens = Array.isArray(words) ? words : splitWords(words);
    const total = wordCount(tokens);
    if (!total) return 0;
    const fp = tokens.filter(isFirstPersonToken).length;
    return fp / total;
  }

  function reduceFirstPersonReferences(text, maxRatio, minWords) {
    let out = normalizeWhitespace(text)
      .replace(/\bI am\b/gi, "feeling")
      .replace(/\bI'm\b/gi, "feeling")
      .replace(/\bI keep\b/gi, "keep")
      .replace(/\bI was\b/gi, "was")
      .replace(/\bI have\b/gi, "have")
      .replace(/\bI've\b/gi, "have")
      .replace(/\bmy\b/gi, "the")
      .replace(/\bmine\b/gi, "that")
      .replace(/\bmyself\b/gi, "this body");

    let words = splitWords(out);
    for (let i = 0; i < words.length && firstPersonRatio(words) > maxRatio; i++) {
      if (!isFirstPersonToken(words[i])) continue;
      if (wordCount(words) <= minWords) break;
      words.splice(i, 1);
      i -= 1;
    }

    return normalizeWhitespace(words.join(" "));
  }

  function pickRandomClauseWindow(text, minWords, maxWords) {
    const clauses = splitClauses(text);
    if (!clauses.length) return normalizeWhitespace(text);
    if (clauses.length === 1) return truncateToWordCount(clauses[0], maxWords);

    const target = randInt(minWords, maxWords);
    let best = clauses[Math.floor(Math.random() * clauses.length)];
    let bestScore = Number.POSITIVE_INFINITY;

    for (let attempt = 0; attempt < 12; attempt++) {
      const start = randInt(0, clauses.length - 1);
      let cand = clauses[start];
      let i = start + 1;

      while (i < clauses.length && wordCount(cand) < target) {
        cand = `${cand} ${clauses[i]}`;
        i += 1;
      }

      cand = truncateToWordCount(cand, maxWords);
      const wc = wordCount(cand);
      const score =
        wc >= minWords && wc <= maxWords
          ? Math.abs(target - wc)
          : Math.min(Math.abs(wc - minWords), Math.abs(wc - maxWords)) + 100;

      if (score < bestScore) {
        bestScore = score;
        best = cand;
      }
    }

    return normalizeWhitespace(best);
  }

  function pickRandomWordWindow(text, minWords, maxWords) {
    const words = splitWords(text);
    const total = wordCount(words);
    if (total <= maxWords) return normalizeWhitespace(text);

    const span = randInt(minWords, maxWords);
    const maxStart = Math.max(0, words.length - span);
    const start = randInt(0, maxStart);
    return normalizeWhitespace(words.slice(start, start + span).join(" "));
  }

  function finalizeThoughtEnding(text, { minWords, maxWords, fallback }) {
    let out = trimDanglingEnding(text, minWords);

    if (wordCount(out) < minWords) {
      out = clampWordRange(out, { minWords, maxWords, fallback });
      out = trimDanglingEnding(out, minWords);
    }

    out = truncateToWordCount(out, maxWords);
    out = trimDanglingEnding(out, minWords);
    out = ensureTerminalPunctuation(out);
    return out;
  }

  function countLexHits(text, lexemes) {
    const t = normalizeWhitespace(text).toLowerCase();
    if (!t) return 0;
    let hits = 0;
    for (const raw of (Array.isArray(lexemes) ? lexemes : [])) {
      const token = normalizeWhitespace(raw).toLowerCase();
      if (!token) continue;
      const pattern = token.includes(" ")
        ? escapeRegExp(token)
        : `\\b${escapeRegExp(token)}\\b`;
      if (new RegExp(pattern, "i").test(t)) hits += 1;
    }
    return hits;
  }

  function thoughtToneScore(text) {
    const positiveLex = [
      "steady", "relief", "possible", "manage", "manageable", "prepared", "calm",
      "clear", "clearer", "useful", "warm", "kind", "trust", "hope", "shelter",
      "anchored", "grounded", "decent", "support", "soften", "ease"
    ];
    const negativeLex = [
      "panic", "fear", "threat", "danger", "collapse", "ruin", "ruined", "unsafe",
      "hopeless", "alone", "grief", "failure", "forgery", "shame", "dread", "empty",
      "no one", "nothing", "trapped", "catastrophe", "cruelty"
    ];

    const posHits = countLexHits(text, positiveLex);
    const negHits = countLexHits(text, negativeLex);
    return posHits - negHits;
  }

  function classifyThoughtTone(text) {
    const score = thoughtToneScore(text);
    if (score <= -2) return "dark";
    if (score >= 2) return "hopeful";
    return "neutral";
  }

  function openingSignature(text, size = 5) {
    return splitWords(text)
      .slice(0, Math.max(1, Number(size) || 5))
      .map(canonicalToken)
      .filter(Boolean)
      .join(" ");
  }

  function pickToneLift(pool, turnIndex = 0) {
    const list = Array.isArray(pool) ? pool.filter(Boolean) : [];
    if (!list.length) return "";
    const idx = Math.abs(Number(turnIndex) || 0) % list.length;
    return list[idx];
  }

  function buildToneSteering({ characterId, kind, whisperText, priorMonologueCount }) {
    const turnIndex = Math.max(1, (Number(priorMonologueCount) || 0) + 1);
    const recent = engine.getRecentMonologues(characterId, Math.max(1, TONE_BALANCER.windowSize - 1));
    const tones = recent.map((entry) => classifyThoughtTone(entry.text));
    const darkCount = tones.filter((t) => t === "dark").length;
    const nonDarkCount = tones.length - darkCount;
    const pressureProfile = getCharacterPressureProfile(characterId);
    const projectedCount = Math.min(TONE_BALANCER.windowSize, tones.length + 1);
    const minNonDarkRatio = pressureProfile === "focused"
      ? TONE_BALANCER.minNonDarkRatio
      : 0.75;
    const minNonDarkNeeded = Math.ceil(projectedCount * minNonDarkRatio);
    const requireNonDark = nonDarkCount < minNonDarkNeeded;
    const whisperTone = classifyWhisperTone(whisperText).tone;

    let target = "neutral";
    if (requireNonDark) {
      target = "non_dark_required";
    } else if (pressureProfile === "open") {
      if (kind === EVENT_KIND.WHISPER && whisperTone === "threat") {
        target = "steady";
      } else if (whisperTone === "calm" || whisperTone === "tender" || turnIndex % 2 === 0) {
        target = "gently_hopeful";
      }
    } else if (whisperTone === "calm" || whisperTone === "tender" || (turnIndex % 3 === 0 && whisperTone !== "threat")) {
      target = "gently_hopeful";
    } else if (kind === EVENT_KIND.WHISPER && whisperTone === "threat") {
      target = "steady";
    }

    const lenses = TONE_BALANCER.variationLenses;
    const lens = lenses[(turnIndex - 1) % lenses.length] || lenses[0] || null;

    return {
      turnIndex,
      profile: pressureProfile,
      target,
      lens,
      darkCount,
      nonDarkCount,
      sampleCount: tones.length,
      recentOpenings: recent.map((entry) => openingSignature(entry.text)).filter(Boolean)
    };
  }

  function buildToneSteeringBlock(steering) {
    if (!steering) return "- Tone steering unavailable.";

    const openProfile = steering.profile === "open";
    const targetLine = steering.target === "non_dark_required"
      ? "- This turn MUST land neutral-to-gently-hopeful (not dark). Include one concrete stabilizing action or relief cue."
      : steering.target === "gently_hopeful"
        ? "- This turn should read gently hopeful overall; include one feasible good-outcome signal."
        : steering.target === "steady"
          ? "- This turn may hold pressure, but must stay steady (no doom spiral). Include one concrete agency cue."
          : openProfile
            ? "- This turn should feel natural and mostly neutral-to-pleasant, with ordinary observations and at least one concrete anchor of agency."
            : "- This turn should be neutral/varied with at least one concrete anchor of agency.";

    const lensLine = steering.lens
      ? `- Variation lens: ${steering.lens.instruction}`
      : "- Variation lens: use a fresh opening angle.";

    return [
      targetLine,
      lensLine,
      "- End on a workable next step, steadier interpretation, or small relief.",
      `- Recent tone mix (last ${steering.sampleCount}): non-dark ${steering.nonDarkCount}, dark ${steering.darkCount}.`
    ].join("\n");
  }

  function enforceToneSteering(text, steering) {
    let out = normalizeWhitespace(text);
    if (!out || !steering) return out;

    const opening = openingSignature(out);
    if (opening && steering.recentOpenings.includes(opening) && steering.lens?.opener) {
      out = `${steering.lens.opener} ${out}`;
    }

    const tone = classifyThoughtTone(out);
    if (steering.target === "non_dark_required" && tone === "dark") {
      const lift = pickToneLift(TONE_BALANCER.steadyLifts, steering.turnIndex);
      if (lift) out = `${out} ${lift}`;
    } else if (steering.target === "gently_hopeful" && tone !== "hopeful") {
      const lift = pickToneLift(TONE_BALANCER.hopefulLifts, steering.turnIndex + 1);
      if (lift) out = `${out} ${lift}`;
    } else if (steering.target === "steady" && tone === "dark") {
      const lift = pickToneLift(TONE_BALANCER.steadyLifts, steering.turnIndex + 2);
      if (lift) out = `${out} ${lift}`;
    }

    return normalizeWhitespace(out);
  }

  function simplifyLanguage(text) {
    let out = normalizeWhitespace(text);
    if (!out) return out;

    for (const [from, to] of Object.entries(ATTENTION_BALANCER.simpleWordReplacements)) {
      out = out.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi"), to);
    }

    out = out
      .replace(/\bI think\b/gi, "")
      .replace(/\bI feel\b/gi, "")
      .replace(/\bit feels like\b/gi, "it seems")
      .replace(/\bthere is\b/gi, "there's")
      .replace(/\bthere are\b/gi, "there are");

    return cleanSpacing(out);
  }

  function classifyAttentionFocus(text) {
    const t = normalizeWhitespace(text);
    if (!t) return "mixed";

    const words = splitWords(t);
    const fp = firstPersonRatio(words);
    const selfHits = countLexHits(t, ATTENTION_BALANCER.selfCueWords);
    const worldHits = countLexHits(t, ATTENTION_BALANCER.worldCueWords);

    if (worldHits >= 2 && fp <= 0.12) return "world";
    if ((fp >= 0.16 || selfHits >= 3) && worldHits <= 1) return "self";
    return "mixed";
  }

  function hasConcreteWorldCue(text) {
    const t = normalizeWhitespace(text);
    if (!t) return false;
    const worldHits = countLexHits(t, ATTENTION_BALANCER.worldCueWords);
    return worldHits >= 1;
  }

  function sceneAnchors(scene = null) {
    return ATTENTION_BALANCER.sceneFallbackAnchors.slice();
  }

  function buildFocusSteering({ characterId, kind, whisperText, priorMonologueCount, scene }) {
    const turnIndex = Math.max(1, (Number(priorMonologueCount) || 0) + 1);
    const recent = engine.getRecentMonologues(characterId, Math.max(1, ATTENTION_BALANCER.windowSize - 1));
    const focusMix = recent.map((entry) => classifyAttentionFocus(entry.text));
    const selfCount = focusMix.filter((f) => f === "self").length;
    const requireWorld = selfCount >= ATTENTION_BALANCER.maxSelfFocusedInWindow || (turnIndex % 2 === 0);
    const anchors = sceneAnchors(scene);
    const anchor = anchors.length ? anchors[(turnIndex - 1) % anchors.length] : ATTENTION_BALANCER.sceneFallbackAnchors[0];
    const whisperTone = classifyWhisperTone(whisperText).tone;

    return {
      turnIndex,
      requireWorld,
      keepSimple: true,
      maxFirstPersonRatio: requireWorld ? 0.10 : 0.14,
      anchor,
      whisperTone,
      selfCount,
      sampleCount: focusMix.length
    };
  }

  function buildFocusSteeringBlock(plan) {
    if (!plan) return "- Focus steering unavailable.";

    const worldLine = plan.requireWorld
      ? "- This turn MUST start from the outside world: one object/sound/other person in the room before inner commentary."
      : "- This turn should include at least one concrete room detail before self-analysis.";

    return [
      worldLine,
      "- Keep language plain and simple. Prefer short sentences over layered abstraction.",
      `- Keep first-person usage low (target <=${Math.round(plan.maxFirstPersonRatio * 100)}%).`,
      `- Suggested world anchor for this turn: ${plan.anchor}`,
      `- Recent self-focused count (last ${plan.sampleCount}): ${plan.selfCount}.`
    ].join("\n");
  }

  function enforceFocusSteering(text, plan) {
    let out = normalizeWhitespace(text);
    if (!out || !plan) return out;

    if (plan.requireWorld && !hasConcreteWorldCue(out)) {
      out = `${plan.anchor} ${out}`;
    }

    out = simplifyLanguage(out);
    out = reduceFirstPersonReferences(out, plan.maxFirstPersonRatio, THOUGHT_WORD_MIN);
    return normalizeWhitespace(out);
  }


  function classifyWhisperTone(whisperText) {
    const t = normalizeWhitespace(whisperText).toLowerCase();
    if (!t) return { tone: "neutral", repeated: false };

    const calm = /(relax|calm|breathe|breath|soft|gentle|steady|slow|ease|quiet)/.test(t);
    const threat = /(danger|fear|panic|dead|die|dark|unsafe|hurt|blood|loss|alone)/.test(t);
    const urgent = /(now|hurry|must|never|stop|run|quick|urgent)/.test(t);
    const tender = /(forgive|love|warm|home|kind|hold|safe|tender)/.test(t);

    const tokens = t.split(/\s+/).filter(Boolean);
    const counts = new Map();
    let maxFreq = 0;
    for (const tok of tokens) {
      const k = tok.replace(/[^a-z0-9']/g, "");
      if (!k) continue;
      const n = (counts.get(k) || 0) + 1;
      counts.set(k, n);
      if (n > maxFreq) maxFreq = n;
    }
    const repeated = maxFreq >= 3;

    if (calm) return { tone: "calm", repeated };
    if (urgent) return { tone: "urgent", repeated };
    if (threat) return { tone: "threat", repeated };
    if (tender) return { tone: "tender", repeated };
    return { tone: "neutral", repeated };
  }

  function hasWhisperBendCue(text) {
    const t = normalizeWhitespace(text).toLowerCase();
    if (!t) return false;
    return /\b(breath|pulse|jaw|shoulders|chest|nerves|skin|heartbeat|pressure|cadence|rhythm|echo)\b/.test(t);
  }

  function hasToneSpecificWhisperBend(text, whisperText) {
    const t = normalizeWhitespace(text).toLowerCase();
    if (!t) return false;

    const { tone, repeated } = classifyWhisperTone(whisperText);
    const hasBody = /\b(breath|pulse|jaw|shoulders|chest|nerves|skin|heartbeat|muscle|tension|hands)\b/.test(t);
    const hasRhythm = /\b(cadence|rhythm|echo|repetition|repeated|again)\b/.test(t);

    if (tone === "calm") {
      const hasCalmLex = /\b(calm|steady|slower|slow|ease|unclench|soften|soothe|settle)\b/.test(t);
      return hasCalmLex && (hasBody || hasRhythm);
    }
    if (tone === "urgent") {
      const hasUrgentLex = /\b(urgent|hurry|rush|faster|compress|tighten|narrow|timing)\b/.test(t);
      return hasUrgentLex && hasBody;
    }
    if (tone === "threat") {
      const hasThreatLex = /\b(risk|danger|threat|exit|scan|vigilance|unsafe|protect)\b/.test(t);
      return hasThreatLex && (hasBody || /\b(door|aisle|window|route)\b/.test(t));
    }
    if (tone === "tender") {
      const hasTenderLex = /\b(soft|tender|warm|gentle|forgive|kind|loosen)\b/.test(t);
      return hasTenderLex && (hasBody || /\b(memory|remember)\b/.test(t));
    }

    if (repeated) return hasRhythm;
    return hasWhisperBendCue(t);
  }

  function buildWhisperCue(whisperText, psyche = null) {
    const { tone, repeated } = classifyWhisperTone(whisperText);
    const highArousal = Number(psyche?.arousal || 0) > 0.62;

    if (tone === "calm") {
      if (repeated) return highArousal
        ? "Repetition taps the ribs; breath counts, then stutters"
        : "A repeated calming cadence lands; breath slows by increments";
      return highArousal
        ? "Breath is counted on purpose; shoulders try to drop"
        : "A calmer register settles in; jaw unclenches a little";
    }

    if (tone === "urgent") {
      return "Timing compresses; pulse and planning speed up together";
    }

    if (tone === "threat") {
      return "Nerves spike; exits and consequences sharpen at once";
    }

    if (tone === "tender") {
      return "A softer pressure arrives; old grief loosens slightly";
    }

    return repeated
      ? "The repeated phrase keeps knocking against attention"
      : "The phrase lingers as background pressure under thought";
  }

  function enforceWhisperBend(text, whisperText, psyche = null, opts = {}) {
    const base = normalizeWhitespace(text);
    const whisper = normalizeWhitespace(whisperText);
    const strict = !!opts.strict;
    if (!base || !whisper) return base;
    if (strict) {
      if (hasToneSpecificWhisperBend(base, whisper)) return base;
    } else if (hasWhisperBendCue(base)) {
      return base;
    }

    const cue = buildWhisperCue(whisper, psyche);
    return normalizeWhitespace(`${cue}. ${base}`);
  }

  async function safeReadText(resp) {
    try { return await resp.text(); } catch (_) { return ""; }
  }

  // -----------------------------
  // Start
  // -----------------------------
  init();

})();
