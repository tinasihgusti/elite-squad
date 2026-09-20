#!/usr/bin/env bash
# Bangkitkan ulang supabase/PASANG-SEMUA.sql dari file migrasi.
# Jalankan setiap kali ada migrasi baru atau migrasi yang diubah:
#   bash scripts/build-pasang-semua.sh
set -euo pipefail

cd "$(dirname "$0")/.."
OUT=supabase/PASANG-SEMUA.sql

{
  sed -n '1,25p' <<'HEADER'
-- =====================================================================
--  ELITE SQUAD TRACKER — PASANG SEMUA SEKALIGUS
--
--  Cara pakai:
--    1. Buka Supabase → SQL Editor → tab baru
--    2. Copy SELURUH isi file ini, tempel ke editor
--    3. Klik Run (atau Cmd/Ctrl + Enter)
--    4. Tunggu sampai muncul "Success" di bawah
--
--  File ini berisi gabungan seluruh migrasi, berurutan.
--
--  AMAN dijalankan berulang kali. Kalau sebagian sudah pernah dijalankan,
--  bagian itu hanya akan dilewati, bukan menimbulkan error.
--
--  Akan muncul banyak pesan "NOTICE: ... does not exist, skipping".
--  Itu normal — artinya skrip memeriksa sesuatu yang memang belum ada.
--
--  JANGAN mengedit file ini langsung. Ubah file di supabase/migrations/
--  lalu bangkitkan ulang: bash scripts/build-pasang-semua.sh
-- =====================================================================
HEADER
  echo

  for f in supabase/migrations/*.sql; do
    printf '\n-- ###################################################################\n'
    printf -- '-- ##  BAGIAN: %s\n' "$(basename "$f")"
    printf -- '-- ###################################################################\n\n'
    cat "$f"
    echo
  done
} > "$OUT"

echo "Dibangkitkan: $OUT ($(wc -l < "$OUT") baris, dari $(ls supabase/migrations/*.sql | wc -l) migrasi)"
