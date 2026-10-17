import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// Elige fotos de la galería, las reduce a 1080 px y las vuelve a guardar en JPEG.
// Al volver a guardarlas se pierden los metadatos EXIF, incluida la ubicación GPS.
export async function elegirFotos(max: number, cuadrada = false): Promise<string[]> {
  if (max <= 0) return [];
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) return [];
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: !cuadrada && max > 1,
    selectionLimit: max,
    allowsEditing: cuadrada,
    aspect: cuadrada ? [1, 1] : undefined,
    quality: 1,
    exif: false,
  });
  if (r.canceled) return [];
  const salida: string[] = [];
  for (const a of r.assets.slice(0, max)) {
    const ancho = Math.min(a.width || 1080, cuadrada ? 400 : 1080);
    const ref = await ImageManipulator.manipulate(a.uri).resize({ width: ancho }).renderAsync();
    const hecho = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.72, base64: true });
    if (hecho.base64) salida.push(`data:image/jpeg;base64,${hecho.base64}`);
  }
  return salida;
}
