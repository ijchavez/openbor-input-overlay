# Modification notice for this source copy

On 2026-10-09, the `uiohook-napi` upstream patch at
`../src/libuiohook.patch` was applied to the `libuiohook` submodule at
`f259ff37e81125f6f91ebac5439e7cde1e78b296` to reproduce the
`uiohook-napi` 1.5.5 npm source. It modifies:

- `src/windows/input_helper.c`
- `src/windows/input_hook.c`
- `src/x11/input_hook.c`

The patch is from the upstream `uiohook-napi` repository at commit
`44e0d868ac6fedd2a68c7f8ad8163c73a3f36fc3`. No additional
modifications to `libuiohook` are included in this source copy. The modified
library remains LGPL-3.0-or-later; see `COPYING.md` and `COPYING.LESSER.md`.
