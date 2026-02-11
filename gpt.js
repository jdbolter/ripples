/* gpt.js
   World Jockey (Wings Mode) — UI + Engine
   Depends on: scenes.js providing window.SCENES and window.SCENE_ORDER
   HTML IDs must match indexgpt.html you loaded.
*/

(() => {
  "use strict";

  // -----------------------------
  // Guard: scenes.js must load first
  // -----------------------------
  if (!window.SCENES || !window.SCENE_ORDER) {
    throw new Error("Missing SCENES/SCENE_ORDER. Ensure scenes.js is loaded before gpt.js.");
  }

  const ACTIVATIONS = ["THOUGHTS", "FEARS", "LONGING"];
  const ACT_CLASS = {
    THOUGHTS: "thoughts",
    FEARS: "fears",
    LONGING: "longing"
  };

  // -----------------------------
  // DOM
  // -----------------------------
  const elScenarioSelect = byId("scenarioSelect");
  const elScenarioPill = byId("scenarioPill");
  const elGrid = byId("grid");
  const elLinks = byId("linkLayer");
  const elList = byId("entityList"); // left list container (kept id for compatibility)
  const elWorldtext = byId("worldtext");
  const elLatentPanel = byId("latentPanel");
  const elAuditLog = byId("auditLog");
  const elTickLabel = byId("tickLabel");
  const elSelectedPill = byId("selectedPill");

  const btnThoughts = byId("btnThoughts");
  const btnFears = byId("btnFears");
  const btnLonging = byId("btnLonging");

  const elAutoplayToggle = byId("autoplayToggle");
  const elCountdownPill = byId("countdownPill");

  const elBpmSlider = byId("bpmSlider");
  const elFxSlider = byId("fxSlider");
  const elRippleSpeedSlider = byId("rippleSpeedSlider");
  const elBpmLabel = byId("bpmLabel");

  // -----------------------------
  // ENGINE (semantic layer boundary)
  // -----------------------------
  const engine = (() => {
    let sceneId = window.SCENE_ORDER[0]?.id || Object.keys(window.SCENES)[0];
    let tick = 0;
    let selectedId = null;

    // Drift state: neighbors pick “more aligned” variants next time.
    // Example: FEARS ripple nudges FEARS variants up; LONGING nudges LONGING, etc.
    const drift = {}; // drift[characterId] = { THOUGHTS:0, FEARS:0, LONGING:0 }
    const used = {};  // used[characterId][activation] = Set(index)

    let audit = [];

    function loadScene(newSceneId) {
      if (!window.SCENES[newSceneId]) throw new Error(`Unknown scene: ${newSceneId}`);
      sceneId = newSceneId;
      tick = 0;
      selectedId = null;
      audit = [];
      // reset state
      for (const k of Object.keys(drift)) delete drift[k];
      for (const k of Object.keys(used)) delete used[k];
      return snapshot({ worldtext: getScene().meta.baseline, mode: "baseline" });
    }

    function getScene() {
      return window.SCENES[sceneId];
    }

    function listScenes() {
      return window.SCENE_ORDER.slice();
    }

    function selectCharacter(id) {
      selectedId = id;
      return snapshot(); // keep current worldtext unless baseline mode needs hint
    }

    function preview(characterId, activation) {
      const sc = getScene();
      const seed = sc.seeds?.[characterId]?.[activation] || "(no seed)";
      const ch = sc.characters.find(c => c.id === characterId);
      const header = `[PREVIEW — ${ch ? ch.label : characterId} · ${activation}]`;
      return { text: `${header}\n\n${seed}`, mode: "preview" };
    }

    function activate(activation) {
      if (!ACTIVATIONS.includes(activation)) throw new Error(`Bad activation: ${activation}`);
      if (!selectedId) return snapshot({ worldtext: getScene().meta.baseline, mode: "baseline" });

      const sc = getScene();
      const ch = sc.characters.find(c => c.id === selectedId);
      if (!ch) return snapshot({ worldtext: sc.meta.baseline, mode: "baseline" });

      const primaryText = pickMonologue(sc, ch.id, activation);

      // Ripple: subtle drift nudges neighbors
      const neighbors = (ch.adjacentTo || []).slice();
      const rippleLedger = [];
      for (const nbId of neighbors) {
        applyDrift(nbId, activation, ch);
        rippleLedger.push({ targetId: nbId, activation, strength: driftStrength(ch) });
      }

      const entry = {
        tick,
        time: new Date().toLocaleTimeString(),
        characterId: ch.id,
        characterLabel: ch.label,
        activation,
        text: primaryText
      };
      audit.unshift(entry);

      // advance tick AFTER logging, so T0 is first event
      tick++;

      return snapshot({ worldtext: primaryText, mode: "ripple", rippleLedger });
    }

    function pickMonologue(sc, characterId, activation) {
      const arr = sc.monologues?.[characterId]?.[activation];
      if (!arr || !arr.length) {
        const seed = sc.seeds?.[characterId]?.[activation] || "";
        return seed ? `${seed}\n\n(There is no full monologue yet for this activation.)` :
          "(No monologue available.)";
      }

      // Choose variant based on drift + "not recently used" preference
      const d = getDrift(characterId)[activation]; // scalar
      const targetBand = bandIndex(arr.length, d); // choose higher indices when drift is high

      const chosen = chooseWithAvoidance(characterId, activation, arr.length, targetBand);
      markUsed(characterId, activation, chosen);

      return arr[chosen];
    }

    function chooseWithAvoidance(characterId, activation, n, preferredIndex) {
      // Try preferred first; if used recently, try nearby.
      const order = [];
      order.push(preferredIndex);
      for (let step = 1; step < n; step++) {
        const a = preferredIndex - step;
        const b = preferredIndex + step;
        if (a >= 0) order.push(a);
        if (b < n) order.push(b);
      }

      const usedSet = getUsedSet(characterId, activation);
      for (const idx of order) {
        if (!usedSet.has(idx)) return idx;
      }

      // If all used, just pick the preferred index and reset the used set
      usedSet.clear();
      return preferredIndex;
    }

    function bandIndex(n, driftScalar) {
      // driftScalar grows slowly; map to index 0..n-1
      // Keep it subtle: clamp drift to [0, 2]
      const d = clamp(driftScalar, 0, 2);
      const t = d / 2; // 0..1
      return Math.round(t * (n - 1));
    }

    function applyDrift(targetId, activation, sourceChar) {
      const s = driftStrength(sourceChar);
      const d = getDrift(targetId);

      // Nudge the activated channel up; tiny cross-talk to others down
      for (const a of ACTIVATIONS) {
        if (a === activation) d[a] += 0.20 * s;
        else d[a] = Math.max(0, d[a] - 0.05 * s);
      }

      // Clamp to keep it subtle and avoid runaway
      for (const a of ACTIVATIONS) d[a] = clamp(d[a], 0, 2);
    }

    function driftStrength(sourceChar) {
      // sensitivity: low/medium/high
      const s = (sourceChar?.sensitivity || "medium").toLowerCase();
      if (s === "low") return 0.6;
      if (s === "high") return 1.2;
      return 1.0;
    }

    function getDrift(id) {
      if (!drift[id]) drift[id] = { THOUGHTS: 0, FEARS: 0, LONGING: 0 };
      return drift[id];
    }

    function getUsedSet(id, activation) {
      if (!used[id]) used[id] = {};
      if (!used[id][activation]) used[id][activation] = new Set();
      return used[id][activation];
    }

    function markUsed(id, activation, idx) {
      getUsedSet(id, activation).add(idx);
      // keep memory small by capping size
      const s = getUsedSet(id, activation);
      if (s.size > 12) {
        // crude cap: clear after it grows
        s.clear();
        s.add(idx);
      }
    }

    function snapshot(extra = {}) {
      const sc = getScene();
      return {
        meta: {
          sceneId,
          label: sc.meta.label,
          title: sc.meta.title,
          tick
        },
        scene: {
          cols: sc.meta.cols,
          rows: sc.meta.rows,
          baseline: sc.meta.baseline
        },
        characters: sc.characters,
        seeds: sc.seeds || {},
        selection: { characterId: selectedId },
        audit: audit.slice(0, 50),
        uiText: {
          worldtext: extra.worldtext ?? null,
          mode: extra.mode ?? null
        },
        rippleLedger: extra.rippleLedger || null
      };
    }

    function chooseAmbientMove() {
      const sc = getScene();
      const pool = sc.ambientBehaviors || [];
      if (!pool.length) {
        const ch = sc.characters[0];
        return ch ? { characterId: ch.id, activation: "THOUGHTS" } : null;
      }
      const total = pool.reduce((a, b) => a + (b.probability || 0), 0) || 1;
      let r = Math.random() * total;
      for (const item of pool) {
        r -= (item.probability || 0);
        if (r <= 0) return { characterId: item.character, activation: item.activation };
      }
      return { characterId: pool[0].character, activation: pool[0].activation };
    }

    return {
      listScenes,
      loadScene,
      getScene,
      snapshot,
      selectCharacter,
      preview,
      activate,
      chooseAmbientMove
    };
  })();

  // -----------------------------
  // UI STATE
  // -----------------------------
  let isAutoplay = false;
  let autoplayTimer = null;
  let countdownTimer = null;
  let secondsToNext = 0;

  // Track last worldtext mode to decide whether to re-baseline on selection
  let lastWorldMode = "baseline";

  // -----------------------------
  // Init
  // -----------------------------
  function init() {
    populateScenes();
    bindUI();
    applyFxFromSliders();

    const firstSceneId = engine.listScenes()[0]?.id || Object.keys(window.SCENES)[0];
    const snap = engine.loadScene(firstSceneId);
    render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
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
      stopAutoplayIfRunning();
      const snap = engine.loadScene(elScenarioSelect.value);
      render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
    });

    btnThoughts.addEventListener("click", () => onActivate("THOUGHTS"));
    btnFears.addEventListener("click", () => onActivate("FEARS"));
    btnLonging.addEventListener("click", () => onActivate("LONGING"));

    elAutoplayToggle.addEventListener("click", toggleAutoplay);

    elBpmSlider.addEventListener("input", () => {
      const bpm = clamp(parseInt(elBpmSlider.value, 10), 6, 60);
      elBpmLabel.textContent = String(bpm);
      if (isAutoplay) restartAutoplay();
    });

    elFxSlider.addEventListener("input", applyFxFromSliders);
    elRippleSpeedSlider.addEventListener("input", applyFxFromSliders);

    window.addEventListener("keydown", (e) => {
      const k = e.key;

      if (k === "ArrowLeft") { e.preventDefault(); cycleScene(-1); }
      if (k === "ArrowRight") { e.preventDefault(); cycleScene(1); }

      if (k === " ") { e.preventDefault(); toggleAutoplay(); }

      if (k === "t" || k === "T") onActivate("THOUGHTS");
      if (k === "f" || k === "F") onActivate("FEARS");
      if (k === "l" || k === "L") onActivate("LONGING");

      if (/^[1-8]$/.test(k)) {
        const idx = parseInt(k, 10) - 1;
        const sc = engine.getScene();
        const ch = sc.characters[idx];
        if (ch) onSelectCharacter(ch.id);
      }
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
    const snap = engine.selectCharacter(id);
    render(snap);

    // If we were showing baseline/preview, update baseline with hint
    if (lastWorldMode !== "ripple") {
      const sc = engine.getScene();
      const ch = sc.characters.find(c => c.id === id);
      if (ch) {
        const baseline = sc.meta.baseline +
          `\n\n[Perspective locked: ${ch.label} (${ch.id}). Press T/F/L.]`;
        setWorldtext(baseline, { mode: "baseline" });
      }
    }
  }

  function onActivate(activation) {
    const snapBefore = engine.snapshot();
    const selectedId = snapBefore.selection.characterId;
    if (!selectedId) return;

    // Visual ripple first (selected + neighbors)
    const sc = engine.getScene();
    const ch = sc.characters.find(c => c.id === selectedId);
    if (ch) {
      rippleAtCharacter(ch.id, activation, 1.0);
      (ch.adjacentTo || []).forEach((nbId, i) => {
        setTimeout(() => rippleAtCharacter(nbId, activation, 0.55), 220 + i * 110);
      });
    }

    const snap = engine.activate(activation);
    render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
  }

  function cycleScene(dir) {
    const scenes = engine.listScenes();
    const cur = elScenarioSelect.value;
    const idx = scenes.findIndex(s => s.id === cur);
    const next = (idx + dir + scenes.length) % scenes.length;
    elScenarioSelect.value = scenes[next].id;

    stopAutoplayIfRunning();
    const snap = engine.loadScene(scenes[next].id);
    render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
  }

  // -----------------------------
  // Render
  // -----------------------------
  function render(snapshot, opts = {}) {
    // Header pills
    elScenarioPill.textContent = snapshot.meta.label;
    elTickLabel.textContent = String(snapshot.meta.tick);

    // Selection pill
    if (!snapshot.selection.characterId) elSelectedPill.textContent = "NO CHARACTER";
    else elSelectedPill.textContent = snapshot.selection.characterId.toUpperCase();

    // Buttons enabled state
    const enabled = !!snapshot.selection.characterId;
    btnThoughts.disabled = !enabled;
    btnFears.disabled = !enabled;
    btnLonging.disabled = !enabled;

    // Scene select (keep sync)
    elScenarioSelect.value = snapshot.meta.sceneId;

    // List, grid, links, seeds, audit
    renderCharacterList(snapshot);
    renderGrid(snapshot);
    renderLinks(snapshot);
    renderSeeds(snapshot);
    renderAudit(snapshot);

    // Worldtext (only override if provided)
    if (opts.forceWorldtext != null) {
      setWorldtext(opts.forceWorldtext, { mode: opts.mode || "ripple" });
    } else if (lastWorldMode == null) {
      setWorldtext(snapshot.scene.baseline, { mode: "baseline" });
    }
  }

  function renderCharacterList(snapshot) {
    elList.innerHTML = "";
    snapshot.characters.forEach((ch, i) => {
      const item = document.createElement("div");
      item.className = "entity-item" + (snapshot.selection.characterId === ch.id ? " selected" : "");
      item.addEventListener("click", () => onSelectCharacter(ch.id));

      const icon = document.createElement("div");
      icon.className = "entity-icon";
      icon.textContent = ch.icon || "•";

      const meta = document.createElement("div");
      meta.className = "entity-meta";

      const name = document.createElement("div");
      name.className = "entity-name";
      name.textContent = ch.label;

      const sub = document.createElement("div");
      sub.className = "entity-sub";
      const loc = ch.location ? ` · ${ch.location}` : "";
      const w = ch.innerWeather ? ` · ${ch.innerWeather}` : "";
      sub.textContent = `key ${i + 1}${loc}${w}`;

      meta.appendChild(name);
      meta.appendChild(sub);

      item.appendChild(icon);
      item.appendChild(meta);
      elList.appendChild(item);
    });
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
          cell.classList.add("has-entity"); // keep class for now; CSS still uses it
          cell.dataset.characterId = ch.id;

          if (snapshot.selection.characterId === ch.id) cell.classList.add("selected");

          const inner = document.createElement("div");
          inner.className = "grid-entity";
          inner.innerHTML = `
            <div class="icon">${escapeHtml(ch.icon || "•")}</div>
            <div class="label">${escapeHtml(ch.id)}</div>
          `;
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

  function renderSeeds(snapshot) {
    elLatentPanel.innerHTML = "";

    const id = snapshot.selection.characterId;
    if (!id) {
      const d = document.createElement("div");
      d.className = "help";
      d.textContent = "Select a character to preview seed fragments (THOUGHTS / FEARS / LONGING).";
      elLatentPanel.appendChild(d);
      return;
    }

    const sc = engine.getScene();
    const ch = sc.characters.find(c => c.id === id);
    const seedObj = snapshot.seeds[id] || {};

    const cards = [
      { a: "THOUGHTS", colorVar: "--term-text" },
      { a: "FEARS", colorVar: "--term-alert" },
      { a: "LONGING", colorVar: "--term-gold" }
    ];

    for (const card of cards) {
      const wrap = document.createElement("div");
      wrap.className = "latent-card";

      const h = document.createElement("div");
      h.className = "h";
      h.innerHTML = `
        <span style="color:var(${card.colorVar})">${card.a}</span>
        <span class="tag">${escapeHtml(ch ? ch.id : id)}</span>
      `;

      const txt = document.createElement("div");
      txt.className = "txt";
      txt.textContent = seedObj[card.a] || "(no seed)";

      txt.addEventListener("click", () => {
        const pv = engine.preview(id, card.a);
        setWorldtext(pv.text, { mode: pv.mode });
      });

      wrap.appendChild(h);
      wrap.appendChild(txt);
      elLatentPanel.appendChild(wrap);
    }
  }

  function renderAudit(snapshot) {
    elAuditLog.innerHTML = "";

    if (!snapshot.audit.length) {
      const d = document.createElement("div");
      d.className = "help";
      d.textContent = "No events yet. Trigger THOUGHTS / FEARS / LONGING to begin. Entries are replayable.";
      elAuditLog.appendChild(d);
      return;
    }

    for (const entry of snapshot.audit) {
      const item = document.createElement("div");
      item.className = "audit-item";

      item.innerHTML = `
        <div class="row" style="justify-content:space-between;">
          <span><span class="k">T${entry.tick}</span> ${escapeHtml(entry.characterId)} → <span class="${ACT_CLASS[entry.activation]}">${escapeHtml(entry.activation)}</span></span>
          <span class="help" style="margin:0;">${escapeHtml(entry.time)}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        onSelectCharacter(entry.characterId);
        rippleAtCharacter(entry.characterId, entry.activation, 1.0);
        setWorldtext(entry.text, { mode: "ripple" });
      });

      elAuditLog.appendChild(item);
    }
  }

  function setWorldtext(text, opts = {}) {
    const mode = opts.mode || "ripple";
    lastWorldMode = mode;

    // Make character ids and labels clickable (lightweight)
    const sc = engine.getScene();
    let html = escapeHtml(String(text));

    // Replace labels and ids (longer keys first)
    const tokens = [];
    for (const ch of sc.characters) {
      tokens.push({ key: ch.label, id: ch.id });
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
  // Visual ripple only
  // -----------------------------
  function rippleAtCharacter(characterId, activation, intensity) {
    const cell = Array.from(elGrid.querySelectorAll(".grid-cell.has-entity"))
      .find(c => c.dataset.characterId === characterId);
    if (!cell) return;

    const cls = ACT_CLASS[activation] || "thoughts";

    // Flash
    cell.classList.add("flash", cls);
    window.setTimeout(() => cell.classList.remove("flash", cls), 420);

    // Rings (two pulses)
    for (let i = 0; i < 2; i++) {
      const ring = document.createElement("div");
      ring.className = `ripple-ring ${cls}`;
      ring.style.opacity = String(0.90 * intensity);
      ring.style.animationDelay = `${i * 110}ms`;
      cell.appendChild(ring);
      window.setTimeout(() => ring.remove(), 1600);
    }
  }

  // -----------------------------
  // FX
  // -----------------------------
  function applyFxFromSliders() {
    const fx = clamp(parseInt(elFxSlider.value, 10) / 100, 0, 1);
    const sp = clamp(parseInt(elRippleSpeedSlider.value, 10) / 100, 0.5, 2);

    document.documentElement.style.setProperty("--fx-flicker", String(0.15 + 0.85 * fx));
    document.documentElement.style.setProperty("--fx-glow", String(0.15 + 0.85 * fx));
    document.documentElement.style.setProperty("--fx-ripple-speed", String(sp));
  }

  // -----------------------------
  // Autoplay
  // -----------------------------
  function toggleAutoplay() {
    isAutoplay = !isAutoplay;
    elAutoplayToggle.classList.toggle("on", isAutoplay);
    elAutoplayToggle.setAttribute("aria-checked", String(isAutoplay));

    if (isAutoplay) startAutoplay();
    else stopAutoplay();
  }

  function restartAutoplay() {
    if (!isAutoplay) return;
    stopAutoplay();
    startAutoplay();
  }

  function stopAutoplayIfRunning() {
    if (isAutoplay) {
      isAutoplay = false;
      elAutoplayToggle.classList.remove("on");
      elAutoplayToggle.setAttribute("aria-checked", "false");
      stopAutoplay();
    }
  }

  function startAutoplay() {
    // Choose default character if none selected
    const snap = engine.snapshot();
    if (!snap.selection.characterId) {
      const first = snap.characters[0];
      if (first) onSelectCharacter(first.id);
    }

    const bpm = clamp(parseInt(elBpmSlider.value, 10), 6, 60);
    elBpmLabel.textContent = String(bpm);

    const intervalMs = Math.round(60000 / bpm);
    secondsToNext = Math.ceil(intervalMs / 1000);

    elCountdownPill.style.display = "inline-block";
    elCountdownPill.textContent = `NEXT: ${secondsToNext}s`;

    countdownTimer = setInterval(() => {
      secondsToNext = Math.max(0, secondsToNext - 1);
      elCountdownPill.textContent = `NEXT: ${secondsToNext}s`;
    }, 1000);

    autoplayTimer = setInterval(() => {
      secondsToNext = Math.ceil(intervalMs / 1000);
      elCountdownPill.textContent = `NEXT: ${secondsToNext}s`;

      const move = engine.chooseAmbientMove();
      if (!move) return;

      onSelectCharacter(move.characterId);
      onActivate(move.activation);
    }, intervalMs);
  }

  function stopAutoplay() {
    clearInterval(autoplayTimer);
    clearInterval(countdownTimer);
    autoplayTimer = null;
    countdownTimer = null;
    elCountdownPill.style.display = "none";
  }

  // -----------------------------
  // Utilities
  // -----------------------------
  function byId(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element #${id} in HTML.`);
    return el;
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // -----------------------------
  // Start
  // -----------------------------
  init();

})();