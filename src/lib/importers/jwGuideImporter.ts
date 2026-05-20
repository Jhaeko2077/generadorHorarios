export type ImportedGuideData = {
  weekLabel?: string;
  meetingDateLabel?: string;
  bibleReading?: string;
  openingSong?: string;
  middleSong?: string;
  closingSong?: string;
  parts: Array<{
    section: "TESOROS" | "MAESTROS" | "VIDA_CRISTIANA" | "OTROS";
    title: string;
    durationMinutes?: number;
    reference?: string;
  }>;
};

export async function importFromJwGuideUrl(url: string): Promise<ImportedGuideData> {
  void url;

  // TODO(Fase 2): Parsear HTML real de jw.org para extraer datos estructurados.
  // TODO(Fase 2): Resolver variaciones por idioma y formato de semana.
  // TODO(Fase 2): Identificar partes por seccion y mapear duraciones/referencias automaticamente.

  return {
    parts: [],
  };
}
