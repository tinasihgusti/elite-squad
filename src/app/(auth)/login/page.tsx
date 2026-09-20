import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <Card>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Masuk ke akunmu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lanjutkan mengisi tracker mingguan Elite Squad.
        </p>
      </div>
      <LoginForm next={searchParams.next} />
    </Card>
  );
}
