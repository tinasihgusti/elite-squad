export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat halaman">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}
