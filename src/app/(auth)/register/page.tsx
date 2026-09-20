import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <Card>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Buat akun peserta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Isi data diri sekali, selanjutnya cukup login tiap minggu.
        </p>
      </div>
      <RegisterForm />
    </Card>
  );
}
