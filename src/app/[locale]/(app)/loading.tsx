import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Sidebar skeleton */}
      <div className="bg-background fixed top-14 bottom-0 left-0 z-30 w-56 border-r">
        <div className="space-y-2 p-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-primary/10 h-9 animate-pulse rounded-md" />
          ))}
        </div>
      </div>
      {/* TopBar skeleton */}
      <div className="bg-background fixed inset-x-0 top-0 z-40 h-14 border-b">
        <div className="bg-primary/5 h-full animate-pulse" />
      </div>
      {/* Content skeleton */}
      <div className="pt-14 pl-56">
        <PageSkeleton variant="card-grid" />
      </div>
    </div>
  );
}
