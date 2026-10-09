# E3.1d verification record — 2026-10-09

This record concerns proposed future distributions of OpenBOR Input Overlay
1.2.5. It does not change the already published v1.2.5 executables.
Detailed commands and logs are retained outside the repository in the sibling
`../../.tmp-openbor-e3-1d-lgpl-validation/VALIDACION.md` and
`../../.tmp-openbor-e3-1d-lgpl-validation/PACKAGING-ISOLATED-01.md` files.

## Corresponding materials

- Base: `origin/master` at `474b5b9a37a0b5796e61df45c6bbf1cc25f791eb`.
  `uiohook-napi` 1.5.5 source matches upstream commit
  `44e0d868ac6fedd2a68c7f8ad8163c73a3f36fc3` and `libuiohook` submodule
  `f259ff37e81125f6f91ebac5439e7cde1e78b296`, with upstream's
  `src/libuiohook.patch` already applied. The wrapper, headers, `binding.gyp`,
  metadata, and generated `dist` files match the npm 1.5.5 package after
  line-ending normalization. A reverse patch check succeeded.
- The original 53 files under `legal/` were text only (656,920 bytes), with
  no native binaries or dependencies. Six upstream-generated files in the
  source `dist/` preserve the matching package layout; only `dist/index.js`
  is the runtime entry point. The final set contains 58 files: those 53,
  LGPL 2.1 and StdUtils clarification texts, and three unmodified upstream
  source archives for the NSIS plug-ins and 7-Zip 19.00.
- GPLv3 and LGPLv3 are unchanged GNU texts. SHA-256:
  `3972DC9744F6499F0F9B2DBF76696F2AE7AD8AF9B23DDE66D6AF86C9DFB36986`
  and `E3A994D82E644B03A792A930F574002658412F62407F5FEE083F2555C5F23118`.
  The NSIS plug-in notices and LGPL 2.1 text are described in
  `THIRD-PARTY-NOTICES.md`.

## Technical validation completed

- Toolchain: Visual Studio Community 2026 18.10.3, MSVC v143 14.44.35207
  (`cl.exe` and `link.exe` 19.44.35229.0), MSBuild 18.10.1.42706,
  Windows SDK 10.0.26100.0, Python 3.12.14, Node 24.18.0, npm 11.16.0,
  node-gyp 12.3.0, and Electron 37.10.3 headers and `node.lib`.
- On Windows x64, disposable baseline and modified copies of the included
  source produced `libuiohook.lib` and `uiohook_napi.node`. The modified
  `libuiohook/src/windows/input_hook.c` compiled with an observable marker.
  Addon SHA-256 changed from
  `E290114E304AC5B980B3A1DA5598BFC862C010752249D78DCF357C1076503C39`
  to `DFC474D476A1734E7B6597E3D0CBDFEC4A0F3230C3CC9C7E8F6FE3CDE22C9B2A`;
  only the modified addon contains the marker. The addon loaded in Node and
  Electron 37.10.3 (`ELECTRON_RUN_AS_NODE=1`). The global hook was not run.
- The official checkout's pnpm junctions prevented electron-builder startup.
  A separate copy with locally installed declared dependencies resolved
  Electron 37.10.3, electron-builder/app-builder-lib 26.15.3,
  `uiohook-napi` 1.5.5, and `node-gyp-build` 4.8.4. Portable and NSIS installer
  Windows x64 builds both exited 0. Their SHA-256 values were
  `4394BCA380BBC8EBE4B37A29E0CBE8BA719AAB0E2CE09334E24E7704343073FD`
  and `647D785F5C5584E52925421993C4FB9F97212BBFB689A39AEB4760A4DF07BC99`.
- The first isolated pair was extracted. Each contained the original 53
  `resources/legal/` files with hashes identical to the prepared tree,
  including LGPL/GPL texts, notices, source, patch, `binding.gyp`, and
  `RELINKING.md`. Each contained seven native prebuilds whose hashes match
  the local published v1.2.5 portable, plus unchanged Electron/Chromium
  license files. No private or temporary project files were found in the
  payload or app ASAR. The original Windows x64 addon hash was
  `EE68F046628D2E4406D8AA85C6489AD06578B64A0E19ED64822BD22E7C473B85`.
- Final `npm test`: 33/33. `git diff --check --cached` and
  `git diff --check`: passed for the focused NSIS notice update.

## Focused NSIS review

- The isolated build used electron-builder's cached NSIS 3.0.4.1 toolchain.
  Its `COPYING` identifies the core and zlib compressor as zlib/libpng.
  The generated configuration selects NSIS `zlib`; the application payload
  is a separate 7z archive extracted through `Nsis7z`, not the NSIS bzip2
  or LZMA compressor. The core zlib/libpng terms appreciate but do not
  require attribution in binary distributions.
- The generated script calls `StdUtils` and `Nsis7z`. Cached x86 Unicode
  `StdUtils.dll` matches the author's 1.14 release (SHA-256
  `B72E9013A6204E9F01076DC38DABBF30870D44DFC66962ADBF73619D4331601E`),
  and cached `nsis7z.dll` matches the official 19.00 package (SHA-256
  `B393F05E8FF919EF071181050E1873C9A776E1A0AE8329AEFFF7007D0CADF592`).
  These plug-ins prompted the focused LGPL 2.1 notice and source references
  in `THIRD-PARTY-NOTICES.md`; StdUtils's original clarification is included
  unchanged. The version-matched StdUtils 1.14 source archive, Nsis7z 19.00
  source package, and 7-Zip 19.00 source archive are included under
  `native-source/nsis/`. Their SHA-256 values are
  `C5E3B1A66219BC9564C2CCC1702691327EECF044AD33404AC268D725D22DCA49`,
  `6F2F3730049926F40442EE0C8B7D3E3DEE7ACE544D82467FF8059EA3F4201C58`,
  and `9BA70A5E8485CF9061B30A2A84FE741DE5AEB8DD271AAB8889DA0E9B3BF1868E`.

## Distribution status and limits

- The published v1.2.5 portable and installer still have hashes
  `E999DC38B941D946AEE104B4FC17913E6B128AAD3BD0DD6E2462447328FCA05E`
  and `B97A95979256D2D7D63D7E9FBCC577BA5ED1DF6823C2BCB10C11781FC7934672`.
  They contain seven native prebuilds and Electron/Chromium notices but no
  `resources/legal/`. They have not been replaced or corrected.
- The isolated build lacked `resources/app-update.yml`, present in the
  published portable. The current application does not reference that file
  or `electron-updater`; no distribution requirement or functional effect
  has been demonstrated. No update configuration was changed.
- The project has no versioned root lockfile, so the isolated build does not
  establish byte-for-byte reproduction of the historical dependency tree.
- The final isolated packaging pass confirmed that both portable and
  installer contain all 58 current `legal/` files with matching hashes,
  all seven original native prebuilds, and the Electron/Chromium licenses.
  The sign-off artifacts remain temporary and are not the already published
  v1.2.5 executables.
