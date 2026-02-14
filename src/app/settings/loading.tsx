export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 max-w-2xl">
      <div className="h-8 w-32 bg-surface-2 rounded-md" />
      <div className="h-4 w-64 bg-surface-2 rounded-md" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-surface-1 border border-border rounded-lg" />
        ))}
      </div>
    </div>
  );
}
