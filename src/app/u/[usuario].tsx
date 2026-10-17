import { Redirect, useLocalSearchParams } from 'expo-router';
import { Pantalla, Parrafo } from '../../components/ui';
import * as store from '../../lib/store';

// Enlace corto desde una @mención: /u/nombre lleva al perfil.
export default function PorUsuario() {
  const { usuario } = useLocalSearchParams<{ usuario: string }>();
  const p = store.perfilPorUsuario(usuario ?? '');
  if (!p) return <Pantalla><Parrafo suave>No existe la cuenta @{usuario}.</Parrafo></Pantalla>;
  return <Redirect href={`/usuario/${p.id}`} />;
}
