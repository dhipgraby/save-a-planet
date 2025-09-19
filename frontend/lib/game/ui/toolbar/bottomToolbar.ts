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
  const y = cam.height - 72; // initial guess; will be corrected on resize using actual height
  const iconSrc = (key: string) => {
    const map: Record<string, string> = { sustainableFarm: "farm" };
    return `/game/${map[key] ?? key}.png`;
  };
  const buttons = host.state.installed.map((s: any) => {
    const key = s.key;
    const type = s.type;
    return `<button data-sys="${key}" data-type="${type}" class="sap-chip">
      <span class="sap-chip-icon"><img src="${iconSrc(key)}" width="22" height="22" alt="${key}"/></span>
      <span class="sap-chip-text">${key}</span>
    </button>`;
  }).join("");
  const html = `
    <style>
      .sap-toolbar { 
        width:${width}px; background: linear-gradient(180deg, rgba(11,18,32,0.95), rgba(8,13,24,0.95));
        border:1px solid #1f2937; border-radius:12px; padding:10px; backdrop-filter:blur(6px);
        box-shadow:0 8px 24px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,0.04);
        display:flex; align-items:center; justify-content:space-between; gap:12px;
      }
      .sap-chip { display:flex; align-items:center; gap:10px; padding:8px 12px; color:#e5e7eb; cursor:pointer;
        background: linear-gradient(180deg,#0f172a,#0b1220); border:1px solid #334155; border-radius:10px;
        box-shadow: 0 2px 6px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04);
        text-transform:capitalize; font-size:13px; transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
      }
      .sap-chip:hover { transform: translateY(-1px); box-shadow:0 6px 16px rgba(0,0,0,.45), 0 0 0 3px rgba(59,130,246,.15);
        border-color:#3b82f6; }
      .sap-chip:active { transform: translateY(0); box-shadow:0 2px 8px rgba(0,0,0,.35); }
  .sap-chip-icon { width:28px; height:28px; display:flex; align-items:center; justify-content:center; filter: drop-shadow(0 1px 0 rgba(0,0,0,.6)); }
      .sap-chip-text { line-height:1; }
      .sap-btns { display:flex; align-items:center; gap:10px; }
      .sap-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border:none; border-radius:10px; font-weight:700; color:#ffffff; cursor:pointer;
        text-shadow:0 1px 0 rgba(0,0,0,.55); letter-spacing:.2px; box-shadow:0 6px 16px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06); transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease; }
      .sap-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }
      .sap-btn:active { transform: translateY(0); filter: brightness(0.98); }
  .sap-btn-buy { background: linear-gradient(180deg,#60a5fa,#2563eb); border:1px solid #1d4ed8; }
  .sap-btn-surrender { background: linear-gradient(180deg,#f87171,#dc2626); border:1px solid #b91c1c; }
      .sap-btn-icon { width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; }
      .sap-btn-icon svg { display:block }
    </style>
    <div class="sap-toolbar">
      <div style="display:flex;flex-wrap:wrap;gap:10px;max-width:70%;">${buttons}</div>
      <div class="sap-btns">
        <button data-surrender class="sap-btn sap-btn-surrender">
          <span class="sap-btn-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M7 2v20M7 3h7a2 2 0 0 1 2 2v0a2 2 0 0 0 2 2h1v7h-7a2 2 0 0 1-2-2v0a2 2 0 0 0-2-2H7" stroke="#ffffff" stroke-opacity="0.0"/></svg>
          </span>
          Surrender
        </button>
        <button data-buy class="sap-btn sap-btn-buy">
          <span class="sap-btn-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M6 6h15l-2 9H8L6 6zm0 0L5 3H2" stroke="#ffffff" stroke-opacity="0.0"/></svg>
          </span>
          Buy System
        </button>
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
