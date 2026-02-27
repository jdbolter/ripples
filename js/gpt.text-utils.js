(() => {
  "use strict";

  function stripOuterQuotes(text) {
    return String(text || "").trim().replace(/^“|^"/, "").replace(/”$|"$/, "").trim();
  }

  function normalizeWhitespace(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function cleanSpacing(text) {
    return normalizeWhitespace(text)
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .trim();
  }

  function splitWords(text) {
    return normalizeWhitespace(text).split(" ").filter(Boolean);
  }

  function wordCount(words) {
    const tokens = Array.isArray(words) ? words : splitWords(words);
    return tokens.filter((w) => /[A-Za-z0-9]/.test(w)).length;
  }

  function canonicalToken(token) {
    return String(token || "")
      .toLowerCase()
      .replace(/[’]/g, "'")
      .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
  }

  function splitClauses(text) {
    const t = normalizeWhitespace(text);
    if (!t) return [];

    const parts = t
      .split(/(?<=[.!?;:])\s+/)
      .map((s) => normalizeWhitespace(s))
      .filter(Boolean);

    return parts.length ? parts : [t];
  }

  function truncateToWordCount(text, maxWords) {
    const words = splitWords(text);
    if (wordCount(words) <= maxWords) return normalizeWhitespace(text);
    const out = [];
    let seen = 0;
    for (const w of words) {
      const isWord = /[A-Za-z0-9]/.test(w);
      if (isWord && seen >= maxWords) break;
      out.push(w);
      if (isWord) seen += 1;
    }
    return normalizeWhitespace(out.join(" "));
  }

  function isDanglingEndToken(token) {
    const t = canonicalToken(token);
    if (!t) return false;

    const dangling = new Set([
      "a", "an", "the",
      "to", "of", "in", "on", "at", "for", "from", "with", "by",
      "as", "if", "than", "that", "which", "who", "whom", "whose",
      "and", "or", "but", "nor", "so", "yet",
      "about", "above", "across", "after", "against", "along", "around",
      "before", "behind", "below", "beneath", "beside", "between", "beyond",
      "during", "into", "near", "onto", "over", "through", "toward", "towards",
      "under", "until", "upon", "within", "without", "since", "per", "via"
    ]);

    return dangling.has(t);
  }

  function trimDanglingEnding(text, minWords = 0) {
    const words = splitWords(text);
    while (words.length && isDanglingEndToken(words[words.length - 1])) {
      if (wordCount(words) <= minWords) break;
      words.pop();
    }
    return normalizeWhitespace(words.join(" "));
  }

  function ensureTerminalPunctuation(text) {
    const t = normalizeWhitespace(text).replace(/…/g, "...");
    if (!t) return t;
    if (/\.\.\.$/.test(t) || /[.!?]$/.test(t)) return t;
    const clipped = t.replace(/[;:,]+$/, "");
    return `${clipped}...`;
  }

  function randInt(min, max) {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }

  function clampWordRange(text, { minWords, maxWords, fallback }) {
    let out = truncateToWordCount(text, maxWords);
    if (wordCount(out) >= minWords) return out;

    const source = splitWords(normalizeWhitespace(fallback || ""));
    if (!source.length) return out;

    const needed = Math.max(0, minWords - wordCount(out));
    if (!needed) return out;

    const base = splitWords(out);
    const start = randInt(0, Math.max(0, source.length - needed));
    const add = source.slice(start, start + needed);
    return truncateToWordCount(normalizeWhitespace(base.concat(add).join(" ")), maxWords);
  }

  window.RipplesTextUtils = Object.freeze({
    stripOuterQuotes,
    normalizeWhitespace,
    cleanSpacing,
    splitWords,
    wordCount,
    canonicalToken,
    splitClauses,
    truncateToWordCount,
    trimDanglingEnding,
    ensureTerminalPunctuation,
    randInt,
    clampWordRange
  });
})();
