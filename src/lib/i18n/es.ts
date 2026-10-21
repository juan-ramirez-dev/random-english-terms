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
    remove: 'Quitar',
    recommended: 'recomendado',
  },

  nav: {
    home: 'Hoy',
    practice: 'Practicar',
    material: 'Material',
    progress: 'Progreso',
    settings: 'Ajustes',
  },

  expressions: {
    types: {
      'phrasal-verb': 'Phrasal verb',
      idiom: 'Modismo',
      collocation: 'Colocación',
      expression: 'Expresión',
    },
    mastery: {
      new: 'Nueva',
      learning: 'Aprendiendo',
      mastered: 'Dominada',
    },
    count: (n: number) => (n === 1 ? '1 expresión' : `${n} expresiones`),
  },

  home: {
    greeting: '¿Listo para subir de nivel?',
    streak: (n: number) => (n === 1 ? 'Racha de 1 día' : `Racha de ${n} días`),
    toLearn: (n: number) =>
      n === 1 ? '1 expresión por aprender' : `${n} expresiones por aprender`,
    allDone: 'Estás al día.',
    cta: 'Practicar ahora',
    recent: 'Material reciente',
    seeAll: 'Ver todo',
    recentEmpty: 'Añade un texto para encontrar expresiones en él.',
    addText: 'Añadir texto',
    progress: 'Tu progreso',
  },

  material: {
    title: 'Material',
    subtitle: 'Tus textos y las expresiones que contienen.',
    empty: 'Aún no hay textos.',
    emptyHint:
      'Pega una lectura o la transcripción de una reunión para empezar.',
    addText: 'Añadir texto',
    open: (title: string) => `Abrir ${title}`,
    all: 'Todo el material',
    loading: 'Buscando expresiones…',
    retry: 'Intentar de nuevo',
    learning: (n: number) =>
      n === 1
        ? '1 expresión para practicar'
        : `${n} expresiones para practicar`,
    practice: 'Practicar estas',
  },

  swipe: {
    step: (i: number, total: number) => `${i} de ${total}`,
    known: 'Ya la sé',
    learn: 'Aprenderla',
    skip: 'Saltar',
    keys: '← la sé · → aprender · ↑ saltar',
    learnNow: (n: number) =>
      n === 1 ? 'Aprender la 1 que elegí' : `Aprender las ${n} que elegí`,
    keepSwiping: (n: number) =>
      n === 1 ? 'Seguir (queda 1)' : `Seguir (quedan ${n})`,
    done: 'Ya revisaste todas las expresiones de este texto.',
    nothingNew: 'No hay expresiones nuevas en este texto.',
  },

  learn: {
    title: (n: number) =>
      n === 1 ? '1 expresión por aprender' : `${n} expresiones por aprender`,
    hint: 'Obtén el significado, un ejemplo y ejercicios para cada una.',
    withAi: 'Generar con mi IA',
    generating: 'Escribiendo tus ejercicios…',
    orClaude: 'O usa Claude',
    claudeHint:
      'Copia el prompt, pégalo en Claude y luego pega aquí su respuesta.',
    firstOnly: (n: number) => `El prompt incluye las primeras ${n}.`,
    copy: 'Copiar prompt',
    copied: 'Copiado',
    pastePlaceholder: 'Pega aquí la respuesta de Claude…',
    save: 'Guardar',
    saved: (n: number) =>
      n === 1
        ? '1 expresión lista para practicar.'
        : `${n} expresiones listas para practicar.`,
  },

  practice: {
    title: 'Practicar',
    building: 'Preparando tu sesión…',
    nothing: 'Aún no hay nada que practicar.',
    nothingHint: 'Abre un texto en Material y elige lo que quieres aprender.',
    goMaterial: 'Ir a Material',
    retry: 'Intentar de nuevo',
    step: (i: number, total: number) => `${i} de ${total}`,
    kinds: {
      'multiple-choice': '¿Qué significa?',
      'fill-gap': 'Completa el hueco',
      context: '¿Cuál encaja?',
      match: 'Empareja',
    },
    typeHere: 'Escribe la expresión',
    check: 'Comprobar',
    next: 'Siguiente',
    alreadyKnow: 'Ya me la sé',
    finish: 'Terminar',
    correct: '¡Correcto!',
    wrong: 'No del todo',
    answerWas: (answer: string) => `Respuesta: ${answer}`,
    pickMeaning: 'Elige una frase y luego su significado.',
    quit: 'Salir',
    doneTitle: 'Sesión completa',
    score: (correct: number, total: number) =>
      `${correct} de ${total} correctas`,
    streak: (n: number) => (n === 1 ? 'Racha de 1 día' : `Racha de ${n} días`),
    again: 'Practicar de nuevo',
    backHome: 'Volver a Hoy',
  },

  progress: {
    title: 'Progreso',
    subtitle: 'Cada expresión, según cuánto la dominas.',
    empty: 'Aún no hay expresiones.',
    emptyHint: 'Aparecerán aquí al añadir textos.',
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

  settings: {
    title: 'Ajustes',
    subtitle: 'Tus datos viven solo en este computador.',
    language: 'Idioma',
    languages: { en: 'English', es: 'Español' },
    ai: 'IA',
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

  ai: {
    hint: 'La IA que convierte tus palabras en ejercicios.',
    none: 'Aún no has configurado una IA.',
    localModel: 'En este computador',
    setUp: 'Configurar IA',
    change: 'Cambiar IA',
  },

  aiSetup: {
    eyebrow: 'IA',
    title: 'Elige una IA',
    aiType: 'Tipo de IA',
    local: 'En este computador',
    online: 'Servicio en línea',
    privateTitle: 'Privada.',
    privateText: 'Funciona en tu computador. Nada sale de él.',
    provider: 'Proveedor',
    model: 'Modelo',
    keyLabel: 'Clave de API',
    keyPlaceholder: 'Pega tu clave',
    keyWhere: (url: string) => `Consigue una clave en ${url}`,
    keySafe: 'Tu clave está segura:',
    keychain: 'Se guarda en el llavero del sistema, nunca en la app.',
    onlyFor: (name: string) => `Solo se envía a ${name}.`,
    testing: 'Probando…',
    testAndSave: 'Probar y guardar',
    downloadAndUse: 'Descargar y usar',
    downloading: 'Descargando…',
    downloaded: 'Descargado',
    available: 'Ya está en este computador',
    reuse: 'Usar sin descargar',
    importing: 'Importando…',
    useThis: 'Usar este',
    replaces: (name: string) => `Reemplaza a ${name}.`,
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
    textTooLong: 'Ese texto es demasiado largo. El límite es {max} caracteres.',
    noExpressions: 'No se encontraron expresiones en ese texto',
    badJson: 'Eso no parece JSON. Copia toda la respuesta de Claude.',
    nothingValid: 'Ninguna de esas expresiones sirvió. Inténtalo de nuevo.',
    copyFailed: 'No se pudo copiar el prompt',
    noAi: 'Primero configura una IA',
    textNotFound: 'Texto no encontrado',
    fileReadFailed: 'No se pudo leer ese archivo',
    offline: 'No se pudo conectar con {provider}. Revisa tu conexión.',
    badResponse: '{provider} respondió algo inesperado.',
    keyRejected: '{provider} rechazó la clave.',
    modelNotFound: '{provider} no tiene ese modelo.',
    rateLimited: '{provider} está limitando. Intenta más tarde.',
    providerFailed: '{provider} falló ({status}). Intenta de nuevo.',
    unknownProvider: 'Proveedor desconocido',
    emptyKey: 'Primero pega tu clave de API',
    keychainFailed: 'No se pudo acceder al llavero del sistema',
    keyMissing: '{provider} no tiene una clave guardada. Agrégala en Ajustes.',
    refused: 'La IA se negó a responder. Intenta de nuevo.',
    invalidModel: 'La IA respondió algo inesperado.',
    tooLong: 'Ese texto es demasiado largo para la IA de este computador.',
    localModelMissing:
      'El modelo de IA no está en este computador. Configúralo en Ajustes.',
    localModelBroken: 'No se pudo abrir el modelo de IA. Descárgalo de nuevo.',
    localModelFailed: 'La IA de este computador falló. Intenta de nuevo.',
    localModelBusy:
      'La IA de este computador está ocupada. Intenta en un momento.',
    downloadFailed: 'No se pudo descargar el modelo. Intenta de nuevo.',
    diskFull: 'No hay espacio suficiente en el disco',
    downloadCorrupt: 'La descarga se corrompió. Intenta de nuevo.',
    modelSaveFailed: 'No se pudo guardar el modelo',
    modelDeleteFailed: 'No se pudo eliminar el modelo',
    unknownModel: 'Modelo desconocido',
    appFolderMissing: 'No se encontró la carpeta de la app',
  },
}
