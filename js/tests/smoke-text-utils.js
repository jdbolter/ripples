#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const utilsPath = path.resolve(__dirname, "..", "gpt.text-utils.js");
const source = fs.readFileSync(utilsPath, "utf8");
const sandbox = { window: {}, console };
vm.runInNewContext(source, sandbox, { filename: "js/gpt.text-utils.js" });

const u = sandbox.window.RipplesTextUtils;
assert.ok(u, "RipplesTextUtils should be defined on window.");

assert.equal(u.normalizeWhitespace("  one \n two\tthree  "), "one two three");
assert.equal(u.stripOuterQuotes(" \"hello\" "), "hello");
assert.equal(u.cleanSpacing("A  ,  b  !"), "A, b!");

assert.deepEqual(
  Array.from(u.splitClauses("First part. Second part? Third part!")),
  ["First part.", "Second part?", "Third part!"]
);

assert.equal(u.wordCount("alpha beta gamma"), 3);
assert.equal(u.canonicalToken("“Frame,”"), "frame");

const truncated = u.truncateToWordCount("one two three four five", 3);
assert.ok(u.wordCount(truncated) <= 3, "truncateToWordCount should cap to max words.");

assert.equal(u.trimDanglingEnding("carry this to", 1), "carry this");
assert.equal(u.ensureTerminalPunctuation("No ending yet"), "No ending yet...");

const clamped = u.clampWordRange("short phrase", {
  minWords: 4,
  maxWords: 6,
  fallback: "fallback words keep this stable"
});
assert.ok(
  u.wordCount(clamped) >= 4 && u.wordCount(clamped) <= 6,
  "clampWordRange should return text inside min/max bounds."
);

console.log("smoke-text-utils: ok");
