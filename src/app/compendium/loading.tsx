export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-surface-2 rounded-md" />
      <div className="h-4 w-80 bg-surface-2 rounded-md" />
      <div className="h-10 w-full max-w-xl bg-surface-2 rounded-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-surface-1 border border-border rounded-lg" />
        ))}
      </div>
    </div>
  );
}
