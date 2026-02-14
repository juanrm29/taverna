export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-36 bg-surface-2 rounded-md" />
      <div className="h-4 w-56 bg-surface-2 rounded-md" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="h-48 bg-surface-1 border border-border rounded-lg" />
          <div className="h-12 bg-surface-2 rounded-md" />
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-10 w-14 bg-surface-1 border border-border rounded-md" />
            ))}
          </div>
        </div>
        <div className="h-64 bg-surface-1 border border-border rounded-lg" />
      </div>
    </div>
  );
}
