export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-24 bg-surface-2 rounded-md" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-surface-2 rounded-md" />
          <div className="h-4 w-80 bg-surface-2 rounded-md" />
        </div>
        <div className="h-9 w-28 bg-surface-2 rounded-md" />
      </div>
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-surface-2 rounded-md" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-surface-1 border border-border rounded-lg" />
        ))}
      </div>
    </div>
  );
}
