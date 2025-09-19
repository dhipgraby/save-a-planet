import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import type { GoodSystemKey } from "../../types";
import { spawnFloatingText } from "../effects/floatingText";

export interface GoodSystemHost {
  scene: Phaser.Scene;
  state: any; // GameState
  planetSizePx: () => number;
  industryIcons: Array<{ image: Phaser.GameObjects.Image; angle: number; radius: number; key: string; type: "bad" | "good" }>;
  setIndustryIcons: (arr: Array<{ image: Phaser.GameObjects.Image; angle: number; radius: number; key: string; type: "bad" | "good" }>) => void;
  headerHeight: () => number;
  updateBottomToolbar: () => void;
  updateHud: () => void;
  updateSidebar: () => void;
  closeBottomPanel: () => void;
  setBottomPanelDom: (dom: Phaser.GameObjects.DOMElement | null) => void;
  bottomPanelDom: Phaser.GameObjects.DOMElement | null;
  bottomPanelCentered: boolean;
  setBottomPanelCentered: (v: boolean) => void;
}

export function addGoodIcon(host: GoodSystemHost, goodKey: GoodSystemKey) {
  const cam = host.scene.cameras.main;
  const centerX = cam.width / 2;
  const centerY = cam.height / 2;
  const baseRadius = Math.round(host.planetSizePx() / 2) + 70;
  const goodCount = host.industryIcons.filter(i => i.type === "good").length;
  const angle = Phaser.Math.DegToRad(60 + goodCount * 60);
  const x = centerX + baseRadius * Math.cos(angle);
  const y = centerY + baseRadius * Math.sin(angle);
  const icon = host.scene.add.image(x, y, goodKey).setInteractive({ useHandCursor: true });
  host.scene.tweens.add({ targets: icon, y: y - 4, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  host.scene.tweens.add({ targets: icon, angle: { from: -3, to: 3 }, duration: 2400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  icon.on("pointerdown", () => promptSell(host, goodKey));
  // Tooltip wiring will be handled outside to keep this generic
  host.industryIcons.push({ image: icon, angle, radius: baseRadius, key: goodKey, type: "good" });
  host.updateBottomToolbar();
}

export function promptSell(host: GoodSystemHost, goodKey: GoodSystemKey) {
  host.closeBottomPanel();
  const cam = host.scene.cameras.main;
  const width = cam.width;
  const panelWidth = Math.min(640, width - 24);
  const panelMaxHeight = Math.max(220, Math.floor(cam.height * 0.45));
  const x = (width - panelWidth) / 2;
  const good = (gameConfig.goodSystems as any)[goodKey];
  const refund = Math.floor(good.buildCost * gameConfig.sellRefundPct);
  const html = `
    <style>
      @keyframes sap-pop {0%{transform:scale(.88);opacity:0;}60%{transform:scale(1.04);opacity:1;}100%{transform:scale(1);} }
      .sap-modal { width:${panelWidth}px; max-height:${panelMaxHeight}px; overflow:auto; color:#e5e7eb; padding:16px;
        background:linear-gradient(180deg, rgba(11,18,32,.96), rgba(8,13,24,.96)); border:1px solid #1f2937; border-radius:14px;
        box-shadow:0 12px 36px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04); backdrop-filter: blur(6px);
        will-change:transform,opacity; animation:sap-pop 420ms cubic-bezier(0.34,1.56,0.64,1) both; }
      .sap-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
      .sap-title { font-weight:900; font-size:20px; letter-spacing:.2px; color:#eaf2ff; }
      .sap-close { background:#334155; color:#ffffff; border:1px solid #475569; border-radius:10px; padding:5px 9px; cursor:pointer; text-shadow:0 1px 0 rgba(0,0,0,.55); font-size:13px; }
      .sap-top { display:flex; gap:16px; align-items:flex-start; margin-bottom:18px; }
      .sap-top img { background:#0f172a; border:1px solid #1f2937; border-radius:12px; padding:10px; }
      .sap-cols { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
      .sap-col h4 { margin:0 0 6px; font-weight:900; font-size:15px; }
      .sap-pros h4 { color:#86efac; } .sap-cons h4 { color:#fca5a5; }
      .sap-list { margin:0; padding-left:0; list-style:none; }
      .sap-list li { display:flex; align-items:flex-start; gap:10px; margin:6px 0; font-size:14px; }
      .sap-li-icon { width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; margin-top:2px; font-size:16px; }
      .sap-actions { display:flex; gap:8px; margin: 12px 0; align-items:center; }
      .sap-btn { display:inline-flex; align-items:center; gap:8px; padding:7px 11px; border:none; border-radius:10px; font-weight:700; cursor:pointer; color:#ffffff;
        text-shadow:0 2px 2px rgba(0,0,0,.75), 0 0 6px rgba(0,0,0,.45); font-size:14px;
        box-shadow:0 6px 16px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06); transition: transform 120ms ease, filter 120ms ease; }
      .sap-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }
      .sap-btn:active { transform: translateY(0); filter: brightness(0.98); }
      .sap-btn-warn { background: linear-gradient(180deg,#fbbf24,#d97706); border:1px solid #b45309; color:#0b1220; text-shadow:none; }
      .sap-card-icon { width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center; background:#0f172a; border-radius:10px; border:1px solid #1f2937; }
      .sap-tags { display:flex; gap:10px; flex-wrap:wrap; font-size:12px; opacity:.9; }
      .sap-tag { display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:999px; background:#0f172a; border:1px solid #1f2937; }
    </style>
    <div class="sap-modal">
      <div class="sap-header">
        <div class="sap-title">${good.name}</div>
        <button data-close class="sap-close">Close</button>
      </div>
      <div class="sap-top">
        <img src="/game/${good.key === "sustainableFarm" ? "farm" : good.key}.png" width="54" height="54" alt="${good.name}"/>
        <div style="flex:1;min-width:0;opacity:.95;">
          <div style="margin-bottom:6px;opacity:.95;font-size:14px;line-height:1.35;">${good.description}</div>
          <div class="sap-cols">
            <div class="sap-col sap-pros">
              <h4>Pros</h4>
              <ul class="sap-list">${good.pros.map((p: string) => `<li><span class='sap-li-icon' style="color:#86efac;">✔️</span><span>${p}</span></li>`).join("")}</ul>
            </div>
            <div class="sap-col sap-cons">
              <h4>Cons</h4>
              <ul class="sap-list">${good.cons.map((c: string) => `<li><span class='sap-li-icon' style="color:#fbbf24;">⚠️</span><span>${c}</span></li>`).join("")}</ul>
            </div>
          </div>
        </div>
      </div>
      <div class="sap-actions">
        <div style="opacity:.9;font-size:14px;">Refund: ${refund}</div>
        <button data-sell class="sap-btn sap-btn-warn"><span class="sap-li-icon">💰</span>Sell</button>
      </div>
    </div>`;
  const dom = host.scene.add.dom(x, 0).createFromHTML(html).setOrigin(0, 0).setDepth(25);
  dom.addListener("click");
  dom.on("click", (ev: any) => {
    const t = ev.target as HTMLElement; if (!t) return;
    if (t.hasAttribute("data-close")) {
      host.closeBottomPanel(); return;
    }
    if (t.hasAttribute("data-sell")) {
      const idx = host.state.installed.findIndex((s: any) => s.type === "good" && s.key === goodKey);
      if (idx !== -1) host.state.installed.splice(idx, 1);
      const iconIdx = host.industryIcons.findIndex(i => i.type === "good" && i.key === goodKey);
      if (iconIdx !== -1) {
        host.industryIcons[iconIdx].image.destroy();
        host.industryIcons.splice(iconIdx, 1);
      }
      host.state.resources += refund;
      spawnFloatingText(host.scene, `${good.name} sold`, { color: "#fde68a", y: host.headerHeight() + 8 });
      host.updateHud();
      host.updateSidebar();
      host.updateBottomToolbar();
      host.closeBottomPanel();
    }
  });
  host.setBottomPanelDom(dom);
}
