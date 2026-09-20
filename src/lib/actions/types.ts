/** Bentuk state seragam yang dikembalikan semua Server Action ke form. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  /** Error per field, dipakai untuk menampilkan pesan di bawah input terkait. */
  fieldErrors?: Record<string, string[]>;
  /**
   * Pesan teknis asli (misalnya dari Supabase). Ditampilkan kecil di bawah
   * pesan utama supaya penyebab sebenarnya tidak pernah tertutup pesan generik.
   */
  detail?: string;
};

export const idleState: ActionState = { status: "idle", message: "" };

/**
 * Hasil aksi ceklis. Selain status, aksi mengembalikan keadaan terbaru menurut
 * server — daftar yang tercentang dan XP hari ini.
 *
 * Dengan begitu tampilan tidak perlu menunggu render ulang halaman: klien
 * menyalin kebenaran dari server, sehingga centang optimistik yang meleset
 * otomatis terkoreksi dan tidak ada lagi jalur yang bisa gagal diam-diam.
 */
export type ToggleState = ActionState & {
  keys?: string[];
  todayXp?: number;
};

/** Ubah error Zod menjadi ActionState. */
export function zodToActionState(
  fieldErrors: Record<string, string[] | undefined>,
  message = "Periksa kembali isian yang ditandai merah.",
): ActionState {
  const cleaned: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    if (value?.length) cleaned[key] = value;
  }
  return { status: "error", message, fieldErrors: cleaned };
}
