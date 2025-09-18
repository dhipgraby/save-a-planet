import * as Phaser from "phaser";
import { introSlides, IntroSlide } from "./introSlides";

export interface IntroSequenceOptions {
  onComplete: () => void;
  onSkipToEnd?: () => void; // when user hits skip (jumps to final slide)
}

// Encapsulates the animated educational intro sequence.
export class IntroSequence {
  private scene: Phaser.Scene;
  private dom: Phaser.GameObjects.DOMElement | null = null;
  private active = false;
  private slideIndex = 0;
  private readonly opts: IntroSequenceOptions;

  constructor(scene: Phaser.Scene, opts: IntroSequenceOptions) {
    this.scene = scene;
    this.opts = opts;
  }

  isActive() {
    return this.active;
  }
  destroy() {
    if (this.dom) {
      this.dom.destroy(); this.dom = null;
    } this.active = false;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.slideIndex = 0;
    this.render();
  }

  private buildSlideHtml(slide: IntroSlide, idx: number, panelWidth: number, panelHeight: number) {
    const progressDots = introSlides
      .map((_, i) => `<span style="width:10px;height:10px;border-radius:50%;background:${i === idx ? "#10b981" : "#1f2937"};display:inline-block;transition:background .3s"></span>`)
      .join("<span style=\"width:8px;display:inline-block\"></span>");
    const linesHtml = slide.lines
      .map(l => `<div class="line" data-line style="opacity:0;transform:translateY(4px);">${l}</div>`)
      .join("");
    return `
      <div data-intro-root style="width:${panelWidth}px;max-width:100%;max-height:${panelHeight}px;display:flex;flex-direction:column;">
        <div style="padding:18px 22px 14px;background:#0b1220dd;border:1px solid #1f2937;border-radius:14px;backdrop-filter:blur(6px);box-shadow:0 8px 28px -4px rgba(0,0,0,.55);flex:1;display:flex;flex-direction:column;">
          <div style="font-size:14px;font-weight:600;letter-spacing:.06em;color:#38bdf8;text-transform:uppercase;margin-bottom:6px;">CLIMATE REALITY SIMULATION</div>
          <div style="font-size:28px;font-weight:800;line-height:1.1;color:#f1f5f9;margin-bottom:14px;">${slide.title}</div>
          <div data-lines style="flex:1;font-family:monospace;font-size:16px;line-height:1.35;color:#e2e8f0;display:flex;flex-direction:column;gap:6px;">
            ${linesHtml}
          </div>
          <div style="margin-top:10px;font-size:12px;color:#64748b;font-family:monospace;display:flex;justify-content:space-between;align-items:center;">
            <div>${slide.fact ?? ""}</div>
            <div style="display:flex;align-items:center;gap:6px;">${progressDots}</div>
          </div>
          <div style="margin-top:14px;display:flex;justify-content:space-between;gap:12px;">
            <button data-skip style="flex:0 0 auto;padding:10px 16px;background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:10px;font-weight:600;font-family:monospace;cursor:pointer;">Skip</button>
            <button data-next style="flex:1;padding:10px 18px;background:#10b981;color:#062c26;border:none;border-radius:10px;font-weight:700;font-family:monospace;cursor:pointer;">${idx === introSlides.length - 1 ? "Start Game" : "Next →"}</button>
          </div>
        </div>
      </div>`;
  }

  private render() {
    const cam = this.scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const panelWidth = Math.min(760, cam.width - 40);
    const panelHeight = Math.min(420, cam.height - 80);
    const slide = introSlides[this.slideIndex];
    const html = `<div data-intro-wrapper>${this.buildSlideHtml(slide, this.slideIndex, panelWidth, panelHeight)}</div>`;

    if (this.dom) {
      this.dom.destroy();
    }
    this.dom = this.scene.add.dom(cx, cy).createFromHTML(html).setOrigin(0.5).setDepth(40);
    this.dom.addListener("click");
    this.dom.on("click", (ev: any) => this.handleClick(ev));
    this.animateLines();
  }

  private handleClick(ev: any) {
    const t = ev.target as HTMLElement;
    if (!t) return;
    if (t.hasAttribute("data-skip")) {
      this.slideIndex = introSlides.length - 1;
      this.opts.onSkipToEnd?.();
      this.render();
      return;
    }
    if (t.hasAttribute("data-next")) {
      if (this.slideIndex < introSlides.length - 1) {
        this.slideIndex++;
        this.render();
      } else {
        // Done
        this.destroy();
        this.opts.onComplete();
      }
    }
  }

  private animateLines() {
    if (!this.dom) return;
    const root = this.dom.node as HTMLElement;
    const container = root.querySelector("[data-lines]");
    if (!container) return;
    const lines = Array.from(container.querySelectorAll("[data-line]")) as HTMLElement[];
    lines.forEach((el, idx) => {
      setTimeout(() => {
        el.style.transition = "opacity .55s ease, transform .55s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 120 * idx + 140);
    });
  }
}
