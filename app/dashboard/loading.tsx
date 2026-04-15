export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1280px] space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-slate-200" />
          <div className="h-4 w-80 rounded bg-slate-200" />
        </div>
        <div className="h-8 w-36 rounded-lg bg-slate-200" />
      </div>
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 flex-1 rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="flex gap-5">
        <div className="h-96 w-[60%] rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-4">
          <div className="h-44 rounded-xl bg-slate-200" />
          <div className="h-44 rounded-xl bg-slate-200" />
        </div>
      </div>
      <div className="h-52 rounded-xl bg-slate-200" />
    </div>
  )
}
