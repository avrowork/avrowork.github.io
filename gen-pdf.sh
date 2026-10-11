#!/usr/bin/env bash
# Regenera cv.pdf (versión estática/imprimible del CV) a partir de index.html.
#
# Uso:   ./gen-pdf.sh [salida.pdf]     (por defecto: cv.pdf)
# Chrome: se puede forzar con CHROME=/ruta/a/chrome
#
# Se imprime con JavaScript deshabilitado para que el PDF sea reproducible:
# el texto del hero queda en su valor por defecto y las animaciones de
# entrada no dependen del scroll (las fuerza el CSS de impresión de cv.css).
set -euo pipefail
cd "$(dirname "$0")"

find_chrome() {
  if [ -n "${CHROME:-}" ]; then
    printf '%s\n' "$CHROME"
    return 0
  fi
  local c
  for c in google-chrome google-chrome-stable chromium chromium-browser chrome; do
    if command -v "$c" >/dev/null 2>&1; then
      command -v "$c"
      return 0
    fi
  done
  # Chrome for Testing descargado por Puppeteer (~/.cache/puppeteer)
  local found
  found="$(find "${PUPPETEER_CACHE_DIR:-$HOME/.cache/puppeteer}" -type f -name chrome 2>/dev/null | sort | tail -1)"
  if [ -n "$found" ]; then
    printf '%s\n' "$found"
    return 0
  fi
  echo "No se encontró Chrome/Chromium. Instálalo o exporta CHROME=/ruta/a/chrome" >&2
  return 1
}

CHROME_BIN="$(find_chrome)"
OUT="${1:-cv.pdf}"
case "$OUT" in
  /*) ;;
  *) OUT="$PWD/$OUT" ;;
esac

"$CHROME_BIN" \
  --headless \
  --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --no-pdf-header-footer \
  --disable-javascript \
  --print-to-pdf="$OUT" \
  "file://$PWD/index.html" 2>/dev/null

echo "OK -> $OUT  (Chrome: $("$CHROME_BIN" --version))"
