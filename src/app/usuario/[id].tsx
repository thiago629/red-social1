import { Redirect, useLocalSearchParams } from 'expo-router';
import { PerfilVista } from '../../components/PerfilVista';
import * as store from '../../lib/store';

export default function Usuario() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (id === store.get().sesionId) return <Redirect href="/perfil" />;
  return <PerfilVista id={id} />;
}
