#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const promptPath = path.resolve(__dirname, "..", "gpt.prompt.js");
const source = fs.readFileSync(promptPath, "utf8");
const sandbox = { window: {}, console, Math };
vm.runInNewContext(source, sandbox, { filename: "js/gpt.prompt.js" });

const p = sandbox.window.RipplesPromptBuilder;
assert.ok(p && typeof p.buildOpenAIUserPrompt === "function", "Prompt builder should expose buildOpenAIUserPrompt().");

function stubClassifyWhisperTone(text) {
  const t = String(text || "").toLowerCase();
  if (t.includes("calm")) return { tone: "calm", repeated: false };
  return { tone: "neutral", repeated: false };
}

function stubTrimForPrompt(str, maxLen) {
  const s = String(str || "").replace(/\s+/g, " ").trim();
  return s.length > maxLen ? `${s.slice(0, maxLen - 3)}...` : s;
}

function stubBuildPacketPromptContext() {
  return { promptBlock: "- Packet steering stub.", selection: {} };
}

function stubNormalizeWhitespace(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function stubUniqList(values) {
  const seen = new Set();
  const out = [];
  for (const v of (Array.isArray(values) ? values : [])) {
    const s = String(v || "").trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

const { sys, userPrompt, packetContext } = p.buildOpenAIUserPrompt({
  sc: {
    meta: { label: "Reading Room", baseline: "A quiet room with wooden chairs." },
    prompts: {
      system: "You write short interior monologues.",
      scene: "A table under yellow light.",
      whisperRule: "Whisper bends mood indirectly."
    },
    motifs: ["paper", "window"]
  },
  ch: {
    dossier: "A person balancing obligation and fatigue.",
    voice: ["plainspoken"],
    motifSeeds: ["paper"]
  },
  sceneId: "library",
  whisperText: "stay calm",
  openingLead: "the paper edge catches",
  openingLeadSource: "carryover",
  recentThoughts: [{ kind: "LISTEN", text: "A short prior thought." }],
  priorMonologueCount: 2,
  toneSteeringBlock: "- Tone steering stub.",
  focusSteeringBlock: "- Focus steering stub.",
  thoughtWordMin: 20,
  thoughtWordMax: 40,
  dynamicsPromptLine: "- Dynamics prompt line.",
  dynamicsDeltaGuidance: "- Dynamics delta guidance.",
  psyche: { arousal: 0.3, valence: 0.5, agency: 0.6, permeability: 0.4, coherence: 0.7 },
  classifyWhisperTone: stubClassifyWhisperTone,
  trimForPrompt: stubTrimForPrompt,
  buildPacketPromptContext: stubBuildPacketPromptContext,
  normalizeWhitespace: stubNormalizeWhitespace,
  uniqList: stubUniqList
});

assert.equal(sys, "You write short interior monologues.");
assert.ok(typeof userPrompt === "string" && userPrompt.includes("Generate an interior monologue."));
assert.ok(userPrompt.includes("Carry-over riff persistence (MANDATORY):"));
assert.ok(userPrompt.includes("Allow ordinary, neutral, or gently pleasant observations when natural"));
assert.ok(!userPrompt.includes("Character motif seeds:"));
assert.ok(packetContext && typeof packetContext.promptBlock === "string");

const whisperPrompt = p.buildOpenAIUserPrompt({
  sc: {
    meta: { label: "Reading Room", baseline: "A quiet room with wooden chairs." },
    prompts: {
      system: "You write short interior monologues.",
      scene: "A table under yellow light.",
      whisperRule: "Whisper bends mood indirectly."
    },
    motifs: ["paper", "window"]
  },
  ch: {
    dossier: "A person balancing obligation and fatigue.",
    voice: ["plainspoken"],
    motifSeeds: ["paper"]
  },
  sceneId: "library",
  whisperText: "stay calm stay calm",
  openingLead: "stay calm",
  openingLeadSource: "whisper",
  recentThoughts: [],
  priorMonologueCount: 0,
  toneSteeringBlock: "- Tone steering stub.",
  focusSteeringBlock: "- Focus steering stub.",
  thoughtWordMin: 20,
  thoughtWordMax: 40,
  dynamicsPromptLine: "- Dynamics prompt line.",
  dynamicsDeltaGuidance: "- Dynamics delta guidance.",
  psyche: { arousal: 0.3, valence: 0.5, agency: 0.6, permeability: 0.4, coherence: 0.7 },
  classifyWhisperTone: stubClassifyWhisperTone,
  trimForPrompt: stubTrimForPrompt,
  buildPacketPromptContext: stubBuildPacketPromptContext,
  normalizeWhitespace: stubNormalizeWhitespace,
  uniqList: stubUniqList
});
assert.ok(whisperPrompt.userPrompt.includes("Echo 2-5 distinctive words from this whisper-derived phrase"));
assert.ok(whisperPrompt.userPrompt.includes("Do not repeat the same whisper phrase twice in one monologue."));

console.log("smoke-prompt-builder: ok");
