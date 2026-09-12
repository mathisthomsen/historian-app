import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Evidoxa";

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.hero" });

  // Token values are inlined rather than referenced: ImageResponse renders in
  // Satori, which has no access to the stylesheet and no CSS custom properties.
  // If globals.css changes these colours, change them here too. The one colour
  // left is --color-primary, which is brand, not meaning.
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "hsl(36, 25%, 98.5%)",
        color: "hsl(20, 14%, 9%)",
      }}
    >
      <div
        style={{
          fontSize: 28,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "hsl(26, 10%, 38%)",
        }}
      >
        Evidoxa
      </div>
      <div style={{ fontSize: 76, lineHeight: 1.1, marginTop: 32, maxWidth: 900 }}>
        {t("headline")}
      </div>
      {/*
        A rule, not four certainty-coloured bars.

        This previously drew the four `--color-certainty-*` hues as decoration.
        They annotated nothing — the image has no assertion on it — so the one
        artefact that represents the product in every shared link, unfurl and
        search result was spending the scholarly palette on ornament. Same
        borrowing as the roadmap dots and the diagram's node strokes; widest
        reach of the three. `src/test/certainty-vocabulary.test.ts` now fails on
        these literal values as well as on the token names, because inlining
        them here is exactly what let this one through.
      */}
      <div
        style={{
          width: 240,
          height: 4,
          marginTop: 48,
          borderRadius: 999,
          background: "hsl(245,40%,36%)",
        }}
      />
    </div>,
    size,
  );
}
