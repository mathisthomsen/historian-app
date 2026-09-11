import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

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
 * Reads content/changelog/{version}.{locale}.mdx, newest first.
 *
 * A release missing the requested locale falls back to the German file rather
 * than being dropped: a missing translation must never silently shorten the
 * release history.
 */
export async function listReleases(locale: string): Promise<Release[]> {
  const files = await readdir(CONTENT_DIR);
  const versions = [...new Set(files.map((f) => f.split(".").slice(0, 3).join(".")))];

  const releases = await Promise.all(
    versions.map(async (version) => {
      const preferred = join(CONTENT_DIR, `${version}.${locale}.mdx`);
      const fallback = join(CONTENT_DIR, `${version}.de.mdx`);
      const raw = await readFile(preferred, "utf8").catch(() => readFile(fallback, "utf8"));

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

  return releases.sort((a, b) => b.version.localeCompare(a.version));
}
