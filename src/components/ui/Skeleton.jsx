export function SkeletonRow() {
  return (
    <div className="animate-pulse flex space-x-4 p-4">
      <div className="rounded-full bg-slate-200 h-10 w-10" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-xl p-6 shadow-sm border">
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
      <div className="h-8 bg-slate-200 rounded w-1/4 mb-2" />
      <div className="h-3 bg-slate-200 rounded w-3/4" />
    </div>
  );
}
