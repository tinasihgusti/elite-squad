import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center">
          <span className="text-lg font-bold tracking-tight text-slate-900">Elite Squad</span>
          <span className="ml-1.5 text-lg font-light text-brand-600">Tracker</span>
        </Link>
        {children}
      </div>
    </main>
  );
}
