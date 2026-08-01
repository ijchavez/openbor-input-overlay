class OverlayStateController {
  constructor({ clickThrough = false, streamMode = false } = {}) {
    this.state = {
      interaction: 'idle',
      clickThrough: Boolean(clickThrough),
      streamMode: Boolean(streamMode)
    };
    this.clickThroughBeforeMove = null;
  }

  snapshot() {
    return { ...this.state };
  }

  startMove() {
    if (this.state.interaction === 'move') return this.snapshot();
    this.clickThroughBeforeMove = this.state.clickThrough;
    this.state.interaction = 'move';
    this.state.clickThrough = false;
    return this.snapshot();
  }

  finishMove({ clickThrough } = {}) {
    if (this.state.interaction !== 'move') return this.snapshot();
    const restored = clickThrough === undefined
      ? Boolean(this.clickThroughBeforeMove)
      : Boolean(clickThrough);
    this.state.interaction = 'idle';
    this.state.clickThrough = restored;
    this.clickThroughBeforeMove = null;
    return this.snapshot();
  }

  toggleMove() {
    return this.state.interaction === 'move' ? this.finishMove() : this.startMove();
  }

  toggleClickThrough() {
    if (this.state.interaction === 'move') {
      return this.finishMove({ clickThrough: true });
    }
    this.state.clickThrough = !this.state.clickThrough;
    return this.snapshot();
  }

  prepareForSettings() {
    return this.finishMove();
  }

  toggleStreamMode() {
    this.state.streamMode = !this.state.streamMode;
    return this.snapshot();
  }
}

module.exports = { OverlayStateController };
