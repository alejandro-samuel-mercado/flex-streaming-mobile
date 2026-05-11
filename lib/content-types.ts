/**
 * Content type labels and helpers — mobile version.
 * Ported from web's content-types.tsx without JSX icon components.
 */

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  MOVIE: 'Película',
  SERIES: 'Serie',
  ANIME: 'Anime',
  ANIMATION: 'Animación',
  DOCUMENTARY: 'Documental',
  BIOGRAPHY: 'Biografía',
  REALITY_SHOW: 'Reality Show',
  TALK_SHOW: 'Talk Show',
  VARIETY_SHOW: 'Programa de Variedades',
  STAND_UP: 'Stand-up Comedy',
  SPECIAL: 'Especial',
  EDUCATIONAL: 'Contenido Educativo',
  KIDS: 'Infantil',
  FAMILY: 'Familiar',
  INTERACTIVE: 'Contenido Interactivo',
  EXPERIMENTAL: 'Experimental / Artístico',
  DOCUDRAMA: 'Docudrama',
  NOVELA: 'Telenovela',
  SHORT: 'Cortometraje',
};

export const getContentTypeLabel = (type?: string): string => {
  return CONTENT_TYPE_LABELS[type || ''] || type || 'Contenido';
};

// Icon names from lucide-react-native for each type
export const CONTENT_TYPE_ICONS: Record<string, string> = {
  MOVIE: 'Film',
  SERIES: 'Tv',
  ANIME: 'Monitor',
  ANIMATION: 'Play',
  DOCUMENTARY: 'Globe',
  BIOGRAPHY: 'Star',
  REALITY_SHOW: 'Camera',
  TALK_SHOW: 'Mic',
  VARIETY_SHOW: 'LayoutGrid',
  STAND_UP: 'Mic',
  SPECIAL: 'Sparkles',
  EDUCATIONAL: 'BookOpen',
  KIDS: 'Baby',
  FAMILY: 'Users',
  INTERACTIVE: 'MousePointer',
  EXPERIMENTAL: 'FlaskConical',
  DOCUDRAMA: 'Theater',
  NOVELA: 'Heart',
  SHORT: 'Clock',
};

export const CONTENT_TYPES_LIST = Object.keys(CONTENT_TYPE_LABELS);
