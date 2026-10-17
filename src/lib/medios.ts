import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Vídeos y fotos de reels e historias.
// En la nube se suben a Supabase Storage. En modo prueba, en la web se guardan en el propio navegador
// (IndexedDB) para que no se pierdan al recargar; en el móvil se usa el archivo elegido.
export const MAX_SEGUNDOS = 90;
export const MAX_MB = 100;

const BD = 'plazzo-medios';
const TABLA = 'videos';

function abrirBD(): Promise<IDBDatabase> {
  return new Promise((ok, mal) => {
    const r = indexedDB.open(BD, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(TABLA);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
  });
}

async function guardarEnNavegador(clave: string, archivo: Blob) {
  const bd = await abrirBD();
  await new Promise<void>((ok, mal) => {
    const t = bd.transaction(TABLA, 'readwrite');
    t.objectStore(TABLA).put(archivo, clave);
    t.oncomplete = () => ok();
    t.onerror = () => mal(t.error);
  });
}

async function leerDelNavegador(clave: string): Promise<Blob | undefined> {
  const bd = await abrirBD();
  return new Promise((ok, mal) => {
    const r = bd.transaction(TABLA).objectStore(TABLA).get(clave);
    r.onsuccess = () => ok(r.result as Blob | undefined);
    r.onerror = () => mal(r.error);
  });
}

const urls = new Map<string, string>();

// Devuelve algo que <Image> o el reproductor pueden usar: un número (archivo de la app) o una dirección.
export function useMedio(uri: string | number | undefined) {
  const esNavegador = typeof uri === 'string' && uri.startsWith('idb:');
  const [url, setUrl] = useState<string | undefined>(esNavegador ? urls.get(uri) : undefined);
  useEffect(() => {
    if (!esNavegador || urls.has(uri)) return;
    let vivo = true;
    leerDelNavegador(uri.slice(4))
      .then((b) => {
        if (!b || !vivo) return;
        const u = URL.createObjectURL(b);
        urls.set(uri, u);
        setUrl(u);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [uri, esNavegador]);
  if (esNavegador) return url ?? urls.get(uri);
  return uri;
}

export type Elegido = { tipo: 'foto' | 'video'; uri: string; duracion?: number; ancho?: number; alto?: number };

export async function elegirMedio(tipos: 'video' | 'todo'): Promise<Elegido | { error: string } | null> {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) return { error: 'Necesitamos permiso para ver tu galería.' };
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: tipos === 'video' ? ['videos'] : ['images', 'videos'],
    videoMaxDuration: MAX_SEGUNDOS,
    quality: 1,
    exif: false,
  });
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  if (a.type !== 'video') {
    // Las fotos se reducen y se quitan sus datos ocultos (ubicación GPS).
    const [foto] = await elegirFotosDesde(a.uri);
    return foto ? { tipo: 'foto', uri: foto } : null;
  }
  const segundos = (a.duration ?? 0) / 1000;
  if (segundos > MAX_SEGUNDOS + 1) return { error: `El vídeo dura más de ${MAX_SEGUNDOS} segundos.` };
  if ((a.fileSize ?? 0) > MAX_MB * 1024 * 1024) return { error: `El vídeo pesa más de ${MAX_MB} MB.` };
  let uri = a.uri;
  if (Platform.OS === 'web' && a.file) {
    const clave = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      await guardarEnNavegador(clave, a.file);
      uri = `idb:${clave}`;
      urls.set(uri, a.uri);
    } catch {
      // Sin IndexedDB el vídeo dura hasta que se recarga la página.
    }
  }
  return { tipo: 'video', uri, duracion: segundos, ancho: a.width, alto: a.height };
}

async function elegirFotosDesde(uri: string) {
  const ref = await ImageManipulator.manipulate(uri).resize({ width: 1080 }).renderAsync();
  const hecho = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
  return hecho.base64 ? [`data:image/jpeg;base64,${hecho.base64}`] : [];
}
