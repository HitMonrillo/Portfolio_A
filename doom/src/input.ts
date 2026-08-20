const MOVE_KEYS: Record<string, string> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'strafeLeft',
  KeyD: 'strafeRight',
  ArrowLeft: 'turnLeft',
  ArrowRight: 'turnRight',
  KeyQ: 'turnLeft',
  KeyE: 'turnRight',
};

export interface InputHandlers {
  onShoot: () => void;
  onLockChange: (locked: boolean) => void;
}

export class Input {
  private active = new Set<string>();
  /** Yaw accumulated from the mouse since the last frame consumed it. */
  private yawDelta = 0;
  private locked = false;
  /**
   * Pointer lock can be refused (browser setting, embedded frame, automation).
   * When that happens we fall back to plain click-to-shoot so the arena stays
   * usable instead of silently swallowing every click.
   */
  private lockUnavailable = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private handlers: InputHandlers,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clear);
    document.addEventListener('pointerlockchange', this.onLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
  }

  get isLocked(): boolean {
    return this.locked;
  }

  isDown(action: string): boolean {
    return this.active.has(action);
  }

  /** Returns the yaw accumulated since the last call and resets it. */
  takeYaw(): number {
    const yaw = this.yawDelta;
    this.yawDelta = 0;
    return yaw;
  }

  requestLock(): void {
    if (this.lockUnavailable) return;
    // Older browsers return undefined here rather than a promise.
    const result = this.canvas.requestPointerLock() as unknown;
    if (result instanceof Promise) {
      result.catch(() => {
        this.lockUnavailable = true;
        this.handlers.onLockChange(false);
      });
    }
  }

  releaseLock(): void {
    if (this.locked) document.exitPointerLock();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    // Space fires too, so the arena is playable without a mouse at all.
    if (e.code === 'Space') {
      e.preventDefault();
      this.handlers.onShoot();
      return;
    }
    const action = MOVE_KEYS[e.code];
    if (!action) return;
    // Otherwise arrow keys scroll the page out from under the canvas.
    if (this.locked) e.preventDefault();
    this.active.add(action);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const action = MOVE_KEYS[e.code];
    if (action) this.active.delete(action);
  };

  private clear = (): void => {
    this.active.clear();
  };

  private onLockChange = (): void => {
    this.locked = document.pointerLockElement === this.canvas;
    if (!this.locked) this.clear();
    this.handlers.onLockChange(this.locked);
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.locked) this.yawDelta += e.movementX;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    e.preventDefault();
    // First click grabs the pointer; clicks after that are shots. If the
    // pointer can't be locked at all, every click is a shot.
    if (this.locked || this.lockUnavailable) this.handlers.onShoot();
    else this.requestLock();
  };
}
