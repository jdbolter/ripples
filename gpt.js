/* gpt.js
   RIPPLES — End-User Interface (2-column layout)
   + photoreal thumbnails + focus overlay expand/collapse
   Simplified: ONLY THOUGHTS + FEARS (no LONGING, no autoplay)
   Depends on: scenes.js providing window.SCENES and window.SCENE_ORDER
   Requires index.html elements: #focusOverlay, #focusImage
*/

(() => {
  "use strict";

  if (!window.SCENES || !window.SCENE_ORDER) {
    throw new Error("Missing SCENES/SCENE_ORDER. Ensure scenes.js is loaded before gpt.js.");
  }

  // ONLY two activations now
  const ACTIVATIONS = ["THOUGHTS", "FEARS"];
  const ACT_CLASS = { THOUGHTS: "thoughts", FEARS: "fears" };

  // -----------------------------
  // DOM
  // -----------------------------
  const elScenarioSelect = byId("scenarioSelect");
  const elScenarioPill = byId("scenarioPill");
  const elGrid = byId("grid");
  const elLinks = byId("linkLayer");
  const elWorldtext = byId("worldtext");
  const elAuditLog = byId("auditLog");
  const elTickLabel = byId("tickLabel");
  const elSelectedPill = byId("selectedPill");

  const btnThoughts = byId("btnThoughts");
  const btnFears = byId("btnFears");

  // focus overlay
  const elFocusOverlay = byId("focusOverlay");
  const elFocusImage = byId("focusImage");

  // -----------------------------
  // ENGINE
  // -----------------------------
  const engine = (() => {
    let sceneId = window.SCENE_ORDER[0]?.id || Object.keys(window.SCENES)[0];
    let tick = 0;
    let selectedId = null;

    // drift + avoidance now only track THOUGHTS/FEARS
    const drift = {}; // drift[characterId] = { THOUGHTS:0, FEARS:0 }
    const used = {};  // used[characterId][activation] = Set(index)
    let audit = [];

    function loadScene(newSceneId) {
      if (!window.SCENES[newSceneId]) throw new Error(`Unknown scene: ${newSceneId}`);
      sceneId = newSceneId;
      tick = 0;
      selectedId = null;
      audit = [];
      for (const k of Object.keys(drift)) delete drift[k];
      for (const k of Object.keys(used)) delete used[k];
      return snapshot({ worldtext: getScene().meta.baseline, mode: "baseline" });
    }

    function getScene() { return window.SCENES[sceneId]; }
    function listScenes() { return window.SCENE_ORDER.slice(); }

    function selectCharacter(id) {
      selectedId = id;
      return snapshot();
    }

    function activate(activation) {
      if (!ACTIVATIONS.includes(activation)) throw new Error(`Bad activation: ${activation}`);
      if (!selectedId) return snapshot({ worldtext: getScene().meta.baseline, mode: "baseline" });

      const sc = getScene();
      const ch = sc.characters.find(c => c.id === selectedId);
      if (!ch) return snapshot({ worldtext: sc.meta.baseline, mode: "baseline" });

      const primaryText = pickMonologue(sc, ch.id, activation);

      // Ripple = drift nudges neighbors
      const neighbors = (ch.adjacentTo || []).slice();
      for (const nbId of neighbors) applyDrift(nbId, activation, ch);

      audit.unshift({
        tick,
        time: new Date().toLocaleTimeString(),
        characterId: ch.id,
        characterLabel: ch.label,
        activation,
        text: primaryText
      });

      tick++;
      return snapshot({ worldtext: primaryText, mode: "ripple" });
    }

    function pickMonologue(sc, characterId, activation) {
      const arr = sc.monologues?.[characterId]?.[activation];
      if (!arr || !arr.length) {
        const seed = sc.seeds?.[characterId]?.[activation] || "";
        return seed ? `${seed}\n\n(There is no full monologue yet for this activation.)` :
          "(No monologue available.)";
      }

      const d = getDrift(characterId)[activation];
      const preferred = bandIndex(arr.length, d);
      const chosen = chooseWithAvoidance(characterId, activation, arr.length, preferred);
      markUsed(characterId, activation, chosen);
      return arr[chosen];
    }

    function chooseWithAvoidance(characterId, activation, n, preferredIndex) {
      const order = [preferredIndex];
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
      usedSet.clear();
      return preferredIndex;
    }

    function bandIndex(n, driftScalar) {
      const d = clamp(driftScalar, 0, 2);
      const t = d / 2;
      return Math.round(t * (n - 1));
    }

    function applyDrift(targetId, activation, sourceChar) {
      const s = driftStrength(sourceChar);
      const d = getDrift(targetId);

      for (const a of ACTIVATIONS) {
        if (a === activation) d[a] += 0.20 * s;
        else d[a] = Math.max(0, d[a] - 0.05 * s);
      }
      for (const a of ACTIVATIONS) d[a] = clamp(d[a], 0, 2);
    }

    function driftStrength(sourceChar) {
      const s = (sourceChar?.sensitivity || "medium").toLowerCase();
      if (s === "low") return 0.6;
      if (s === "high") return 1.2;
      return 1.0;
    }

    function getDrift(id) {
      if (!drift[id]) drift[id] = { THOUGHTS: 0, FEARS: 0 };
      return drift[id];
    }

    function getUsedSet(id, activation) {
      if (!used[id]) used[id] = {};
      if (!used[id][activation]) used[id][activation] = new Set();
      return used[id][activation];
    }

    function markUsed(id, activation, idx) {
      const s = getUsedSet(id, activation);
      s.add(idx);
      if (s.size > 12) {
        s.clear();
        s.add(idx);
      }
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

    return { listScenes, loadScene, getScene, snapshot, selectCharacter, activate };
  })();

  // -----------------------------
  // UI STATE
  // -----------------------------
  let lastWorldMode = "baseline";
  let isFocusOpen = false;

  // -----------------------------
  // Init
  // -----------------------------
  function init() {
    populateScenes();
    bindUI();

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
      closeFocus();
      const snap = engine.loadScene(elScenarioSelect.value);
      render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
    });

    btnThoughts.addEventListener("click", () => onActivate("THOUGHTS"));
    btnFears.addEventListener("click", () => onActivate("FEARS"));

    // Focus overlay: click to close
    elFocusOverlay.addEventListener("click", (e) => {
      e.preventDefault();
      closeFocus();
    });

    window.addEventListener("keydown", (e) => {
      const k = e.key;

      if (k === "Escape") {
        if (isFocusOpen) {
          e.preventDefault();
          closeFocus();
        }
        return;
      }

      if (k === "ArrowLeft") { e.preventDefault(); cycleScene(-1); }
      if (k === "ArrowRight") { e.preventDefault(); cycleScene(1); }

      // Only T and F now
      if (k === "t" || k === "T") onActivate("THOUGHTS");
      if (k === "f" || k === "F") onActivate("FEARS");
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

    const sc = engine.getScene();
    const ch = sc.characters.find(c => c.id === id);

    if (ch?.image) openFocus(ch.image, ch.label || ch.id);
    else closeFocus();

    if (lastWorldMode !== "ripple") {
      if (ch) {
        const baseline = sc.meta.baseline + `\n\n[Listening to: ${ch.label}. Press T / F.]`;
        setWorldtext(baseline, { mode: "baseline" });
      }
    }
  }

  function onActivate(activation) {
    const snapBefore = engine.snapshot();
    const selectedId = snapBefore.selection.characterId;
    if (!selectedId) return;

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

    closeFocus();
    const snap = engine.loadScene(scenes[next].id);
    render(snap, { forceWorldtext: snap.uiText.worldtext, mode: snap.uiText.mode });
  }

  // -----------------------------
  // Render
  // -----------------------------
  function render(snapshot, opts = {}) {
    elScenarioPill.textContent = snapshot.meta.label;
    elTickLabel.textContent = String(snapshot.meta.tick);

    if (!snapshot.selection.characterId) elSelectedPill.textContent = "NO CHARACTER";
    else elSelectedPill.textContent = snapshot.selection.characterId.toUpperCase();

    const enabled = !!snapshot.selection.characterId;
    btnThoughts.disabled = !enabled;
    btnFears.disabled = !enabled;

    elScenarioSelect.value = snapshot.meta.sceneId;

    renderGrid(snapshot);
    renderLinks(snapshot);
    renderReplay(snapshot);

    // Keep focus overlay image in sync if selection changed via replay/link
    if (snapshot.selection.characterId) {
      const sc = engine.getScene();
      const ch = sc.characters.find(c => c.id === snapshot.selection.characterId);
      if (ch?.image) openFocus(ch.image, ch.label || ch.id);
      else closeFocus();
    } else {
      closeFocus();
    }

    if (opts.forceWorldtext != null) {
      setWorldtext(opts.forceWorldtext, { mode: opts.mode || "ripple" });
    } else if (lastWorldMode == null) {
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
      d.textContent = "No replay items yet. Select a character and trigger THOUGHTS or FEARS.";
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

    const sc = engine.getScene();
    let html = escapeHtml(String(text));

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
  // Focus overlay
  // -----------------------------
  function openFocus(src, altText) {
    if (!src) return;

    if (elFocusImage.getAttribute("src") !== src) {
      elFocusImage.setAttribute("src", src);
    }
    elFocusImage.setAttribute("alt", altText || "");

    elFocusOverlay.classList.add("open");
    elFocusOverlay.setAttribute("aria-hidden", "false");
    isFocusOpen = true;
  }

  function closeFocus() {
    elFocusOverlay.classList.remove("open");
    elFocusOverlay.setAttribute("aria-hidden", "true");
    isFocusOpen = false;
  }

  // -----------------------------
  // Visual ripple only
  // -----------------------------
  function rippleAtCharacter(characterId, activation, intensity) {
    const cell = Array.from(elGrid.querySelectorAll(".grid-cell.has-entity"))
      .find(c => c.dataset.characterId === characterId);
    if (!cell) return;

    const cls = ACT_CLASS[activation] || "thoughts";

    cell.classList.add("flash", cls);
    window.setTimeout(() => cell.classList.remove("flash", cls), 420);

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