# Gestor de Contraseñas - Aplicación Electron

## Descripción

Gestor de Contraseñas es ahora una aplicación de escritorio compacta construida con Electron. La aplicación se diseñó para ocupar menos de 1/4 de la pantalla (400x600px) y permanecer en la bandeja del sistema cuando se cierra.

## Características

- **Diseño Compacto**: Optimizado para ventanas pequeñas (400x600px)
- **Bandeja del Sistema**: Se mantiene ejecutando en segundo plano
- **Interfaz Simplificada**: Vista de lista única con modals para detalles
- **Auto-Lock**: Bloqueo automático por inactividad
- **Cifrado Local**: Todos los datos se almacenan cifrados localmente

## Requisitos

- Node.js 18+
- npm o bun

## Instalación

```bash
npm install
```

## Desarrollo

Para ejecutar la aplicación en modo desarrollo:

```bash
npm run dev:electron
```

Esto iniciará:
1. Servidor Vite en puerto 5173
2. Aplicación Electron que carga desde el servidor de desarrollo

## Build

Para crear un ejecutable de la aplicación:

```bash
npm run build:electron
```

Esto generará:
- **Windows**: Instalador NSIS y versión portable en `dist-electron/`

## Estructura de Archivos

```
├── electron/
│   ├── main.cjs         # Proceso principal de Electron (CommonJS)
│   └── preload.cjs      # Script de preload (CommonJS)
├── src/
│   ├── components/      # Componentes React
│   ├── stores/          # Estado con Zustand
│   └── main.tsx         # Punto de entrada React
└── public/
    └── icon.png         # Icono de la aplicación (necesario)
```

**Nota**: Los archivos de Electron usan extensión `.cjs` (CommonJS) porque el proyecto usa `"type": "module"` en package.json.

## Funcionalidad de Bandeja del Sistema

- **Click en icono**: Muestra/oculta la ventana
- **Click derecho**: Menú contextual con opciones:
  - Abrir Gestor de Contraseñas
  - Salir

## Ventana Compacta

La aplicación usa un diseño optimizado para ventanas pequeñas:
- Tamaño por defecto: 400x600px
- Tamaño mínimo: 350x500px
- Tamaño máximo: 500x800px
- Fuentes y espaciados reducidos
- Sin panel lateral, todo en vista de lista

## Notas Importantes

1. **Icono**: Necesitas agregar un archivo `icon.png` en la carpeta `public/` antes de hacer el build
2. **Auto-inicio**: La aplicación NO se inicia automáticamente con Windows (puedes agregar esta funcionalidad más tarde)
3. **Datos**: Todos los datos se almacenan en localStorage del navegador de Electron

## Comandos Útiles

```bash
# Desarrollo web (sin Electron)
npm run dev

# Desarrollo Electron
npm run dev:electron

# Build web
npm run build

# Build Electron
npm run build:electron

# Lint
npm run lint
```

## Próximas Mejoras

- [ ] Auto-inicio con Windows
- [ ] Atajos de teclado globales
- [ ] Notificaciones del sistema
- [ ] Actualizaciones automáticas
- [ ] Exportar/Importar vault
- [ ] Generador de contraseñas mejorado
- [ ] Búsqueda de credenciales
- [ ] Categorías/Tags

## Soporte

Para reportar problemas o solicitar funcionalidades, crea un issue en el repositorio.
