import type { Messages } from './en'

export const es: Messages = {
  meta: {
    description: 'Vocabulario de inglés a partir de tus lecturas.',
  },

  common: {
    save: 'Guardar',
    saving: 'Guardando…',
    cancel: 'Cancelar',
    close: 'Cerrar',
    delete: 'Eliminar',
    back: 'Atrás',
    of: 'de',
    notNow: 'Ahora no',
  },

  nav: {
    library: 'Biblioteca',
    study: 'Estudiar',
    words: 'Palabras',
    settings: 'Ajustes',
  },

  library: {
    title: 'Biblioteca',
    subtitle: 'Tus lecturas y transcripciones.',
    empty: 'Aún no hay textos.',
    emptyHint:
      'Pega una lectura o la transcripción de una reunión para empezar.',
    addText: 'Añadir texto',
    terms: (n: number) => (n === 1 ? '1 término' : `${n} términos`),
    toReview: (n: number) => `${n} por revisar`,
    allReviewed: 'Todo revisado',
    review: 'Revisar',
    open: (title: string) => `Abrir ${title}`,
  },

  add: {
    title: 'Añadir un texto',
    subtitle: 'Pégalo, o importa un archivo .txt.',
    titleLabel: 'Título',
    titlePlaceholder: 'ej. Reunión de equipo — 3 de marzo',
    textLabel: 'Texto',
    textPlaceholder: 'Pega aquí tu lectura o transcripción…',
    import: 'Importar .txt',
    save: 'Guardar y extraer',
    saving: 'Extrayendo…',
  },

  study: {
    title: 'Estudiar',
    pickFirst: 'Primero elige un texto en la biblioteca.',
    goToLibrary: 'Ir a la biblioteca',
    progress: (i: number, total: number) => `${i} de ${total}`,
    known: 'Ya la conozco',
    learn: 'Quiero aprenderla',
    skip: 'Saltar',
    hintKnow: '← Conozco',
    hintLearn: 'Aprender →',
    hintSkip: '↑ / Espacio para saltar',
    noTerms: 'No hay términos para revisar en este texto.',
    doneTitle: 'Listo por ahora',
    doneSummary: (known: number, learning: number) =>
      `${known} conocidas · ${learning} por aprender`,
    reviewAgain: 'Revisar de nuevo',
    backToLibrary: 'Volver a la biblioteca',
  },

  words: {
    title: 'Palabras',
    subtitle: 'De todos tus textos.',
    learning: 'Aprendiendo',
    known: 'Conocidas',
    learningEmpty:
      'Nada por aprender aún. Marca palabras con → mientras estudias.',
    knownEmpty:
      'Aún no hay palabras conocidas. Márcalas con ← mientras estudias.',
    from: (title: string) => `de ${title}`,
  },

  settings: {
    title: 'Ajustes',
    subtitle: 'Tus datos viven solo en este computador.',
    language: 'Idioma',
    languages: { en: 'English', es: 'Español' },
    about: 'Acerca de Lexio',
    version: 'Versión',
    dataFile: 'Archivo de datos',
    danger: 'Zona de peligro',
    deleteAll: 'Eliminar todos los textos',
    deleteAllHint:
      'Borra todos los textos y sus términos. No se puede deshacer.',
    deleteAllConfirm: '¿Eliminar todo?',
    deleteAllMessage:
      'Se borran todos tus textos y palabras de este computador.',
    deleteAllOk: 'Eliminar todo',
  },

  update: {
    check: 'Buscar actualizaciones',
    checking: 'Buscando…',
    upToDate: 'Ya tienes la última versión.',
    failed: 'No se pudo actualizar. Intenta de nuevo.',
    available: (version: string) => `Hay una versión nueva (${version}).`,
    updating: 'Actualizando…',
    update: 'Actualizar',
  },

  errors: {
    generic: 'Algo salió mal. Inténtalo de nuevo.',
    invalidData: 'Datos inválidos',
    titleRequired: 'Ponle un título al texto',
    textRequired: 'Pega algún texto primero',
    noWords: 'No se encontraron palabras en ese texto',
    textNotFound: 'Texto no encontrado',
    termNotFound: 'Término no encontrado',
    fileReadFailed: 'No se pudo leer ese archivo',
  },
}
