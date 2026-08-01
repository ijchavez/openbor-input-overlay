const test = require('node:test');
const assert = require('node:assert/strict');
const { OverlayStateController } = require('../src/overlay-state');

test('opening settings finishes move mode and restores click-through', () => {
  const state = new OverlayStateController({ clickThrough: true });
  assert.deepEqual(state.startMove(), {
    interaction: 'move',
    clickThrough: false,
    streamMode: false
  });
  assert.deepEqual(state.prepareForSettings(), {
    interaction: 'idle',
    clickThrough: true,
    streamMode: false
  });
});

test('click-through during move finishes movement and stays enabled', () => {
  const state = new OverlayStateController();
  state.startMove();
  assert.deepEqual(state.toggleClickThrough(), {
    interaction: 'idle',
    clickThrough: true,
    streamMode: false
  });
});

test('OBS mode is independent from the interaction mode', () => {
  const state = new OverlayStateController();
  state.startMove();
  assert.deepEqual(state.toggleStreamMode(), {
    interaction: 'move',
    clickThrough: false,
    streamMode: true
  });
});
