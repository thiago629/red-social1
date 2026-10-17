import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { color } from '../lib/config';

// Piezas básicas de la interfaz, al estilo de X/Twitter: plano, blanco, bordes finos y botones redondos.

export function Pantalla({ children, scroll = true, ancho = 600 }: { children: ReactNode; scroll?: boolean; ancho?: number }) {
  const contenido = <View style={[s.columna, { maxWidth: ancho }]}>{children}</View>;
  return (
    <View style={s.fondo}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {contenido}
        </ScrollView>
      ) : (
        contenido
      )}
    </View>
  );
}

export function Titulo({ children }: { children: ReactNode }) {
  return <Text style={s.titulo}>{children}</Text>;
}

export function Subtitulo({ children }: { children: ReactNode }) {
  return <Text style={s.subtitulo}>{children}</Text>;
}

export function Parrafo({ children, suave, style }: { children: ReactNode; suave?: boolean; style?: TextStyle }) {
  return <Text style={[s.parrafo, suave && { color: color.suave }, style]}>{children}</Text>;
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.tarjeta, style]}>{children}</View>;
}

type BotonProps = {
  texto: string;
  onPress: () => void;
  tipo?: 'principal' | 'negro' | 'secundario' | 'peligro' | 'texto';
  desactivado?: boolean;
  pequeño?: boolean;
};

export function Boton({ texto, onPress, tipo = 'principal', desactivado, pequeño }: BotonProps) {
  const claro = tipo === 'secundario' || tipo === 'texto';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={desactivado}
      style={({ pressed }) => [
        s.boton,
        pequeño && { paddingVertical: 7, paddingHorizontal: 14 },
        tipo === 'principal' && { backgroundColor: color.acento },
        tipo === 'negro' && { backgroundColor: color.tinta },
        tipo === 'secundario' && { backgroundColor: color.papel, borderColor: color.bordeFuerte, borderWidth: 1 },
        tipo === 'peligro' && { backgroundColor: color.peligro },
        tipo === 'texto' && { backgroundColor: 'transparent', paddingHorizontal: 4 },
        (pressed || desactivado) && { opacity: 0.55 },
      ]}
    >
      <Text style={[s.botonTexto, pequeño && { fontSize: 14 }, claro && { color: tipo === 'texto' ? color.acento : color.tinta }]}>{texto}</Text>
    </Pressable>
  );
}

export function Campo(props: TextInputProps & { etiqueta: string; error?: string; ayuda?: string }) {
  const { etiqueta, error, ayuda, style, ...resto } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.etiqueta}>{etiqueta}</Text>
      <TextInput
        placeholderTextColor={color.suave}
        style={[s.campo, error ? { borderColor: color.peligro } : null, style]}
        accessibilityLabel={etiqueta}
        {...resto}
      />
      {error ? <Text style={{ color: color.peligro, fontSize: 13 }}>{error}</Text> : null}
      {ayuda && !error ? <Text style={{ color: color.suave, fontSize: 13 }}>{ayuda}</Text> : null}
    </View>
  );
}

export function Casilla({ marcada, onCambio, children }: { marcada: boolean; onCambio: (v: boolean) => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      onPress={() => onCambio(!marcada)}
      style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}
    >
      <View style={[s.casilla, marcada && { backgroundColor: color.acento, borderColor: color.acento }]}>
        {marcada ? <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text> : null}
      </View>
      <Text style={[s.parrafo, { flex: 1 }]}>{children}</Text>
    </Pressable>
  );
}

// Fila de ajuste con interruptor.
export function Interruptor({
  titulo,
  descripcion,
  valor,
  onCambio,
  desactivado,
}: {
  titulo: string;
  descripcion?: string;
  valor: boolean;
  onCambio: (v: boolean) => void;
  desactivado?: boolean;
}) {
  return (
    <View style={s.filaAjuste}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, color: desactivado ? color.suave : color.tinta }}>{titulo}</Text>
        {descripcion ? <Text style={{ fontSize: 13, color: color.suave, lineHeight: 18 }}>{descripcion}</Text> : null}
      </View>
      <Switch
        value={valor}
        onValueChange={onCambio}
        disabled={desactivado}
        trackColor={{ true: color.acento, false: color.bordeFuerte }}
        thumbColor="#fff"
        accessibilityLabel={titulo}
      />
    </View>
  );
}

// Fila de un menú de ajustes que lleva a otra pantalla.
export function FilaMenu({ titulo, descripcion, onPress, peligro }: { titulo: string; descripcion?: string; onPress: () => void; peligro?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.filaAjuste, pressed && { backgroundColor: color.gris }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, color: peligro ? color.peligro : color.tinta, fontWeight: '600' }}>{titulo}</Text>
        {descripcion ? <Text style={{ fontSize: 13, color: color.suave, lineHeight: 18 }}>{descripcion}</Text> : null}
      </View>
      <Text style={{ color: color.suave, fontSize: 18 }}>›</Text>
    </Pressable>
  );
}

