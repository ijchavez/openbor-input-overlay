const CODE_ALIASES = {
  ControlLeft: 'Ctrl', ControlRight: 'CtrlRight', AltLeft: 'Alt', AltRight: 'AltRight',
  ShiftLeft: 'Shift', ShiftRight: 'ShiftRight', MetaLeft: 'Meta', MetaRight: 'MetaRight'
};

function nativeName(code) {
  if (CODE_ALIASES[code]) return CODE_ALIASES[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

class InputManager {
  constructor(mapping, emit) {
    this.mapping = mapping;
    this.emit = emit;
    this.hook = null;
    this.keydownHandler = null;
    this.keyupHandler = null;
    this.pressedCodes = new Set();
  }

  start() {
    try {
      const { uIOhook, UiohookKey } = require('uiohook-napi');
      const byKeycode = new Map();
      for (const [code, button] of Object.entries(this.mapping)) {
        const keycode = UiohookKey[nativeName(code)];
        if (keycode !== undefined) byKeycode.set(keycode, { code, button });
      }
      const handle = (pressed) => ({ keycode }) => {
        const entry = byKeycode.get(keycode);
        if (!entry) return;
        if (pressed && this.pressedCodes.has(entry.code)) return;
        pressed ? this.pressedCodes.add(entry.code) : this.pressedCodes.delete(entry.code);
        this.emit({ type: 'input', button: entry.button, code: entry.code, pressed, source: 'global' });
      };
      this.keydownHandler = handle(true);
      this.keyupHandler = handle(false);
      uIOhook.on('keydown', this.keydownHandler);
      uIOhook.on('keyup', this.keyupHandler);
      uIOhook.start();
      this.hook = uIOhook;
      return { active: true, source: 'global', message: 'Input global activo' };
    } catch (error) {
      console.warn('Global hook unavailable, local fallback enabled:', error.message);
      return { active: true, source: 'local', message: 'Fallback local (enfocá el overlay)', detail: error.message };
    }
  }

  updateMapping(mapping) {
    this.stop();
    this.mapping = mapping;
    return this.start();
  }

  stop() {
    if (this.hook) {
      try {
        if (this.keydownHandler) this.hook.off('keydown', this.keydownHandler);
        if (this.keyupHandler) this.hook.off('keyup', this.keyupHandler);
        this.hook.stop();
      } catch {}
    }
    this.hook = null;
    this.keydownHandler = null;
    this.keyupHandler = null;
    this.pressedCodes.clear();
  }
}

module.exports = { InputManager };