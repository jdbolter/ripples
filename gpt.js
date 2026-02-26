/* gpt.js
   RIPPLES — End-User Interface (2-column layout)

   Interaction model:
   - Click a character => opens photo + immediately produces a monologue (DEFAULT channel)
   - Whisper text + click Whisper => re-generates monologue; whisper causes visible ripple
   - Traces log records both "LISTEN" and "WHISPER" events + psyche snapshot per trace
   - API mode: a SINGLE OpenAI call returns BOTH monologue + psyche delta (semantic)
   - Local mode: deterministic monologue rotation + heuristic delta

   Depends on: scenes.js providing window.SCENES and window.SCENE_ORDER
   Requires index.html elements:
     #scenarioSelect, #grid, #linkLayer, #worldtext, #auditLog, #selectedPill
     #focusOverlay, #focusImage, #focusMessage
     #whisperInput, #whisperSend
     #apiModal, #apiKeyInput, #apiSubmit, #apiSkip
*/

(() => {
  "use strict";

  // Build marker (helps confirm browser is loading this exact file)
  const __RIPPLES_BUILD__ = "2026-02-26-tone-balance-variation";
  console.log("[RIPPLES] gpt.js loaded", __RIPPLES_BUILD__);

  if (!window.SCENES || !window.SCENE_ORDER) {
    throw new Error("Missing SCENES/SCENE_ORDER. Ensure scenes.js is loaded before gpt.js.");
  }

  // Single implicit channel for now
  const DEFAULT_CHANNEL = "THOUGHTS";
  const EVENT_KIND = { LISTEN: "LISTEN", WHISPER: "WHISPER" };
  const THOUGHT_WORD_MIN = 20;
  const THOUGHT_WORD_MAX = 40;
  const FIRST_PERSON_MAX_RATIO = 0.20;
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

  // OpenAI (client-side key entry)
  let userApiKey = null;
  let isGenerating = false;
  const apiNarrativeState = {};
  let autoThoughtTimer = null;

  // -----------------------------
  // DOM
  // -----------------------------
  const elScenarioSelect = byId("scenarioSelect");
  const elGrid = byId("grid");
  const elLinks = byId("linkLayer");
  const elWorldtext = byId("worldtext");
  const elAuditLog = byId("auditLog");
  const elSelectedPill = byId("selectedPill");

  // Whisper UI
  const elWhisperInput = byId("whisperInput");
  const btnWhisperSend = byId("whisperSend");

  // Focus overlay
  const elFocusOverlay = byId("focusOverlay");
  const elFocusImage = byId("focusImage");
  const elFocusMessage = byId("focusMessage");

  // API Key Modal
  const elApiModal = byId("apiModal");
  const elApiKeyInput = byId("apiKeyInput");
  const elApiKeyStatus = byId("apiKeyStatus");
  const btnApiSubmit = byId("apiSubmit");
  const btnApiSkip = byId("apiSkip");
  let isApiKeyChecking = false;

  // -----------------------------
  // ENGINE (scene state + rotation + psyche)
  // -----------------------------
  const engine = (() => {
    let sceneId = window.SCENE_ORDER[0]?.id || Object.keys(window.SCENES)[0];
    let tick = 0;
    let selectedId = null;

    // pool memory per character/channel
    const cursor = {}; // cursor[characterId][channel] = lastIndexUsed
    const cursorRecent = {}; // cursorRecent[characterId][channel] = [recentIndices...]

    // Whisper memory (for later prompts)
    const lastWhisper = {}; // lastWhisper[characterId] = string
    const whisperHistory = []; // {tick, characterId, text, time}

    // Psychic state (persistent per character, per scene)
    // Values are normalized to [0, 1]
    const psyche = {}; // psyche[characterId] = { arousal, valence, agency, permeability, coherence }

    function initPsycheForScene() {
      const sc = getScene();
      for (const ch of (sc.characters || [])) {
        const p0 = upgradeLegacyPsyche(ch.psyche0 || {});
        psyche[ch.id] = normalizePsyche(p0);
      }
    }

    function getPsyche(id) {
      const p = psyche[id];
      if (!p) return defaultPsyche();
      return {
        arousal: p.arousal,
        valence: p.valence,
        agency: p.agency,
        permeability: p.permeability,
        coherence: p.coherence
      };
    }

    function applyRipple({ sourceId, kind, whisperText, deltaOverride = null }) {
      const sc = getScene();
      const src = sc.characters.find(c => c.id === sourceId);
      if (!src) return;

      // Ensure psyche exists
      if (!psyche[sourceId]) initPsycheForScene();

      // Compute delta for source (override wins)
      const delta =
        (deltaOverride && typeof deltaOverride === "object")
          ? sanitizeDelta(deltaOverride)
          : computeDelta(kind, whisperText);

      applyDeltaTo(sourceId, delta, 1.0);

      // Diffuse to adjacency list only (measurable but contained)
      const nbs = (src.adjacentTo || []).slice();
      for (const nbId of nbs) {
        applyDeltaTo(nbId, delta, DYNAMICS.neighborScale);
      }

      // Global settling depends on active dynamics mode.
      for (const ch of (sc.characters || [])) {
        if (!psyche[ch.id]) continue;
        psyche[ch.id].arousal = clamp01(psyche[ch.id].arousal + DYNAMICS.stabilization.arousal);
        psyche[ch.id].coherence = clamp01(psyche[ch.id].coherence + DYNAMICS.stabilization.coherence);
      }
    }

    function computeDelta(kind, whisperText) {
      let arousal = 0;
      let valence = 0;
      let agency = 0;
      let permeability = 0;
      let coherence = 0;

      if (kind === EVENT_KIND.WHISPER) {
        arousal += DYNAMICS.whisperBase.arousal;
        permeability += DYNAMICS.whisperBase.permeability;
        coherence += DYNAMICS.whisperBase.coherence;

        // Lightweight heuristic (LOCAL MODE / fallback only)
        const w = String(whisperText || "").toLowerCase();

        const neg = [
          "fear","danger","blood","die","dead","dark","cold","threat","loss","gone","alone","unsafe","panic",
          "sad","sorrow","grief","cry","tears","depressed","depress","misery","hopeless","lonely"
        ];
        const pos = [
          "warm","light","forgive","tender","safe","home","quiet","kind","hold","soft",
          "happy","joy","joyful","smile","glad","delight","hope","bright"
        ];

        if (neg.some(k => w.includes(k))) {
          arousal += 0.10;
          valence -= 0.12;
          agency -= 0.07;
          coherence -= 0.05;
        }
        if (pos.some(k => w.includes(k))) {
          arousal -= 0.05;
          valence += 0.10;
          agency += 0.06;
          permeability += 0.03;
          coherence += 0.04;
        }

        const urgent = ["now", "hurry", "must", "never", "don't", "dont", "stop", "run"];
        if (urgent.some(k => w.includes(k))) {
          arousal += 0.06;
          agency -= 0.04;
        }

        const exclamations = (w.match(/!/g) || []).length;
        if (exclamations > 0) {
          arousal += Math.min(0.06, exclamations * 0.02);
          coherence -= Math.min(0.04, exclamations * 0.015);
        }

        if (w && w.length < 18) {
          arousal += 0.05;
          coherence -= 0.02;
        }
      } else {
        // LISTEN recenters state based on active mode.
        arousal += DYNAMICS.listenBase.arousal;
        valence += DYNAMICS.listenBase.valence;
        agency += DYNAMICS.listenBase.agency;
        permeability += DYNAMICS.listenBase.permeability;
        coherence += DYNAMICS.listenBase.coherence;
      }

      return { arousal, valence, agency, permeability, coherence };
    }

    // IMPORTANT: Coerce numeric strings from the model ("0.06") into real numbers.
    function sanitizeDelta(d) {
      const dd = mapLegacyDeltaShape(d);
      return {
        arousal: clampDelta("arousal", numCoerce(dd?.arousal, 0)),
        valence: clampDelta("valence", numCoerce(dd?.valence, 0)),
        agency: clampDelta("agency", numCoerce(dd?.agency, 0)),
        permeability: clampDelta("permeability", numCoerce(dd?.permeability, 0)),
        coherence: clampDelta("coherence", numCoerce(dd?.coherence, 0))
      };
    }
    function clampDelta(axis, x) {
      const limits = {
        arousal: 0.15,
        valence: 0.12,
        agency: 0.10,
        permeability: 0.15,
        coherence: 0.10
      };
      const lim = limits[axis] || 0.12;
      return Math.max(-lim, Math.min(lim, x));
    }

    function applyDeltaTo(id, delta, scale) {
      if (!psyche[id]) return;

      psyche[id].arousal = clamp01(psyche[id].arousal + delta.arousal * axisScale(scale, "arousal"));
      psyche[id].valence = clamp01(psyche[id].valence + delta.valence * axisScale(scale, "valence"));
      psyche[id].agency = clamp01(psyche[id].agency + delta.agency * axisScale(scale, "agency"));
      psyche[id].permeability = clamp01(psyche[id].permeability + delta.permeability * axisScale(scale, "permeability"));
      psyche[id].coherence = clamp01(psyche[id].coherence + delta.coherence * axisScale(scale, "coherence"));

      // Cross-coupling keeps dynamics plausible while preserving immediacy.
      psyche[id].coherence = clamp01(psyche[id].coherence - 0.015 * psyche[id].arousal + 0.010 * psyche[id].agency);
      psyche[id].agency = clamp01(psyche[id].agency - 0.010 * psyche[id].arousal + 0.006 * psyche[id].coherence);
      psyche[id].valence = clamp01(psyche[id].valence + 0.008 * (psyche[id].coherence - 0.5));
    }

    function axisScale(scale, axis) {
      if (typeof scale === "number") return scale;
      if (scale && typeof scale === "object") return numOr(scale[axis], 1);
      return 1;
    }

    function defaultPsyche() {
      return {
        arousal: 0.35,
        valence: 0.55,
        agency: 0.55,
        permeability: 0.40,
        coherence: 0.55
      };
    }

    function normalizePsyche(p) {
      return {
        arousal: clamp01(numOr(p.arousal, 0.35)),
        valence: clamp01(numOr(p.valence, 0.55)),
        agency: clamp01(numOr(p.agency, 0.55)),
        permeability: clamp01(numOr(p.permeability, 0.40)),
        coherence: clamp01(numOr(p.coherence, 0.55))
      };
    }

    function upgradeLegacyPsyche(p0) {
      const hasNewShape =
        p0 && typeof p0 === "object" &&
        ["arousal", "valence", "agency", "permeability", "coherence"].every((k) => k in p0);
      if (hasNewShape) return p0;

      const tension = clamp01(numOr(p0?.tension, 0.35));
      const clarity = clamp01(numOr(p0?.clarity, 0.55));
      const openness = clamp01(numOr(p0?.openness, 0.40));
      const drift = clamp01(numOr(p0?.drift, 0.45));

      return {
        arousal: tension,
        permeability: openness,
        coherence: clamp01(0.65 * clarity + 0.35 * (1 - drift)),
        agency: clamp01(0.55 * clarity + 0.45 * (1 - tension)),
        valence: clamp01(0.5 + 0.35 * (clarity - 0.5) - 0.45 * (tension - 0.5) - 0.2 * (drift - 0.5))
      };
    }

    function mapLegacyDeltaShape(d) {
      const hasNew = d && typeof d === "object" &&
        ["arousal", "valence", "agency", "permeability", "coherence"].some((k) => k in d);
      if (hasNew) return d || {};

      const hasLegacy = d && typeof d === "object" &&
        ["tension", "clarity", "openness", "drift"].some((k) => k in d);
      if (!hasLegacy) return d || {};

      const tension = numCoerce(d.tension, 0);
      const clarity = numCoerce(d.clarity, 0);
      const openness = numCoerce(d.openness, 0);
      const drift = numCoerce(d.drift, 0);

      return {
        arousal: tension,
        permeability: openness,
        coherence: 0.65 * clarity - 0.35 * drift,
        agency: 0.55 * clarity - 0.45 * tension,
        valence: 0.35 * clarity - 0.45 * tension - 0.2 * drift
      };
    }

    function clamp01(x) { return Math.max(0, Math.min(1, x)); }
    function numOr(v, d) { return (typeof v === "number" && Number.isFinite(v)) ? v : d; }
    function numCoerce(v, fallback) {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
      }
      return fallback;
    }

    // Traces
    let audit = [];

    function loadScene(newSceneId) {
      if (!window.SCENES[newSceneId]) throw new Error(`Unknown scene: ${newSceneId}`);
      sceneId = newSceneId;
      resetApiNarrativeState(newSceneId);
      tick = 0;
      selectedId = null;
      audit = [];
      for (const k of Object.keys(cursor)) delete cursor[k];
      for (const k of Object.keys(cursorRecent)) delete cursorRecent[k];
      for (const k of Object.keys(lastWhisper)) delete lastWhisper[k];
      whisperHistory.length = 0;
      for (const k of Object.keys(psyche)) delete psyche[k];
      initPsycheForScene();
      return snapshot({ worldtext: getScene().meta.baseline, mode: "baseline" });
    }

    function getScene() { return window.SCENES[sceneId]; }
    function getSceneId() { return sceneId; }
    function listScenes() { return window.SCENE_ORDER.slice(); }

    function selectCharacter(id) {
      selectedId = id;
      return snapshot();
    }

    function getSelectedId() { return selectedId; }

    function recordWhisper(characterId, text) {
      const clean = String(text || "").trim();
      lastWhisper[characterId] = clean;
      whisperHistory.push({
        tick,
        time: new Date().toLocaleTimeString(),
        characterId,
        text: clean
      });
    }

    function getLastWhisper(characterId) {
      return lastWhisper[characterId] || "";
    }

    function getWhisperHistory(limit = 10) {
      return whisperHistory.slice(-limit);
    }

    function getRecentMonologues(characterId, limit = 3) {
      const n = Math.max(0, Math.min(10, Number(limit) || 0));
      if (!n) return [];

      // `audit` is newest-first because entries are unshifted.
      // Return oldest->newest to preserve narrative progression.
      return audit
        .filter((entry) => entry.characterId === characterId && typeof entry.text === "string" && entry.text.trim())
        .slice(0, n)
        .reverse()
        .map((entry) => ({
          tick: entry.tick,
          kind: entry.kind,
          text: entry.text,
          whisperText: entry.whisperText || ""
        }));
    }

    function getMonologueCount(characterId) {
      return audit.filter((entry) =>
        entry.characterId === characterId &&
        typeof entry.text === "string" &&
        entry.text.trim()
      ).length;
    }

    function nextMonologue(characterId, channel) {
      const sc = getScene();

      const pool = sc.monologues?.[characterId]?.[channel];
      if (!pool || !pool.length) {
        const seed = sc.seeds?.[characterId]?.[channel] || "";
        return seed ? `${seed}\n\n(There is no full monologue pool for this character/channel.)`
          : "(No monologue available.)";
      }

      if (!cursor[characterId]) cursor[characterId] = {};
      if (!cursorRecent[characterId]) cursorRecent[characterId] = {};
      const recent = Array.isArray(cursorRecent[characterId][channel])
        ? cursorRecent[characterId][channel]
        : [];
      const blockSize = Math.min(pool.length - 1, 2);
      const blocked = new Set(recent.slice(-Math.max(0, blockSize)));
      const candidates = pool
        .map((_, i) => i)
        .filter((i) => !blocked.has(i));
      const choicePool = candidates.length ? candidates : pool.map((_, i) => i);
      const next = choicePool[Math.floor(Math.random() * choicePool.length)];
      cursor[characterId][channel] = next;
      cursorRecent[characterId][channel] = recent.concat(next).slice(-3);
      return pool[next];
    }

    function pushTrace(entry) {
      audit.unshift(entry);
      audit = audit.slice(0, 80);
    }

    function newTrace({ kind, characterId, channel, text, whisperText = "" }) {
      const sc = getScene();
      const ch = sc.characters.find(c => c.id === characterId);
      const label = ch?.label || characterId;

      const entry = {
        tick,
        time: new Date().toLocaleTimeString(),
        kind,
        characterId,
        characterLabel: label,
        channel,
        whisperText,
        text,
        psyche: getPsyche(characterId) // snapshot at time of trace
      };

      pushTrace(entry);
      tick++;
      return entry;
    }

    function snapshot(extra = {}) {
      const sc = getScene();
      return {
        meta: { sceneId, label: sc.meta.label, title: sc.meta.title, tick },
        scene: { cols: sc.meta.cols, rows: sc.meta.rows, baseline: sc.meta.baseline },
        characters: sc.characters,
        selection: { characterId: selectedId },
        audit: audit.slice(0, 50),
        uiText: { worldtext: extra.worldtext ?? null, mode: extra.mode ?? null }
      };
    }

    return {
      listScenes,
      loadScene,
      getSceneId,
      getScene,
      snapshot,
      selectCharacter,
      getSelectedId,
      nextMonologue,
      newTrace,
      recordWhisper,
      getLastWhisper,
      getWhisperHistory,
      getRecentMonologues,
      getMonologueCount,
      getPsyche,
      applyRipple
    };
  })();

  // -----------------------------
  // UI STATE
  // -----------------------------
  let lastWorldMode = "baseline";
  let isFocusOpen = false;
  let focusMode = "none"; // "none" | "prompt" | "photo"

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
  function init() {
    populateScenes();
    bindUI();

    const firstSceneId = engine.listScenes()[0]?.id || Object.keys(window.SCENES)[0];
    const snap = engine.loadScene(firstSceneId);

    preloadSceneImages(engine.getScene());

    render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
    showSelectPromptIfNeeded();
    clearAutoThoughtTimer();
  }

  function populateScenes() {
    elScenarioSelect.innerHTML = "";
    for (const s of engine.listScenes()) {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.label;
      elScenarioSelect.appendChild(opt);
    }
  }

  function bindUI() {
    elScenarioSelect.addEventListener("change", () => {
      clearAutoThoughtTimer();
      closeFocus();
      const snap = engine.loadScene(elScenarioSelect.value);

      preloadSceneImages(engine.getScene());

      render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
      showSelectPromptIfNeeded();
    });

    // API key modal
    btnApiSubmit.addEventListener("click", async () => {
      if (isApiKeyChecking) return;
      const val = String(elApiKeyInput.value || "").trim();
      if (!val) {
        setApiKeyStatus("Enter an API key or choose Skip.", true);
        return;
      }

      setApiKeyChecking(true);
      setApiKeyStatus("Validating key...", false);

      try {
        const ok = await validateApiKey(val);
        if (!ok) return;

        userApiKey = val;
        elApiModal.classList.add("hidden");
        elApiKeyInput.value = "";
        setApiKeyStatus("", false);
      } finally {
        setApiKeyChecking(false);
      }
    });

    btnApiSkip.addEventListener("click", () => {
      userApiKey = null;
      elApiModal.classList.add("hidden");
      elApiKeyInput.value = "";
      setApiKeyStatus("", false);
    });

    elApiKeyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        btnApiSubmit.click();
      }
    });

    // Whisper button
    btnWhisperSend.addEventListener("click", onWhisperSend);

    // Cmd/Ctrl+Enter sends whisper
    elWhisperInput.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onWhisperSend();
      }
    });

    // Overlay click closes only in PHOTO mode (prompt is click-through via CSS)
    elFocusOverlay.addEventListener("click", (e) => {
      e.preventDefault();
      if (focusMode === "photo") closeFocus();
    });

    window.addEventListener("keydown", (e) => {
      const k = e.key;

      if (k === "Escape") {
        if (isFocusOpen && focusMode === "photo") {
          e.preventDefault();
          closeFocus();
        }
        return;
      }

      if (k === "ArrowLeft") { e.preventDefault(); cycleScene(-1); }
      if (k === "ArrowRight") { e.preventDefault(); cycleScene(1); }
    });

    window.addEventListener("resize", () => {
      clearTimeout(window.__linksDebounce);
      window.__linksDebounce = setTimeout(() => renderLinks(engine.snapshot()), 120);
    });
  }

  // -----------------------------
  // Actions
  // -----------------------------
  function onSelectCharacter(id) {
    clearAutoThoughtTimer();
    engine.selectCharacter(id);
    const sc = engine.getScene();
    const ch = sc.characters.find(c => c.id === id);

    elSelectedPill.textContent = (ch?.label || id || "NO CHARACTER").toUpperCase();

    if (focusMode === "prompt") closeFocus();

    // Open photo slightly delayed (aesthetic)
    if (ch?.image) {
      window.setTimeout(() => openFocusImage(ch.image, ch.label || ch.id), 220);
    } else {
      closeFocus();
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
      openPrompt("Select a character");
      return;
    }

    const whisper = String(elWhisperInput.value || "").trim();
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

    if (focusMode === "photo") {
      restorePhoto = {
        src: elFocusImage.getAttribute("src"),
        alt: elFocusImage.getAttribute("alt") || ""
      };
      closeFocus();
    }

    window.setTimeout(() => {
      flashRippleFor(selectedId);

      if (restorePhoto && restorePhoto.src) {
        window.setTimeout(() => {
          openFocusImage(restorePhoto.src, restorePhoto.alt);
        }, 1900);
      }
    }, 240);

    elWhisperInput.value = "";
  }

  async function requestMonologue({ characterId, channel, kind, whisperText }) {
    if (isGenerating) return;
    isGenerating = true;

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

    setWorldtext("…", { mode: "baseline" });

    // Drift update strategy:
    // - Local mode (no API): applyRipple BEFORE selecting from pool.
    // - API mode + WHISPER: model returns a delta; applyRipple AFTER generation using that delta.
    const useModelDelta = !!userApiKey && kind === EVENT_KIND.WHISPER;
    if (!useModelDelta) {
      engine.applyRipple({ sourceId: characterId, kind, whisperText });
    }

    try {
      if (userApiKey) {
        const out = await generateFromOpenAI({
          characterId,
          channel,
          whisperText,
          kind,
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

    engine.newTrace({
      kind,
      characterId,
      channel,
      whisperText: whisperText || "",
      text
    });

    setWorldtext(text, { mode: "ripple" });
    const snap = engine.snapshot();
    renderReplay(snap);
    renderGrid(snap);
    renderLinks(snap);
    scheduleAutoThought(AUTO_THOUGHT.intervalMs);
  }

  function cycleScene(dir) {
    clearAutoThoughtTimer();
    const scenes = engine.listScenes();
    const cur = elScenarioSelect.value;
    const idx = scenes.findIndex(s => s.id === cur);
    const next = (idx + dir + scenes.length) % scenes.length;
    elScenarioSelect.value = scenes[next].id;

    closeFocus();
    const snap = engine.loadScene(scenes[next].id);

    preloadSceneImages(engine.getScene());

    render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
    showSelectPromptIfNeeded();
  }

  function showSelectPromptIfNeeded() {
    const snap = engine.snapshot();
    if (!snap.selection.characterId) openPrompt("Select a character");
  }

  // -----------------------------
  // Render
  // -----------------------------
  function render(snapshot, opts = {}) {
    if (!snapshot.selection.characterId) {
      elSelectedPill.textContent = "NO CHARACTER";
    } else {
      const sc = engine.getScene();
      const ch = sc.characters.find(c => c.id === snapshot.selection.characterId);
      elSelectedPill.textContent = (ch?.label || snapshot.selection.characterId).toUpperCase();
    }

    elScenarioSelect.value = snapshot.meta.sceneId;

    renderGrid(snapshot);
    renderLinks(snapshot);
    renderReplay(snapshot);

    if (opts.forceWorldtext != null) {
      setWorldtext(opts.forceWorldtext, { mode: opts.mode || "baseline" });
    } else {
      setWorldtext(snapshot.scene.baseline, { mode: "baseline" });
    }
  }

  function renderGrid(snapshot) {
    const { cols, rows } = snapshot.scene;
    document.documentElement.style.setProperty("--cols", String(cols));
    document.documentElement.style.setProperty("--rows", String(rows));

    elGrid.innerHTML = "";

    const occupied = new Map();
    for (const ch of snapshot.characters) {
      occupied.set(`${ch.position.x},${ch.position.y}`, ch);
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";

        const ch = occupied.get(`${x},${y}`);
        if (ch) {
          cell.classList.add("has-entity");
          cell.dataset.characterId = ch.id;

          if (snapshot.selection.characterId === ch.id) cell.classList.add("selected");

          const inner = document.createElement("div");
          const hasPhoto = !!ch.image;
          inner.className = "grid-entity" + (hasPhoto ? " has-photo" : "");

          if (hasPhoto) {
            inner.innerHTML = `
              <img class="thumb" src="${escapeHtml(ch.image)}" alt="${escapeHtml(ch.label || ch.id)}" loading="lazy" />
            `;
          } else {
            inner.innerHTML = `
              <div class="icon">${escapeHtml(ch.icon || "•")}</div>
              <div class="label">${escapeHtml(ch.id)}</div>
            `;
          }

          cell.appendChild(inner);
          cell.addEventListener("click", () => onSelectCharacter(ch.id));
        }

        elGrid.appendChild(cell);
      }
    }
  }

  function renderLinks(snapshot) {
    elLinks.innerHTML = "";

    const rect = elGrid.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const cols = snapshot.scene.cols;
    const cellSize = rect.width / cols;
    elLinks.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);

    const centers = {};
    for (const ch of snapshot.characters) {
      centers[ch.id] = {
        cx: (ch.position.x + 0.5) * cellSize,
        cy: (ch.position.y + 0.5) * cellSize
      };
    }

    const drawn = new Set();
    for (const ch of snapshot.characters) {
      const a = centers[ch.id];
      if (!a) continue;

      for (const adjId of (ch.adjacentTo || [])) {
        const b = centers[adjId];
        if (!b) continue;

        const key = [ch.id, adjId].sort().join("::");
        if (drawn.has(key)) continue;
        drawn.add(key);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(a.cx));
        line.setAttribute("y1", String(a.cy));
        line.setAttribute("x2", String(b.cx));
        line.setAttribute("y2", String(b.cy));
        elLinks.appendChild(line);
      }
    }
  }

  function renderReplay(snapshot) {
    elAuditLog.innerHTML = "";

    const whispers = snapshot.audit.filter((entry) => entry.kind === EVENT_KIND.WHISPER);

    if (!whispers.length) {
      const d = document.createElement("div");
      d.className = "help";
      d.textContent = "No whispers yet.";
      elAuditLog.appendChild(d);
      return;
    }

    for (const entry of whispers) {
      const item = document.createElement("div");
      item.className = "audit-item";

      const character = entry.characterLabel || entry.characterId;
      const whisperText = String(entry.whisperText || "").trim() || "(empty whisper)";

      item.innerHTML = `
        <div class="row">To ${escapeHtml(character)}: "${escapeHtml(whisperText)}"</div>
      `;

      item.addEventListener("click", () => {
        onSelectCharacter(entry.characterId);
      });

      elAuditLog.appendChild(item);
    }
  }

  function setWorldtext(text, opts = {}) {
    const mode = opts.mode || "baseline";
    lastWorldMode = mode;

    const sc = engine.getScene();
    let html = escapeHtml(String(text));

    const tokens = [];
    for (const ch of sc.characters) {
      if (ch.label) tokens.push({ key: ch.label, id: ch.id });
      tokens.push({ key: ch.id, id: ch.id });
    }
    tokens.sort((a, b) => b.key.length - a.key.length);

    for (const t of tokens) {
      const safeKey = escapeRegExp(t.key);
      html = html.replace(
        new RegExp(`\\b${safeKey}\\b`, "g"),
        `<span class="entity-link" data-character="${escapeHtml(t.id)}">${escapeHtml(t.key)}</span>`
      );
    }

    elWorldtext.innerHTML = html;
    elWorldtext.scrollTop = 0;

    elWorldtext.querySelectorAll(".entity-link").forEach(span => {
      span.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-character");
        if (id) onSelectCharacter(id);
      });
    });
  }

  // -----------------------------
  // Focus overlay modes
  // -----------------------------
  function openPrompt(message) {
    focusMode = "prompt";
    elFocusOverlay.classList.add("prompt-mode");

    elFocusImage.style.display = "none";
    elFocusMessage.textContent = message || "Select a character";

    elFocusOverlay.classList.add("open");
    elFocusOverlay.setAttribute("aria-hidden", "false");
    isFocusOpen = true;
  }

  function openFocusImage(src, altText) {
    if (!src) return;

    focusMode = "photo";
    elFocusOverlay.classList.remove("prompt-mode");

    elFocusImage.style.display = "";
    elFocusMessage.textContent = "";

    if (elFocusImage.getAttribute("src") !== src) {
      elFocusImage.setAttribute("src", src);
    }
    elFocusImage.setAttribute("alt", altText || "");

    elFocusOverlay.classList.add("open");
    elFocusOverlay.setAttribute("aria-hidden", "false");
    isFocusOpen = true;
  }

  function closeFocus() {
    focusMode = "none";
    elFocusOverlay.classList.remove("prompt-mode");
    elFocusOverlay.classList.remove("open");
    elFocusOverlay.setAttribute("aria-hidden", "true");
    isFocusOpen = false;
  }

  // -----------------------------
  // Image preload/decode (best-effort)
  // -----------------------------
  function preloadSceneImages(scene) {
    if (!scene?.characters) return;
    for (const ch of scene.characters) {
      if (!ch.image) continue;
      const img = new Image();
      img.src = ch.image;
      if (img.decode) img.decode().catch(() => {});
    }
  }

  // -----------------------------
  // Visual ripple only
  // -----------------------------
  function flashRippleFor(characterId) {
    const sc = engine.getScene();
    const ch = sc.characters.find(c => c.id === characterId);
    if (!ch) return;

    // If a full-screen photo is open, briefly fade it so the grid ripples can be seen.
    if (isFocusOpen && focusMode === "photo") {
      elFocusOverlay.style.opacity = "0.05";
      window.setTimeout(() => {
        elFocusOverlay.style.opacity = "";
      }, 1600);
    }

    rippleAtCharacter(ch.id, "thoughts", 1.0);

    (ch.adjacentTo || []).forEach((nbId, i) => {
      window.setTimeout(() => rippleAtCharacter(nbId, "thoughts", 0.55), 180 + i * 110);
    });
  }

  function rippleAtCharacter(characterId, cls, intensity) {
    const cell = Array.from(elGrid.querySelectorAll(".grid-cell.has-entity"))
      .find(c => c.dataset.characterId === characterId);
    if (!cell) return;

    const klass = cls || "thoughts";

    cell.classList.add("flash", klass);
    window.setTimeout(() => cell.classList.remove("flash", klass), 900);

    for (let i = 0; i < 2; i++) {
      const ring = document.createElement("div");
      ring.className = `ripple-ring ${klass}`;
      ring.style.opacity = String(0.90 * intensity);
      ring.style.animationDelay = `${i * 110}ms`;
      cell.appendChild(ring);
      window.setTimeout(() => ring.remove(), 1600);
    }
  }

  // -----------------------------
  // Utilities
  // -----------------------------
  function byId(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element #${id} in HTML.`);
    return el;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function trimForPrompt(str, maxLen) {
    const oneLine = String(str || "").replace(/\s+/g, " ").trim();
    const max = Math.max(32, Number(maxLen) || 240);
    if (oneLine.length <= max) return oneLine;
    return `${oneLine.slice(0, max - 3)}...`;
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
        motifStages: {},
        motifLastUsed: {},
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
        motifStages: {},
        motifLastUsed: {},
        threadLastUsed: {}
      };
    }
    return apiNarrativeState[sid][cid];
  }

  function buildPacketPromptContext({ sceneId, scene, character, whisperText, priorMonologueCount, disclosurePhase }) {
    const packet = normalizeCharacterPacket(character, scene);
    const state = getApiCharacterState(sceneId, character?.id);
    const turnNumber = state.turnIndex + 1;
    const toneCadenceDirective = (turnNumber % 2 === 0)
      ? "- Tonal cadence (required this turn): keep the overall thought neutral-to-gently-hopeful. Include one concrete stabilizing or competence cue."
      : "- Tonal cadence: darker pressure is allowed, but retain one concrete anchor of agency or steadiness.";

    const activeThread = pickLifeThread({
      threads: packet.lifeThreads,
      state,
      cooldown: packet.antiRepeat.topicCooldownTurns
    });
    const motifSelection = pickMotifForTurn({
      packet,
      state,
      whisperText
    });

    const phase = disclosurePhase || (
      priorMonologueCount <= 3 ? "early" :
      priorMonologueCount <= 7 ? "middle" : "late"
    );
    const phaseDirectives = packet.disclosurePlan[phase] || [];
    const includeSecondaryThread = shouldIncludeSecondaryThread(phase, state.turnIndex);
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

    const promptBlock = [
      `- Turn index in this scene for this character: ${turnNumber}.`,
      toneCadenceDirective,
      `- Character premise anchor: ${packet.core.premise}.`,
      `- Preserve central conflict: ${packet.core.centralConflict}.`,
      `- Preserve contradiction: ${packet.core.contradiction}.`,
      `- Primary life thread (required, concrete): ${activeThread}.`,
      secondaryThread
        ? `- Optional secondary thread (at most one brief clause): ${secondaryThread}.`
        : "- No secondary thread this turn; stay with the primary thread.",
      "- Hard cap: keep this thought to one dominant concern, with at most one brief secondary pivot.",
      "- Do not introduce a third concern thread in this thought.",
      `- Motif pick for this turn: ${motifSelection.seed} (stage ${motifSelection.stage}).`,
      `- Motif stage guidance: ${motifSelection.stageDirective}.`,
      `- Motif trigger route: ${motifSelection.triggerRoute}.`,
      `- Voice texture: ${packet.voiceRules.texture.join(", ")}.`,
      `- Syntax bias: ${packet.voiceRules.syntaxBias.join(", ")}.`,
      `- Taboo stylistic moves: ${packet.voiceRules.tabooMoves.join("; ")}.`,
      phaseDirectives.length
        ? `- Disclosure directives (${phase.toUpperCase()}): ${phaseDirectives.join(" | ")}.`
        : `- Disclosure directives (${phase.toUpperCase()}): keep incremental and allusive.`,
      packet.promptContract.mustInclude.length
        ? `- Must include this turn: ${packet.promptContract.mustInclude.join("; ")}.`
        : "- Must include this turn: one practical stake, one body cue, one concrete anchor.",
      packet.promptContract.mustAvoid.length
        ? `- Must avoid this turn: ${packet.promptContract.mustAvoid.join("; ")}.`
        : "- Must avoid this turn: direct whisper reply; life-summary exposition.",
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
        secondaryThread,
        motif: motifSelection.seed,
        motifStage: motifSelection.stage,
        motifDecayTurns: packet.motifSystem.decayAfterTurns
      }
    };
  }

  function normalizeCharacterPacket(character, scene) {
    const packet = (character && typeof character.packet === "object" && character.packet) ? character.packet : {};
    const core = (packet.core && typeof packet.core === "object") ? packet.core : {};
    const voiceRules = (packet.voice_rules && typeof packet.voice_rules === "object") ? packet.voice_rules : {};
    const motifSystem = (packet.motif_system && typeof packet.motif_system === "object") ? packet.motif_system : {};
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

    const mergedMotifSeeds = uniqList([
      ...(motifSystem.seeds || []),
      ...(character?.motifSeeds || []),
      ...(scene?.motifs || [])
    ]).slice(0, 40);

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
      motifSystem: {
        seeds: mergedMotifSeeds.length ? mergedMotifSeeds : ["object detail", "body cue", "ambient sound"],
        triggerMap: (motifSystem.trigger_map && typeof motifSystem.trigger_map === "object")
          ? motifSystem.trigger_map
          : {},
        evolution: {
          stage_1: String(motifSystem?.evolution?.stage_1 || "literal mention in present scene detail"),
          stage_2: String(motifSystem?.evolution?.stage_2 || "associative link to practical or emotional stake"),
          stage_3: String(motifSystem?.evolution?.stage_3 || "reframed motif as decision pressure")
        },
        decayAfterTurns: Math.max(1, Number(motifSystem.decay_after_turns) || 3)
      },
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

  function shouldIncludeSecondaryThread(phase, turnIndex) {
    const p = String(phase || "").toLowerCase();
    const t = Math.max(0, Number(turnIndex) || 0);

    if (p === "middle") return t % 2 === 0; // about half of turns
    if (p === "late") return t % 3 === 1;   // occasional late-stage pivot
    return false; // early thoughts stay single-threaded
  }

  function pickMotifForTurn({ packet, state, whisperText }) {
    const seeds = uniqList(packet?.motifSystem?.seeds || []).filter(Boolean);
    if (!seeds.length) {
      return {
        seed: "concrete object detail",
        stage: 1,
        stageDirective: "literal mention in the immediate scene",
        triggerRoute: "fallback"
      };
    }

    const tone = classifyWhisperTone(whisperText).tone;
    const triggerKeys = [];
    if (tone && tone !== "neutral") triggerKeys.push(`whisper_${tone}`);

    const triggerMap = packet?.motifSystem?.triggerMap || {};
    const triggeredSeeds = new Set();
    for (const key of triggerKeys) {
      for (const seed of uniqList(triggerMap[key] || [])) {
        triggeredSeeds.add(String(seed));
      }
    }

    let best = null;
    for (const seed of seeds) {
      const key = String(seed);
      const last = Number.isFinite(state.motifLastUsed[key]) ? state.motifLastUsed[key] : -999;
      const age = state.turnIndex - last;
      const triggerBoost = triggeredSeeds.has(key) ? 2.5 : 0;
      const recencyPenalty = age <= 1 ? 1.2 : 0;
      const score = age * 0.25 + triggerBoost - recencyPenalty + (Math.random() * 0.3);
      if (!best || score > best.score) {
        best = { seed: key, score };
      }
    }

    const stage = Math.max(1, Math.min(3, Number(state.motifStages[best.seed]) || 1));
    const stageDirective = packet?.motifSystem?.evolution?.[`stage_${stage}`] || "literal mention in present scene detail";
    return {
      seed: best.seed,
      stage,
      stageDirective,
      triggerRoute: triggerKeys.length ? triggerKeys.join("+") : "none"
    };
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

    if (selection && selection.motif) {
      const motif = String(selection.motif);
      const prior = Math.max(1, Math.min(3, Number(state.motifStages[motif]) || 1));
      const mentioned = motifMentioned(clean, motif);
      state.motifStages[motif] = mentioned ? Math.min(3, prior + 1) : prior;
      state.motifLastUsed[motif] = state.turnIndex;
      rememberRecent(state.recentTopics, motif, 10);
    }

    const decayAfter = Math.max(1, Number(selection?.motifDecayTurns) || 3);
    for (const seed of Object.keys(state.motifLastUsed)) {
      const last = Number(state.motifLastUsed[seed]);
      if (!Number.isFinite(last)) continue;
      if ((state.turnIndex - last) > decayAfter) {
        const current = Math.max(1, Math.min(3, Number(state.motifStages[seed]) || 1));
        state.motifStages[seed] = Math.max(1, current - 1);
      }
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

  function motifMentioned(text, motifSeed) {
    const t = normalizeWhitespace(text).toLowerCase();
    const motif = normalizeWhitespace(motifSeed).toLowerCase();
    if (!t || !motif) return false;
    if (t.includes(motif)) return true;

    const parts = motif.split(/\s+/).map(canonicalToken).filter(Boolean);
    if (!parts.length) return false;
    const hits = parts.reduce((n, p) => n + (new RegExp(`\\b${escapeRegExp(p)}\\b`, "i").test(t) ? 1 : 0), 0);
    return hits >= Math.min(2, parts.length);
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
    btnApiSubmit.disabled = isApiKeyChecking;
    btnApiSkip.disabled = isApiKeyChecking;
    elApiKeyInput.disabled = isApiKeyChecking;
  }

  function setApiKeyStatus(message, isError) {
    elApiKeyStatus.textContent = String(message || "");
    elApiKeyStatus.classList.toggle("error", !!isError);
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

      setApiKeyStatus(`API check failed (${resp.status}). Try again or use Skip.`, true);
      return false;
    } catch (_) {
      setApiKeyStatus("Could not validate key (network error). Try again.", true);
      return false;
    }
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
    toneSteering = null,
    focusSteering = null
  }) {
    const sc = engine.getScene();
    const sceneId = engine.getSceneId();
    const ch = sc.characters.find(c => c.id === characterId);
    const sceneLabel = String(sc?.meta?.label || "");
    const sceneTitle = String(sc?.meta?.title || "");
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

    const ps = engine.getPsyche(characterId);
    const psycheBlock = [
      "Current psychic state (0–1):",
      `- arousal: ${ps.arousal.toFixed(2)}`,
      `- valence: ${ps.valence.toFixed(2)}`,
      `- agency: ${ps.agency.toFixed(2)}`,
      `- permeability: ${ps.permeability.toFixed(2)}`,
      `- coherence: ${ps.coherence.toFixed(2)}`
    ].join("\n");

    const stateStyleMap = [
      "State-to-style mapping (follow):",
      "- Higher arousal => more immediate pressure, urgency, and sharper cuts between images.",
      "- Lower valence => heavier interpretations, but retain one neutral or constructive anchor.",
      "- Higher agency => firmer verbs, self-directed intention, less passivity.",
      "- Higher permeability => stronger influence from surrounding atmosphere and others.",
      "- Lower coherence => fragmented transitions, associative leaps, and unresolved turns.",
      DYNAMICS.promptLine,
      "Do not mention these numbers explicitly."
    ].join("\n");

    const whisperClean = String(whisperText || "").trim();
    const whisperTone = classifyWhisperTone(whisperClean);
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

    const whisperImpact = whisperClean
      ? [
          "WHISPER IMPACT (MANDATORY):",
          "- Do NOT quote the whisper and do NOT address the whisperer.",
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
      `Length: ${THOUGHT_WORD_MIN}-${THOUGHT_WORD_MAX} words.`,
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
      "Avoid repeating imagery or nouns from recent monologues.",
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
      `Whisper (do not quote): ${whisperClean || "(none)"}`,
      "",
      "Return JSON with:",
      `- monologue: string (${THOUGHT_WORD_MIN}-${THOUGHT_WORD_MAX} words)`,
      "- delta: object with numeric fields arousal, valence, agency, permeability, coherence",
      "Delta semantics:",
      "- Interpret the whisper holistically (meaning, tone, implication), not keywords.",
      "- The delta represents how the whisper alters the character’s internal state.",
      "- Range guidance: arousal/permeability in [-0.15,0.15], valence in [-0.12,0.12], agency/coherence in [-0.10,0.10].",
      DYNAMICS.deltaGuidance,
      "- If whisper is empty/none, delta should be near 0."
    ].join("\n");

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

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userApiKey}`
      },
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

  function stripOuterQuotes(text) {
    return String(text || "").trim().replace(/^“|^"/, "").replace(/”$|"$/, "").trim();
  }

  function normalizeWhitespace(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function cleanSpacing(text) {
    return normalizeWhitespace(text)
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .trim();
  }

  function splitWords(text) {
    return normalizeWhitespace(text).split(" ").filter(Boolean);
  }

  function wordCount(words) {
    const tokens = Array.isArray(words) ? words : splitWords(words);
    return tokens.filter((w) => /[A-Za-z0-9]/.test(w)).length;
  }

  function canonicalToken(token) {
    return String(token || "")
      .toLowerCase()
      .replace(/[’]/g, "'")
      .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
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

  function splitClauses(text) {
    const t = normalizeWhitespace(text);
    if (!t) return [];

    // Keep clause-ending punctuation attached to preserve fragment shape.
    const parts = t
      .split(/(?<=[.!?;:])\s+/)
      .map((s) => normalizeWhitespace(s))
      .filter(Boolean);

    return parts.length ? parts : [t];
  }

  function truncateToWordCount(text, maxWords) {
    const words = splitWords(text);
    if (wordCount(words) <= maxWords) return normalizeWhitespace(text);
    const out = [];
    let seen = 0;
    for (const w of words) {
      const isWord = /[A-Za-z0-9]/.test(w);
      if (isWord && seen >= maxWords) break;
      out.push(w);
      if (isWord) seen++;
    }
    return normalizeWhitespace(out.join(" "));
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

  function isDanglingEndToken(token) {
    const t = canonicalToken(token);
    if (!t) return false;

    const dangling = new Set([
      "a", "an", "the",
      "to", "of", "in", "on", "at", "for", "from", "with", "by",
      "as", "if", "than", "that", "which", "who", "whom", "whose",
      "and", "or", "but", "nor", "so", "yet",
      "about", "above", "across", "after", "against", "along", "around",
      "before", "behind", "below", "beneath", "beside", "between", "beyond",
      "during", "into", "near", "onto", "over", "through", "toward", "towards",
      "under", "until", "upon", "within", "without", "since", "per", "via"
    ]);

    return dangling.has(t);
  }

  function trimDanglingEnding(text, minWords = 0) {
    const words = splitWords(text);
    while (words.length && isDanglingEndToken(words[words.length - 1])) {
      if (wordCount(words) <= minWords) break;
      words.pop();
    }
    return normalizeWhitespace(words.join(" "));
  }

  function ensureTerminalPunctuation(text) {
    const t = normalizeWhitespace(text).replace(/…/g, "...");
    if (!t) return t;
    if (/\.\.\.$/.test(t) || /[.!?]$/.test(t)) return t;
    const clipped = t.replace(/[;:,]+$/, "");
    return `${clipped}...`;
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
    const projectedCount = Math.min(TONE_BALANCER.windowSize, tones.length + 1);
    const minNonDarkNeeded = Math.ceil(projectedCount * TONE_BALANCER.minNonDarkRatio);
    const requireNonDark = nonDarkCount < minNonDarkNeeded;
    const whisperTone = classifyWhisperTone(whisperText).tone;

    let target = "neutral";
    if (requireNonDark) {
      target = "non_dark_required";
    } else if (whisperTone === "calm" || whisperTone === "tender" || (turnIndex % 3 === 0 && whisperTone !== "threat")) {
      target = "gently_hopeful";
    } else if (kind === EVENT_KIND.WHISPER && whisperTone === "threat") {
      target = "steady";
    }

    const lenses = TONE_BALANCER.variationLenses;
    const lens = lenses[(turnIndex - 1) % lenses.length] || lenses[0] || null;

    return {
      turnIndex,
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

    const targetLine = steering.target === "non_dark_required"
      ? "- This turn MUST land neutral-to-gently-hopeful (not dark). Include one concrete stabilizing action or relief cue."
      : steering.target === "gently_hopeful"
        ? "- This turn should read gently hopeful overall; include one feasible good-outcome signal."
        : steering.target === "steady"
          ? "- This turn may hold pressure, but must stay steady (no doom spiral). Include one concrete agency cue."
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
    const motifAnchors = uniqList(scene?.motifs || [])
      .filter((m) => countLexHits(m, ATTENTION_BALANCER.worldCueWords) > 0)
      .slice(0, 12)
      .map((m) => `${m}.`);
    const base = ATTENTION_BALANCER.sceneFallbackAnchors.slice();
    return motifAnchors.length ? motifAnchors.concat(base) : base;
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

  function clampWordRange(text, { minWords, maxWords, fallback }) {
    let out = truncateToWordCount(text, maxWords);
    if (wordCount(out) >= minWords) return out;

    const source = splitWords(normalizeWhitespace(fallback || ""));
    if (!source.length) return out;

    const needed = Math.max(0, minWords - wordCount(out));
    if (!needed) return out;

    const base = splitWords(out);
    const start = randInt(0, Math.max(0, source.length - needed));
    const add = source.slice(start, start + needed);
    return truncateToWordCount(normalizeWhitespace(base.concat(add).join(" ")), maxWords);
  }

  function randInt(min, max) {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }

  async function safeReadText(resp) {
    try { return await resp.text(); } catch (_) { return ""; }
  }

  // -----------------------------
  // Start
  // -----------------------------
  init();

})();
