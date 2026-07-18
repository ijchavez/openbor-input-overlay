# OpenBOR Input Overlay

Overlay transparente para Windows que convierte las teclas usadas en OpenBOR en un mando visual. Está pensado para jugar, grabar o transmitir con OBS y ofrece input global, click-through, movimiento y escalado, skins, reasignación de teclas, perfiles, modo transmisión y control desde la bandeja de Windows.

## Índice

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
  - [Instalar dependencias](#instalar-dependencias)
  - [Ejecutar la aplicación](#ejecutar-la-aplicación)
  - [Otros comandos](#otros-comandos)
- [Inicio rápido](#inicio-rápido)
- [Interfaz del overlay](#interfaz-del-overlay)
- [Input global y fallback local](#input-global-y-fallback-local)
- [Mover y cambiar el tamaño](#mover-y-cambiar-el-tamaño)
- [Cambiar los controles de lado](#cambiar-los-controles-de-lado)
- [Click-through](#click-through)
- [Modo transmisión para OBS](#modo-transmisión-para-obs)
- [Skins](#skins)
- [Configurar las teclas](#configurar-las-teclas)
  - [Mapping predeterminado](#mapping-predeterminado)
  - [Códigos de teclado](#códigos-de-teclado)
- [Joystick o gamepad USB](#joystick-o-gamepad-usb)
- [Perfiles](#perfiles)
  - [Elegir la carpeta de perfiles](#elegir-la-carpeta-de-perfiles)
  - [Crear o actualizar un perfil](#crear-o-actualizar-un-perfil)
  - [Cargar un perfil](#cargar-un-perfil)
  - [Eliminar un perfil](#eliminar-un-perfil)
  - [Qué guarda un perfil](#qué-guarda-un-perfil)
- [Bandeja de Windows](#bandeja-de-windows)
- [Atajos de teclado](#atajos-de-teclado)
- [Persistencia y archivos de configuración](#persistencia-y-archivos-de-configuración)
  - [Configuración predeterminada](#configuración-predeterminada)
  - [Estado local durante el desarrollo](#estado-local-durante-el-desarrollo)
  - [Aplicación instalada o portable](#aplicación-instalada-o-portable)
  - [Copias de respaldo](#copias-de-respaldo)
- [Referencia de config.json](#referencia-de-configjson)
- [Usar con OpenBOR](#usar-con-openbor)
- [Configurar OBS](#configurar-obs)
- [Compilar instalador y portable](#compilar-instalador-y-portable)
- [Solución de problemas](#solución-de-problemas)
- [Limitaciones actuales](#limitaciones-actuales)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Seguridad del renderer](#seguridad-del-renderer)
- [Desarrollo y Git](#desarrollo-y-git)

## Características

- Overlay transparente y siempre visible sobre otras ventanas.
- Input de teclado global mediante `uiohook-napi`.
- Fallback local si el hook nativo no puede iniciarse.
- Indicadores visuales para direcciones, botones de acción, Start y Select.
- Dirección mediante stick analógico visual o D-pad.
- Diagonales al mantener dos direcciones simultáneamente.
- Skins PlayStation, Xbox y arcade.
- Click-through para que el mouse atraviese el overlay.
- Modo mover con restauración automática del click-through.
- Tamaño ajustable entre `380 × 165` y `760 × 330` píxeles.
- Reasignación visual de teclas sin editar JSON manualmente.
- Layout reversible para colocar el D-pad/stick a la izquierda o a la derecha.
- Soporte directo para gamepads USB con mapping estándar.
- Perfiles individuales en archivos JSON con mapping, skin, tamaño y layout.
- Modo transmisión limpio para OBS.
- Persistencia automática de posición, tamaño, skin, click-through, modo transmisión y último perfil.
- Menú en la bandeja de Windows.
- Atajos globales para las acciones principales.
- Configuración local separada de los valores predeterminados del repositorio.
- Copia de respaldo antes de sobrescribir el estado local.

## Requisitos

- Windows 10 u 11, preferentemente x64.
- Node.js 20 o superior para ejecutar desde el código fuente.
- npm, incluido con Node.js.
- OpenBOR en modo ventana o borderless para superponer el overlay sobre el juego.
- OBS Studio si se desea grabar o transmitir.

## Instalación

### Instalar dependencias

Abrí PowerShell en la carpeta del proyecto:

```powershell
cd D:\OneDrive\Documents\openbor-input-overlay
npm.cmd install
```

También podés usar `npm install` si PowerShell permite ejecutar `npm.ps1`.

### Ejecutar la aplicación

```powershell
npm.cmd start
```

Al iniciar se abre el overlay y aparece un icono en la bandeja de Windows, junto al reloj. Si no lo ves, revisá el menú de iconos ocultos mediante la flecha `^`.

### Otros comandos

```powershell
npm.cmd run dev
npm.cmd run build:portable
npm.cmd run build:installer
npm.cmd run build
```

- `npm.cmd run dev`: inicia Electron con el argumento de desarrollo.
- `npm.cmd run build:portable`: genera únicamente el ejecutable portable x64.
- `npm.cmd run build:installer`: genera únicamente el instalador NSIS x64.
- `npm.cmd run build`: genera ambos artefactos dentro de `dist/`.
## Inicio rápido

1. Iniciá el overlay con `npm.cmd start`.
2. Comprobá que el indicador muestre `Input global activo`.
3. Pulsá `Ctrl+Shift+M` para entrar en modo mover.
4. Arrastrá la franja superior, ajustá el tamaño con `−` o `+` y usá `⇄` para cambiar los controles de lado.
5. Pulsá nuevamente `Ctrl+Shift+M` para terminar.
6. Configurá las teclas desde `Configurar teclas` si el mapping predeterminado no coincide con OpenBOR.
7. Activá click-through con `Ctrl+Shift+I` para que el overlay no intercepte el mouse.
8. Para transmitir, activá `Modo OBS` o pulsá `Ctrl+Shift+S`.
9. Para salir del modo OBS, pulsá otra vez `Ctrl+Shift+S` o desmarcalo desde la bandeja.

## Interfaz del overlay

La ventana contiene las siguientes áreas:

- **Barra superior:** nombre de la aplicación, zona de arrastre e indicador del input.
- **Control de dirección:** stick visual o D-pad, según `directionControl`.
- **Botones centrales:** Select y Start.
- **Botones derechos:** triángulo, círculo, cruz y cuadrado; las skins Xbox y arcade cambian sus símbolos.
- **Barra inferior:** acceso a movimiento, tamaño, modo OBS, perfiles, configuración de teclas y click-through.

El color del indicador informa el estado del input:

- **Verde:** input global activo.
- **Amarillo:** fallback local activo.

## Input global y fallback local

El input global usa [`uiohook-napi`](https://www.npmjs.com/package/uiohook-napi), un binding nativo que escucha eventos `keydown` y `keyup` aunque OpenBOR tenga el foco.

El flujo es el siguiente:

1. La aplicación convierte cada `KeyboardEvent.code` configurado al nombre correspondiente de `UiohookKey`.
2. El hook escucha la tecla globalmente.
3. El proceso principal envía el evento al renderer.
4. El renderer ilumina o libera el control visual correspondiente.
5. Las pulsaciones repetidas del sistema se filtran para evitar eventos duplicados.

Si el módulo nativo no puede cargarse, la aplicación continúa funcionando en modo `Fallback local`. En este modo:

- El overlay debe tener el foco para recibir las teclas.
- No puede ver las pulsaciones cuando OpenBOR tiene el foco.
- Sirve para probar el mapping y diagnosticar el hook global.

## Mover y cambiar el tamaño

Pulsá `Ctrl+Shift+M` o elegí `Modo mover` desde la bandeja.

Mientras el modo mover está activo:

- El click-through se desactiva temporalmente.
- La aplicación se muestra y obtiene el foco.
- La franja superior puede arrastrarse para cambiar la posición.
- Los controles `− TAMAÑO +` aparecen en la barra inferior.
- `−` reduce el tamaño en pasos aproximados del 10 %.
- `+` aumenta el tamaño en pasos aproximados del 10 %.
- `Ctrl+Shift+↓` reduce el tamaño.
- `Ctrl+Shift+↑` aumenta el tamaño.

Límites de tamaño:

- **Máximo:** `760 × 330`.
- **Mínimo:** `380 × 165`.

El contenido escala proporcionalmente y la ventana conserva su centro durante el cambio. Al salir del modo mover se restaura el estado de click-through que estaba activo antes de entrar.

La posición y el tamaño se guardan automáticamente después de mover o redimensionar.

## Cambiar los controles de lado

Con `Modo mover` activo, pulsá el botón `⇄` para alternar entre estas disposiciones:

- **Estándar:** D-pad/stick a la izquierda y botones de acción a la derecha.
- **Invertida:** botones de acción a la izquierda y D-pad/stick a la derecha.

También se puede activar `Controles invertidos` desde la bandeja de Windows. La disposición se guarda automáticamente y forma parte de cada perfil.

## Click-through

Click-through hace que el mouse atraviese el overlay y llegue al juego o ventana que está debajo.

Se puede alternar mediante:

- El botón `Click-through: ON/OFF`.
- `Ctrl+Shift+I`.
- El menú de la bandeja.

Aunque esté en `ON`, los botones de click-through, configuración, perfiles y modo OBS conservan una pequeña zona interactiva al pasar el cursor. El resto de la ventana continúa siendo atravesable.

Durante los modos mover, configuración o perfiles, click-through se desactiva temporalmente. Al cerrar ese modo se restaura el valor anterior.

Si el modo OBS oculta los controles, usá `Ctrl+Shift+I` o la bandeja para cambiar click-through.

## Modo transmisión para OBS

El modo transmisión limpio oculta:

- La barra superior.
- El indicador del input.
- La barra inferior.
- Los botones de configuración.
- Las ayudas y atajos visibles.

El mando sigue reaccionando normalmente a las teclas.

Para activarlo o desactivarlo:

- Pulsá `Ctrl+Shift+S`.
- Pulsá `Modo OBS` antes de que la barra inferior quede oculta.
- Marcá o desmarcá `Modo transmisión limpio` desde la bandeja de Windows.

> Si activaste modo OBS y desaparecieron los botones, no es un error: salí con `Ctrl+Shift+S` o desde la bandeja.

Si entrás en modo mover mientras modo OBS está activo, la barra necesaria para mover y cambiar el tamaño reaparece temporalmente. Al terminar vuelve la vista limpia.

El estado de modo OBS se guarda automáticamente y se recupera en el siguiente inicio.

## Skins

Las skins disponibles son:

- `playstation`
- `xbox`
- `arcade`

Podés cambiar de skin mediante:

- `Ctrl+Shift+K`.
- `Cambiar skin` desde la bandeja.
- La propiedad `skin` del archivo de configuración.
- La carga de un perfil que tenga otra skin.

La skin cambia símbolos, colores y presentación, pero no altera el mapping de teclas. La última skin seleccionada se guarda automáticamente.

## Configurar las teclas

1. Pulsá `Configurar teclas` en la barra inferior o en la bandeja.
2. Elegí uno de los controles del panel:
   - Arriba
   - Abajo
   - Izquierda
   - Derecha
   - Superior
   - Derecho
   - Inferior
   - Izquierdo
   - Select
   - Start
3. Presioná la nueva tecla.
4. El cambio se guarda y el hook global se reinicia con el nuevo mapping.
5. Repetí el proceso con los demás controles.
6. Pulsá `Terminar configuración` para cerrar el panel.

Cada control admite una tecla principal. Si asignás una tecla que ya estaba usada, esa tecla pasa al nuevo control para evitar conflictos. Al reasignar un control, su asignación anterior se elimina.

### Mapping predeterminado

| Tecla | Control visual |
|---|---|
| `ArrowUp` | Arriba |
| `ArrowDown` | Abajo |
| `ArrowLeft` | Izquierda |
| `ArrowRight` | Derecha |
| `Z` | Cuadrado / botón izquierdo |
| `X` | Cruz / botón inferior |
| `C` | Círculo / botón derecho |
| `V` | Triángulo / botón superior |
| `Enter` | Start |
| `ShiftLeft` o `ShiftRight` | Select |

### Códigos de teclado

El mapping utiliza valores de [`KeyboardEvent.code`](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/code), por ejemplo:

- Letras: `KeyA`, `KeyZ`, `KeyX`.
- Números superiores: `Digit1`, `Digit2`.
- Flechas: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`.
- Teclas especiales: `Enter`, `Space`, `Escape`, `Tab`, `Backspace`.
- Modificadores: `ShiftLeft`, `ShiftRight`, `ControlLeft`, `ControlRight`, `AltLeft`, `AltRight`.
- Teclado numérico: `Numpad0`, `NumpadEnter`, etc.
- Funciones: `F1` a `F24`, cuando estén disponibles en el teclado y en el hook nativo.

No todas las teclas especiales de todos los teclados tienen necesariamente un equivalente en `UiohookKey`. El fallback local puede reconocer códigos que el hook global no soporte.

## Joystick o gamepad USB

La aplicación detecta mediante la Gamepad API el primer mando USB que Windows y Chromium expongan al sistema. No requiere activar el hook global de teclado.

Mapping estándar actual:

| Control físico | Control visual |
|---|---|
| Stick izquierdo o D-pad | Direcciones |
| A / cruz (botón 0) | Cruz / botón inferior |
| B / círculo (botón 1) | Círculo / botón derecho |
| X / cuadrado (botón 2) | Cuadrado / botón izquierdo |
| Y / triángulo (botón 3) | Triángulo / botón superior |
| Back / Share (botón 8) | Select |
| Start / Options (botón 9) | Start |

1. Conectá el joystick antes o después de abrir el overlay.
2. Pulsá cualquier botón si el navegador todavía no lo enumeró.
3. El estado superior cambia a `Gamepad USB: nombre del dispositivo`.
4. Las pulsaciones se iluminan en el overlay y quedan visibles en la captura de OBS.

El teclado y el gamepad pueden usarse al mismo tiempo. Se aplica una zona muerta de `0.45` al stick izquierdo para evitar entradas accidentales. La asignación USB es fija por ahora; algunos controles genéricos que no respetan el mapping estándar pueden presentar botones intercambiados.

## Perfiles

Los perfiles agrupan configuraciones para distintos juegos o jugadores. Cada perfil se guarda como un archivo `.json` independiente.

### Elegir la carpeta de perfiles

1. Abrí `Perfiles`.
2. Pulsá `Elegir carpeta`.
3. Elegí una carpeta existente o creá una desde el selector nativo de Windows.
4. Pulsá `Usar esta carpeta`.

La ruta elegida se conserva al reiniciar y la lista se actualiza con todos los `.json` válidos de esa carpeta. Los archivos inválidos se ignoran sin impedir que la aplicación arranque.

Ubicaciones predeterminadas:

- **Desarrollo:** `profiles/` dentro del repositorio.
- **Portable:** `profiles/` junto al ejecutable.
- **Instalada:** `profiles/` dentro del directorio de datos de la aplicación.

Los perfiles antiguos guardados dentro de la configuración se migran automáticamente a archivos individuales la primera vez que se inicia esta versión.

### Crear o actualizar un perfil

1. Configurá el mapping deseado.
2. Elegí la skin.
3. Ajustá el tamaño y la disposición izquierda/derecha del overlay.
4. Pulsá `Perfiles`.
5. Escribí un nombre de hasta 40 caracteres.
6. Pulsá `Crear / actualizar perfil`.

Si ya existe un perfil con el mismo nombre, se reemplaza con los valores actuales.

### Cargar un perfil

1. Abrí `Perfiles`.
2. Seleccioná un nombre en `Perfiles guardados`.
3. Pulsá `Cargar`.

La aplicación aplica inmediatamente el mapping, la skin, el tamaño y la disposición. El hook global se reinicia con las teclas del perfil y el nombre queda marcado como activo.

También se puede cargar un perfil directamente desde el submenú `Perfiles` de la bandeja.

### Eliminar un perfil

1. Abrí `Perfiles`.
2. Seleccioná el perfil.
3. Pulsá `Eliminar`.
4. Confirmá la eliminación.

Eliminar el perfil activo quita su marca de activo, pero no borra el mapping que ya está aplicado en memoria.

### Qué guarda un perfil

Cada perfil guarda:

- Mapping de teclas.
- Skin.
- Ancho y alto del overlay.
- Disposición estándar o invertida.

Actualmente un perfil no guarda:

- Posición en pantalla.
- Click-through.
- Opacidad.
- Modo OBS.
- `directionControl`.

Esos valores pueden persistir como estado general de la aplicación, pero no forman parte individual de cada perfil en esta versión.

## Bandeja de Windows

La aplicación crea un icono junto al reloj. Si Windows lo oculta, abrí la flecha `^` de iconos adicionales.

- **Clic izquierdo:** muestra u oculta el overlay.
- **Clic derecho:** abre el menú completo.

El menú permite:

- Mostrar u ocultar el overlay.
- Activar o cerrar modo mover.
- Activar o desactivar modo transmisión limpio.
- Activar o desactivar click-through.
- Cargar un perfil.
- Abrir o cerrar el administrador de perfiles.
- Abrir o cerrar la configuración de teclas.
- Cambiar la skin.
- Invertir la posición del D-pad/stick y los botones de acción.
- Salir completamente de la aplicación.

Cerrar la ventana mediante `Alt+F4` no termina el proceso: la oculta en la bandeja. Para cerrar realmente la aplicación elegí `Salir` en ese menú.

## Atajos de teclado

Los atajos son globales: funcionan aunque OpenBOR tenga el foco.

| Atajo | Acción |
|---|---|
| `Ctrl+Shift+O` | Mostrar u ocultar el overlay |
| `Ctrl+Shift+K` | Cambiar a la siguiente skin |
| `Ctrl+Shift+I` | Activar o desactivar click-through |
| `Ctrl+Shift+M` | Entrar o salir del modo mover |
| `Ctrl+Shift+S` | Entrar o salir del modo transmisión limpio |
| `Ctrl+Shift+↓` | Achicar mientras modo mover está activo |
| `Ctrl+Shift+↑` | Agrandar mientras modo mover está activo |

Los primeros cinco atajos se configuran en `hotkeys`. Los atajos de tamaño están definidos actualmente por la aplicación.

Si un atajo no responde, puede estar registrado por otra aplicación o por otra instancia del overlay. Cerrá las otras instancias y volvé a iniciar.

## Persistencia y archivos de configuración

### Configuración predeterminada

`config.json` contiene los valores predeterminados distribuidos con el proyecto. Este archivo debe mantenerse limpio y versionable.

### Estado local durante el desarrollo

Al ejecutar mediante `npm.cmd start`, el estado del usuario se guarda en:

```text
config.user.json
```

Este archivo está incluido en `.gitignore` y no debe aparecer en commits. Conserva las preferencias personales y la ruta de la carpeta de perfiles sin modificar los defaults del repositorio.

### Aplicación instalada o portable

En una aplicación empaquetada:

1. La build portable detecta `PORTABLE_EXECUTABLE_DIR` y guarda automáticamente `config.json` y la carpeta `profiles/` junto al `.exe`. Así se pueden copiar juntos a otra PC o unidad USB.
2. En una instalación normal, si existe un `config.json` junto al ejecutable se usa ese archivo.
3. Si no existe, se usa el directorio `userData` de Electron, normalmente dentro de `%APPDATA%\openbor-input-overlay\config.json`.
### Copias de respaldo

Antes de sobrescribir la configuración, la aplicación copia la versión anterior a:

```text
config.user.json.bak
```

O al equivalente `.bak` de la configuración instalada/portable.

La escritura utiliza primero un archivo temporal `.tmp` y luego lo reemplaza, reduciendo el riesgo de dejar JSON incompleto si ocurre una interrupción.

Se guarda automáticamente al:

- Mover la ventana.
- Cambiar el tamaño.
- Cambiar la skin.
- Alternar click-through.
- Alternar modo OBS.
- Cambiar la disposición de los controles.
- Elegir otra carpeta de perfiles.
- Crear, cargar o eliminar perfiles.
- Salir de la aplicación.

## Referencia de config.json

Ejemplo resumido:

```json
{
  "skin": "playstation",
  "directionControl": "stick",
  "layout": "standard",
  "scale": 1,
  "opacity": 0.96,
  "showLabels": true,
  "alwaysOnTop": true,
  "clickThrough": false,
  "streamMode": false,
  "window": {
    "width": 760,
    "height": 330,
    "x": null,
    "y": null
  },
  "hotkeys": {
    "toggleVisibility": "CommandOrControl+Shift+O",
    "cycleSkin": "CommandOrControl+Shift+K",
    "toggleClickThrough": "CommandOrControl+Shift+I",
    "toggleMoveMode": "CommandOrControl+Shift+M",
    "toggleStreamMode": "CommandOrControl+Shift+S"
  },
  "mapping": {
    "ArrowUp": "up",
    "KeyZ": "square"
  },
  "profilesDirectory": null,
  "activeProfile": null
}
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `skin` | string | `playstation`, `xbox` o `arcade` |
| `directionControl` | string | `stick` o `dpad` |
| `layout` | string | `standard` o `reversed`; define qué grupo aparece a cada lado |
| `scale` | number | Escala adicional aplicada al contenido visual |
| `opacity` | number | Opacidad del overlay, normalmente entre `0` y `1` |
| `showLabels` | boolean | Muestra u oculta etiquetas y barra inferior |
| `alwaysOnTop` | boolean | Mantiene la ventana sobre otras ventanas |
| `clickThrough` | boolean | Estado inicial y persistente de click-through |
| `streamMode` | boolean | Estado persistente del modo transmisión limpio |
| `window.width` | number | Ancho de la ventana, limitado entre `380` y `760` |
| `window.height` | number | Alto de la ventana, proporcional al ancho |
| `window.x` | number o null | Posición horizontal; `null` deja decidir a Windows |
| `window.y` | number o null | Posición vertical; `null` deja decidir a Windows |
| `hotkeys` | object | Aceleradores globales compatibles con Electron |
| `mapping` | object | Relación `KeyboardEvent.code` → control visual |
| `profilesDirectory` | string o null | Carpeta de archivos de perfil; `null` usa la ubicación predeterminada |
| `profiles` | object | Campo heredado que se migra a archivos individuales al iniciar |
| `activeProfile` | string o null | Último perfil cargado o creado |

Controles válidos dentro de `mapping`:

```text
up, down, left, right,
square, cross, circle, triangle,
start, select
```

Editá manualmente el archivo local con la aplicación cerrada. Un JSON inválido hace que la aplicación use los valores predeterminados y escriba una advertencia en la consola.

## Usar con OpenBOR

1. Iniciá el overlay.
2. Iniciá OpenBOR.
3. Configurá OpenBOR en modo ventana o borderless.
4. Comprobá que ambos programas se ejecuten con el mismo nivel de privilegio.
5. Ajustá el mapping para que coincida con las teclas configuradas en OpenBOR.
6. Posicioná y escalá el overlay.
7. Activá click-through antes de jugar.

El fullscreen exclusivo puede dibujarse por encima de cualquier overlay. Si no aparece sobre el juego, usá ventana sin bordes.

Si OpenBOR se ejecuta como administrador y el overlay no, Windows puede impedir que el hook capture las teclas. Ejecutá ambos normalmente o ambos con el mismo nivel de privilegio.

## Configurar OBS

Método recomendado:

1. Iniciá el overlay y OpenBOR.
2. En OBS agregá una fuente `Captura de ventana`.
3. Elegí `OpenBOR Input Overlay`.
4. Usá Windows Graphics Capture cuando esté disponible.
5. Conservá la transparencia de la ventana.
6. Activá modo OBS con `Ctrl+Shift+S`.
7. Posicioná la fuente dentro de la escena.

Alternativamente, capturá el escritorio o el juego con el overlay ya posicionado encima.

No debería ser necesario usar chroma key. Si aparece un rectángulo negro, cambiá el método de captura y comprobá que preserve el canal alfa.

## Compilar instalador y portable

### Generar solamente el portable

```powershell
npm.cmd run build:portable
```

El archivo resultante queda en `dist/` con un nombre similar a:

```text
OpenBOR Input Overlay-Portable-1.0.0-x64.exe
```

Es un único ejecutable: no requiere instalación. Al cerrarlo desde la bandeja guarda un `config.json` junto al `.exe`; distribuí ese JSON solamente si querés incluir una configuración o perfiles predefinidos. Para una descarga limpia alcanza con publicar el `.exe`.

### Generar solamente el instalador

```powershell
npm.cmd run build:installer
```

El resultado usa un nombre similar a:

```text
OpenBOR Input Overlay-Setup-1.0.0-x64.exe
```

### Generar ambos

```powershell
npm.cmd run build
```

Configuración de build relevante:

- App ID: `com.openbor.inputoverlay`.
- Nombre: `OpenBOR Input Overlay`.
- Arquitectura: Windows x64.
- Targets: `portable` y `nsis`.
- Cada target tiene un nombre de artefacto distinto para evitar sobrescrituras.
- `uiohook-napi` queda fuera del ASAR para que su binario nativo pueda cargarse.
- `npmRebuild` está desactivado en la configuración actual.

Antes de distribuir, probá el portable y el instalador en una máquina limpia, verificá que el input global funcione y comprobá que el antivirus no bloquee el módulo nativo. Al no estar firmado digitalmente, Windows SmartScreen puede mostrar una advertencia al descargarlo o ejecutarlo.
## Solución de problemas

### `npm` no se reconoce

Node.js no está instalado o no está en `PATH`.

```powershell
winget install OpenJS.NodeJS.LTS
```

Cerrá y abrí PowerShell, luego comprobá:

```powershell
node --version
npm.cmd --version
```

### PowerShell bloquea npm.ps1

Usá directamente:

```powershell
npm.cmd install
npm.cmd start
```

O habilitá scripts locales para tu usuario:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### No puedo salir del modo OBS

- Pulsá `Ctrl+Shift+S`.
- O abrí la bandeja con la flecha `^`, hacé clic derecho en el icono y desmarcá `Modo transmisión limpio`.

### No puedo hacer clic en el overlay

- Desactivá click-through con `Ctrl+Shift+I`.
- También podés cambiarlo desde la bandeja.
- Para moverlo, usá directamente `Ctrl+Shift+M`; el modo mover desactiva click-through temporalmente.

### No puedo moverlo o cambiar el tamaño

1. Pulsá `Ctrl+Shift+M`.
2. Arrastrá únicamente la franja superior.
3. Usá `−`, `+`, `Ctrl+Shift+↓` o `Ctrl+Shift+↑`.
4. Pulsá otra vez `Ctrl+Shift+M` al terminar.

### La aplicación desapareció al cerrar

La ventana se ocultó en la bandeja. Hacé clic en el icono para mostrarla. Elegí `Salir` en el menú para terminar el proceso.

### No veo el icono de bandeja

- Revisá la flecha `^` junto al reloj.
- Arrastrá el icono al área visible si querés dejarlo fijo.
- Comprobá en el Administrador de tareas si la aplicación sigue abierta.

### El indicador muestra fallback local

1. Usá Windows x64 y Node.js LTS.
2. Cerrá la aplicación.
3. Reinstalá dependencias:

```powershell
npm.cmd install
```

4. Ejecutá OpenBOR y el overlay con el mismo nivel de privilegio.
5. Revisá si el antivirus aisló algún archivo `.node` de `uiohook-napi`.

### Una tecla funciona localmente pero no globalmente

Puede no tener equivalente en `UiohookKey`. Revisá `nativeName()` y `CODE_ALIASES` en `src/input-manager.js` o elegí otra tecla compatible.

### Un atajo global no responde

- Cerrá otras instancias del overlay.
- Verificá que otra aplicación no use el mismo atajo.
- Cambiá el acelerador en `hotkeys` y reiniciá.

### El overlay no aparece sobre OpenBOR

- Evitá fullscreen exclusivo.
- Usá modo ventana o borderless.
- Confirmá `alwaysOnTop: true`.
- Asegurate de que el overlay no esté oculto desde `Ctrl+Shift+O` o la bandeja.

### OBS muestra un rectángulo negro

- Cambiá a Windows Graphics Capture.
- Verificá que la fuente admita transparencia.
- Probá captura de escritorio como alternativa.
- No uses chroma key salvo que el método de captura no conserve alfa.

### Se abrió una copia antigua

Confirmá la carpeta antes de iniciar:

```powershell
cd D:\OneDrive\Documents\openbor-input-overlay
npm.cmd start
```

Cerrá cualquier proceso iniciado desde otra copia del repositorio.

### La configuración quedó dañada

1. Cerrá la aplicación desde la bandeja.
2. Revisá `config.user.json` y `config.user.json.bak`.
3. Restaurá el `.bak` o eliminá el archivo local para volver a los defaults.
4. No elimines `config.json` del proyecto.

## Limitaciones actuales

- Solo Windows está contemplado y probado como plataforma principal.
- Los gamepads usan un mapping USB estándar fijo; todavía no se pueden reasignar sus botones ni usar botones del mouse.
- Hay un solo overlay y un solo jugador por instancia.
- Los perfiles todavía no guardan posición, opacidad, click-through ni tipo de dirección.
- No existe todavía una ventana de configuración separada.
- Los perfiles se pueden compartir como archivos JSON, pero todavía no hay botones dedicados de importar/exportar.
- No hay actualización automática.
- Los atajos de tamaño no son configurables desde `config.json`.
- El fullscreen exclusivo puede impedir que el overlay se vea.

## Arquitectura del proyecto

```text
openbor-input-overlay/
├─ main.js                 Proceso principal, ventana, bandeja, atajos e IPC
├─ preload.js              API segura expuesta al renderer
├─ config.json             Valores predeterminados versionados
├─ config.user.json        Estado local ignorado por Git
├─ src/
│  ├─ config.js            Carga, mezcla, persistencia y backup
│  ├─ profile-store.js      Perfiles JSON y migración
│  └─ input-manager.js     Hook global y actualización del mapping
└─ renderer/
   ├─ index.html           Estructura visual y paneles
   ├─ styles.css           Skins, escalado y modos visuales
   └─ app.js               Estado visual, mapping y perfiles
```

Responsabilidades principales:

- `main.js`: crea `BrowserWindow`, controla bandeja, hotkeys, persistencia, perfiles y modos.
- `preload.js`: expone únicamente las operaciones IPC necesarias mediante `contextBridge`.
- `src/config.js`: selecciona el archivo de estado, mezcla defaults y guarda con `.tmp`/`.bak`.
- `src/input-manager.js`: traduce códigos, administra listeners de `uiohook-napi` y reinicia el mapping.
- `src/profile-store.js`: guarda, carga, enumera, elimina y migra archivos de perfil JSON.
- `renderer/app.js`: actualiza botones, stick, gamepad USB, layout y paneles de configuración y perfiles.

## Seguridad del renderer

La ventana usa:

- `contextIsolation: true`
- `nodeIntegration: false`
- Un preload limitado mediante `contextBridge`

El renderer no accede directamente al sistema de archivos ni a módulos de Node.js. Las operaciones sensibles se realizan en el proceso principal mediante canales IPC definidos explícitamente.

## Desarrollo y Git

El estado personal no debe entrar en Git:

```text
config.user.json
config.user.json.bak
config.user.json.tmp
```

`config.user.json` está ignorado explícitamente y `*.bak`/`*.tmp` también están cubiertos por `.gitignore`.

Antes de un commit:

```powershell
git status --short
git diff --check
node --check main.js
node --check preload.js
node --check renderer/app.js
node --check src/config.js
node --check src/input-manager.js
```

Para probar una modificación:

```powershell
npm.cmd start
```

Para generar artefactos:

```powershell
npm.cmd run build
```

Mantené `config.json` como default limpio y probá los cambios personales únicamente mediante `config.user.json`.
