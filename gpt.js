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
  const __RIPPLES_BUILD__ = "2026-02-21-psyche5-high-immediacy";
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

  // Single switch for system dynamics:
  // - "intense": strongest whisper impact + wider propagation
  // - "high": stronger whisper impact, lighter stabilization
  // - "subtle": gentler whisper impact, stronger settling
  const DYNAMICS_MODE = "intense"; // change to "high" or "subtle" to soften behavior
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

  // OpenAI (client-side key entry)
  let userApiKey = null;
  let isGenerating = false;

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

    // rotation memory per character/channel so Whisper/LISTEN can "move" through the pool
    const cursor = {}; // cursor[characterId][channel] = lastIndexUsed

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
      tick = 0;
      selectedId = null;
      audit = [];
      for (const k of Object.keys(cursor)) delete cursor[k];
      for (const k of Object.keys(lastWhisper)) delete lastWhisper[k];
      whisperHistory.length = 0;
      for (const k of Object.keys(psyche)) delete psyche[k];
      initPsycheForScene();
      return snapshot({ worldtext: getScene().meta.baseline, mode: "baseline" });
    }

    function getScene() { return window.SCENES[sceneId]; }
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
      const last = Number.isInteger(cursor[characterId][channel]) ? cursor[characterId][channel] : -1;
      const thoughtCount = getMonologueCount(characterId);
      let next;
      if (thoughtCount <= 1 && pool.length > 1) {
        next = Math.floor(Math.random() * pool.length);
        if (next === last) next = (next + 1) % pool.length;
      } else {
        next = (last + 1) % pool.length;
      }
      cursor[characterId][channel] = next;
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
    let text = "";
    let usedLocalPool = false;

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
        const out = await generateFromOpenAI({ characterId, channel, whisperText, kind });
        text = out.text;

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

    if (isTrainDelayScene(engine.getScene())) {
      text = ensureTrainDelayPressure(text);
    }

    text = constrainThoughtText(text, {
      minWords: THOUGHT_WORD_MIN,
      maxWords: THOUGHT_WORD_MAX,
      maxFirstPersonRatio: FIRST_PERSON_MAX_RATIO,
      preferRandomWindow: usedLocalPool && priorMonologueCount <= 1
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
  }

  function cycleScene(dir) {
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
  async function generateFromOpenAI({ characterId, channel, whisperText, kind }) {
    const sc = engine.getScene();
    const ch = sc.characters.find(c => c.id === characterId);
    const sceneLabel = String(sc?.meta?.label || "");
    const sceneTitle = String(sc?.meta?.title || "");
    const isPosthuman = /forest|post[- ]?human/i.test(sceneLabel);
    const isTrainDelay = isTrainDelayScene(sc) || /train|ice|berlin/i.test(`${sceneLabel} ${sceneTitle}`);

    const sys = (sc.prompts && sc.prompts.system) ? sc.prompts.system :
      "You write short interior monologues.";

    const sceneFrame = (sc.prompts && sc.prompts.scene) ? sc.prompts.scene : (sc.meta?.baseline || "");
    const whisperRule = (sc.prompts && sc.prompts.whisperRule) ? sc.prompts.whisperRule :
      "If a whisper is present, it bends mood indirectly; do not answer it directly.";

    const dossier = (ch && ch.dossier) ? ch.dossier : "";

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
      "- Lower valence => darker interpretations and threat-biased framing of neutral details.",
      "- Higher agency => firmer verbs, self-directed intention, less passivity.",
      "- Higher permeability => stronger influence from surrounding atmosphere and others.",
      "- Lower coherence => fragmented transitions, associative leaps, and unresolved turns.",
      DYNAMICS.promptLine,
      "Do not mention these numbers explicitly."
    ].join("\n");

    const whisperClean = String(whisperText || "").trim();
    const recentThoughts = engine.getRecentMonologues(characterId, 3);
    const priorMonologueCount = engine.getMonologueCount(characterId);
    const disclosurePhase =
      priorMonologueCount <= 3 ? "early" :
      priorMonologueCount <= 7 ? "middle" :
      "late";
    const disclosureGuidance = disclosurePhase === "early"
      ? [
          "- Vary openings unpredictably (object detail, body sensation, admin/money task, stray memory, abstract dread).",
          "- Keep core conflict mostly indirect; at most one brief allusive signal.",
          "- One abrupt topic shift is allowed if it still feels psychologically plausible.",
          "- Do not name the character's deepest fear or full backstory directly yet."
        ]
      : disclosurePhase === "middle"
        ? [
            "- Keep oscillating between present-moment detail, practical life threads, and deeper concern.",
            "- Allow at most one modestly clearer backstory signal, still indirect and understated.",
            "- Avoid full explanations, timelines, or confessional summaries."
          ]
        : [
            "- Deepen emotional clarity, but remain allusive rather than fully explanatory.",
            "- Leave some core material implied; avoid exhaustive disclosure.",
            "- Let mundane detail and side-concerns interrupt heavier thoughts so the voice stays lived-in."
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
          "- Move at least once from mundane immediate detail to deeper concern and back to lived practical detail.",
          "- Keep transitions subtle and psychologically natural, not abrupt."
        ].join("\n")
      : [
          "Continuity context: none yet for this character.",
          "Disclosure phase: EARLY (first thought).",
          "Disclosure pacing rules:",
          "- Start with a surprising angle; do not default to biography summary.",
          "- Range across everyday concerns with at least one quick associative jump.",
          "- Hint at deeper history indirectly; avoid explicit backstory exposition.",
          "Associative movement rules:",
          "- Let one detail open a sideways association; returning to practical detail is optional."
        ].join("\n");

    const openingModes = [
      "begin with a concrete object, then jump to an unrelated obligation",
      "begin vague and atmospheric, then snap to one practical detail",
      "begin practical and precise, then blur into an unnamed unease",
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
      "- Besides the central worry, include at least one secondary life thread from ordinary life.",
      "- Secondary threads may include work tasks, money, admin, health routines, family logistics, social duties, study pressure, or unfinished errands.",
      "- Build a short associative chain (2-4 linked turns of thought) rather than a single fixed topic.",
      "- Do not stay only on train surroundings."
    ].join("\n");

    const whisperImpact = whisperClean
      ? [
          "WHISPER IMPACT (MANDATORY):",
          "- Do NOT quote the whisper and do NOT address the whisperer.",
          "- Let the whisper noticeably bend the monologue’s mood and imagery.",
          "- Incorporate ONE concrete image implied by the whisper (object/place/bodily sensation/sound).",
          "- Make the final sentence carry an aftertaste of the whisper (unease, tenderness, recognition, dread, etc.).",
          "- Keep it subtle but unmistakable.",
          ""
        ].join("\n")
      : [
          "(No whisper present.)",
          ""
        ].join("\n");

    const concernConstraint = isPosthuman
      ? "- Include one immediate embodied concern (shelter, hunger, injury risk, weather, territory, energy, predation, mating pressure, seasonal survival)."
      : "- Include one immediate personal concern (status, work, money, health, aging, regret, belonging, obligation, reputation, deadline, body discomfort).";

    const delayPressureBlock = isTrainDelay
      ? [
          "Train-delay pressure (required for this scene):",
          "- A carriage announcement says arrival is 30 minutes late.",
          "- Explicitly mention lateness/delay and at least one concrete consequence (connection risk, missed timing, call rescheduling, pickup friction, appointment pressure, admin fallout).",
          "- Keep it immediate, not abstract."
        ].join("\n")
      : "No scene-wide delay requirement.";

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
      "",
      "Scene:",
      sceneFrame,
      "",
      "Character:",
      dossier,
      "",
      delayPressureBlock,
      "",
      continuityBlock,
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

  function isTrainDelayScene(sc) {
    const id = String(sc?.id || "");
    const label = String(sc?.meta?.label || "");
    const title = String(sc?.meta?.title || "");
    return /ice_to_berlin_second_class/i.test(id) || /train|ice|berlin/i.test(`${label} ${title}`);
  }

  function hasTrainDelayPressure(text) {
    const t = normalizeWhitespace(text).toLowerCase();
    if (!t) return false;

    const late = /\b(late|delay|delayed|behind schedule)\b/.test(t);
    const thirty = /\b(30|thirty|half an hour)\b/.test(t);
    const minute = /\b(minute|minutes)\b/.test(t);
    const announcement = /\b(announcement|announced|speaker|conductor)\b/.test(t);

    if (late && (thirty || minute)) return true;
    if (announcement && late) return true;
    return false;
  }

  function ensureTrainDelayPressure(text) {
    const base = normalizeWhitespace(text);
    if (!base) return base;
    if (hasTrainDelayPressure(base)) return base;

    const additions = [
      "Announcement repeats: 30 minutes late. Connection window tightening",
      "Now 30 minutes late; timing for calls and arrivals starts to slip",
      "Thirty minutes late, announced twice. Plans compress into apology math",
      "Delay holds at 30 minutes. Next transfer and next message both at risk"
    ];

    const extra = additions[randInt(0, additions.length - 1)];
    return normalizeWhitespace(`${base} ${extra}`);
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
