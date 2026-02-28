#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class FakeClassList {
  constructor() { this._set = new Set(); }
  add(...items) { for (const i of items) this._set.add(i); }
  remove(...items) { for (const i of items) this._set.delete(i); }
  toggle(item, force) {
    if (force === undefined) {
      if (this._set.has(item)) this._set.delete(item);
      else this._set.add(item);
      return;
    }
    if (force) this._set.add(item);
    else this._set.delete(item);
  }
}

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.value = "";
    this.disabled = false;
    this.innerHTML = "";
    this.textContent = "";
    this.className = "";
    this.style = {};
    this.dataset = {};
    this.classList = new FakeClassList();
    this._attrs = new Map();
    this._events = new Map();
    this._children = [];
  }
  addEventListener(type, fn) { this._events.set(type, fn); }
  appendChild(child) { this._children.push(child); }
  querySelectorAll() { return []; }
  setAttribute(k, v) { this._attrs.set(k, String(v)); }
  getAttribute(k) { return this._attrs.has(k) ? this._attrs.get(k) : null; }
  getBoundingClientRect() { return { width: 400, height: 200 }; }
}

const ids = [
  "scenarioSelect", "grid", "linkLayer", "worldtext", "auditLog", "selectedPill",
  "whisperInput", "whisperSend",
  "focusOverlay", "focusImage", "focusMessage",
  "apiModal", "apiKeyInput", "apiKeyStatus", "apiSubmit"
];
const nodes = new Map(ids.map((id) => [id, new FakeElement(id)]));

const sandbox = {
  window: {
    addEventListener() {},
    setTimeout,
    clearTimeout
  },
  console,
  document: {
    getElementById(id) { return nodes.get(id) || null; },
    createElement() { return new FakeElement(); },
    createElementNS() { return new FakeElement(); },
    documentElement: { style: { setProperty() {} } }
  },
  Image: class { decode() { return Promise.resolve(); } },
  setTimeout,
  clearTimeout
};

const uiPath = path.resolve(__dirname, "..", "gpt.ui.js");
const source = fs.readFileSync(uiPath, "utf8");
vm.runInNewContext(source, sandbox, { filename: "js/gpt.ui.js" });

const api = sandbox.window.RipplesUI;
assert.ok(api && typeof api.createUIController === "function", "UI module should expose createUIController().");

const controller = api.createUIController({
  eventKind: { LISTEN: "LISTEN", WHISPER: "WHISPER" },
  getScene: () => ({ characters: [{ id: "a", label: "A", adjacentTo: [] }] })
});

controller.populateScenes([{ id: "s1", label: "Scene 1" }]);
controller.bindUI({
  onScenarioChange: () => {},
  onWhisperSend: () => {},
  onApiSubmit: async () => {},
  onCycleScene: () => {},
  onSelectCharacter: () => {},
  onResize: () => {}
});

controller.render({
  meta: { sceneId: "s1", label: "Scene 1", title: "Title", tick: 0 },
  scene: { cols: 2, rows: 1, baseline: "Baseline." },
  characters: [{ id: "a", label: "A", icon: "•", position: { x: 0, y: 0 }, adjacentTo: [] }],
  selection: { characterId: "a" },
  audit: [],
  uiText: { worldtext: null, mode: null }
}, { forceWorldtext: "A baseline line.", mode: "baseline" });

controller.setWorldtext("A notices A.", { mode: "ripple" });
controller.openPrompt("Select a character");
controller.openFocusImage("img.png", "A");
controller.closeFocus();
controller.flashRippleFor("a");
controller.setApiKeyChecking(true);
controller.setApiKeyStatus("status", false);
controller.showApiModal();
controller.hideApiModal();

assert.ok(typeof controller.getDefaultSelectedPillText() === "string");
console.log("smoke-ui: ok");
