export interface UbigeoDepartamento {
  departamento: string;
  provincias: UbigeoProvincia[];
}

export interface UbigeoProvincia {
  provincia: string;
  distritos: string[];
}

/** Normaliza para comparaciones case/acentos/espacios */
export function normalize(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
