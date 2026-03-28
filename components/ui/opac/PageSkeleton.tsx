export function PageSkeleton() {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      {/* Header placeholder */}
      <div className="flex items-center gap-3 py-2">
        <div className="w-9 h-9 rounded-full bg-[#D8E8D8]" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-[#D8E8D8] rounded w-32" />
          <div className="h-3 bg-[#E8F0E8] rounded w-20" />
        </div>
      </div>

      {/* Card placeholders */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="h-4 bg-[#D8E8D8] rounded w-3/4" />
          <div className="h-3 bg-[#E8F0E8] rounded w-full" />
          <div className="h-3 bg-[#E8F0E8] rounded w-4/5" />
        </div>
      ))}
    </div>
  )
}
