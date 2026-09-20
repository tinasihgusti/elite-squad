"use client";

import { useMemo, useState, useActionState } from "react";

import { adjustXpAction, deleteParticipantAction } from "@/lib/actions/admin";
import { idleState } from "@/lib/actions/types";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass, inputErrorClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn, formatDate } from "@/lib/utils";
import type { AdminParticipantRow } from "@/lib/database.types";

export function ParticipantManager({
  participants,
  deleteEnabled,
}: {
  participants: AdminParticipantRow[];
  deleteEnabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.squad ?? "").toLowerCase().includes(q) ||
        (p.faculty ?? "").toLowerCase().includes(q),
    );
  }, [participants, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama, squad, atau fakultas..."
          aria-label="Cari peserta"
          className={cn(inputClass, "max-w-xs")}
        />
        <p className="text-sm text-slate-500">
          {filtered.length} dari {participants.length} peserta
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          Tidak ada peserta yang cocok.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((participant) => (
            <ParticipantRow
              key={participant.user_id}
              participant={participant}
              isOpen={openId === participant.user_id}
              onToggle={() =>
                setOpenId(openId === participant.user_id ? null : participant.user_id)
              }
              deleteEnabled={deleteEnabled}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ParticipantRow({
  participant,
  isOpen,
  onToggle,
  deleteEnabled,
}: {
  participant: AdminParticipantRow;
  isOpen: boolean;
  onToggle: () => void;
  deleteEnabled: boolean;
}) {
  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {participant.full_name}
            {participant.role !== "member" && (
              <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold uppercase text-brand-700">
                {participant.role}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-slate-500">
            {participant.squad ?? "Tanpa squad"}
            {participant.faculty ? ` · ${participant.faculty}` : ""} · Lv {participant.level}{" "}
            {participant.level_name}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-slate-900">
            {participant.total_xp.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-400">XP</p>
        </div>

        <span aria-hidden className="shrink-0 text-slate-400">
          {isOpen ? "▴" : "▾"}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-5 border-t border-slate-100 bg-slate-50 p-4">
          <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <Stat label="Sesi diikuti" value={`${participant.sessions_done}/10`} />
            <Stat label="Terverifikasi" value={`${participant.sessions_verified}/10`} />
            <Stat label="Hari amalan" value={participant.amal_logged_days} />
            <Stat label="Laporan drama" value={participant.drama_count} />
            <Stat label="XP hari ini" value={participant.today_xp} />
            <Stat
              label="Aktif terakhir"
              value={participant.last_active_on ? formatDate(participant.last_active_on) : "—"}
            />
            <Stat label="Bergabung" value={formatDate(participant.joined_at)} />
            <Stat label="WhatsApp" value={participant.phone ?? "—"} />
          </dl>

          <AdjustXpForm participant={participant} />

          {deleteEnabled ? (
            <DeleteParticipantForm participant={participant} />
          ) : (
            <Alert variant="info">
              Fitur hapus akun nonaktif: <code>SUPABASE_SERVICE_ROLE_KEY</code> belum diisi di
              environment variable.
            </Alert>
          )}
        </div>
      )}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-2.5">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function AdjustXpForm({ participant }: { participant: AdminParticipantRow }) {
  const [state, formAction] = useActionState(adjustXpAction, idleState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <input type="hidden" name="userId" value={participant.user_id} />

      <div>
        <h4 className="text-sm font-semibold text-slate-900">Sesuaikan XP</h4>
        <p className="text-xs text-slate-500">
          Nilai negatif untuk mengurangi XP yang terdata tidak sesuai. Semua penyesuaian tercatat.
        </p>
      </div>

      {state.status === "error" && state.message && <Alert variant="error">{state.message}</Alert>}
      {state.status === "success" && <Alert variant="success">{state.message}</Alert>}

      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <Field label="Jumlah XP" htmlFor={`points-${participant.user_id}`} required errors={errors.points}>
          <input
            id={`points-${participant.user_id}`}
            name="points"
            type="number"
            step={10}
            required
            placeholder="-200"
            className={cn(inputClass, errors.points && inputErrorClass)}
          />
        </Field>

        <Field label="Alasan" htmlFor={`note-${participant.user_id}`} required errors={errors.note}>
          <input
            id={`note-${participant.user_id}`}
            name="note"
            type="text"
            required
            maxLength={300}
            placeholder="Contoh: kehadiran Sesi 5 tidak terverifikasi"
            className={cn(inputClass, errors.note && inputErrorClass)}
          />
        </Field>
      </div>

      <SubmitButton pendingText="Menyimpan..." className="sm:w-auto sm:px-6">
        Simpan Penyesuaian
      </SubmitButton>
    </form>
  );
}

function DeleteParticipantForm({ participant }: { participant: AdminParticipantRow }) {
  const [state, formAction] = useActionState(deleteParticipantAction, idleState);
  const [expanded, setExpanded] = useState(false);
  const errors = state.fieldErrors ?? {};

  if (state.status === "success") {
    return <Alert variant="success">{state.message}</Alert>;
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-sm font-semibold text-red-600 hover:text-red-700"
      >
        Hapus akun peserta ini
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <input type="hidden" name="userId" value={participant.user_id} />

      <div>
        <h4 className="text-sm font-semibold text-red-900">Hapus akun permanen</h4>
        <p className="text-xs text-red-700">
          Seluruh XP, amalan, progres modul, dan laporan drama milik peserta ini ikut terhapus dan
          tidak bisa dikembalikan.
        </p>
      </div>

      {state.status === "error" && state.message && <Alert variant="error">{state.message}</Alert>}

      <Field
        label={`Ketik "${participant.full_name}" untuk konfirmasi`}
        htmlFor={`confirm-${participant.user_id}`}
        required
        errors={errors.confirmName}
      >
        <input
          id={`confirm-${participant.user_id}`}
          name="confirmName"
          type="text"
          required
          autoComplete="off"
          className={cn(inputClass, errors.confirmName && inputErrorClass)}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <SubmitButton
          pendingText="Menghapus..."
          className="bg-red-600 hover:bg-red-700 focus:ring-red-500/40 sm:w-auto sm:px-6"
        >
          Hapus Permanen
        </SubmitButton>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
