import { Link } from 'expo-router';
import { createElement } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { color } from '../lib/config';

// Vídeos de TikTok compartidos por la gente: se ven con el reproductor oficial de TikTok
// (lo permite TikTok y el vídeo sigue siendo de su autor). No copiamos vídeos de TikTok.
export function idTikTok(url: string) {
  return url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i)?.[1];
}

export function TikTok({ url }: { url: string }) {
  const id = idTikTok(url);
  if (Platform.OS === 'web' && id) {
    return (
      <View style={{ width: 300, maxWidth: '100%', aspectRatio: 9 / 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}>
        {createElement('iframe', {
          src: `https://www.tiktok.com/player/v1/${id}?music_info=1&description=1`,
          title: 'Vídeo de TikTok',
          allow: 'fullscreen; encrypted-media',
          style: { border: 0, width: '100%', height: '100%' },
        })}
      </View>
    );
  }
  // En el móvil se abre dentro de la app con el navegador integrado.
  return (
    <Link href={{ pathname: '/enlace', params: { url } }} asChild>
      <Pressable style={{ borderWidth: 1, borderColor: color.borde, borderRadius: 16, padding: 12, gap: 2 }}>
        <Text style={{ color: color.tinta, fontWeight: '700' }}>♪ Vídeo de TikTok</Text>
        <Text style={{ color: color.suave, fontSize: 12 }}>Toca para verlo dentro de la app</Text>
      </Pressable>
    </Link>
  );
}
