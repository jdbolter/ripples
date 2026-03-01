(() => {
  "use strict";

  function createEngine(opts = {}) {
    const scenes = (opts.scenes && typeof opts.scenes === "object") ? opts.scenes : {};
    const sceneOrder = Array.isArray(opts.sceneOrder) ? opts.sceneOrder : [];
    const eventKind = (opts.eventKind && typeof opts.eventKind === "object") ? opts.eventKind : { LISTEN: "LISTEN", WHISPER: "WHISPER" };
    const dynamics = (opts.dynamics && typeof opts.dynamics === "object") ? opts.dynamics : {
      neighborScale: 0.55,
      stabilization: { arousal: -0.001, coherence: 0.001 },
      whisperBase: { arousal: 0.12, permeability: 0.10, coherence: -0.03 },
      listenBase: { arousal: -0.01, valence: 0.01, agency: 0.005, permeability: 0.015, coherence: 0.01 }
    };
    const resetApiNarrativeState = (typeof opts.resetApiNarrativeState === "function")
      ? opts.resetApiNarrativeState
      : () => {};
    const extractLastSentenceOrFragment = (typeof opts.extractLastSentenceOrFragment === "function")
      ? opts.extractLastSentenceOrFragment
      : (text) => String(text || "").trim();
    const continuityLeadMaxWords = Math.max(1, Number(opts.continuityLeadMaxWords) || 16);

    let sceneId = sceneOrder[0]?.id || Object.keys(scenes)[0];
    let tick = 0;
    let selectedId = null;

    const cursor = {};
    const cursorRecent = {};

    const lastWhisper = {};
    const whisperHistory = [];
    const openingBufferByCharacter = {};

    const psyche = {};

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
      const src = sc.characters.find((c) => c.id === sourceId);
      if (!src) return;

      if (!psyche[sourceId]) initPsycheForScene();

      const delta =
        (deltaOverride && typeof deltaOverride === "object")
          ? sanitizeDelta(deltaOverride)
          : computeDelta(kind, whisperText);

      applyDeltaTo(sourceId, delta, 1.0);

      const nbs = (src.adjacentTo || []).slice();
      for (const nbId of nbs) {
        applyDeltaTo(nbId, delta, dynamics.neighborScale);
      }

      for (const ch of (sc.characters || [])) {
        if (!psyche[ch.id]) continue;
        psyche[ch.id].arousal = clamp01(psyche[ch.id].arousal + dynamics.stabilization.arousal);
        psyche[ch.id].coherence = clamp01(psyche[ch.id].coherence + dynamics.stabilization.coherence);
      }
    }

    function computeDelta(kind, whisperText) {
      let arousal = 0;
      let valence = 0;
      let agency = 0;
      let permeability = 0;
      let coherence = 0;

      if (kind === eventKind.WHISPER) {
        arousal += dynamics.whisperBase.arousal;
        permeability += dynamics.whisperBase.permeability;
        coherence += dynamics.whisperBase.coherence;

        const w = String(whisperText || "").toLowerCase();

        const neg = [
          "fear", "danger", "blood", "die", "dead", "dark", "cold", "threat", "loss", "gone", "alone", "unsafe", "panic",
          "sad", "sorrow", "grief", "cry", "tears", "depressed", "depress", "misery", "hopeless", "lonely"
        ];
        const pos = [
          "warm", "light", "forgive", "tender", "safe", "home", "quiet", "kind", "hold", "soft",
          "happy", "joy", "joyful", "smile", "glad", "delight", "hope", "bright"
        ];

        if (neg.some((k) => w.includes(k))) {
          arousal += 0.10;
          valence -= 0.12;
          agency -= 0.07;
          coherence -= 0.05;
        }
        if (pos.some((k) => w.includes(k))) {
          arousal -= 0.05;
          valence += 0.10;
          agency += 0.06;
          permeability += 0.03;
          coherence += 0.04;
        }

        const urgent = ["now", "hurry", "must", "never", "don't", "dont", "stop", "run"];
        if (urgent.some((k) => w.includes(k))) {
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
        arousal += dynamics.listenBase.arousal;
        valence += dynamics.listenBase.valence;
        agency += dynamics.listenBase.agency;
        permeability += dynamics.listenBase.permeability;
        coherence += dynamics.listenBase.coherence;
      }

      return { arousal, valence, agency, permeability, coherence };
    }

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

    let audit = [];

    function loadScene(newSceneId) {
      if (!scenes[newSceneId]) throw new Error(`Unknown scene: ${newSceneId}`);
      sceneId = newSceneId;
      resetApiNarrativeState(newSceneId);
      tick = 0;
      selectedId = null;
      audit = [];
      for (const k of Object.keys(cursor)) delete cursor[k];
      for (const k of Object.keys(cursorRecent)) delete cursorRecent[k];
      for (const k of Object.keys(lastWhisper)) delete lastWhisper[k];
      whisperHistory.length = 0;
      for (const k of Object.keys(openingBufferByCharacter)) delete openingBufferByCharacter[k];
      for (const k of Object.keys(psyche)) delete psyche[k];
      initPsycheForScene();
      return snapshot({ worldtext: getScene().meta.baseline, mode: "baseline" });
    }

    function getScene() { return scenes[sceneId]; }
    function getSceneId() { return sceneId; }
    function listScenes() { return sceneOrder.slice(); }

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

    function getOpeningBuffer(characterId) {
      return openingBufferByCharacter[characterId] || "";
    }

    function setOpeningBufferFromThought(characterId, text) {
      const id = String(characterId || "").trim();
      if (!id) return "";
      openingBufferByCharacter[id] = extractLastSentenceOrFragment(text, continuityLeadMaxWords);
      return openingBufferByCharacter[id];
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
      const ch = sc.characters.find((c) => c.id === characterId);
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
        psyche: getPsyche(characterId)
      };

      pushTrace(entry);
      tick += 1;
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
      getOpeningBuffer,
      setOpeningBufferFromThought,
      getPsyche,
      applyRipple
    };
  }

  window.RipplesEngine = Object.freeze({
    createEngine
  });
})();
