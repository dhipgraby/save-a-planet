import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import type { GoodSystemKey } from "../../types";
import { spawnFloatingText } from "../effects/floatingText";
import { getEducationFor } from "../education/education";

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
  const panelWidth = Math.min(520, width - 24);
  const x = (width - panelWidth) / 2;
  const y = host.scene.cameras.main.height - 120;
  const good = (gameConfig.goodSystems as any)[goodKey];
  const refund = Math.floor(good.buildCost * gameConfig.sellRefundPct);
  const edu = getEducationFor(goodKey, "good");
  const html = `
    <style>@keyframes sap-pop {0%{transform:scale(.88);opacity:0;}60%{transform:scale(1.04);opacity:1;}100%{transform:scale(1);}}</style>
    <div style="width:${panelWidth}px;background:#0b1220ee;border:1px solid #1f2937;border-radius:12px;color:#e5e7eb;padding:14px;backdrop-filter:blur(4px);box-shadow:0 10px 30px rgba(0,0,0,.45);will-change:transform,opacity;animation:sap-pop 420ms cubic-bezier(0.34,1.56,0.64,1) both;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-weight:800;font-size:18px;">${good.name}</div>
        <button data-close style="background:#1f2937;color:#e5e7eb;border:none;border-radius:8px;padding:6px 10px;">Close</button>
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
        <img src="/game/${good.key === "sustainableFarm" ? "farm" : good.key}.svg" width="42" height="42" alt="${good.name}" style="background:#0f172a;border:1px solid #1f2937;border-radius:8px;padding:6px;"/>
        <div style="flex:1;min-width:0;font-size:12px;opacity:.95;">
          <div style="margin-bottom:4px;opacity:.9;">${edu.tagline ?? ""}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <div style="font-weight:700;margin-bottom:4px;color:#86efac;">Pros</div>
              <ul style="margin:0;padding-left:16px;">${edu.pros.map((p: string) => `<li>✅ ${p}</li>`).join("")}</ul>
            </div>
            <div>
              <div style="font-weight:700;margin-bottom:4px;color:#fca5a5;">Cons</div>
              <ul style="margin:0;padding-left:16px;">${edu.cons.map((c: string) => `<li>⚠️ ${c}</li>`).join("")}</ul>
            </div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <div>Refund: ${refund}</div>
        <button data-sell style="padding:8px 10px;background:#fbbf24;color:#0b1220;border:none;border-radius:8px;font-weight:700;">Sell</button>
      </div>
    </div>`;
  const dom = host.scene.add.dom(x, y).createFromHTML(html).setOrigin(0, 0).setDepth(25);
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
