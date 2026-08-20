import type { TargetId } from './level';

export class Panels {
  private overlay: HTMLElement;
  private panels = new Map<string, HTMLElement>();
  private openId: TargetId | null = null;

  constructor(private onClose: () => void) {
    const overlay = document.querySelector<HTMLElement>('#panel-overlay');
    if (!overlay) throw new Error('#panel-overlay missing');
    this.overlay = overlay;

    for (const el of document.querySelectorAll<HTMLElement>('[data-panel]')) {
      this.panels.set(el.dataset.panel!, el);
    }

    overlay.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target === overlay || target.closest('[data-close]')) this.close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.openId) {
        e.preventDefault();
        this.close();
      }
    });
  }

  get isOpen(): boolean {
    return this.openId !== null;
  }

  open(id: TargetId): void {
    if (this.openId === id) return;
    const panel = this.panels.get(id);
    if (!panel) return;

    for (const el of this.panels.values()) el.hidden = true;
    panel.hidden = false;
    this.overlay.hidden = false;
    this.openId = id;
    panel.querySelector<HTMLElement>('[data-close]')?.focus();
  }

  close(): void {
    if (!this.openId) return;
    this.overlay.hidden = true;
    for (const el of this.panels.values()) el.hidden = true;
    this.openId = null;
    this.onClose();
  }
}
