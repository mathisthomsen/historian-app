/**
 * Generates `sanitize-pairs.json`: input -> stored pairs produced by the REAL
 * `sanitize()` of #150 (sanitize-html with `allowedTags: []`,
 * `allowedAttributes: {}`, exactly the options of the former
 * `src/lib/sanitize.ts`).
 *
 * Provenance only. The JSON is the artifact; the backfill tests read it so they
 * keep working after T3 deletes `sanitize()` and drops `sanitize-html`. Once
 * that has happened this script can no longer run (it needs sanitize-html@2.17.1
 * and the seed below is only reproducible against that version). Run it from
 * the repo root, before T3:
 *
 *   node src/lib/backfill-150/__fixtures__/generate-sanitize-pairs.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sanitizeHtml from "sanitize-html";

const SEED = 150;
const FUZZ_COUNT = 400;

const sanitize = (input) => sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });

// Mulberry32: small, deterministic.
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The measured table of the plan ("What sanitize() does today") plus the
// cases the backfill must get right.
const curated = [
  "Müller & Söhne",
  "Briefe 1848 < 1850",
  "x > y",
  '"Faust"',
  "Gretchen's",
  "<b>x</b>",
  "<script>alert(1)</script>",
  "a<b",
  "x<y and more text",
  "fol. 12r <sic>",
  "[sic] <unclear>Wort</unclear>",
  "&amp;",
  "&lt;script&gt;",
  "&lt;",
  "&gt;",
  "&amp;lt;",
  "&amp;amp;",
  "&amp;gt;",
  "&lt;&amp;&gt;",
  "&copy;",
  "&#65;",
  "&nbsp;",
  "&quot;",
  "&foo;",
  "AT&T",
  "R&D & Q&A",
  "Tom & Jerry & Co.",
  "a && b",
  "1 < 2 > 0",
  "<<",
  "<</",
  "< /b>",
  "<!-- c -->",
  "<?xml?>",
  "3 &lt; 4",
  "Ludwig van Beethoven & Söhne (Wien) <1827>",
  "",
  " ",
  "plain text",
  "Köln & Düsseldorf; Straße & Platz",
  "&&&&",
  "<<<>>>",
  "a & b & c & d & e & f & g & h & i & j & k & l",
  "&#38;amp;",
  "&#x26;lt;",
  "&AMP;",
  "&Lt;",
  "x &lt;b&gt;y&lt;/b&gt; z",
  "&amp;lt;b&amp;gt;",
  "emoji 😀 & 𝔘𝔫𝔦",
  "line one\nline & two\r\nline < three",
  "tab\t&\t<",
];

const atoms = [
  "&",
  "&",
  "<",
  ">",
  ";",
  "#",
  '"',
  "'",
  "/",
  "!",
  "-",
  "=",
  "?",
  "amp",
  "lt",
  "gt",
  "quot",
  "script",
  "b",
  "i",
  "sic",
  "x",
  "y",
  "a",
  "B",
  "1",
  "42",
  "Müller",
  "Söhne",
  " ",
  " ",
  " ",
  "\n",
  "&amp;",
  "&lt;",
  "&gt;",
  "&amp;lt;",
  "&amp;amp;",
  "&#38;",
  "&#x3c;",
  "&copy;",
  "<b>",
  "</b>",
  "<sic>",
  "<script>",
  "</script>",
  "<!--",
  "-->",
  "<br/>",
];

const next = prng(SEED);
const pick = (list) => list[Math.floor(next() * list.length)];

const inputs = new Set(curated);
let guard = 0;
while (inputs.size < curated.length + FUZZ_COUNT && guard++ < 100000) {
  const n = 1 + Math.floor(next() * 12);
  let s = "";
  for (let i = 0; i < n; i++) s += pick(atoms);
  inputs.add(s);
}

const pairs = [...inputs].map((input) => ({ input, stored: sanitize(input) }));

const out = {
  generator: "generate-sanitize-pairs.mjs",
  sanitizeHtml: "2.17.1",
  options: { allowedTags: [], allowedAttributes: {} },
  seed: SEED,
  pairs,
};

writeFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "sanitize-pairs.json"),
  JSON.stringify(out, null, 1) + "\n",
);
console.log(`${pairs.length} pairs`);
