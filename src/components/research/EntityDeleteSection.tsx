/**
 * Shared bottom-of-page region for an entity detail page's delete control.
 *
 * A solid destructive button in the PageHeader next to Edit claims too much
 * of the page's visual weight — Edit is the frequent, primary action; Delete
 * is rare and consequential. Moving Delete here, below the tab content, in
 * its own separated region with a low-emphasis (outline/ghost) treatment,
 * keeps it reachable without competing with Edit (issue #70).
 *
 * Shared across persons/events/sources detail pages so the three stay
 * visually identical per architecture.md §3 ("every entity detail page
 * shares one layout") — each page passes its own translated description and
 * its own Delete*Button as children.
 */
export function EntityDeleteSection({
  description,
  children,
}: {
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">{description}</p>
      {children}
    </div>
  );
}
