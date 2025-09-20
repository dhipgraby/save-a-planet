import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";

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
    const panelWidth = Math.min(1000, cam.width - 40);
    const panelMaxHeight = Math.min(700, cam.height - 100);

    // Pull key values from config to keep text accurate
    const baseDecay = gameConfig.baseDecay;
    const per10s = gameConfig.populationConsumptionPer10sPerCapita;
    const popCheck = gameConfig.populationCheckIntervalSec;
    const popDecay = gameConfig.populationDecayPerCheck;
    const popHeal = gameConfig.populationHealPerCheck;
    const healMult = Math.round(gameConfig.populationHealThresholdMultiplier * 100);
    const minPer10s = gameConfig.minIncomePerPopPer10s;
    const healPct = Math.round(gameConfig.heal.amountPct * 100);
    const healCD = gameConfig.heal.cooldownSec;
    const removeCost = gameConfig.removeBadCost;
    const sellRefund = Math.round(gameConfig.sellRefundPct * 100);

    const html = `
      <div style="width:${panelWidth}px;max-height:${panelMaxHeight}px;overflow:auto;background:linear-gradient(145deg,#0b1220ee,#0f172acc);border:1px solid #1e293b;border-radius:18px;color:#e2e8f0;padding:26px 28px 24px;backdrop-filter:blur(8px);box-shadow:0 18px 42px -10px rgba(0,0,0,.65);font-family:monospace;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:14px;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <div style="font-size:13px;letter-spacing:.1em;font-weight:600;color:#38bdf8;text-transform:uppercase;">Simulation Setup</div>
            <div style="font-weight:800;font-size:30px;line-height:1.05;color:#f8fafc;text-shadow:0 2px 4px rgba(0,0,0,.4);">Save a Planet</div>
          </div>
          <div style="font-size:12px;color:#64748b;text-align:right;max-width:260px;line-height:1.3;">Extend viability — every delayed collapse second matters.</div>
        </div>       

        <div style="font-size:12px;letter-spacing:.08em;font-weight:700;color:#38bdf8;text-transform:uppercase;margin:2px 0 8px 2px;">How It Works</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-bottom:18px;">
          <!-- Polluting vs Clean Systems -->
          <div style="background:#0f1b2dcc;border:1px solid #1e293b;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="font-weight:700;color:#f1f5f9;font-size:15px;">Systems: Bad vs Good</div>
            <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;">
              <div style="display:flex;flex-direction:column;gap:6px;align-items:center;flex:1;">
                <div style="font-size:12px;color:#fca5a5;font-weight:700;">Polluting</div>
                <div style="display:flex;gap:10px;align-items:center;">
                  <img src="/game/oil.png" alt="Oil" width="56" height="56" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.35));"/>
                  <img src="/game/coal.png" alt="Coal" width="56" height="56" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.35));"/>
                </div>
                <div style="font-size:12px;color:#cbd5e1;text-align:center;">Fast resources, rising damage.</div>
              </div>
              <div style="width:1px;height:64px;background:#1e293b;"></div>
              <div style="display:flex;flex-direction:column;gap:6px;align-items:center;flex:1;">
                <div style="font-size:12px;color:#86efac;font-weight:700;">Clean</div>
                <div style="display:flex;gap:10px;align-items:center;">
                  <img src="/game/solar.png" alt="Solar" width="56" height="56" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.35));"/>
                  <img src="/game/wind.png" alt="Wind" width="56" height="56" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.35));"/>
                </div>
                <div style="font-size:12px;color:#cbd5e1;text-align:center;">Slower ramp, less damage.</div>
              </div>
            </div>
          </div>

          <!-- Population Capacity -->
          <div style="background:#0f1b2dcc;border:1px solid #1e293b;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="font-weight:700;color:#f1f5f9;font-size:15px;">Population Capacity</div>
            <div style="display:flex;gap:12px;align-items:center;justify-content:center;">
              <img src="/game/population.png" alt="Healthy population" width="68" height="68" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.35));"/>
              <img src="/game/lesspopulation.png" alt="Declining population" width="68" height="68" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.35));"/>
            </div>
            <div style="font-size:12px;color:#cbd5e1;text-align:center;">Under-supply → decline; strong surplus → recover.</div>
          </div>

          <!-- Resources -->
          <div style="background:#0f1b2dcc;border:1px solid #1e293b;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="font-weight:700;color:#f1f5f9;font-size:15px;">Resources & Land</div>
            <div style="display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;">
              <img src="/game/farm.png" alt="Farm" width="60" height="60" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.35));"/>
              <img src="/game/logging.png" alt="Logging" width="60" height="60" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.35));"/>
              <img src="/game/reforest.png" alt="Reforest" width="60" height="60" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.35));"/>
            </div>
            <div style="font-size:12px;color:#cbd5e1;text-align:center;">Meet needs without eroding resilience.</div>
          </div>

          <!-- Core Loop -->
          <div style="background:#0f1b2dcc;border:1px solid #1e293b;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;">
            <div style="font-weight:700;color:#f1f5f9;font-size:15px;">Core Loop</div>
            <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:13px;color:#cbd5e1;">
              <li>Every 1s: PlanetHealth -= base (${baseDecay}) + sum(system impact); Resources += sum(income).</li>
              <li>Every 10s: Consumption = Population × ${per10s} resources.</li>
              <li>Every ${popCheck}s: if income/sec &lt; (Pop × ${minPer10s} / 10) → Population −${popDecay}; if ≥ ${healMult}% of need → Population +${popHeal}.</li>
            </ul>
          </div>

          <!-- Actions & Costs -->
          <div style="background:#0f1b2dcc;border:1px solid #1e293b;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;">
            <div style="font-weight:700;color:#f1f5f9;font-size:15px;">Actions & Costs</div>
            <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:13px;color:#cbd5e1;">
              <li>Remove polluters: ${removeCost} resources each.</li>
              <li>Build clean systems: pay cost; some require minimum population.</li>
              <li>Sell clean systems: ${sellRefund}% refund.</li>
              <li>Heal planet: +${healPct}% (cooldown ${healCD}s).</li>
            </ul>
          </div>

          <!-- Scoring -->
          <div style="background:#0f1b2dcc;border:1px solid #1e293b;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="font-weight:700;color:#f1f5f9;font-size:15px;">Scoring</div>
            <div style="display:flex;gap:12px;align-items:center;justify-content:center;">
              <img src="/game/coin.svg" alt="Score coin" width="44" height="44" style="filter:drop-shadow(0 6px 12px rgba(0,0,0,.35));"/>
            </div>
            <div style="font-size:12px;color:#cbd5e1;text-align:center;">Score = survival time + population health bonus.</div>
          </div>
        </div>

        <div style="display:flex;align-items:stretch;margin-top:10px;">
          <button data-start
            style="
              width:100%;
              padding:16px 20px;
              border:none;
              border-radius:14px;
              font-weight:900;
              font-size:16px;
              letter-spacing:.02em;
              cursor:pointer;
              color:#062c26;
              background:linear-gradient(180deg,#34d399,#10b981,#059669);
              box-shadow:0 14px 32px rgba(16,185,129,.35), 0 0 0 1px rgba(16,185,129,.6) inset;
              position:relative;
              overflow:hidden;
            "
          >
            <span style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(255,255,255,.08),rgba(255,255,255,0));opacity:.35;"></span>
            <span style="position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#062c26" aria-hidden="true" focusable="false">
                <path d="M8 5v14l11-7z"></path>
              </svg>
              <span>Start</span>
            </span>
          </button>
        </div>
      </div>`;

    this.overlayBg = this.scene.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.65).setInteractive().setDepth(39);
    this.dom = this.scene.add.dom(cx, cy).createFromHTML(html).setOrigin(0.5).setDepth(40);
    this.dom.addListener("click");
    this.dom.on("click", (ev: any) => {
      const t = ev.target as HTMLElement | null;
      // Delegate to the nearest ancestor with data-start so inner spans/SVG clicks work
      const startEl = t && (t.closest ? t.closest("[data-start]") : (t.getAttribute && t.getAttribute("data-start") !== null ? t : null));
      if (startEl) this.opts.onStart();
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
