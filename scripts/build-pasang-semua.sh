#!/usr/bin/env bash
# Bangkitkan ulang supabase/PASANG-SEMUA.sql dari file migrasi.
# Jalankan setiap kali ada migrasi baru atau migrasi yang diubah:
#   bash scripts/build-pasang-semua.sh
set -euo pipefail

cd "$(dirname "$0")/.."
OUT=supabase/PASANG-SEMUA.sql

# Sidik jari isi: berubah setiap kali ada migrasi yang diubah. Dicetak saat
# skrip dijalankan supaya ketahuan kalau yang tereksekusi versi lama dari cache.
FINGERPRINT=$(cat supabase/migrations/*.sql | sha256sum | cut -c1-8)
TANGGAL=$(date +%Y-%m-%d)

{
  cat <<HEADER
-- =====================================================================
--  ELITE SQUAD TRACKER — PASANG SEMUA SEKALIGUS
--
--  VERSI SKRIP: ${FINGERPRINT}   (dibangkitkan ${TANGGAL})
--
--  Cara pakai:
--    1. Buka Supabase → SQL Editor → tab baru
--    2. Copy SELURUH isi file ini, tempel ke editor
--    3. Klik Run (atau Cmd/Ctrl + Enter)
--    4. Di bawah akan muncul TABEL STATUS. Semua baris harus ✅ SIAP.
--
--  File ini berisi gabungan seluruh migrasi, berurutan, ditutup
--  pemeriksaan hasil. AMAN dijalankan berulang kali.
--
--  Pesan "NOTICE: ... does not exist, skipping" itu normal.
--
--  JANGAN mengedit file ini langsung. Ubah file di supabase/migrations/
--  lalu bangkitkan ulang: bash scripts/build-pasang-semua.sh
-- =====================================================================

do \$fingerprint\$
begin
  raise notice '=====================================================';
  raise notice ' Elite Squad Tracker — versi skrip: ${FINGERPRINT}';
  raise notice ' Kalau versi ini BUKAN yang diharapkan, yang jalan';
  raise notice ' adalah file lama dari cache. Muat ulang paksa dulu.';
  raise notice '=====================================================';
end
\$fingerprint\$;
HEADER
  echo

  for f in supabase/migrations/*.sql; do
    printf '\n-- ###################################################################\n'
    printf -- '-- ##  BAGIAN: %s\n' "$(basename "$f")"
    printf -- '-- ###################################################################\n\n'
    cat "$f"
    echo
  done

  printf '\n-- ###################################################################\n'
  printf -- '-- ##  PEMERIKSAAN HASIL — tabel di bawah ini yang tampil setelah Run\n'
  printf -- '-- ###################################################################\n\n'
  cat supabase/check-install.sql
} > "$OUT"

echo "Dibangkitkan: $OUT"
echo "  baris   : $(wc -l < "$OUT")"
echo "  migrasi : $(ls supabase/migrations/*.sql | wc -l)"
echo "  versi   : $FINGERPRINT"
