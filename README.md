# OpenBOR Input Overlay

MVP de overlay transparente para Windows: convierte las teclas de OpenBOR en un gamepad visual con skins PlayStation, Xbox y arcade, input global, fallback local, click-through y hotkeys.

## Instalar y ejecutar

Requiere Windows 10/11 y Node.js 20 o superior.

```powershell
npm install
npm start
```

`npm run dev` inicia el modo de desarrollo. `npm run build` genera instalador NSIS y ejecutable portable en `dist/`.

## OpenBOR y OBS

Iniciá primero el overlay y después OpenBOR. Movelo arrastrando la franja superior y redimensionalo desde los bordes. Usá OpenBOR en modo **windowed** o **borderless**: el fullscreen exclusivo puede dibujarse encima de cualquier overlay.

En OBS agregá **Captura de ventana**, elegí `OpenBOR Input Overlay` y usá Windows Graphics Capture con transparencia. También podés capturar el escritorio/juego con el overlay ya posicionado. No requiere chroma key.

El indicador verde confirma `Input global activo`; amarillo indica el fallback local.

## Mapping y configuración

Editá `config.json` con la app cerrada. En una build portable podés ponerlo junto al `.exe`.

- `skin`: `playstation`, `xbox` o `arcade`.
- `directionControl`: `stick` o `dpad`. El stick admite diagonales al pulsar dos flechas.
- `scale`, `opacity`, `showLabels`, `alwaysOnTop`, `clickThrough`.
- `window`: tamaño/posición inicial (`null` deja decidir a Windows).
- `mapping`: códigos `KeyboardEvent.code` asociados a `up`, `down`, `left`, `right`, `square`, `cross`, `circle`, `triangle`, `start` o `select`.

Mapping inicial: flechas → movimiento, `Z` → □, `X` → ✕, `C` → ○, `V` → △, `Enter` → Start y ambos `Shift` → Select. Las skins cambian los símbolos sin cambiar el mapping.

## Hotkeys

- `Ctrl+Shift+O`: ocultar/mostrar.
- `Ctrl+Shift+K`: cambiar skin.
- `Ctrl+Shift+I`: alternar click-through. Desactivalo para poder arrastrar la ventana.
- `Ctrl+Shift+M`: entrar/salir del modo mover. Arrastrá la franja superior o usá `−`/`+` para cambiar el tamaño; también podés usar `Ctrl+Shift+↓`/`Ctrl+Shift+↑`. Al salir se restaura el click-through anterior.

Se pueden cambiar en `config.json` usando aceleradores de Electron.

## Input global y fallback

El hook usa [`uiohook-napi`](https://www.npmjs.com/package/uiohook-napi), bindings N-API de `libuiohook` con `keydown` y `keyup` globales. Al ser nativo, un antivirus, una política corporativa, arquitectura no soportada o permisos distintos pueden impedir que cargue.

Si falla, la app no se cierra: cambia a `Fallback local`. Hacé click en el overlay para probar las mismas teclas con eventos del navegador. Este modo no puede verlas cuando OpenBOR tiene el foco.

Para recuperar el hook global:

1. Usá Windows x64 y Node LTS, borrá `node_modules`/`package-lock.json` y repetí `npm install`.
2. Ejecutá overlay y OpenBOR con el mismo nivel de privilegio. Windows puede bloquear el hook hacia un juego abierto como administrador.
3. Comprobá que el antivirus no haya aislado el `.node` de `uiohook-napi`.

## Problemas comunes

- **No aparece sobre el juego:** evitá fullscreen exclusivo; usá windowed/borderless.
- **Rectángulo negro en OBS:** cambiá a Windows Graphics Capture y habilitá transparencia; no todos los métodos preservan alfa.
- **No puedo moverlo:** `Ctrl+Shift+I` desactiva click-through.
- **Mapping especial no detectado globalmente:** agregá el alias de `UiohookKey` en `src/input-manager.js`; el fallback local acepta cualquier `KeyboardEvent.code`.

## Estructura

`main.js` maneja ventana/hotkeys; `src/input-manager.js`, el hook; `src/config.js`, configuración; `preload.js`, IPC seguro; y `renderer/`, UI y estado visual. El renderer tiene aislamiento de contexto y Node deshabilitado.
