import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import { getEducationFor } from "../education/education";
import { spawnFloatingText } from "../effects/floatingText";
import type { BadSystemKey, GoodSystemKey } from "../../types";

export interface BadSystemHost {
  scene: Phaser.Scene;
  state: any; // GameState
  iconSrc: (key: string) => string;
  closeBottomPanel: () => void;
  addGoodIcon: (good: GoodSystemKey) => void;
  headerHeight: () => number;
  updateHud: () => void;
  updateSidebar: () => void;
  setBottomPanelDom: (dom: Phaser.GameObjects.DOMElement | null) => void;
  setBottomPanelCentered: (v: boolean) => void;
  bottomPanelDom: Phaser.GameObjects.DOMElement | null;
  industryIcons: Array<{ image: Phaser.GameObjects.Image; angle: number; radius: number; key: string; type: "bad" | "good" }>;
}

export function promptReplacement(host: BadSystemHost, badKey: BadSystemKey) {
  host.closeBottomPanel();
  const cam = host.scene.cameras.main;
  const width = cam.width;
  const height = cam.height;
  const panelWidth = Math.min(860, width - 24);
  const panelMaxHeight = Math.max(220, Math.floor(height * 0.5));
  const x = (width - panelWidth) / 2;
  const bad = (gameConfig.badSystems as any)[badKey];
  const goods = Object.values(gameConfig.goodSystems) as any[];
  const tickSec = gameConfig.tickDurationMs / 1000;
  const removeCost = gameConfig.removeBadCost;
  const edu = getEducationFor(badKey, "bad");
  const cards = goods.map(g => `
    <div style="background:#0b1220;border:1px solid #1f2937;border-radius:10px;padding:12px;display:flex;gap:12px;align-items:center;">
      <div style="width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;background:#0f172a;border-radius:8px;border:1px solid #1f2937;">⚙️</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;">${g.name}</div>
        <div style="opacity:.85;font-size:12px;margin:4px 0 6px;">${g.blurb}</div>
        <div style="display:flex;gap:12px;font-size:12px;opacity:.9;">
          <span>🔨Build: ${g.buildCost}</span>
          <span>👫Pop req: ${g.populationRequired}</span>
          <span><img src="/game/coin.svg" width="18" height="18" alt="coins"/> Income: +${(g.resourceIncome / tickSec).toFixed(1)}/s</span>
          <span>🔥Damage: ${(g.planetImpact / tickSec).toFixed(1)}/s</span>
        </div>
      </div>
      <button data-build="${g.key}" style="padding:8px 10px;background:#10b981;color:#0b1220;border:none;border-radius:8px;font-weight:700;">Build</button>
    </div>`).join("");
  const html = `
    <style>@keyframes sap-pop {0%{transform:scale(.88);opacity:0;}60%{transform:scale(1.04);opacity:1;}100%{transform:scale(1);}}</style>
    <div style="width:${panelWidth}px;max-height:${panelMaxHeight}px;overflow:auto;background:#0b1220ee;border:1px solid #1f2937;border-radius:12px;color:#e5e7eb;padding:14px;backdrop-filter:blur(4px);box-shadow:0 10px 30px rgba(0,0,0,.45);will-change:transform,opacity;animation:sap-pop 420ms cubic-bezier(0.34,1.56,0.64,1) both;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-weight:800;font-size:18px;">Manage ${bad.name}</div>
        <button data-close style="background:#1f2937;color:#e5e7eb;border:none;border-radius:8px;padding:6px 10px;">Close</button>
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
        <img src="${host.iconSrc(bad.key)}" width="42" height="42" alt="${bad.name}" style="background:#0f172a;border:1px solid #1f2937;border-radius:8px;padding:6px;"/>
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
      <div style="display:flex;gap:10px;margin-bottom:12px;">
        <button data-remove style="padding:8px 10px;background:#ef4444;color:#0b1220;border:none;border-radius:8px;font-weight:700;">Remove (${removeCost})</button>
        <button data-open-build style="padding:8px 10px;background:#3b82f6;color:#0b1220;border:none;border-radius:8px;font-weight:700;">Build Good System</button>
      </div>
      <div data-build-list style="display:none;grid-template-columns:1fr;gap:10px;">${cards}</div>
    </div>`;
  const dom = host.scene.add.dom(x, 0).createFromHTML(html).setOrigin(0, 0).setDepth(25);
  // Center vertically after measuring
  const root = dom.node as HTMLElement;
  const actualH = Math.min(panelMaxHeight, root.getBoundingClientRect().height || panelMaxHeight);
  const centeredY = Math.max(8, Math.floor((cam.height - actualH) / 2));
  dom.setPosition(x, centeredY);
  host.setBottomPanelCentered(true);
  dom.addListener("click");
  dom.on("click", (ev: any) => {
    const t = ev.target as HTMLElement; if (!t) return;
    if (t.hasAttribute("data-close")) {
      host.closeBottomPanel(); return;
    }
    if (t.hasAttribute("data-remove")) {
      if (host.state.resources < removeCost) {
        spawnFloatingText(host.scene, "Not enough resources to remove", { color: "#f87171", y: host.headerHeight() + 8 });
        return;
      }
      const idx = host.state.installed.findIndex((s: any) => s.type === "bad" && s.key === badKey);
      if (idx === -1) {
        spawnFloatingText(host.scene, "No such system installed", { color: "#fbbf24", y: host.headerHeight() + 8 });
        return;
      }
      host.state.resources -= removeCost;
      host.state.installed.splice(idx, 1);
      const iconIdx = host.industryIcons.findIndex(i => i.type === "bad" && i.key === badKey);
      if (iconIdx !== -1) {
        host.industryIcons[iconIdx].image.destroy(); host.industryIcons.splice(iconIdx, 1);
      }
      spawnFloatingText(host.scene, `${bad.name} removed`, { color: "#fca5a5", y: host.headerHeight() + 8 });
      host.updateHud();
      host.updateSidebar();
      return;
    }
    if (t.hasAttribute("data-open-build")) {
      const root = dom.node as HTMLElement;
      const list = root.querySelector("[data-build-list]") as HTMLElement | null;
      if (list) list.style.display = "grid";
      return;
    }
    const build = t.getAttribute("data-build");
    if (build) {
      const goodKey = build as GoodSystemKey;
      const good = (gameConfig.goodSystems as any)[goodKey];
      if (host.state.populationHealth < good.populationRequired) {
        spawnFloatingText(host.scene, `Requires population ≥ ${good.populationRequired}`, { color: "#fbbf24", y: host.headerHeight() + 8 });
        return;
      }
      if (host.state.resources < good.buildCost) {
        spawnFloatingText(host.scene, "Not enough resources", { color: "#f87171", y: host.headerHeight() + 8 });
        return;
      }
      host.state.resources -= good.buildCost;
      host.state.installed.push({ key: good.key, type: "good", resourceIncome: good.resourceIncome, planetImpact: good.planetImpact, spriteKey: good.key });
      host.addGoodIcon(goodKey);
      spawnFloatingText(host.scene, `${good.name} built`, { color: "#93c5fd", y: host.headerHeight() + 8 });
      host.updateHud();
      host.updateSidebar();
    }
  });
  host.setBottomPanelDom(dom);
}
