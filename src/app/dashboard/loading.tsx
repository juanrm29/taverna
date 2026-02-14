export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-surface-2 rounded-md" />
      <div className="h-4 w-64 bg-surface-2 rounded-md" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 bg-surface-1 border border-border rounded-lg" />
        ))}
      </div>
    </div>
  );
}
