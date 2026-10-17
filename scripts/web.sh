#!/usr/bin/env bash
# Genera la web lista para publicar en una subcarpeta (GitHub Pages) o en la raíz de un dominio.
#   BASE_URL=/red-social1 scripts/web.sh   → dist/ para https://thiago629.github.io/red-social1
#   scripts/web.sh                         → dist/ para un dominio propio (plazzo.app)
set -euo pipefail
BASE="${BASE_URL:-}"
BASE_URL="$BASE" npx expo export --platform web --output-dir dist
# Enlaces del index.html (manifiesto e iconos) dentro de la subcarpeta.
sed -i "s|href=\"/manifest.json\"|href=\"$BASE/manifest.json\"|; s|href=\"/icono-192.png\"|href=\"$BASE/icono-192.png\"|" dist/index.html
# GitHub Pages: cualquier ruta (/reels, /post/123…) abre la app, y no ignora la carpeta _expo.
cp dist/index.html dist/404.html
touch dist/.nojekyll
if [ -n "${DOMINIO:-}" ]; then echo "$DOMINIO" > dist/CNAME; fi
