# Rebuild and relink `uiohook-napi` with modified `libuiohook`

This directory accompanies OpenBOR Input Overlay 1.2.5. The source tree at
`native-source/uiohook-napi-1.5.5` contains the C wrapper, TypeScript source,
`binding.gyp`, package scripts and lockfile, and the `libuiohook` source. It
omits prebuilt binaries so that a build cannot silently reuse one. It is based
on [uiohook-napi commit 44e0d868](https://github.com/SnosMe/uiohook-napi/tree/44e0d868ac6fedd2a68c7f8ad8163c73a3f36fc3),
whose submodule pins [libuiohook commit f259ff37](https://github.com/kwhat/libuiohook/tree/f259ff37e81125f6f91ebac5439e7cde1e78b296).
The upstream `src/libuiohook.patch` has already been applied to the included
`libuiohook` tree. Do **not** apply it a second time. The included C sources,
headers, `binding.gyp`, package metadata, and generated `dist` files were
compared with the installed npm 1.5.5 package; their contents match after
normalizing line endings. No project-specific changes to this native code are
included. The patch is retained to document upstream's modifications to its
submodule.

## Tools

On Windows, install a supported Node.js version (Node 20 or newer), npm,
Python 3, and Visual Studio 2022 Build Tools with the Desktop development
with C++ workload and Windows SDK. `node-gyp` 11.5.0 supplies the GYP build
driver. Internet access is needed to retrieve npm dependencies and Electron
headers on a fresh machine. On macOS, use Xcode Command Line Tools; on Linux,
use a C compiler, Python 3, `make`, and the X11 development libraries required
by `binding.gyp` (`X11`, `Xrandr`, `Xtst`, `Xt` and pthread). Build on the target
OS and architecture; the seven distributed `.node` files are separate binaries.

## Build a modified addon on Windows x64

Use a disposable copy of `native-source/uiohook-napi-1.5.5` and edit a file
under its `libuiohook/src` directory. For an observable test, change a string
or instruction in a compiled `libuiohook` function and preserve its license
header. A comment-only edit does not prove a new library was linked.

In PowerShell, from that copied source directory:

```powershell
npm ci --ignore-scripts
$electronVersion = "37.10.3" # replace with the Electron version used by your target application build
npm exec --yes --package=node-gyp@11.5.0 -- node-gyp rebuild --target=$electronVersion --dist-url=https://electronjs.org/headers
Get-Item build/Release/uiohook_napi.node
```

The `binding.gyp` target `libuiohook` builds a static library from the edited
source and declares it as a dependency of the `uiohook_napi` target. A
successful `node-gyp rebuild` therefore compiles both targets and produces
`build/Release/uiohook_napi.node`. Check the build log for compilation of the
edited source and linking of `libuiohook.lib` into the addon. Compare SHA-256
of baseline and modified `.node` outputs and confirm they differ. Load the
result with Electron on the matching OS and architecture. Build a fresh
baseline first if you need a controlled comparison.

To use the replacement in an OpenBOR Input Overlay source checkout, install
its dependencies, copy the rebuilt file over
`node_modules/uiohook-napi/prebuilds/win32-x64/uiohook-napi.node`, then run
the normal `npm run build:portable` and `npm run build:installer` commands.
Verify the replacement hash within each generated package before distributing
it. Use a separate output directory or remove old outputs deliberately; do
not overwrite published 1.2.5 artifacts. For another platform, rebuild on
that platform and replace the matching `prebuilds/<platform>-<arch>` file.

The MIT wrapper source and project code permit this recombination. The
resulting addon still contains LGPL-covered `libuiohook`; carry these notices,
license texts, and corresponding source with a redistributed build. Preserve
source-file copyright and modification notices when changing the library.
