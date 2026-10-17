import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, type ReactNode } from 'react';
import { Image, Platform, Pressable, View, type ViewStyle } from 'react-native';
import { degradado } from '../lib/config';
import { filtroDe } from '../lib/filtros';
import { useMedio } from '../lib/medios';
import { Avatar } from './ui';

// Aplica un filtro a lo que tenga dentro (foto o vídeo).
export function ConFiltro({ filtro, style, children }: { filtro?: string; style?: ViewStyle; children: ReactNode }) {
  const f = filtroDe(filtro);
  const css = Platform.OS === 'web' && f.css !== 'none' ? ({ filter: f.css } as ViewStyle) : null;
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <View style={[{ flex: 1 }, css]}>{children}</View>
      {f.tinte ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: f.tinte }} /> : null}
    </View>
  );
}

export function Foto({ uri, filtro, style }: { uri: string | number; filtro?: string; style?: ViewStyle }) {
  const fuente = useMedio(uri);
  return (
    <ConFiltro filtro={filtro} style={style}>
      {fuente !== undefined ? (
        <Image source={typeof fuente === 'string' ? { uri: fuente } : fuente} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : null}
    </ConFiltro>
  );
}

type VideoProps = {
  uri: string | number;
  filtro?: string;
  activo: boolean;
  silencio?: boolean;
  bucle?: boolean;
  style?: ViewStyle;
  alTerminar?: () => void;
  ajuste?: 'cover' | 'contain';
};

// Reproductor a pantalla completa: solo suena el que está a la vista.
export function Video(props: VideoProps) {
  const fuente = useMedio(props.uri);
  if (fuente === undefined) return <View style={[{ backgroundColor: '#000' }, props.style]} />;
  return <VideoListo {...props} fuente={fuente} />;
}

function VideoListo({ fuente, filtro, activo, silencio = false, bucle = true, style, alTerminar, ajuste = 'cover' }: VideoProps & { fuente: string | number }) {
  const player = useVideoPlayer(typeof fuente === 'string' ? { uri: fuente } : fuente, (p) => {
    p.loop = bucle;
    p.muted = silencio;
  });
  useEffect(() => {
    player.muted = silencio;
  }, [player, silencio]);
  useEffect(() => {
    if (activo) player.play();
    else player.pause();
  }, [player, activo]);
  useEffect(() => {
    if (!alTerminar) return;
    const sub = player.addListener('playToEnd', alTerminar);
    return () => sub.remove();
  }, [player, alTerminar]);
  return (
    <ConFiltro filtro={filtro} style={[{ backgroundColor: '#000' }, style] as unknown as ViewStyle}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit={ajuste} nativeControls={false} playsInline />
    </ConFiltro>
  );
}

// Avatar con el anillo de colores de las historias (gris si ya las has visto).
export function AnilloHistoria({ nombre, foto, tam = 64, visto, onPress }: { nombre: string; foto?: string; tam?: number; visto?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Historia de ${nombre}`}>
      <LinearGradient
        colors={visto ? ['#CFD9DE', '#CFD9DE'] : [...degradado]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ width: tam + 8, height: tam + 8, borderRadius: (tam + 8) / 2, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ padding: 2, borderRadius: tam, backgroundColor: '#fff' }}>
          <Avatar nombre={nombre} foto={foto} tam={tam - 2} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
