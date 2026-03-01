#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const enginePath = path.resolve(__dirname, "..", "gpt.engine.js");
const source = fs.readFileSync(enginePath, "utf8");
const sandbox = { window: {}, console, Date, Math };
vm.runInNewContext(source, sandbox, { filename: "js/gpt.engine.js" });

const api = sandbox.window.RipplesEngine;
assert.ok(api && typeof api.createEngine === "function", "Engine module should expose createEngine().");

let resetCalls = 0;
const scenes = {
  reading_room: {
    meta: { label: "Reading Room", title: "Room", cols: 2, rows: 1, baseline: "Baseline text." },
    characters: [
      { id: "a", label: "A", adjacentTo: ["b"], psyche0: {} },
      { id: "b", label: "B", adjacentTo: ["a"], psyche0: {} }
    ],
    monologues: {
      a: { THOUGHTS: ["one line", "another line"] },
      b: { THOUGHTS: ["side line"] }
    },
    seeds: {}
  }
};

const engine = api.createEngine({
  scenes,
  sceneOrder: [{ id: "reading_room", label: "Reading Room" }],
  eventKind: { LISTEN: "LISTEN", WHISPER: "WHISPER" },
  dynamics: {
    neighborScale: { arousal: 0.6, valence: 0.4, agency: 0.3, permeability: 0.5, coherence: 0.3 },
    stabilization: { arousal: -0.001, coherence: 0.001 },
    whisperBase: { arousal: 0.1, permeability: 0.08, coherence: -0.03 },
    listenBase: { arousal: -0.01, valence: 0.01, agency: 0.005, permeability: 0.01, coherence: 0.01 }
  },
  resetApiNarrativeState: () => { resetCalls += 1; },
  extractLastSentenceOrFragment: () => "tail fragment",
  continuityLeadMaxWords: 16
});

assert.equal(engine.listScenes().length, 1);
const snap = engine.loadScene("reading_room");
assert.equal(resetCalls, 1);
assert.equal(snap.meta.sceneId, "reading_room");
assert.equal(snap.selection.characterId, null);

engine.selectCharacter("a");
assert.equal(engine.getSelectedId(), "a");

engine.recordWhisper("a", "stay calm");
assert.equal(engine.getLastWhisper("a"), "stay calm");
assert.equal(engine.getWhisperHistory(5).length, 1);

const m = engine.nextMonologue("a", "THOUGHTS");
assert.ok(["one line", "another line"].includes(m));

engine.applyRipple({ sourceId: "a", kind: "WHISPER", whisperText: "danger now!" });
const pa = engine.getPsyche("a");
const pb = engine.getPsyche("b");
for (const v of [pa.arousal, pa.valence, pa.agency, pa.permeability, pa.coherence, pb.arousal, pb.valence, pb.agency, pb.permeability, pb.coherence]) {
  assert.ok(v >= 0 && v <= 1, "Psyche values must remain clamped to [0, 1].");
}

engine.newTrace({ kind: "LISTEN", characterId: "a", channel: "THOUGHTS", text: "A trace line." });
assert.equal(engine.getMonologueCount("a"), 1);
assert.equal(engine.getRecentMonologues("a", 3).length, 1);

engine.setOpeningBufferFromThought("a", "One sentence. Another sentence.");
assert.equal(engine.getOpeningBuffer("a"), "tail fragment");
assert.equal(engine.getOpeningBuffer("b"), "");

console.log("smoke-engine: ok");
