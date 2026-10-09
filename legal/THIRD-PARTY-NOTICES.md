# Third-party notices for OpenBOR Input Overlay 1.2.5

OpenBOR Input Overlay's original code and documentation are MIT licensed; see
`../LICENSE`. Copyright (c) 2026 Gerardo Chavez. Neon Pulsar Labs is the
publisher name. Original graphics and marks have separate terms in
`../RIGHTS.md` and `renderer/assets/brand/NOTICE.md` inside the application.
These project notices do not claim ownership of third-party components.

## Native keyboard hook

The application uses `uiohook-napi` 1.5.5, copyright (c) 2020 Alexander
Drozdov, under the MIT license. Its native addon contains `libuiohook` linked
statically. `libuiohook` is copyright (C) 2006-2023 Alexander Barker and other
contributors identified in `native-source/uiohook-napi-1.5.5/libuiohook/AUTHORS`
and the source-file notices. It is licensed under LGPL-3.0-or-later. The
corresponding GPLv3 and LGPLv3 texts are in `licenses/GPL-3.0.txt` and
`licenses/LGPL-3.0.txt`. The `uiohook-napi` MIT text is in
`licenses/uiohook-napi-MIT.txt`.

The native addon is present in seven prebuild directories: `darwin-arm64`,
`darwin-x64`, `linux-arm64`, `linux-loong64`, `linux-x64`, `win32-arm64`, and
`win32-x64`. Source, build configuration, the upstream patch, and instructions
to rebuild and relink a modified library are in `native-source/` and
`RELINKING.md`. The application permits modification of the LGPL-covered
library and reverse engineering for debugging those modifications.

## Other bundled software

`node-gyp-build` 4.8.4, copyright (c) 2017 Mathias Buus, is MIT licensed; its
notice is in `licenses/node-gyp-build-MIT.txt`.

Electron and Chromium retain their own licenses. Their distribution includes
`LICENSE.electron.txt` and `LICENSES.chromium.html` beside the application
executable. The latter contains notices for Chromium's bundled components.

The brand asset notice remains in the packaged application at
`resources/app.asar/renderer/assets/brand/NOTICE.md`.

## Windows installer bootstrap

The installer is built with electron-builder's NSIS 3.0.4.1 toolchain. The
NSIS executable stub and its zlib compressor are under the zlib/libpng license;
the copyright and license are in the upstream NSIS `COPYING` file at
https://nsis.sourceforge.io/Docs/AppendixI.html. NSIS does not require an
acknowledgment in a binary distribution. This notice does not claim NSIS as
project code. The build uses an external 7z application archive, not NSIS's
bzip2 or LZMA compressor.

Two plug-ins are incorporated in the installer. `StdUtils` 1.14, copyright
(C) 2004-2018 LoRd_MuldeR, is LGPL-2.1-or-later. Its verbatim, unmodified
DLL matches the author's 2018-10-27 release. The complete LGPL 2.1 text is
in `licenses/LGPL-2.1.txt`; the author's clarification about NSIS installers
is in `licenses/StdUtils-LGPL-CLARIFICATION.txt`. Matching source and release
materials are in `native-source/nsis/StdUtils.2018-10-27.sources.tbz2` and
at https://github.com/lordmulder/stdutils/releases/tag/1.14.

`Nsis7z` 19.00 uses 7-Zip 19.00 code, copyright (C) 1999-2019 Igor Pavlov;
the plug-in credits Nik Medved, Marek Mizanin, and Stuart Welch. Its
unmodified x86 Unicode DLL matches the author's `Nsis7z_19.00.7z` package.
The plug-in author states LGPL; the included 7-Zip code is
LGPL-2.1-or-later. The applicable license text is in `licenses/LGPL-2.1.txt`.
The matching plug-in source package is
`native-source/nsis/Nsis7z_19.00.7z`
(https://nsis.sourceforge.io/mediawiki/images/6/69/Nsis7z_19.00.7z), and
the 7-Zip source is `native-source/nsis/7z1900-src.7z`
(https://www.7-zip.org/a/7z1900-src.7z). The
plug-in package also identifies its LZMA SDK portions as public domain.
The 7-Zip project and source are at https://www.7-zip.org/.
