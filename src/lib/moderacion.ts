// Primer filtro al publicar: se puede publicar de todo menos lo ilegal.
// En modo prueba es una lista local. En producción, además, el texto y las imágenes pasan por
// un moderador con IA y las fotos por PhotoDNA (contra abuso infantil), siempre desde el servidor.
const ILEGAL: [RegExp, string][] = [
  [/(pornograf[ií]a infantil|menor(es)? desnud|ni[ñn][oa]s? desnud|child porn)/i, 'contenido sexual con menores'],
  [/\b(te voy a matar|os voy a matar|voy a matarte|te mato)\b/i, 'amenazas'],
  [/\b(vendo|compro|se vende)\b.{0,30}\b(coca[ií]na|hero[ií]na|marihuana|hach[ií]s|drogas?|mdma|pistola|armas?|rifle)\b/i, 'venta de drogas o armas'],
  [/\b(vendo|compro)\b.{0,30}\b(dni|pasaporte|tarjetas? clonadas?|cuentas? robadas?)\b/i, 'documentos o cuentas robadas'],
  [/\b(viva (el )?isis|únete a la yihad|unete a la yihad)\b/i, 'apología del terrorismo'],
  [/\b(muerte a los|hay que exterminar a los)\b/i, 'incitación al odio'],
];

export type Resultado = { permitido: true } | { permitido: false; motivo: string };

export function revisarTexto(texto: string, limite = 500): Resultado {
  if (texto.length > limite) return { permitido: false, motivo: `Máximo ${limite} caracteres.` };
  for (const [patron, tipo] of ILEGAL) {
    if (patron.test(texto)) {
      return {
        permitido: false,
        motivo: `No se puede publicar: parece ${tipo}, que es ilegal. Puedes publicar de todo menos cosas ilegales.`,
      };
    }
  }
  return { permitido: true };
}

// Aviso antes de abrir enlaces sospechosos. En producción se consulta un servicio de enlaces peligrosos.
const SOSPECHOSO = [/bit\.ly/i, /premio.*gratis/i, /login.*verify/i, /\.zip($|\/)/i, /\.exe($|\?)/i];

export function enlaceSospechoso(url: string) {
  return SOSPECHOSO.some((r) => r.test(url));
}

export function dominio(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function normalizarEnlace(url: string) {
  const u = url.trim();
  if (!u) return undefined;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export const MOTIVOS_DENUNCIA = [
  'Spam o estafa',
  'Acoso o insultos',
  'Odio',
  'Amenazas o violencia',
  'Contenido sexual sin consentimiento',
  'Menores en peligro',
  'Autolesión o suicidio',
  'Suplantación',
  'Venta de productos ilegales',
  'Derechos de autor',
  'Información falsa peligrosa',
  'Contenido sensible sin marcar',
  'Otro',
];
