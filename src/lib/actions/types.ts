/** Bentuk state seragam yang dikembalikan semua Server Action ke form. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  /** Error per field, dipakai untuk menampilkan pesan di bawah input terkait. */
  fieldErrors?: Record<string, string[]>;
};

export const idleState: ActionState = { status: "idle", message: "" };

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
