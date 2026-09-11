import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// `next-mdx-remote` is archived as of 2026-03-26 (`archived: true` on
// hashicorp/next-mdx-remote, last push 2026-03-26 — five months before this
// dependency was added). This is a known, deliberate acceptance, not an
// oversight: our entire API surface against it is the one `compileMDX` call
// below, the call is build/request-time only, and the dependency is pinned,
// so migrating later stays cheap. Tracked in the backlog.
// `next-mdx-remote-client` is the maintained successor if/when we move off
// this package.
import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";

const CONTENT_DIR = join(process.cwd(), "content", "changelog");

export interface Release {
  version: string;
  date: string;
  title: string;
  body: ReactElement;
}

interface Frontmatter {
  version: string;
  date: string;
  title: string;
}

/**
 * Newest first. Segment-wise numeric compare — deliberately NOT
 * `localeCompare`, which is lexicographic and would rank "0.9.0" above
 * "0.10.0" once a release reaches a double-digit segment.
 */
export function compareVersionsDesc(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Reads content/changelog/{version}.{locale}.mdx, newest first.
 *
 * A release missing the requested locale falls back to the German file rather
 * than being dropped: a missing translation must never silently shorten the
 * release history.
 */
export async function listReleases(locale: string): Promise<Release[]> {
  const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".mdx"));
  const versions = [...new Set(files.map((f) => f.split(".").slice(0, 3).join(".")))];

  const releases = await Promise.all(
    versions.map(async (version) => {
      const preferred = join(CONTENT_DIR, `${version}.${locale}.mdx`);
      const fallback = join(CONTENT_DIR, `${version}.de.mdx`);
      const raw = await readFile(preferred, "utf8").catch(() => readFile(fallback, "utf8"));

      // MDX compilation is code execution: `compileMDX` evaluates the
      // compiled module via `Function`/`Reflect.construct`. This is safe only
      // because every file under content/changelog is repo-authored and
      // reviewed before merge, and because the package's safe default
      // (`blockJS: true` inherited from the underlying MDX compiler) is left
      // untouched here. If this content ever comes from a CMS, a user upload,
      // or any other external source, this loader must be revisited before
      // that happens — do not point it at untrusted input as-is.
      const { content, frontmatter } = await compileMDX<Frontmatter>({
        source: raw,
        options: { parseFrontmatter: true },
      });

      return {
        version: frontmatter.version,
        date: frontmatter.date,
        title: frontmatter.title,
        body: content,
      };
    }),
  );

  return releases.sort((a, b) => compareVersionsDesc(a.version, b.version));
}
