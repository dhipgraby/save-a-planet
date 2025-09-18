import * as Phaser from "phaser";

export interface StartMenuOptions {
  onStart: () => void;
}

export class StartMenu {
  private scene: Phaser.Scene;
  private dom: Phaser.GameObjects.DOMElement | null = null;
  private overlayBg: Phaser.GameObjects.Rectangle | null = null;
  private opts: StartMenuOptions;

  constructor(scene: Phaser.Scene, opts: StartMenuOptions) {
    this.scene = scene;
    this.opts = opts;
  }

  show() {
    this.hide();
    const cam = this.scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const panelWidth = Math.min(860, cam.width - 40);
    const panelMaxHeight = Math.min(520, cam.height - 100);
    const html = `
      <div style="width:${panelWidth}px;max-height:${panelMaxHeight}px;overflow:auto;background:linear-gradient(145deg,#0b1220ee,#0f172acc);border:1px solid #1e293b;border-radius:18px;color:#e2e8f0;padding:26px 28px 24px;backdrop-filter:blur(8px);box-shadow:0 18px 42px -10px rgba(0,0,0,.65);font-family:monospace;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:14px;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <div style="font-size:13px;letter-spacing:.1em;font-weight:600;color:#38bdf8;text-transform:uppercase;">Simulation Setup</div>
            <div style="font-weight:800;font-size:30px;line-height:1.05;color:#f8fafc;text-shadow:0 2px 4px rgba(0,0,0,.4);">Save a Planet — Run</div>
          </div>
          <div style="font-size:12px;color:#64748b;text-align:right;max-width:240px;line-height:1.3;">Extend viability — every delayed collapse second matters.</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-bottom:18px;">
          <div style="background:#0f1b2dcc;border:1px solid #1e293b;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;">
            <div style="font-weight:700;color:#f1f5f9;font-size:15px;">Core Dynamics</div>
            <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:13px;color:#cbd5e1;">
              <li>Planet: base decay + system impact.</li>
              <li>Population: periodic sustainability checks.</li>
              <li>Under-supply → decline; surplus → recover.</li>
              <li>Systems shift overall collapse velocity.</li>
            </ul>
          </div>
          <div style="background:#0f1b2dcc;border:1px solid #1e293b;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;">
            <div style="font-weight:700;color:#f1f5f9;font-size:15px;">Your Levers</div>
            <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:13px;color:#cbd5e1;">
              <li>Remove high-impact polluters (cost).</li>
              <li>Deploy sustainable systems when allowed.</li>
              <li>Sequence: protect stability to transition.</li>
              <li>Heal: rare strategic recovery window.</li>
            </ul>
          </div>
            <div style="background:#0f1b2dcc;border:1px solid #1e293b;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;">
              <div style="font-weight:700;color:#f1f5f9;font-size:15px;">Loss Framing</div>
              <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:13px;color:#cbd5e1;">
                <li>No total rescue—only temporal extension.</li>
                <li>Collapse risk rises if you stall upgrades.</li>
                <li>Score = survival time + health synergy.</li>
                <li>Reflect on failure points each run.</li>
              </ul>
            </div>
        </div>
        <div style="display:flex;justify-content:center;margin-top:4px;">
          <button data-start style="padding:14px 28px;background:#10b981;color:#062c26;border:none;border-radius:12px;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 4px 14px -4px rgba(16,185,129,.5);">Commence Simulation</button>
        </div>
      </div>`;

    this.overlayBg = this.scene.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.65).setInteractive().setDepth(39);
    this.dom = this.scene.add.dom(cx, cy).createFromHTML(html).setOrigin(0.5).setDepth(40);
    this.dom.addListener("click");
    this.dom.on("click", (ev: any) => {
      const t = ev.target as HTMLElement;
      if (t && t.getAttribute("data-start") !== null) this.opts.onStart();
    });
  }

  hide() {
    if (this.dom) {
      this.dom.destroy(); this.dom = null;
    }
    if (this.overlayBg) {
      this.overlayBg.destroy(); this.overlayBg = null;
    }
  }
}
