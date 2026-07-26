# OpenBOR Input Overlay

[Español](README.md) | **English** | [Português (Brasil)](README.pt-BR.md)

A transparent Windows overlay that turns the keys used in OpenBOR into a visual controller. It is designed for playing, recording, and streaming with OBS, and includes global input, click-through, movement and scaling, skins, key remapping, profiles, a clean stream mode, and Windows system tray controls.

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Overlay interface](#overlay-interface)
- [Configurable lighting](#configurable-lighting)
- [Global input and local fallback](#global-input-and-local-fallback)
- [Move and resize](#move-and-resize)
- [Swap the controls](#swap-the-controls)
- [Click-through](#click-through)
- [OBS stream mode](#obs-stream-mode)
- [Skins](#skins)
- [Configure the keys](#configure-the-keys)
- [USB joystick or gamepad](#usb-joystick-or-gamepad)
- [Profiles](#profiles)
- [Windows system tray](#windows-system-tray)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Persistence and configuration files](#persistence-and-configuration-files)
- [`config.json` reference](#configjson-reference)
- [Use with OpenBOR](#use-with-openbor)
- [Configure OBS](#configure-obs)
- [Build the installer and portable executable](#build-the-installer-and-portable-executable)
- [Troubleshooting](#troubleshooting)
- [Current limitations](#current-limitations)
- [Project architecture](#project-architecture)
- [Renderer security](#renderer-security)
- [Development and Git](#development-and-git)

## Features

- Transparent, always-on-top overlay.
- Global keyboard input through `uiohook-napi`, with a local fallback.
- Visual indicators for directions, action buttons, Start, and Select.
- Visual analog stick or D-pad, including diagonals.
- PlayStation, Xbox, and arcade skins.
- Mouse click-through and a move mode that restores it automatically.
- Adjustable size from `380 × 165` to `760 × 330` pixels.
- Visual key remapping without manually editing JSON.
- Reversible layout with the D-pad/stick on either side.
- Direct support for standard-mapped USB gamepads.
- Individual JSON profiles containing mappings, skin, size, and layout.
- Clean stream mode for OBS.
- Automatic persistence of position, size, skin, click-through, stream mode, and the latest profile.
- Windows system tray menu and global shortcuts.
- Local user settings kept separate from repository defaults, with backups before overwriting.

## Requirements

- Windows 10 or 11, preferably x64.
- Node.js 20 or newer to run from source.
- npm, included with Node.js.
- OpenBOR in windowed or borderless mode so the overlay can appear over the game.
- OBS Studio for recording or streaming.

## Installation

### Install dependencies

Open PowerShell in the project folder:

```powershell
cd D:\OneDrive\Documents\openbor-input-overlay
npm.cmd install
```

You can also use `npm install` if PowerShell allows `npm.ps1` to run.

### Run the application

```powershell
npm.cmd start
```

The overlay opens and an icon appears in the Windows system tray next to the clock. If it is not visible, check the hidden icons menu under the `^` arrow.

### Other commands

```powershell
npm.cmd run dev
npm.cmd run build:portable
npm.cmd run build:installer
npm.cmd run build
```

- `npm.cmd run dev`: starts Electron with the development argument.
- `npm.cmd run build:portable`: builds only the x64 portable executable.
- `npm.cmd run build:installer`: builds only the x64 NSIS installer.
- `npm.cmd run build`: creates both artifacts in `dist/`.

## Quick start

1. Start the overlay with `npm.cmd start`.
2. Check that the indicator says `Input global activo` (global input active).
3. Press `Ctrl+Shift+M` to enter move mode.
4. Drag the top strip, resize with `−` or `+`, and use `⇄` to swap the controls.
5. Press `Ctrl+Shift+M` again when finished.
6. Use `Configurar teclas` (configure keys) if the default mapping does not match OpenBOR.
7. Enable click-through with `Ctrl+Shift+I` so the overlay does not capture the mouse.
8. For streaming, enable `Modo OBS` or press `Ctrl+Shift+S`.
9. Exit OBS mode with `Ctrl+Shift+S` or the system tray menu.

> The application interface is currently displayed in Spanish; this guide includes the original labels where they help identify a control.

## Overlay interface

- **Top bar:** application name, drag area, and input status.
- **Direction control:** visual stick or D-pad, selected with `directionControl`.
- **Center buttons:** Select and Start.
- **Action buttons:** triangle, circle, cross, and square; Xbox and arcade skins use different symbols.
- **Bottom bar:** move mode, size, OBS mode, profiles, lighting, key configuration, and click-through.

The input status is green for active global input and yellow for active local fallback.

## Configurable lighting

Click `Iluminación` in the bottom bar or choose `Configurar iluminación` from the tray. The panel independently controls the color and intensity of the action/system buttons and the D-pad/stick. It also controls a direction trail: previous stick positions remain briefly visible, while released D-pad directions receive a fading afterglow. Changes preview live, accept any color exposed by the color picker, persist across restarts, and are not overwritten by skin or profile changes.

## Global input and local fallback

Global input uses [`uiohook-napi`](https://www.npmjs.com/package/uiohook-napi), a native binding that listens for `keydown` and `keyup` events even while OpenBOR has focus.

The application translates each configured `KeyboardEvent.code` into its corresponding `UiohookKey`, listens globally, sends the event from the main process to the renderer, and updates the visual control. System key-repeat events are filtered to avoid duplicates.

If the native module cannot load, the application continues in `Fallback local` mode. In this mode the overlay must have focus, it cannot see keystrokes while OpenBOR has focus, and it is mainly useful for testing mappings and diagnosing the global hook.

## Move and resize

Press `Ctrl+Shift+M` or choose `Modo mover` from the system tray. While move mode is active:

- Click-through is temporarily disabled and the application receives focus.
- Drag the top strip to reposition the overlay.
- The `− TAMAÑO +` controls appear in the bottom bar.
- `−` and `Ctrl+Shift+↓` reduce the size by about 10%.
- `+` and `Ctrl+Shift+↑` increase the size by about 10%.

The maximum size is `760 × 330`; the minimum is `380 × 165`. Content scales proportionally and the window keeps its center while resizing. Position and size are saved automatically. Leaving move mode restores the previous click-through state.

## Swap the controls

In move mode, press `⇄` to alternate between:

- **Standard:** D-pad/stick on the left and action buttons on the right.
- **Reversed:** action buttons on the left and D-pad/stick on the right.

You can also toggle `Controles invertidos` in the system tray. The layout is saved automatically and is included in each profile.

## Click-through

Click-through lets mouse input pass through the overlay to the game or window beneath it. Toggle it using the bottom-bar button, `Ctrl+Shift+I`, or the system tray menu.

The buttons for click-through, configuration, profiles, and OBS keep small interactive areas on hover. Move, configuration, and profile modes temporarily disable click-through and restore its previous value when closed. If OBS mode hides the controls, use the shortcut or the tray menu.

## OBS stream mode

Clean stream mode hides the top bar, input indicator, bottom bar, configuration buttons, and visible help. The controller continues responding normally.

Toggle it with `Ctrl+Shift+S`, the `Modo OBS` button, or `Modo transmisión limpio` in the system tray. If the controls disappear after enabling it, this is expected: press the shortcut again or use the tray. Entering move mode temporarily restores the controls required to move and resize. The OBS mode state persists across restarts.

## Skins

Available skins are `playstation`, `xbox`, and `arcade`. Change them with `Ctrl+Shift+K`, `Cambiar skin` in the tray, the `skin` configuration property, or by loading a profile. A skin changes symbols, colors, and presentation, but not the key mapping.

## Configure the keys

1. Click `Configurar teclas` in the bottom bar or system tray.
2. Select Up, Down, Left, Right, Top, Right, Bottom, Left, Select, or Start.
3. Press the new key.
4. The change is saved and the global hook restarts with the new mapping.
5. Repeat as needed and click `Terminar configuración`.

Each control accepts one primary key. Assigning a key that is already in use moves that key to the new control and prevents conflicts. Reassigning a control removes its previous assignment.

### Default mapping

| Key | Visual control |
|---|---|
| `ArrowUp` | Up |
| `ArrowDown` | Down |
| `ArrowLeft` | Left |
| `ArrowRight` | Right |
| `Z` | Square / left button |
| `X` | Cross / bottom button |
| `C` | Circle / right button |
| `V` | Triangle / top button |
| `Enter` | Start |
| `ShiftLeft` or `ShiftRight` | Select |

### Keyboard codes

Mappings use [`KeyboardEvent.code`](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/code), such as `KeyA`, `Digit1`, `ArrowUp`, `Enter`, `Space`, `ShiftLeft`, `Numpad0`, and `F1` through `F24`. Not every special key on every keyboard has a `UiohookKey` equivalent. The local fallback may recognize codes unsupported by the global hook.

## USB joystick or gamepad

The application uses the Gamepad API to detect the first USB controller exposed by Windows and Chromium. It does not depend on the global keyboard hook.

| Physical control | Visual control |
|---|---|
| Left stick or D-pad | Directions |
| A / cross (button 0) | Cross / bottom button |
| B / circle (button 1) | Circle / right button |
| X / square (button 2) | Square / left button |
| Y / triangle (button 3) | Triangle / top button |
| Back / Share (button 8) | Select |
| Start / Options (button 9) | Start |

Connect the controller before or after opening the overlay and press a button if the browser has not listed it yet. The status changes to `Gamepad USB: device name`, and button presses appear in the overlay and OBS capture. Keyboard and gamepad work simultaneously. The left stick uses a `0.45` dead zone. The USB mapping is currently fixed, so nonstandard generic controllers may have swapped buttons.

## Profiles

Profiles group settings for different games or players and are stored as separate `.json` files.

### Choose the profile folder

Open `Perfiles`, click `Elegir carpeta`, choose or create a folder, and click `Usar esta carpeta`. The selected path persists across restarts, and valid `.json` files in the folder populate the list. Invalid files are ignored.

Default locations are `profiles/` in the repository during development, next to the executable for portable builds, and inside application data for installed builds. Legacy profiles embedded in the configuration are migrated to individual files on first launch.

### Create, load, or delete a profile

To create or update a profile, configure the mapping, skin, size, and layout; open `Perfiles`; enter a name up to 40 characters; and click `Crear / actualizar perfil`. An existing profile with the same name is replaced.

To load one, select it under `Perfiles guardados` and click `Cargar`, or use the tray submenu. Its mapping, skin, size, and layout take effect immediately and the global hook restarts.

To delete one, select it, click `Eliminar`, and confirm. Deleting the active profile clears its active marker but leaves the currently applied mapping in memory.

Each profile stores the keyboard mapping, skin, overlay width and height, and standard or reversed layout. It does not currently store screen position, click-through, opacity, OBS mode, or `directionControl`; those can persist as general application state.

## Windows system tray

The tray icon appears next to the clock, possibly under the `^` hidden-icons arrow. Left-click shows or hides the overlay; right-click opens the full menu.

The menu controls visibility, move mode, clean stream mode, click-through, profile loading and management, key configuration, skin selection, reversed controls, and application exit. `Alt+F4` only hides the window to the tray. Choose `Salir` to end the process.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+O` | Show or hide the overlay |
| `Ctrl+Shift+K` | Select the next skin |
| `Ctrl+Shift+I` | Toggle click-through |
| `Ctrl+Shift+M` | Enter or leave move mode |
| `Ctrl+Shift+S` | Enter or leave clean stream mode |
| `Ctrl+Shift+↓` | Shrink while move mode is active |
| `Ctrl+Shift+↑` | Enlarge while move mode is active |

The first five shortcuts are configured in `hotkeys`; the size shortcuts are currently fixed. If a shortcut does not respond, another application or overlay instance may have registered it.

## Persistence and configuration files

`config.json` contains clean, version-controlled repository defaults. During development, `npm.cmd start` stores personal state in the Git-ignored `config.user.json`.

For packaged applications:

1. A portable build detects `PORTABLE_EXECUTABLE_DIR` and stores `config.json` plus `profiles/` next to the `.exe`.
2. A normal installation uses a `config.json` next to the executable if present.
3. Otherwise it uses Electron's `userData` directory, normally `%APPDATA%\openbor-input-overlay\config.json`.

Before overwriting settings, the application creates `config.user.json.bak` or the corresponding packaged `.bak`. It first writes a `.tmp` file and then replaces the target, reducing the chance of incomplete JSON. It saves after moving, resizing, changing skins, toggling click-through or OBS mode, changing layout, selecting a profile folder, creating/loading/deleting profiles, and exiting.

## `config.json` reference

```json
{
  "skin": "playstation",
  "directionControl": "stick",
  "layout": "standard",
  "scale": 1,
  "opacity": 0.96,
  "lighting": {
    "buttonColor": "#59e4ff",
    "buttonIntensity": 1,
    "dpadColor": "#59e4ff",
    "dpadIntensity": 0.65,
    "trailEnabled": true,
    "trailDuration": 240,
    "trailIntensity": 0.55
  },
  "showLabels": true,
  "alwaysOnTop": true,
  "clickThrough": false,
  "streamMode": false,
  "window": { "width": 760, "height": 330, "x": null, "y": null },
  "hotkeys": {
    "toggleVisibility": "CommandOrControl+Shift+O",
    "cycleSkin": "CommandOrControl+Shift+K",
    "toggleClickThrough": "CommandOrControl+Shift+I",
    "toggleMoveMode": "CommandOrControl+Shift+M",
    "toggleStreamMode": "CommandOrControl+Shift+S"
  },
  "mapping": { "ArrowUp": "up", "KeyZ": "square" },
  "profilesDirectory": null,
  "activeProfile": null
}
```

| Property | Type | Description |
|---|---|---|
| `skin` | string | `playstation`, `xbox`, or `arcade` |
| `directionControl` | string | `stick` or `dpad` |
| `layout` | string | `standard` or `reversed` |
| `scale` | number | Additional visual content scale |
| `opacity` | number | Overlay opacity, normally `0` to `1` |
| `lighting.buttonColor` | string | Hex color for the button glow |
| `lighting.buttonIntensity` | number | Button intensity from `0` to `1` |
| `lighting.dpadColor` | string | Hex color for the D-pad or stick glow |
| `lighting.dpadIntensity` | number | D-pad or stick intensity from `0` to `1` |
| `lighting.trailEnabled` | boolean | Enables the stick trail and D-pad afterglow |
| `lighting.trailDuration` | number | Effect duration in milliseconds, from `80` to `600` |
| `lighting.trailIntensity` | number | Initial trail opacity from `0` to `1` |
| `showLabels` | boolean | Shows or hides labels and the bottom bar |
| `alwaysOnTop` | boolean | Keeps the window above other windows |
| `clickThrough` | boolean | Initial and persisted click-through state |
| `streamMode` | boolean | Persisted clean stream mode state |
| `window.width` | number | Width limited to `380`–`760` |
| `window.height` | number | Height proportional to width |
| `window.x`, `window.y` | number or null | Screen position; `null` lets Windows decide |
| `hotkeys` | object | Electron-compatible global accelerators |
| `mapping` | object | `KeyboardEvent.code` → visual control |
| `profilesDirectory` | string or null | Profile folder; `null` uses the default |
| `profiles` | object | Legacy field migrated to individual files |
| `activeProfile` | string or null | Last loaded or created profile |

Valid mapping controls are `up`, `down`, `left`, `right`, `square`, `cross`, `circle`, `triangle`, `start`, and `select`. Edit the local file only while the application is closed. Invalid JSON makes the application use defaults and print a console warning.

## Use with OpenBOR

1. Start the overlay, then OpenBOR.
2. Run OpenBOR in windowed or borderless mode.
3. Run both applications with the same privilege level.
4. Match the overlay mapping to OpenBOR's configured keys.
5. Position and scale the overlay.
6. Enable click-through before playing.

Exclusive fullscreen may draw above any overlay. If OpenBOR runs as administrator but the overlay does not, Windows may prevent key capture; run both normally or at the same privilege level.

## Configure OBS

1. Start the overlay and OpenBOR.
2. Add a `Window Capture` source in OBS.
3. Select `OpenBOR Input Overlay`.
4. Use Windows Graphics Capture when available and preserve transparency.
5. Enable OBS mode with `Ctrl+Shift+S`.
6. Position the source in the scene.

Alternatively, capture the desktop or game with the overlay already positioned above it. Chroma key should not be necessary. If a black rectangle appears, change the capture method and verify that it preserves the alpha channel.

## Build the installer and portable executable

```powershell
# Portable only
npm.cmd run build:portable

# NSIS installer only
npm.cmd run build:installer

# Both
npm.cmd run build
```

Artifacts are written to `dist/` with names similar to `OpenBOR Input Overlay-Portable-1.0.0-x64.exe` and `OpenBOR Input Overlay-Setup-1.0.0-x64.exe`.

The build uses app ID `com.openbor.inputoverlay`, Windows x64, and `portable` plus `nsis` targets. `uiohook-napi` remains outside ASAR so its native binary can load, and `npmRebuild` is currently disabled. Test both artifacts on a clean machine before distribution. Because the executables are not digitally signed, Windows SmartScreen may warn when they are downloaded or run.

## Troubleshooting

### `npm` is not recognized

Install Node.js and reopen PowerShell:

```powershell
winget install OpenJS.NodeJS.LTS
node --version
npm.cmd --version
```

### PowerShell blocks `npm.ps1`

Use `npm.cmd install` and `npm.cmd start`, or allow local scripts with:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### OBS mode will not close

Press `Ctrl+Shift+S`, or right-click the tray icon and clear `Modo transmisión limpio`.

### The overlay cannot be clicked, moved, or resized

Disable click-through with `Ctrl+Shift+I`. For movement, press `Ctrl+Shift+M`, drag the top strip, resize with `−`, `+`, or the arrow shortcuts, then press `Ctrl+Shift+M` again.

### The application disappeared when closed

It was hidden in the tray. Click the icon to restore it or choose `Salir` to quit.

### The tray icon is missing

Check the `^` hidden-icons area and Task Manager. You may drag the icon into the visible tray area.

### The indicator shows local fallback

Use Windows x64 and Node.js LTS, close the application, run `npm.cmd install`, keep OpenBOR and the overlay at the same privilege level, and check whether antivirus software quarantined a `.node` file from `uiohook-napi`.

### A key works locally but not globally

It may not have a `UiohookKey` equivalent. Check `nativeName()` and `CODE_ALIASES` in `src/input-manager.js` or use another compatible key.

### The overlay does not appear over OpenBOR

Avoid exclusive fullscreen, use windowed or borderless mode, confirm `alwaysOnTop: true`, and make sure the overlay is not hidden with `Ctrl+Shift+O` or the tray.

### OBS shows a black rectangle

Use Windows Graphics Capture, verify alpha transparency, or try desktop capture. Avoid chroma key unless the capture method cannot preserve alpha.

### An old copy opened

Run `npm.cmd start` from the intended repository and close processes launched from other copies.

### The configuration is corrupted

Exit from the tray, inspect `config.user.json` and `config.user.json.bak`, restore the backup or remove the local file to return to defaults, and do not delete the repository's `config.json`.

## Current limitations

- Windows is the only primary tested platform.
- Gamepads use a fixed standard mapping; their buttons and mouse buttons cannot be remapped yet.
- One overlay and one player are supported per instance.
- Profiles do not store position, opacity, click-through, lighting, or direction-control type.
- There is no separate settings window, dedicated profile import/export, or automatic updater.
- Resize shortcuts are not configurable in `config.json`.
- Exclusive fullscreen can prevent the overlay from appearing.

## Project architecture

```text
openbor-input-overlay/
├─ main.js                 Main process, window, tray, shortcuts, and IPC
├─ preload.js              Safe API exposed to the renderer
├─ config.json             Version-controlled defaults
├─ config.user.json        Git-ignored local state
├─ src/
│  ├─ config.js            Loading, merging, persistence, and backups
│  ├─ profile-store.js      JSON profiles and migration
│  └─ input-manager.js     Global hook and mapping updates
└─ renderer/
   ├─ index.html           Visual structure and panels
   ├─ styles.css           Skins, scaling, and visual modes
   └─ app.js               Visual state, mappings, gamepad, and profiles
```

`main.js` manages the `BrowserWindow`, tray, hotkeys, persistence, profiles, and modes. `preload.js` exposes only required IPC operations through `contextBridge`. The `src` modules manage configuration, native input, and profile files. `renderer/app.js` updates controls, the visual stick, USB gamepad state, layout, and settings panels.

## Renderer security

The window uses `contextIsolation: true`, `nodeIntegration: false`, and a limited preload through `contextBridge`. The renderer does not directly access the filesystem or Node.js modules; sensitive operations run in the main process through explicitly defined IPC channels.

## Development and Git

Personal state must not be committed:

```text
config.user.json
config.user.json.bak
config.user.json.tmp
```

Before committing:

```powershell
git status --short
git diff --check
node --check main.js
node --check preload.js
node --check renderer/app.js
node --check src/config.js
node --check src/input-manager.js
```

Use `npm.cmd start` to test and `npm.cmd run build` to generate artifacts. Keep `config.json` as clean defaults and test personal changes through `config.user.json`.
