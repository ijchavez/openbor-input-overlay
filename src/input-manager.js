const CODE_TO_UIOHOOK = {
  ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
  Enter: 'Enter', ShiftLeft: 'Shift', ShiftRight: 'Shift',
  KeyZ: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V'
};

class InputManager {
  constructor(mapping, emit) { this.mapping = mapping; this.emit = emit; this.hook = null; this.pressedCodes = new Set(); }

  start() {
    try {
      const { uIOhook, UiohookKey } = require('uiohook-napi');
      const byKeycode = new Map();
      for (const [code, button] of Object.entries(this.mapping)) {
        const nativeName = CODE_TO_UIOHOOK[code] || code.replace(/^Key/, '');
        const keycode = UiohookKey[nativeName];
        if (keycode !== undefined) byKeycode.set(keycode, { code, button });
      }
      const handle = (pressed) => ({ keycode }) => {
        const entry = byKeycode.get(keycode);
        if (!entry) return;
        if (pressed && this.pressedCodes.has(entry.code)) return;
        pressed ? this.pressedCodes.add(entry.code) : this.pressedCodes.delete(entry.code);
        this.emit({ type: 'input', button: entry.button, code: entry.code, pressed, source: 'global' });
      };
      uIOhook.on('keydown', handle(true));
      uIOhook.on('keyup', handle(false));
      uIOhook.start();
      this.hook = uIOhook;
      return { active: true, source: 'global', message: 'Input global activo' };
    } catch (error) {
      console.warn('Global hook unavailable, local fallback enabled:', error.message);
      return { active: true, source: 'local', message: 'Fallback local (enfocá el overlay)', detail: error.message };
    }
  }

  stop() { if (this.hook) { try { this.hook.stop(); } catch {} } this.hook = null; }
}

module.exports = { InputManager };
