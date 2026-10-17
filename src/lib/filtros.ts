// Filtros para fotos, reels e historias. En la web se aplican con filtros CSS;
// en el móvil se ve el tono de color (el filtro completo se hace en el servidor al subir el vídeo).
export type Filtro = { id: string; nombre: string; css: string; tinte?: string };

export const FILTROS: Filtro[] = [
  { id: 'normal', nombre: 'Normal', css: 'none' },
  { id: 'brillo', nombre: 'Brillo', css: 'brightness(1.15) contrast(1.05) saturate(1.15)' },
  { id: 'vivo', nombre: 'Vivo', css: 'saturate(1.6) contrast(1.1)' },
  { id: 'amanecer', nombre: 'Amanecer', css: 'sepia(0.25) saturate(1.4) hue-rotate(-10deg) brightness(1.05)', tinte: 'rgba(255,140,60,0.12)' },
  { id: 'atardecer', nombre: 'Atardecer', css: 'sepia(0.35) saturate(1.5) contrast(1.05)', tinte: 'rgba(255,61,113,0.14)' },
  { id: 'playa', nombre: 'Playa', css: 'brightness(1.1) saturate(1.3) hue-rotate(-8deg)', tinte: 'rgba(0,200,255,0.10)' },
  { id: 'hielo', nombre: 'Hielo', css: 'saturate(0.8) brightness(1.08) hue-rotate(15deg)', tinte: 'rgba(120,180,255,0.18)' },
  { id: 'noche', nombre: 'Noche', css: 'brightness(0.85) contrast(1.2) saturate(1.2)', tinte: 'rgba(40,20,120,0.22)' },
  { id: 'neon', nombre: 'Neón', css: 'saturate(2) contrast(1.2) hue-rotate(20deg)', tinte: 'rgba(124,58,237,0.16)' },
  { id: 'retro', nombre: 'Retro', css: 'sepia(0.5) contrast(0.9) brightness(1.05) saturate(1.2)', tinte: 'rgba(255,200,120,0.15)' },
  { id: 'vintage', nombre: 'Vintage', css: 'sepia(0.7) contrast(0.85) brightness(1.05)', tinte: 'rgba(160,110,60,0.18)' },
  { id: 'cine', nombre: 'Cine', css: 'contrast(1.3) saturate(0.85) brightness(0.95)', tinte: 'rgba(0,90,90,0.14)' },
  { id: 'dorado', nombre: 'Dorado', css: 'sepia(0.4) saturate(1.6) brightness(1.08)', tinte: 'rgba(255,190,40,0.16)' },
  { id: 'rosa', nombre: 'Rosa', css: 'saturate(1.2) brightness(1.08)', tinte: 'rgba(255,105,180,0.18)' },
  { id: 'menta', nombre: 'Menta', css: 'saturate(1.1) hue-rotate(-20deg)', tinte: 'rgba(0,220,160,0.14)' },
  { id: 'mate', nombre: 'Mate', css: 'contrast(0.8) brightness(1.1) saturate(0.85)', tinte: 'rgba(255,255,255,0.12)' },
  { id: 'drama', nombre: 'Drama', css: 'contrast(1.5) saturate(1.1) brightness(0.9)' },
  { id: 'suave', nombre: 'Suave', css: 'contrast(0.9) brightness(1.12) saturate(0.95) blur(0.3px)', tinte: 'rgba(255,230,240,0.12)' },
  { id: 'bn', nombre: 'B/N', css: 'grayscale(1) contrast(1.1)', tinte: 'rgba(0,0,0,0.0001)' },
  { id: 'carbon', nombre: 'Carbón', css: 'grayscale(1) contrast(1.6) brightness(0.85)' },
  { id: 'sepia', nombre: 'Sepia', css: 'sepia(1)', tinte: 'rgba(112,66,20,0.12)' },
  { id: 'invertido', nombre: 'Invertido', css: 'invert(1) hue-rotate(180deg)' },
  { id: 'lsd', nombre: 'Psico', css: 'hue-rotate(120deg) saturate(1.8)', tinte: 'rgba(255,0,200,0.10)' },
  { id: 'futuro', nombre: 'Futuro', css: 'hue-rotate(-40deg) saturate(1.5) contrast(1.15)', tinte: 'rgba(29,155,240,0.16)' },
];

export const filtroDe = (id?: string) => FILTROS.find((f) => f.id === id) ?? FILTROS[0];

// Colores de fondo para historias solo con texto.
export const FONDOS_HISTORIA = [
  'linear(#FF8A3D,#FF3D71)',
  'linear(#7C3AED,#1D9BF0)',
  'linear(#0F1419,#536471)',
  'linear(#00BA7C,#1D9BF0)',
  'linear(#FF3D71,#7C3AED)',
  'linear(#F59E0B,#EF4444)',
];
export const coloresFondo = (f: string) => f.replace(/^linear\(|\)$/g, '').split(',') as [string, string];
