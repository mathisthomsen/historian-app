import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Sidebar skeleton */}
      <div className="fixed bottom-0 left-0 top-14 z-30 w-56 border-r bg-background">
        <div className="space-y-2 p-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-primary/10" />
          ))}
        </div>
      </div>
      {/* TopBar skeleton */}
      <div className="fixed inset-x-0 top-0 z-40 h-14 border-b bg-background">
        <div className="h-full animate-pulse bg-primary/5" />
      </div>
      {/* Content skeleton */}
      <div className="pl-56 pt-14">
        <PageSkeleton variant="card-grid" />
      </div>
    </div>
  );
}
