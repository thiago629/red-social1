import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { BarraHistorias } from '../../components/BarraHistorias';
import { BotonPublicar } from '../../components/BotonPublicar';
import { Publicacion } from '../../components/Publicacion';
import { Boton, Parrafo } from '../../components/ui';
import { feedSiguiendo, paginaParaTi, type Puntuada } from '../../lib/algoritmo';
import { color, modoDemo } from '../../lib/config';
import * as store from '../../lib/store';

type Fila = (Puntuada & { clave: string }) | { clave: string; separador: true };

export default function Inicio() {
  const version = store.useVersion();
  const estado = store.get();
  const yo = store.yo();
  const [pestana, setPestana] = useState<'parati' | 'siguiendo'>('parati');
  const [paginas, setPaginas] = useState(2);

  // «Para ti» no se acaba nunca: al llegar abajo se carga otra página.
  const filas = useMemo<Fila[]>(() => {
    if (!yo) return [];
    if (pestana === 'siguiendo') return feedSiguiendo(estado, yo.id).map((x) => ({ ...x, clave: `${x.publicacion.id}-${x.compartidoPor ?? ''}` }));
    const salida: Fila[] = [];
    for (let n = 0; n < paginas; n++) {
      if (n === 1) salida.push({ clave: 'sep', separador: true });
      paginaParaTi(estado, yo.id, n).forEach((x) => salida.push({ ...x, clave: `${n}-${x.publicacion.id}` }));
    }
    return salida;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, pestana, paginas, yo?.id]);

  if (!yo) return null;

  const cabecera = (
    <View style={{ gap: 8 }}>
      <BarraHistorias />
      <View style={{ flexDirection: 'row', marginHorizontal: -16, borderBottomWidth: 1, borderBottomColor: color.borde }}>
        <Pestana texto="Para ti" activa={pestana === 'parati'} onPress={() => setPestana('parati')} />
        <Pestana texto="Siguiendo" activa={pestana === 'siguiendo'} onPress={() => setPestana('siguiendo')} />
      </View>
      {modoDemo ? (
        <Text style={{ color: color.suave, fontSize: 12 }}>
          Versión de prueba: los datos se guardan solo en este dispositivo y las cuentas marcadas «ejemplo» no son reales.
        </Text>
      ) : null}
      {pestana === 'parati' ? (
        <Pressable onPress={() => router.push('/intereses')} accessibilityRole="button">
          <Text style={{ color: color.suave, fontSize: 13 }}>
            {yo.verTodo ? 'Estás viendo de todo. ' : `Tus temas: ${yo.intereses.slice(0, 4).join(', ')}${yo.intereses.length > 4 ? '…' : ''}. `}
            <Text style={{ color: color.acento, fontWeight: '600' }}>Cambiar</Text>
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.papel }}>
      <FlatList
        data={filas}
        keyExtractor={(f) => f.clave}
        ListHeaderComponent={cabecera}
        contentContainerStyle={{ width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 100 }}
        onEndReachedThreshold={1.5}
        onEndReached={() => pestana === 'parati' && setPaginas((n) => n + 1)}
        initialNumToRender={8}
        windowSize={7}
        renderItem={({ item }) =>
          'separador' in item ? (
            <View style={{ paddingVertical: 14, alignItems: 'center', gap: 4, borderBottomWidth: 1, borderBottomColor: color.borde, marginHorizontal: -16 }}>
              <Text style={{ fontWeight: '800', color: color.tinta }}>Ya has visto lo nuevo de tus temas</Text>
              <Text style={{ color: color.suave, fontSize: 13 }}>Seguimos con más para ti y algo para descubrir.</Text>
            </View>
          ) : (
            <Publicacion publicacion={item.publicacion} motivos={pestana === 'parati' ? item.motivos : undefined} compartidoPor={item.compartidoPor} />
          )
        }
        ListFooterComponent={
          pestana === 'parati' ? (
            <View style={{ paddingVertical: 24 }}>
              <ActivityIndicator color={color.acento} />
            </View>
          ) : filas.length === 0 ? (
            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
              <Parrafo suave>Aquí verás a la gente que sigues, por orden de fecha y sin algoritmo.</Parrafo>
              <Boton texto="Buscar gente" onPress={() => router.push('/explorar')} />
            </View>
          ) : undefined
        }
      />
      <BotonPublicar />
    </View>
  );
}

function Pestana({ texto, activa, onPress }: { texto: string; activa: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: activa }} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
      <Text style={{ fontWeight: activa ? '800' : '500', color: activa ? color.tinta : color.suave, fontSize: 15, paddingBottom: 12 }}>{texto}</Text>
      <View style={{ height: 4, width: 56, borderRadius: 2, backgroundColor: activa ? color.acento : 'transparent' }} />
    </Pressable>
  );
}
