/**
 * Loading placeholder. Uses the same glass surfaces as real content so the
 * swap-in reads as the page settling rather than a different screen.
 */
export function PageSkeleton() {
  return (
    <div className="p-5 space-y-4">
      {/* Header placeholder */}
      <div className="flex items-center gap-3 py-2">
        <div className="w-9 h-9 rounded-full glass-well shimmer" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 rounded-full w-32 glass-well shimmer" />
          <div className="h-3 rounded-full w-20 glass-well shimmer" />
        </div>
      </div>

      {/* Card placeholders */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="glass-card p-4 space-y-3 anim-rise"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div className="h-4 rounded-full w-3/4 glass-well shimmer" />
          <div className="h-3 rounded-full w-full glass-well shimmer" />
          <div className="h-3 rounded-full w-4/5 glass-well shimmer" />
        </div>
      ))}
    </div>
  )
}
