import { PerfilVista } from '../../components/PerfilVista';
import * as store from '../../lib/store';

export default function MiPerfil() {
  store.useVersion();
  const yo = store.get().sesionId;
  return yo ? <PerfilVista id={yo} /> : null;
}
