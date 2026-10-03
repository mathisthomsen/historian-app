import { describe, expect, it } from "vitest";

import { escapeHtml, html, joinHtml, trusted, TrustedHtml } from "@/lib/html";

describe("escapeHtml", () => {
  it.each([
    ["&", "&amp;"],
    ["<", "&lt;"],
    [">", "&gt;"],
    ['"', "&quot;"],
    ["'", "&#39;"],
  ])("escapes %j as %j", (raw, escaped) => {
    expect(escapeHtml(raw)).toBe(escaped);
  });

  it("escapes every occurrence, not just the first", () => {
    expect(escapeHtml(`<<"">>''&&`)).toBe("&lt;&lt;&quot;&quot;&gt;&gt;&#39;&#39;&amp;&amp;");
  });

  it("is not idempotent by design: an existing entity is escaped again", () => {
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
    expect(escapeHtml("&lt;script&gt;")).toBe("&amp;lt;script&amp;gt;");
  });

  it("returns the empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("passes umlauts and astral characters through unchanged", () => {
    for (const s of ["Müller Söhne ß", "😀", "𝔄", "a😀b𝔄c"]) {
      expect(escapeHtml(s)).toBe(s);
    }
  });
});

describe("html tag", () => {
  const hostile = `Müller & Söhne <script>alert(1)</script> "q" 'a'`;
  const hostileEscaped = `Müller &amp; Söhne &lt;script&gt;alert(1)&lt;/script&gt; &quot;q&quot; &#39;a&#39;`;

  it("escapes every interpolated string, in text and in attributes", () => {
    const out = html`<p title="${hostile}">${hostile}</p>`.toString();
    expect(out).toBe(`<p title="${hostileEscaped}">${hostileEscaped}</p>`);
  });

  it("does not touch the literal parts written by the developer", () => {
    expect(html`<b class="x">&copy; 1848</b>`.toString()).toBe(`<b class="x">&copy; 1848</b>`);
  });

  it("stringifies numbers", () => {
    expect(html`<i>${14}</i><i>${0}</i><i>${-1.5}</i>`.toString()).toBe(
      "<i>14</i><i>0</i><i>-1.5</i>",
    );
  });

  it("does not escape an explicitly trusted fragment", () => {
    expect(html`<p>${trusted("<br>")}</p>`.toString()).toBe("<p><br></p>");
  });

  it("nests an html fragment without double escaping, and still escapes the inner values", () => {
    const inner = html`<strong>${hostile}</strong>`;
    const outer = html`<p>${inner}</p>`;
    expect(outer.toString()).toBe(`<p><strong>${hostileEscaped}</strong></p>`);
  });

  it("escapes a plain string that merely looks like a fragment", () => {
    expect(html`<p>${"<strong>x</strong>"}</p>`.toString()).toBe(
      "<p>&lt;strong&gt;x&lt;/strong&gt;</p>",
    );
  });

  it("does not accept a forged fragment object", () => {
    const forged = { value: "<script>alert(1)</script>" };
    // @ts-expect-error -- a structural look-alike is not a TrustedHtml
    expect(() => html`<p>${forged}</p>`).toThrow(TypeError);

    const sameShape = Object.create(TrustedHtml.prototype, {
      value: { value: "<script>alert(1)</script>" },
    }) as TrustedHtml;
    expect(() => html`<p>${sameShape}</p>`).toThrow(TypeError);
  });

  it("refuses null, undefined and booleans at runtime, and at compile time", () => {
    // @ts-expect-error -- null is not an accepted interpolation
    expect(() => html`<p>${null}</p>`).toThrow(TypeError);
    // @ts-expect-error -- undefined is not an accepted interpolation
    expect(() => html`<p>${undefined}</p>`).toThrow(TypeError);
    // @ts-expect-error -- booleans are not accepted interpolations
    expect(() => html`<p>${true}</p>`).toThrow(TypeError);
  });

  it("refuses a non-finite number", () => {
    expect(() => html`<p>${Number.NaN}</p>`).toThrow(TypeError);
  });

  it("keeps a fragment's string form equal to its markup", () => {
    const f = html`<p>x</p>`;
    expect(`${f}`).toBe("<p>x</p>");
    expect(String(f)).toBe("<p>x</p>");
  });
});

describe("joinHtml", () => {
  it("joins fragments with a trusted separator and escapes plain strings", () => {
    const rows = ["a & b", "<c>"].map((v) => html`<li>${v}</li>`);
    expect(joinHtml(rows, "\n").toString()).toBe("<li>a &amp; b</li>\n<li>&lt;c&gt;</li>");
    expect(joinHtml(["a & b", html`<b>x</b>`]).toString()).toBe("a &amp; b<b>x</b>");
  });

  it("returns an empty fragment for no parts", () => {
    expect(joinHtml([]).toString()).toBe("");
  });
});
