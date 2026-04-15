export default function ParticipantsLoading() {
  return (
    <div className="mx-auto max-w-[1280px] space-y-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-lg bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-200" />
        </div>
        <div className="h-8 w-36 rounded-lg bg-slate-200" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-32 rounded-lg bg-slate-200" />
        ))}
      </div>
      <div className="h-[520px] rounded-xl bg-slate-200" />
    </div>
  )
}
