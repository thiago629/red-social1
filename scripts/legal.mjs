// Copia los textos legales públicos a la app (src/legal/textos.ts).
// Uso: node scripts/legal.mjs /mnt/project-files/app-francisco/legal
// El nombre de la marca y el dominio se ponen como {{NOMBRE}} y {{DOMINIO}}:
// la app los rellena con lo que diga src/lib/config.ts.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const carpeta = process.argv[2];
if (!carpeta) {
  console.error('Indica la carpeta de los textos legales.');
  process.exit(1);
}

const archivos = {
  privacidad: '01-politica-privacidad.md',
  condiciones: '02-terminos-condiciones.md',
  normas: '03-normas-comunidad.md',
  'aviso-legal': '04-aviso-legal.md',
  cookies: '05-politica-cookies.md',
};
const enlaces = Object.fromEntries(Object.entries(archivos).map(([slug, f]) => [f, `/legal/${slug}`]));

const textos = {};
for (const [slug, archivo] of Object.entries(archivos)) {
  let md = readFileSync(join(carpeta, archivo), 'utf8');
  md = md
    .replace(/ZAVNIR|Zavnir/g, '{{NOMBRE}}')
    .replace(/zavnir\.app/g, '{{DOMINIO}}')
    .replace(/\(([0-9]{2}-[a-z-]+\.md)\)/g, (m, f) => (enlaces[f] ? `(${enlaces[f]})` : m));
  const [, titulo] = md.match(/^# (.+)$/m) ?? [, slug];
  textos[slug] = { titulo: titulo.trim(), md: md.replace(/^# .+\n/m, '').trim() };
}

const salida = `// Generado con scripts/legal.mjs desde la carpeta legal del proyecto. No editar a mano.
export const TEXTOS: Record<string, { titulo: string; md: string }> = ${JSON.stringify(textos, null, 2)};
`;
writeFileSync(new URL('../src/legal/textos.ts', import.meta.url), salida);
console.log('Textos legales copiados:', Object.keys(textos).join(', '));
