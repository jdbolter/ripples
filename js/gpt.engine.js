(() => {
  "use strict";

  function createEngine(opts = {}) {
    const scenes = (opts.scenes && typeof opts.scenes === "object") ? opts.scenes : {};
    const sceneOrder = Array.isArray(opts.sceneOrder) ? opts.sceneOrder : [];
    const eventKind = (opts.eventKind && typeof opts.eventKind === "object") ? opts.eventKind : { LISTEN: "LISTEN", WHISPER: "WHISPER" };
    const dynamics = normalizeDynamics(opts.dynamics);
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

    const affect = {};

    function initAffectForScene() {
      const sc = getScene();
      for (const ch of (sc.characters || [])) {
        affect[ch.id] = normalizeAffect(ch.affect0 || ch.psyche0 || {});
      }
    }

    function getPsyche(id) {
      const p = affect[id];
      if (!p) return defaultAffect();
      return {
        emotion: p.emotion,
        intensity: p.intensity
      };
    }

    function applyRipple({ sourceId, kind, whisperText, affectText = "" }) {
      const sc = getScene();
      const src = sc.characters.find((c) => c.id === sourceId);
      if (!src) return;

      if (!affect[sourceId]) initAffectForScene();

      const signal = computeAffectSignal({ kind, whisperText, affectText });
      applySignalTo(sourceId, signal, kind === eventKind.WHISPER ? dynamics.directWhisperScale : dynamics.directThoughtScale);

      for (const ch of (sc.characters || [])) {
        if (ch.id === sourceId || !affect[ch.id]) continue;
        applySignalTo(ch.id, signal, dynamics.sharedRippleScale);
      }

      stabilizeAffect();
    }

    function computeAffectSignal({ kind, whisperText, affectText }) {
      const sourceText = normalizeWhitespace(
        kind === eventKind.WHISPER
          ? (whisperText || affectText || "")
          : (affectText || whisperText || "")
      ).toLowerCase();

      const emotionLexicon = {
        calm: ["calm", "steady", "quiet", "settled", "rest", "ease", "still", "soft", "gentle", "breathe"],
        nervous: ["nervous", "worry", "worried", "fear", "panic", "danger", "unsafe", "hurry", "rush", "tense", "alarm", "dread"],
        sad: ["sad", "grief", "cry", "tears", "loss", "gone", "lonely", "hopeless", "empty", "miss", "hurt"],
        happy: ["happy", "joy", "glad", "relief", "smile", "laugh", "bright", "warm", "delight", "pleased"],
        hopeful: ["hope", "maybe", "possible", "tomorrow", "promise", "repair", "forgive", "open", "begin", "arrive"],
        angry: ["angry", "furious", "resent", "betray", "blame", "hate", "sharp", "cruel", "wrong", "unfair"],
        guarded: ["careful", "guarded", "private", "contained", "watch", "hold back", "measured", "control"]
      };

      const scores = {};
      for (const [emotion, words] of Object.entries(emotionLexicon)) {
        scores[emotion] = words.reduce((sum, word) => sum + countKeywordHits(sourceText, word), 0);
      }

      let emotion = "guarded";
      let score = 0;
      for (const [label, value] of Object.entries(scores)) {
        if (value > score) {
          emotion = label;
          score = value;
        }
      }

      if (!score) {
        if (kind === eventKind.WHISPER) {
          emotion = /!|\b(now|must|stop|run|dont|don't)\b/.test(sourceText) ? "nervous" : "guarded";
        } else {
          emotion = /\b(smile|warm|light|easier|glad)\b/.test(sourceText) ? "calm" : "guarded";
        }
      }

      const punctuationBoost = Math.min(0.10, (sourceText.match(/[!?]/g) || []).length * 0.015);
      const lengthBoost = sourceText && sourceText.length < 28 ? 0.05 : 0;
      const kindBase = kind === eventKind.WHISPER ? dynamics.whisperBaseIntensity : dynamics.listenBaseIntensity;
      const keywordBoost = Math.min(0.22, score * 0.04);
      const intensity = clamp01(kindBase + keywordBoost + punctuationBoost + lengthBoost);

      return { emotion, intensity: Math.max(0.08, intensity) };
    }

    function applySignalTo(id, signal, scale) {
      const state = affect[id];
      if (!state) return;

      const influence = clamp01(signal.intensity * Math.max(0, Number(scale) || 0));
      if (!influence) return;

      if (state.emotion === signal.emotion) {
        state.intensity = clamp01(state.intensity + influence * 0.55);
        return;
      }

      if (influence >= Math.max(0.14, state.intensity * 0.75)) {
        state.emotion = signal.emotion;
        state.intensity = clamp01((state.intensity * 0.45) + influence);
        return;
      }

      state.intensity = clamp01((state.intensity * 0.92) + influence * 0.18);
      if (state.intensity < 0.16) {
        state.emotion = softenEmotion(signal.emotion);
      }
    }

    function stabilizeAffect() {
      for (const state of Object.values(affect)) {
        if (!state) continue;
        const eased = state.intensity + (state.baselineIntensity - state.intensity) * dynamics.recoveryRate;
        state.intensity = clamp01(Math.max(0.05, eased));

        if (state.intensity <= Math.max(0.18, state.baselineIntensity + 0.04)) {
          state.emotion = state.baselineEmotion;
        }
      }
    }

    function defaultAffect() {
      return {
        emotion: "guarded",
        intensity: 0.28,
        baselineEmotion: "guarded",
        baselineIntensity: 0.28
      };
    }

    function normalizeAffect(input) {
      const base = createInitialAffect(input);
      const intensity = clamp01(numOr(base.intensity, 0.28));
      const emotion = normalizeEmotion(base.emotion);
      return {
        emotion,
        intensity,
        baselineEmotion: emotion,
        baselineIntensity: intensity
      };
    }

    function createInitialAffect(raw) {
      const explicitEmotion = normalizeEmotion(raw?.emotion || raw?.mood || raw?.affect);
      const explicitIntensity = numCoerce(raw?.intensity, NaN);
      if (explicitEmotion && Number.isFinite(explicitIntensity)) {
        return { emotion: explicitEmotion, intensity: clamp01(explicitIntensity) };
      }
      if (explicitEmotion) {
        return { emotion: explicitEmotion, intensity: 0.30 };
      }

      const legacy = upgradeLegacyPsyche(raw || {});
      const arousal = clamp01(numOr(legacy.arousal, 0.35));
      const valence = clamp01(numOr(legacy.valence, 0.50));

      let emotion = "guarded";
      if (valence >= 0.62 && arousal <= 0.48) emotion = "calm";
      else if (valence >= 0.62) emotion = "happy";
      else if (valence >= 0.52 && arousal >= 0.52) emotion = "hopeful";
      else if (valence <= 0.42 && arousal >= 0.55) emotion = "nervous";
      else if (valence <= 0.42) emotion = "sad";
      else if (arousal >= 0.68) emotion = "nervous";

      const intensity = clamp01(0.16 + Math.abs(valence - 0.5) * 0.65 + Math.abs(arousal - 0.5) * 0.55);
      return { emotion, intensity };
    }

    function upgradeLegacyPsyche(p0) {
      const hasVectorShape =
        p0 && typeof p0 === "object" &&
        ["arousal", "valence", "agency", "permeability", "coherence"].every((k) => k in p0);
      if (hasVectorShape) return p0;

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

    function softenEmotion(emotion) {
      const e = normalizeEmotion(emotion);
      if (e === "angry") return "nervous";
      if (e === "happy") return "hopeful";
      if (e === "sad") return "guarded";
      if (e === "nervous") return "guarded";
      return e || "guarded";
    }

    function normalizeEmotion(value) {
      const clean = String(value || "").trim().toLowerCase();
      const allowed = new Set(["calm", "nervous", "sad", "happy", "hopeful", "angry", "guarded"]);
      return allowed.has(clean) ? clean : "";
    }

    function countKeywordHits(text, keyword) {
      if (!text || !keyword) return 0;
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      const matches = text.match(new RegExp(`\\b${escaped}\\b`, "g"));
      return matches ? matches.length : 0;
    }

    function normalizeWhitespace(text) {
      return String(text || "").replace(/\s+/g, " ").trim();
    }

    function normalizeDynamics(raw) {
      const obj = (raw && typeof raw === "object") ? raw : {};
      return {
        directWhisperScale: Math.max(0.2, numOr(obj.directWhisperScale, 1.0)),
        directThoughtScale: Math.max(0.1, numOr(obj.directThoughtScale, 0.62)),
        sharedRippleScale: Math.max(0.05, numOr(obj.sharedRippleScale, collapseLegacyScale(obj.neighborScale, 0.18))),
        whisperBaseIntensity: clamp01(numOr(obj.whisperBaseIntensity, 0.22)),
        listenBaseIntensity: clamp01(numOr(obj.listenBaseIntensity, 0.10)),
        recoveryRate: clamp01(numOr(obj.recoveryRate, 0.10))
      };
    }

    function collapseLegacyScale(scale, fallback) {
      if (typeof scale === "number" && Number.isFinite(scale)) return scale;
      if (scale && typeof scale === "object") {
        const nums = Object.values(scale).filter((v) => typeof v === "number" && Number.isFinite(v));
        if (nums.length) return nums.reduce((sum, n) => sum + n, 0) / nums.length;
      }
      return fallback;
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
      for (const k of Object.keys(affect)) delete affect[k];
      initAffectForScene();
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
        affect: getPsyche(characterId)
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
