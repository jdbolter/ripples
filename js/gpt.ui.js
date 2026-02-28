(() => {
  "use strict";

  function createUIController(opts = {}) {
    const eventKind = (opts.eventKind && typeof opts.eventKind === "object")
      ? opts.eventKind
      : { LISTEN: "LISTEN", WHISPER: "WHISPER" };
    const getScene = (typeof opts.getScene === "function")
      ? opts.getScene
      : () => ({ characters: [] });

    const elScenarioSelect = byId("scenarioSelect");
    const elGrid = byId("grid");
    const elLinks = byId("linkLayer");
    const elWorldtext = byId("worldtext");
    const elAuditLog = byId("auditLog");
    const elSelectedPill = byId("selectedPill");
    const defaultSelectedPillText = String(elSelectedPill.textContent || "").trim() || "NO CHARACTER";

    const elWhisperInput = byId("whisperInput");
    const btnWhisperSend = byId("whisperSend");

    const elFocusOverlay = byId("focusOverlay");
    const elFocusImage = byId("focusImage");
    const elFocusMessage = byId("focusMessage");

    const elApiModal = byId("apiModal");
    const elApiKeyInput = byId("apiKeyInput");
    const elApiKeyStatus = byId("apiKeyStatus");
    const btnApiSubmit = byId("apiSubmit");

    let lastWorldMode = "baseline";
    let isFocusOpen = false;
    let focusMode = "none"; // "none" | "prompt" | "photo"
    const handlers = {
      onScenarioChange: () => {},
      onWhisperSend: () => {},
      onApiSubmit: () => {},
      onCycleScene: () => {},
      onSelectCharacter: () => {},
      onResize: () => {}
    };

    function bindUI(h = {}) {
      handlers.onScenarioChange = typeof h.onScenarioChange === "function" ? h.onScenarioChange : handlers.onScenarioChange;
      handlers.onWhisperSend = typeof h.onWhisperSend === "function" ? h.onWhisperSend : handlers.onWhisperSend;
      handlers.onApiSubmit = typeof h.onApiSubmit === "function" ? h.onApiSubmit : handlers.onApiSubmit;
      handlers.onCycleScene = typeof h.onCycleScene === "function" ? h.onCycleScene : handlers.onCycleScene;
      handlers.onSelectCharacter = typeof h.onSelectCharacter === "function" ? h.onSelectCharacter : handlers.onSelectCharacter;
      handlers.onResize = typeof h.onResize === "function" ? h.onResize : handlers.onResize;

      elScenarioSelect.addEventListener("change", () => {
        handlers.onScenarioChange(elScenarioSelect.value);
      });

      btnApiSubmit.addEventListener("click", async () => {
        await handlers.onApiSubmit();
      });

      elApiKeyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void handlers.onApiSubmit();
        }
      });

      btnWhisperSend.addEventListener("click", () => {
        handlers.onWhisperSend();
      });

      elWhisperInput.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
        e.preventDefault();
        handlers.onWhisperSend();
      });

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

        if (k === "ArrowLeft") { e.preventDefault(); handlers.onCycleScene(-1); }
        if (k === "ArrowRight") { e.preventDefault(); handlers.onCycleScene(1); }
      });

      window.addEventListener("resize", () => {
        clearTimeout(window.__linksDebounce);
        window.__linksDebounce = setTimeout(() => handlers.onResize(), 120);
      });
    }

    function populateScenes(scenes) {
      elScenarioSelect.innerHTML = "";
      for (const s of (Array.isArray(scenes) ? scenes : [])) {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.label;
        elScenarioSelect.appendChild(opt);
      }
    }

    function render(snapshot, opts = {}) {
      if (!snapshot.selection.characterId) {
        elSelectedPill.textContent = defaultSelectedPillText;
      } else {
        const ch = (snapshot.characters || []).find((c) => c.id === snapshot.selection.characterId);
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
            inner.className = `grid-entity${hasPhoto ? " has-photo" : ""}`;

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
            cell.addEventListener("click", () => handlers.onSelectCharacter(ch.id));
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

      const whispers = snapshot.audit.filter((entry) => entry.kind === eventKind.WHISPER);
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
          handlers.onSelectCharacter(entry.characterId);
        });

        elAuditLog.appendChild(item);
      }
    }

    function setWorldtext(text, opts = {}) {
      const mode = opts.mode || "baseline";
      lastWorldMode = mode;

      const sc = getScene();
      let html = escapeHtml(String(text));

      const tokens = [];
      for (const ch of (sc.characters || [])) {
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

      elWorldtext.querySelectorAll(".entity-link").forEach((span) => {
        span.addEventListener("click", (e) => {
          const id = e.currentTarget.getAttribute("data-character");
          if (id) handlers.onSelectCharacter(id);
        });
      });
    }

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

    function preloadSceneImages(scene) {
      if (!scene?.characters) return;
      for (const ch of scene.characters) {
        if (!ch.image) continue;
        const img = new Image();
        img.src = ch.image;
        if (img.decode) img.decode().catch(() => {});
      }
    }

    function flashRippleFor(characterId) {
      const sc = getScene();
      const ch = sc.characters.find((c) => c.id === characterId);
      if (!ch) return;

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
        .find((c) => c.dataset.characterId === characterId);
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

    function setApiKeyChecking(loading) {
      const disabled = !!loading;
      btnApiSubmit.disabled = disabled;
      elApiKeyInput.disabled = disabled;
    }

    function setApiKeyStatus(message, isError) {
      elApiKeyStatus.textContent = String(message || "");
      elApiKeyStatus.classList.toggle("error", !!isError);
    }

    function getApiKeyInputValue() {
      return String(elApiKeyInput.value || "");
    }

    function clearApiKeyInput() {
      elApiKeyInput.value = "";
    }

    function hideApiModal() {
      elApiModal.classList.add("hidden");
    }

    function showApiModal() {
      elApiModal.classList.remove("hidden");
      window.setTimeout(() => {
        if (!elApiKeyInput.disabled) elApiKeyInput.focus();
      }, 0);
    }

    function getWhisperValue() {
      return String(elWhisperInput.value || "");
    }

    function clearWhisperValue() {
      elWhisperInput.value = "";
    }

    function getScenarioValue() {
      return elScenarioSelect.value;
    }

    function setScenarioValue(value) {
      elScenarioSelect.value = String(value || "");
    }

    function getFocusMode() {
      return focusMode;
    }

    function getFocusImageState() {
      return {
        src: elFocusImage.getAttribute("src"),
        alt: elFocusImage.getAttribute("alt") || ""
      };
    }

    function setSelectedPillText(text) {
      elSelectedPill.textContent = String(text || defaultSelectedPillText);
    }

    function getDefaultSelectedPillText() {
      return defaultSelectedPillText;
    }

    return {
      bindUI,
      populateScenes,
      render,
      renderGrid,
      renderLinks,
      renderReplay,
      setWorldtext,
      openPrompt,
      openFocusImage,
      closeFocus,
      preloadSceneImages,
      flashRippleFor,
      setApiKeyChecking,
      setApiKeyStatus,
      getApiKeyInputValue,
      clearApiKeyInput,
      hideApiModal,
      showApiModal,
      getWhisperValue,
      clearWhisperValue,
      getScenarioValue,
      setScenarioValue,
      getFocusMode,
      getFocusImageState,
      setSelectedPillText,
      getDefaultSelectedPillText
    };
  }

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

  window.RipplesUI = Object.freeze({
    createUIController
  });
})();
