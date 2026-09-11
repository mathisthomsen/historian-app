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
  // If globals.css changes these colours, change them here too.
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
      <div style={{ display: "flex", gap: 12, marginTop: 48 }}>
        {["hsl(180,50%,30%)", "hsl(215,50%,38%)", "hsl(265,35%,45%)", "hsl(38,65%,45%)"].map(
          (c) => (
            <div key={c} style={{ width: 120, height: 10, borderRadius: 999, background: c }} />
          ),
        )}
      </div>
    </div>,
    size,
  );
}
