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
  const __RIPPLES_BUILD__ = "2026-02-17-fix-text.format.name";
  console.log("[RIPPLES] gpt.js loaded", __RIPPLES_BUILD__);

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
      return { tension: p.tension, clarity: p.clarity, openness: p.openness, drift: p.drift };
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
        applyDeltaTo(nbId, delta, 0.45);
      }

      // Small stabilization: drift rises slightly, clarity falls slightly (subtle)
      for (const ch of (sc.characters || [])) {
        if (!psyche[ch.id]) continue;
        psyche[ch.id].drift = clamp01(psyche[ch.id].drift + 0.003);
        psyche[ch.id].clarity = clamp01(psyche[ch.id].clarity - 0.001);
      }
    }

    function computeDelta(kind, whisperText) {
      let tension = 0;
      let clarity = 0;
      let openness = 0;
      let drift = 0;

      if (kind === EVENT_KIND.WHISPER) {
        openness += 0.10;
        drift += 0.08;
        clarity -= 0.02;

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

        if (neg.some(k => w.includes(k))) tension += 0.10;
        if (pos.some(k => w.includes(k))) { tension -= 0.04; clarity += 0.02; openness += 0.03; }

        if (w && w.length < 18) tension += 0.04;
      } else {
        // LISTEN is a lighter drift
        openness += 0.03;
        drift += 0.02;
        clarity += 0.01;
        tension -= 0.01;
      }

      return { tension, clarity, openness, drift };
    }

    // IMPORTANT: Coerce numeric strings from the model ("0.06") into real numbers.
    function sanitizeDelta(d) {
      return {
        tension: clampDelta(numCoerce(d?.tension, 0)),
        clarity: clampDelta(numCoerce(d?.clarity, 0)),
        openness: clampDelta(numCoerce(d?.openness, 0)),
        drift: clampDelta(numCoerce(d?.drift, 0))
      };
    }
    function clampDelta(x) { return Math.max(-0.20, Math.min(0.20, x)); }

    function applyDeltaTo(id, delta, scale) {
      if (!psyche[id]) return;

      psyche[id].tension = clamp01(psyche[id].tension + delta.tension * scale);
      psyche[id].clarity = clamp01(psyche[id].clarity + delta.clarity * scale);
      psyche[id].openness = clamp01(psyche[id].openness + delta.openness * scale);
      psyche[id].drift = clamp01(psyche[id].drift + delta.drift * scale);

      // Couplings for realism:
      // Higher tension slightly reduces openness; higher drift slightly reduces clarity.
      psyche[id].openness = clamp01(psyche[id].openness - 0.02 * psyche[id].tension);
      psyche[id].clarity = clamp01(psyche[id].clarity - 0.03 * psyche[id].drift);
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

    let text = "";

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
      }
    } catch (err) {
      console.error("OpenAI generation failed; falling back to local.", err);
      text = engine.nextMonologue(characterId, channel);
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
      const ps = entry.psyche || engine.getPsyche(entry.characterId);
      const psycheDebug = ps
        ? ` t=${ps.tension.toFixed(2)} c=${ps.clarity.toFixed(2)} o=${ps.openness.toFixed(2)} d=${ps.drift.toFixed(2)}`
        : "";

      item.innerHTML = `
        <div class="row" style="justify-content:space-between;">
          <span><span class="k">${escapeHtml(tag)}</span> ${escapeHtml(entry.characterId)}${psycheDebug}</span>
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

  // -----------------------------
  // OpenAI (Responses API) — single call returns {monologue, delta}
  //
  // CRITICAL FIX FOR YOUR 400:
  // `name` must be at text.format.name (NOT inside a json_schema wrapper).
  // -----------------------------
  async function generateFromOpenAI({ characterId, channel, whisperText, kind }) {
    const sc = engine.getScene();
    const ch = sc.characters.find(c => c.id === characterId);

    const sys = (sc.prompts && sc.prompts.system) ? sc.prompts.system :
      "You write short interior monologues.";

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
          "- Incorporate ONE concrete image implied by the whisper (object/place/bodily sensation/sound).",
          "- Make the final sentence carry an aftertaste of the whisper (unease, tenderness, recognition, dread, etc.).",
          "- Keep it subtle but unmistakable.",
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
      "Do not rely on dust, light, shadow, air, or silence as primary imagery.",
      "Introduce at least one new concrete sensory anchor.",
      "Output must be JSON only (no markdown, no extra text).",
      "Avoid repeating imagery or nouns from recent monologues.",
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
      `Whisper (do not quote): ${whisperClean || "(none)"}`,
      "",
      "Return JSON with:",
      "- monologue: string (75–100 words)",
      "- delta: object with numeric fields tension, clarity, openness, drift (each in [-0.15, 0.15])",
      "Delta semantics:",
      "- Interpret the whisper holistically (meaning, tone, implication), not keywords.",
      "- The delta represents how the whisper alters the character’s internal state.",
      "- Keep deltas modest; do not jump to extremes.",
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
                required: ["tension", "clarity", "openness", "drift"],
                properties: {
                  tension: { type: "number" },
                  clarity: { type: "number" },
                  openness: { type: "number" },
                  drift: { type: "number" }
                }
              }
            }
          }
        }
      },

      max_output_tokens: 240
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
      delta: { tension: 0, clarity: 0, openness: 0, drift: 0 }
    };
  }

  function postprocessMonologue(text) {
    const t = String(text || "").trim();
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