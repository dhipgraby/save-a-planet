import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import type { GoodSystemKey, BadSystemKey } from "../../types";
import { spawnFloatingText } from "../effects/floatingText";

export interface BottomToolbarHost {
  scene: Phaser.Scene;
  state: any; // GameState
  promptReplacement: (bad: BadSystemKey) => void;
  promptSell: (good: GoodSystemKey) => void;
  addGoodIcon: (good: GoodSystemKey) => void;
  headerHeight: () => number;
  closeBottomPanel: () => void;
  bottomPanelDom: Phaser.GameObjects.DOMElement | null;
  setBottomPanelDom: (dom: Phaser.GameObjects.DOMElement | null) => void;
  addDom: (x: number, y: number, html: string, depth: number) => Phaser.GameObjects.DOMElement;
  setBottomPanelCentered: (v: boolean) => void;
  resources: () => number;
  updateHud: () => void;
  updateSidebar: () => void;
  showBadTooltip: (key: BadSystemKey, x: number, y: number) => void;
  moveTooltip: (x: number, y: number) => void;
  hideTooltip: () => void;
}

export function updateBottomToolbar(host: BottomToolbarHost, existingDom: Phaser.GameObjects.DOMElement | null) {
  const cam = host.scene.cameras.main;
  const width = Math.floor(cam.width - 24);
  const x = 12;
  const y = cam.height - 56;
  const iconSrc = (key: string) => {
    const map: Record<string, string> = { sustainableFarm: "farm" };
    return `/game/${map[key] ?? key}.svg`;
  };
  const buttons = host.state.installed.map((s: any) => {
    const key = s.key;
    const type = s.type;
    return `<button data-sys="${key}" data-type="${type}" style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#0f172a;border:1px solid #1f2937;border-radius:8px;color:#e5e7eb;">
      <img src="${iconSrc(key)}" width="16" height="16" alt="${key}"/>
      <span style="font-size:12px;text-transform:capitalize;">${key}</span>
    </button>`;
  }).join("");
  const html = `
    <div style="width:${width}px;background:#0b1220ee;border:1px solid #1f2937;border-radius:12px;padding:8px;backdrop-filter:blur(6px);box-shadow:0 6px 18px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:space-between;gap:10px;">
      <div style="display:flex;flex-wrap:wrap;gap:8px;max-width:70%;">${buttons}</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button data-surrender style="padding:6px 10px;background:#ef4444;color:#0b1220;border:none;border-radius:8px;font-weight:700;font-size:12px;">Surrender</button>
        <button data-buy style="padding:8px 10px;background:#3b82f6;color:#0b1220;border:none;border-radius:8px;font-weight:700;">Buy System</button>
      </div>
    </div>`;
  if (!existingDom) {
    const dom = host.scene.add.dom(x, y).createFromHTML(html).setOrigin(0, 0).setDepth(26);
    dom.addListener("click");
    dom.on("click", (ev: any) => {
      const t = ev.target as HTMLElement;
      if (!t) return;
      const btn = t.closest("button") as HTMLElement | null;
      if (!btn) return;
      if (btn.hasAttribute("data-buy")) {
        showGlobalBuildPanel(host);
        return;
      }
      if (btn.hasAttribute("data-surrender")) {
        // Mark game over and trigger a restart flow: set state then show game over screen via scene method if present
        (host.state as any).gameOver = true;
        // Expect MainScene to expose showGameOver()
        const sceneAny: any = host.scene as any;
        if (typeof sceneAny.showGameOver === "function") sceneAny.showGameOver();
        return;
      }
      const sys = btn.getAttribute("data-sys");
      const type = btn.getAttribute("data-type");
      if (sys && type === "bad") host.promptReplacement(sys as BadSystemKey);
      else if (sys && type === "good") host.promptSell(sys as GoodSystemKey);
    });
    // Tooltip delegation
    dom.addListener("mouseover");
    dom.addListener("mouseout");
    dom.addListener("mousemove");
    const rootEl = dom.node as HTMLElement;
    const canvasRect = () => (host.scene.game.canvas as HTMLCanvasElement).getBoundingClientRect();
    const extractPos = (e: any) => {
      const rect = canvasRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    rootEl.addEventListener("mouseover", (e) => {
      const target = (e.target as HTMLElement).closest("button");
      if (!target) return;
      if (target.hasAttribute("data-type") && target.getAttribute("data-type") === "bad") {
        const sys = target.getAttribute("data-sys") as BadSystemKey | null;
        if (sys) {
          const { x, y } = extractPos(e); host.showBadTooltip(sys, x, y);
        }
      }
    });
    rootEl.addEventListener("mousemove", (e) => {
      const target = (e.target as HTMLElement).closest("button");
      if (!target) return;
      if (target.hasAttribute("data-type") && target.getAttribute("data-type") === "bad") {
        const { x, y } = extractPos(e); host.moveTooltip(x, y);
      }
    });
    rootEl.addEventListener("mouseout", (e) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (related && rootEl.contains(related)) return; // staying inside
      host.hideTooltip();
    });
    return dom;
  } else {
    // Guard: if existing DOM element was destroyed or its node missing, recreate
    if (!existingDom.scene || !existingDom.node) {
      try {
        existingDom.destroy();
      } catch { /* ignore */ }
      const dom = host.scene.add.dom(x, y).createFromHTML(html).setOrigin(0, 0).setDepth(26);
      dom.addListener("click");
      dom.on("click", (ev: any) => {
        const t = ev.target as HTMLElement; if (!t) return;
        const btn = t.closest("button"); if (!btn) return;
        if (btn.hasAttribute("data-buy")) {
          showGlobalBuildPanel(host); return;
        }
        if (btn.hasAttribute("data-surrender")) {
          (host.state as any).gameOver = true;
          const sceneAny: any = host.scene as any;
          if (typeof sceneAny.showGameOver === "function") sceneAny.showGameOver();
          return;
        }
        const sys = btn.getAttribute("data-sys");
        const type = btn.getAttribute("data-type");
        if (sys && type === "bad") host.promptReplacement(sys as BadSystemKey);
        else if (sys && type === "good") host.promptSell(sys as GoodSystemKey);
      });
      // Reattach tooltip delegation for recreated node
      dom.addListener("mouseover");
      dom.addListener("mouseout");
      dom.addListener("mousemove");
      const rootEl2 = dom.node as HTMLElement;
      const canvasRect2 = () => (host.scene.game.canvas as HTMLCanvasElement).getBoundingClientRect();
      const extractPos2 = (e: any) => {
        const r = canvasRect2(); return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      rootEl2.addEventListener("mouseover", (e) => {
        const target = (e.target as HTMLElement).closest("button");
        if (!target) return;
        if (target.hasAttribute("data-type") && target.getAttribute("data-type") === "bad") {
          const sys = target.getAttribute("data-sys") as BadSystemKey | null;
          if (sys) {
            const { x, y } = extractPos2(e); host.showBadTooltip(sys, x, y);
          }
        }
      });
      rootEl2.addEventListener("mousemove", (e) => {
        const target = (e.target as HTMLElement).closest("button");
        if (!target) return;
        if (target.hasAttribute("data-type") && target.getAttribute("data-type") === "bad") {
          const { x, y } = extractPos2(e); host.moveTooltip(x, y);
        }
      });
      rootEl2.addEventListener("mouseout", (e) => {
        const related = e.relatedTarget as HTMLElement | null;
        if (related && rootEl2.contains(related)) return;
        host.hideTooltip();
      });
      return dom;
    }
    (existingDom.node as HTMLElement).innerHTML = html;
    // After HTML replacement we need to keep tooltip working; listeners remain bound since node reused.
    return existingDom;
  }
}

export function showGlobalBuildPanel(host: BottomToolbarHost) {
  host.closeBottomPanel();
  const cam = host.scene.cameras.main;
  const width = cam.width;
  const panelWidth = Math.min(860, width - 24);
  const panelMaxHeight = Math.max(220, Math.floor(cam.height * 0.5));
  const x = (width - panelWidth) / 2;
  const goods = Object.values(gameConfig.goodSystems);
  const tickSec = gameConfig.tickDurationMs / 1000;
  const cards = goods.map(g => `
    <div style="background:#0b1220;border:1px solid #1f2937;border-radius:10px;padding:12px;display:flex;gap:12px;align-items:center;">
      <div style="width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;background:#0f172a;border-radius:8px;border:1px solid #1f2937;">⚙️</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;">${g.name}</div>
        <div style="opacity:.85;font-size:12px;margin:4px 0 6px;">${g.blurb}</div>
        <div style="display:flex;gap:12px;font-size:12px;opacity:.9;flex-wrap:wrap;">
          <span>Build: ${g.buildCost}</span>
          <span>Pop req: ${g.populationRequired}</span>
          <span>Income: +${(g.resourceIncome / tickSec).toFixed(1)}/s</span>
          <span>Damage: ${(g.planetImpact / tickSec).toFixed(1)}/s</span>
        </div>
      </div>
      <button data-build="${g.key}" style="padding:8px 10px;background:#10b981;color:#0b1220;border:none;border-radius:8px;font-weight:700;">Build</button>
    </div>`).join("");
  const html = `
    <style>@keyframes sap-pop {0%{transform:scale(.88);opacity:0;}60%{transform:scale(1.04);opacity:1;}100%{transform:scale(1);}}</style>
    <div style="width:${panelWidth}px;max-height:${panelMaxHeight}px;overflow:auto;background:#0b1220ee;border:1px solid #1f2937;border-radius:12px;color:#e5e7eb;padding:14px;backdrop-filter:blur(4px);box-shadow:0 10px 30px rgba(0,0,0,.45);will-change:transform,opacity;animation:sap-pop 420ms cubic-bezier(0.34,1.56,0.64,1) both;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-weight:800;font-size:18px;">Build a Good System</div>
        <button data-close style="background:#1f2937;color:#e5e7eb;border:none;border-radius:8px;padding:6px 10px;">Close</button>
      </div>
      <div data-build-list style="display:grid;grid-template-columns:1fr;gap:10px;">${cards}</div>
    </div>`;
  const dom = host.scene.add.dom(x, 0).createFromHTML(html).setOrigin(0, 0).setDepth(25);
  // center vertically
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
    if (t.hasAttribute("data-build")) {
      const goodKey = t.getAttribute("data-build") as GoodSystemKey;
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
      host.state.installed.push({
        key: good.key,
        type: "good",
        resourceIncome: good.resourceIncome,
        planetImpact: good.planetImpact,
        spriteKey: good.key
      });
      host.addGoodIcon(goodKey);
      spawnFloatingText(host.scene, `${good.name} built`, { color: "#93c5fd", y: host.headerHeight() + 8 });
      host.updateHud();
      host.updateSidebar();
      updateBottomToolbar(host, host.bottomPanelDom);
    }
  });
  host.setBottomPanelDom(dom);
}
