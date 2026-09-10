interface HighlightPanelProps {
  kicker: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}

export function HighlightPanel({ kicker, title, body, children }: HighlightPanelProps) {
  return (
    <article className="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
      <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">{kicker}</p>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
      {children ? <div className="mt-auto pt-4">{children}</div> : null}
    </article>
  );
}
