import Constants from 'expo-constants';
import { Platform, Share } from 'react-native';
import { marca } from './config';

// Dirección pública de una publicación, para compartirla fuera de la app.
export function enlacePublicacion(id: string) {
  if (Platform.OS === 'web' && typeof location !== 'undefined') {
    const base = Constants.expoConfig?.experiments?.baseUrl ?? '';
    return `${location.origin}${base}/post/${id}`;
  }
  return `https://${marca.dominio}/post/${id}`;
}

// Abre la barra de compartir del móvil (WhatsApp, Instagram…). En el ordenador copia el enlace.
export async function compartirFuera(texto: string, url: string): Promise<'compartido' | 'copiado' | 'nada'> {
  try {
    const web = Platform.OS === 'web' ? (globalThis.navigator as Navigator | undefined) : undefined;
    if (!web || typeof web.share === 'function') {
      await Share.share({ message: `${texto}\n${url}`, url, title: marca.nombre });
      return 'compartido';
    }
    await web.clipboard.writeText(url);
    return 'copiado';
  } catch {
    return 'nada';
  }
}