// Selector de una opción entre varias (por ejemplo, quién te puede escribir).
export function Selector<T extends string>({
  titulo,
  opciones,
  valor,
  onCambio,
}: {
  titulo: string;
  opciones: { valor: T; texto: string }[];
  valor: T;
  onCambio: (v: T) => void;
}) {
  return (
    <View style={[s.filaAjuste, { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
      <Text style={{ fontSize: 15, color: color.tinta }}>{titulo}</Text>
      <Fila>
        {opciones.map((o) => (
          <Chip key={o.valor} texto={o.texto} activo={valor === o.valor} onPress={() => onCambio(o.valor)} />
        ))}
      </Fila>
    </View>
  );
}

export function Chip({ texto, activo, onPress }: { texto: string; activo?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!activo } : undefined}
      style={[s.chip, activo && { backgroundColor: color.acento, borderColor: color.acento }]}
    >
      <Text style={{ color: activo ? '#fff' : color.tinta, fontSize: 14, fontWeight: activo ? '700' : '500' }}>{texto}</Text>
    </Pressable>
  );
}

export function Fila({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, style]}>{children}</View>;
}

export function Avatar({ nombre, foto, tam = 40 }: { nombre: string; foto?: string; tam?: number }) {
  if (foto) return <Image source={{ uri: foto }} style={{ width: tam, height: tam, borderRadius: tam / 2, backgroundColor: color.borde }} />;
  const inicial = nombre.trim().charAt(0).toUpperCase() || '?';
  const tonos = ['#1D9BF0', '#7856FF', '#F91880', '#00BA7C', '#FF7A00', '#0F1419'];
  const tono = tonos[(nombre.charCodeAt(0) || 0) % tonos.length];
  return (
    <View style={{ width: tam, height: tam, borderRadius: tam / 2, backgroundColor: tono, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: tam * 0.42 }}>{inicial}</Text>
    </View>
  );
}

export function Aviso({ children, tipo = 'info' }: { children: ReactNode; tipo?: 'info' | 'peligro' }) {
  return (
    <View style={[s.aviso, tipo === 'peligro' && { borderColor: '#FDC9CE', backgroundColor: '#FEECEE' }]}>
      <Text style={[s.parrafo, { fontSize: 14 }, tipo === 'peligro' && { color: '#B0101C' }]}>{children}</Text>
    </View>
  );
}

export function Separador() {
  return <View style={{ height: 1, backgroundColor: color.borde, marginHorizontal: -16 }} />;
}

// Texto con #hashtags, @menciones y enlaces que se pueden tocar.
export function TextoRico({ texto, style }: { texto: string; style?: TextStyle }) {
  const partes = texto.split(/((?:#[\p{L}\p{N}_]{2,30})|(?:@[a-zA-Z0-9_]{3,20})|(?:https?:\/\/\S+))/u);
  return (
    <Text style={style}>
      {partes.map((parte, i) => {
        if (/^#/.test(parte))
          return (
            <Text key={i} style={{ color: color.acento }} onPress={() => router.push({ pathname: '/explorar', params: { q: parte } })}>
              {parte}
            </Text>
          );
        if (/^@/.test(parte))
          return (
            <Text key={i} style={{ color: color.acento }} onPress={() => router.push(`/u/${parte.slice(1).toLowerCase()}`)}>
              {parte}
            </Text>
          );
        if (/^https?:\/\//.test(parte))
          return (
            <Text key={i} style={{ color: color.acento }} onPress={() => router.push({ pathname: '/enlace', params: { url: parte } })}>
              {parte}
            </Text>
          );
        return parte;
      })}
    </Text>
  );
}

export function haceCuanto(t: number) {
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: color.papel },
  scroll: { flexGrow: 1 },
  columna: { width: '100%', alignSelf: 'center', padding: 16, gap: 14 },
  titulo: { fontSize: 26, fontWeight: '800', color: color.tinta },
  subtitulo: { fontSize: 19, fontWeight: '800', color: color.tinta, marginTop: 6 },
  parrafo: { fontSize: 15, lineHeight: 21, color: color.tinta },
  etiqueta: { fontSize: 14, fontWeight: '600', color: color.tinta },
  tarjeta: { backgroundColor: color.papel, borderColor: color.borde, borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  boton: { paddingVertical: 11, paddingHorizontal: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  botonTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
  campo: {
    backgroundColor: color.papel,
    borderColor: color.bordeFuerte,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: color.tinta,
  },
  casilla: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: color.suave, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  chip: { borderWidth: 1, borderColor: color.bordeFuerte, backgroundColor: color.papel, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  aviso: { borderWidth: 1, borderColor: '#C9E6FB', backgroundColor: color.acentoSuave, borderRadius: 12, padding: 12 },
  filaAjuste: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.borde },
});
