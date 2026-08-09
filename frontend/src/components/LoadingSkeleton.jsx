export function Skeleton({ className = '' }) {
  return <div className={`animate-skeleton rounded-lg bg-surface-3 ${className}`} aria-hidden="true" />;
}

export default function LoadingSkeleton({ count = 3, variant = 'list' }) {
  if (variant === 'card') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
            <div className="mt-4 flex items-center justify-between">
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12" role="status" aria-label="Loading">
      <Skeleton className="h-40 w-full max-w-md" />
      <Skeleton className="mt-4 h-4 w-64" />
      <Skeleton className="mt-2 h-4 w-40" />
    </div>
  );
}
