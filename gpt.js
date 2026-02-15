/* gpt.js
   RIPPLES — End-User Interface (2-column layout)
   New interaction model:
   - Click a character => opens photo + immediately produces a monologue (DEFAULT channel)
   - Whisper text + click Whisper => re-generates monologue (stub now: rotates to a different monologue)
   - Traces log records both "LISTEN" and "WHISPER" events
   - API-ready stubs: buildPromptContext() + requestMonologue() (local now, OpenAI later)

   Depends on: scenes.js providing window.SCENES and window.SCENE_ORDER
   Requires index.html elements:
     #scenarioSelect, #grid, #linkLayer, #worldtext, #auditLog, #selectedPill
     #focusOverlay, #focusImage, #focusMessage
     #whisperInput, #whisperSend
*/

(() => {
  "use strict";

  if (!window.SCENES || !window.SCENE_ORDER) {
    throw new Error("Missing SCENES/SCENE_ORDER. Ensure scenes.js is loaded before gpt.js.");
  }

  // Single implicit channel for now
  const DEFAULT_CHANNEL = "THOUGHTS";
  const EVENT_KIND = { LISTEN: "LISTEN", WHISPER: "WHISPER" };

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
  const btnApiSubmit = byId("apiSubmit");
  const btnApiSkip = byId("apiSkip");

  // -----------------------------
  // ENGINE (scene state + rotation)
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

    // Psychic drift state (persistent per character, per scene)
    // Values are normalized to [0, 1]
    const psyche = {}; // psyche[characterId] = { tension, clarity, openness, drift }

    function initPsycheForScene() {
      const sc = getScene();
      for (const ch of (sc.characters || [])) {
        const p0 = ch.psyche0 || {};
        psyche[ch.id] = {
          tension: clamp01(numOr(p0.tension, 0.35)),
          clarity: clamp01(numOr(p0.clarity, 0.55)),
          openness: clamp01(numOr(p0.openness, 0.40)),
          drift: clamp01(numOr(p0.drift, 0.45))
        };
      }
    }

    function getPsyche(id) {
      const p = psyche[id];
      if (!p) return { tension: 0.35, clarity: 0.55, openness: 0.40, drift: 0.45 };
      // return a copy
      return { tension: p.tension, clarity: p.clarity, openness: p.openness, drift: p.drift };
    }

    function applyRipple({ sourceId, kind, whisperText }) {
      const sc = getScene();
      const src = sc.characters.find(c => c.id === sourceId);
      if (!src) return;

      // Ensure psyche exists
      if (!psyche[sourceId]) initPsycheForScene();

      // Compute delta for source
      const delta = computeDelta(kind, whisperText);
      applyDeltaTo(sourceId, delta, 1.0);

      // Diffuse to adjacency list only (measurable but contained)
      const nbs = (src.adjacentTo || []).slice();
      for (const nbId of nbs) {
        applyDeltaTo(nbId, delta, 0.45);
      }

      // Small stabilization: over time drift tends to rise slightly, clarity tends to fall slightly
      // (kept subtle so the system doesn't run away)
      for (const ch of (sc.characters || [])) {
        if (!psyche[ch.id]) continue;
        psyche[ch.id].drift = clamp01(psyche[ch.id].drift + 0.003);
        psyche[ch.id].clarity = clamp01(psyche[ch.id].clarity - 0.001);
      }
    }

    function computeDelta(kind, whisperText) {
      // Baselines
      let tension = 0;
      let clarity = 0;
      let openness = 0;
      let drift = 0;

      if (kind === EVENT_KIND.WHISPER) {
        // Whisper is a strong perturbation
        openness += 0.10;
        drift += 0.08;
        clarity -= 0.02;

        // Very lightweight lexical valence heuristic
        const w = String(whisperText || "").toLowerCase();
        const neg = ["fear", "danger", "blood", "die", "dead", "dark", "cold", "threat", "loss", "gone", "alone", "unsafe", "panic"];
        const pos = ["warm", "light", "forgive", "tender", "safe", "home", "quiet", "kind", "hold", "soft"];

        if (neg.some(k => w.includes(k))) tension += 0.10;
        if (pos.some(k => w.includes(k))) { tension -= 0.04; clarity += 0.02; openness += 0.03; }

        // If whisper is very short, it can feel like a jab
        if (w && w.length < 18) tension += 0.04;
      } else {
        // LISTEN is a lighter drift: attention opens slightly
        openness += 0.03;
        drift += 0.02;
        clarity += 0.01;
        tension -= 0.01;
      }

      return { tension, clarity, openness, drift };
    }

    function applyDeltaTo(id, delta, scale) {
      if (!psyche[id]) return;
      psyche[id].tension = clamp01(psyche[id].tension + delta.tension * scale);
      psyche[id].clarity = clamp01(psyche[id].clarity + delta.clarity * scale);
      psyche[id].openness = clamp01(psyche[id].openness + delta.openness * scale);
      psyche[id].drift = clamp01(psyche[id].drift + delta.drift * scale);

      // Couplings for realism
      // Higher tension slightly reduces openness; higher drift slightly reduces clarity.
      psyche[id].openness = clamp01(psyche[id].openness - 0.02 * psyche[id].tension);
      psyche[id].clarity = clamp01(psyche[id].clarity - 0.03 * psyche[id].drift);
    }

    function clamp01(x) { return Math.max(0, Math.min(1, x)); }
    function numOr(v, d) { return (typeof v === "number" && Number.isFinite(v)) ? v : d; }

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

    function nextMonologue(characterId, channel, reason) {
      const sc = getScene();

      const pool = sc.monologues?.[characterId]?.[channel];
      if (!pool || !pool.length) {
        const seed = sc.seeds?.[characterId]?.[channel] || "";
        return seed ? `${seed}\n\n(There is no full monologue pool for this character/channel.)`
          : "(No monologue available.)";
      }

      if (!cursor[characterId]) cursor[characterId] = {};
      const last = Number.isInteger(cursor[characterId][channel]) ? cursor[characterId][channel] : -1;

      // A: rotate to a different monologue each time.
      // For whisper, rotate forward; for listen, also rotate forward.
      const next = (last + 1) % pool.length;

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
        text
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
    btnApiSubmit.addEventListener("click", () => {
      const val = String(elApiKeyInput.value || "").trim();
      userApiKey = val || null;
      elApiModal.classList.add("hidden");
      elApiKeyInput.value = "";
    });

    btnApiSkip.addEventListener("click", () => {
      userApiKey = null;
      elApiModal.classList.add("hidden");
      elApiKeyInput.value = "";
    });

    // Enter submits key
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

    // Update UI selection pill immediately
    elSelectedPill.textContent = (ch?.label || id || "NO CHARACTER").toUpperCase();

    // Dismiss prompt (if present)
    if (focusMode === "prompt") closeFocus();

    // Open photo
    if (ch?.image) openFocusImage(ch.image, ch.label || ch.id);
    else closeFocus();

    // Immediately "listen" => request monologue (stub now: local rotation)
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
    if (!whisper) {
      // No-op if empty; keep it minimal
      return;
    }

    engine.recordWhisper(selectedId, whisper);

    // Stub behavior (A): rotate to a different monologue (same channel) and log WHISPER.
    void requestMonologue({
      characterId: selectedId,
      channel: DEFAULT_CHANNEL,
      kind: EVENT_KIND.WHISPER,
      whisperText: whisper
    });

    // Optional: clear after send (keeps it “ritual” rather than “chat”)
    elWhisperInput.value = "";
  }

  async function requestMonologue({ characterId, channel, kind, whisperText }) {
    if (isGenerating) return;
    isGenerating = true;

    let text = "";

    // Optional: quick UI feedback
    // (don’t overwrite a good monologue; just show a brief marker)
    setWorldtext("…", { mode: "baseline" });

    // Update persistent psychic drift BEFORE generating text
    engine.applyRipple({ sourceId: characterId, kind, whisperText });

    try {
      if (userApiKey) {
        text = await generateFromOpenAI({ characterId, channel, whisperText });
      } else {
        text = engine.nextMonologue(characterId, channel, kind);
      }
    } catch (err) {
      console.error("OpenAI generation failed; falling back to local.", err);
      text = engine.nextMonologue(characterId, channel, kind);
    } finally {
      isGenerating = false;
    }

    engine.newTrace({
      kind,
      characterId,
      channel,
      whisperText: whisperText || "",
      text
    });

    // Visual ripple: ring the selected cell and neighbors
    const sc = engine.getScene();
    const ch = sc.characters.find(c => c.id === characterId);
    if (ch) {
      rippleAtCharacter(ch.id, "thoughts", 1.0);
      (ch.adjacentTo || []).forEach((nbId, i) => {
        setTimeout(() => rippleAtCharacter(nbId, "thoughts", 0.55), 220 + i * 110);
      });
    }

    setWorldtext(text, { mode: "ripple" });
    renderReplay(engine.snapshot());
    renderGrid(engine.snapshot());
    renderLinks(engine.snapshot());
  }

  function buildPromptContext({ characterId, channel, whisperText }) {
    // Placeholder for future OpenAI prompt construction.
    // Keep this signature stable so API integration is drop-in.
    const sc = engine.getScene();
    const ch = sc.characters.find(c => c.id === characterId);

    return {
      scene: sc.meta,
      baseline: sc.meta.baseline,
      character: {
        id: ch?.id,
        label: ch?.label,
        sensitivity: ch?.sensitivity,
        adjacentTo: ch?.adjacentTo || []
      },
      channel,
      lastWhisper: engine.getLastWhisper(characterId),
      whisperText: whisperText || "",
      recentWhispers: engine.getWhisperHistory(6)
    };
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
    // Selection pill shows label if possible
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

    if (!snapshot.audit.length) {
      const d = document.createElement("div");
      d.className = "help";
      d.textContent = "No traces yet.";
      elAuditLog.appendChild(d);
      return;
    }

    for (const entry of snapshot.audit) {
      const item = document.createElement("div");
      item.className = "audit-item";

      const tag = entry.kind === EVENT_KIND.WHISPER ? "WHISPER" : "LISTEN";
      const tagClass = entry.kind === EVENT_KIND.WHISPER ? "fears" : "thoughts";

      item.innerHTML = `
        <div class="row" style="justify-content:space-between;">
          <span><span class="k">${escapeHtml(tag)}</span> ${escapeHtml(entry.characterId)} </span>
          <span class="help" style="margin:0;">${escapeHtml(entry.time)}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        onSelectCharacter(entry.characterId);
        setWorldtext(entry.text, { mode: "ripple" });
      });

      elAuditLog.appendChild(item);
    }
  }

  function setWorldtext(text, opts = {}) {
    const mode = opts.mode || "baseline";
    lastWorldMode = mode;

    const sc = engine.getScene();
    let html = escapeHtml(String(text));

    // Make character ids/labels clickable
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
  function rippleAtCharacter(characterId, cls, intensity) {
    const cell = Array.from(elGrid.querySelectorAll(".grid-cell.has-entity"))
      .find(c => c.dataset.characterId === characterId);
    if (!cell) return;

    const klass = cls || "thoughts";

    cell.classList.add("flash", klass);
    window.setTimeout(() => cell.classList.remove("flash", klass), 420);

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

  // -----------------------------
  // OpenAI (Responses API)
  // -----------------------------
  async function generateFromOpenAI({ characterId, channel, whisperText }) {
    const sc = engine.getScene();
    const ch = sc.characters.find(c => c.id === characterId);

    const sys = (sc.prompts && sc.prompts.system) ? sc.prompts.system :
      "You write short interior monologues. Plain text only.";

    const sceneFrame = (sc.prompts && sc.prompts.scene) ? sc.prompts.scene : (sc.meta?.baseline || "");
    const whisperRule = (sc.prompts && sc.prompts.whisperRule) ? sc.prompts.whisperRule :
      "If a whisper is present, it bends mood indirectly; do not answer it directly.";

    const dossier = (ch && ch.dossier) ? ch.dossier : "";

    const ps = engine.getPsyche(characterId);
    const psycheBlock = [
      "Current psychic state (0–1):",
      `- tension: ${ps.tension.toFixed(2)}`,
      `- clarity: ${ps.clarity.toFixed(2)}`,
      `- openness: ${ps.openness.toFixed(2)}`,
      `- drift: ${ps.drift.toFixed(2)}`
    ].join("\n");

    const stateStyleMap = [
      "State-to-style mapping (follow):",
      "- Higher tension => tighter, sharper imagery; slightly shorter sentences.",
      "- Higher drift => more associative, wandering structure; softer transitions.",
      "- Higher clarity => more concrete sensory detail and specificity.",
      "- Higher openness => more permeability to atmosphere and others; gentler boundaries.",
      "Do not mention these numbers explicitly."
    ].join("\n");

    const whisperClean = String(whisperText || "").trim();

    const whisperImpact = whisperClean
      ? [
          "WHISPER IMPACT (MANDATORY):",
          "- Do NOT quote the whisper and do NOT address the whisperer.",
          "- Let the whisper noticeably bend the monologue’s mood and imagery.",
          "- Incorporate ONE concrete image implied by the whisper (an object, place, bodily sensation, or sound).",
          "- Make the final sentence carry an aftertaste of the whisper (unease, tenderness, recognition, dread, etc.).",
          "- Keep it subtle but unmistakable: the reader should feel a shift compared to a non-whisper monologue.",
          ""
        ].join("\n")
      : [
          "(No whisper present.)",
          ""
        ].join("\n");

    const userPrompt = [
      "Generate an interior monologue.",
      "Length: 75–100 words.",
      "Present tense. First person.",
      "Allusive, impressionistic, understated.",
      "Plain text only.",
      "",
      "Hard constraints:",
      "- No direct second-person reply to a whisper.",
      "- No meta-talk (no mention of prompts, models, AI, system).",
      "- No dialogue formatting; this is interior thought.",
      "",
      "Scene:",
      sceneFrame,
      "",
      "Character:",
      dossier,
      "",
      psycheBlock,
      "",
      stateStyleMap,
      "",
      whisperRule,
      "",
      whisperImpact,
      `Whisper (do not quote): ${whisperClean || "(none)"}`
    ].join("\n");

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: sys },
          { role: "user", content: userPrompt }
        ],
        // Keep tight: ~75–100 words
        max_output_tokens: 160
      })
    });

    if (!resp.ok) {
      const errText = await safeReadText(resp);
      throw new Error(`OpenAI HTTP ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    const text = extractResponseText(data);
    return postprocessMonologue(text);
  }

  function extractResponseText(data) {
    // Responses API typically returns data.output[].content[].text
    try {
      const out = data && data.output;
      if (Array.isArray(out)) {
        for (const item of out) {
          const content = item && item.content;
          if (!Array.isArray(content)) continue;
          for (const part of content) {
            if (part && typeof part.text === "string" && part.text.trim()) {
              return part.text;
            }
          }
        }
      }
    } catch (_) {}

    // Fallbacks (defensive)
    if (typeof data?.output_text === "string") return data.output_text;
    return "(No text returned.)";
  }

  function postprocessMonologue(text) {
    // Light cleanup only — keep it plain.
    const t = String(text || "").trim();
    // Remove surrounding quotes if the model adds them.
    return t.replace(/^“|^"/, "").replace(/”$|"$/, "").trim();
  }

  async function safeReadText(resp) {
    try { return await resp.text(); } catch (_) { return ""; }
  }

  // -----------------------------
  // Start
  // -----------------------------
  init();

})();