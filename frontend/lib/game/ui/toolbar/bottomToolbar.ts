import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import type { GoodSystemKey, BadSystemKey } from "../../types";
import { spawnFloatingText } from "../effects/floatingText";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import BuildGoodSystemModal from "@/components/game/BuildGoodSystemModal";
import ConfirmModal from "@/components/game/ConfirmModal";

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
        showSurrenderConfirm(host);
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
          showSurrenderConfirm(host); return;
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
  const height = cam.height;
  const panelWidth = Math.min(860, width - 24);
  const panelMaxHeight = Math.max(220, Math.floor(height * 0.5));
  const x = (width - panelWidth) / 2;

  // Prepare goods list for React component
  const goodsArr = Object.values(gameConfig.goodSystems) as any[];
  const iconSrc = (key: string) => {
    const map: Record<string, string> = { sustainableFarm: "farm" };
    return `/game/${map[key] ?? key}.png`;
  };
  const goods = goodsArr.map(g => ({
    key: g.key,
    name: g.name,
    blurb: g.blurb,
    buildCost: g.buildCost,
    populationRequired: g.populationRequired,
    resourceIncome: g.resourceIncome,
    planetImpact: g.planetImpact,
    iconSrc: iconSrc(g.key),
    pros: (g.pros ?? []).slice(0, 2),
    cons: (g.cons ?? []).slice(0, 1)
  }));

  const container = document.createElement("div");
  container.style.width = `${panelWidth}px`;
  container.style.maxHeight = `${panelMaxHeight}px`;
  container.style.overflow = "auto";
  const root: Root = createRoot(container);
  const dom = host.scene.add.dom(x, 0, container).setOrigin(0, 0).setDepth(25);

  const onClose = () => {
    try {
      root.unmount();
    } catch { /* noop */ }
    host.closeBottomPanel();
  };
  const onBuild = (goodKey: string) => {
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
    host.addGoodIcon(goodKey as GoodSystemKey);
    spawnFloatingText(host.scene, `${good.name} built`, { color: "#93c5fd", y: host.headerHeight() + 8 });
    host.updateHud();
    host.updateSidebar();
    updateBottomToolbar(host, host.bottomPanelDom);
    onClose();
  };

  root.render(
    React.createElement(BuildGoodSystemModal, {
      title: "Build a Good System",
      goods,
      onClose,
      onBuild
    })
  );

  // Center vertically after mounting
  requestAnimationFrame(() => {
    const rootEl = dom.node as HTMLElement | null;
    const actualH = Math.min(panelMaxHeight, rootEl ? (rootEl.getBoundingClientRect().height || panelMaxHeight) : panelMaxHeight);
    const centeredY = Math.max(8, Math.floor((cam.height - actualH) / 2));
    dom.setPosition(x, centeredY);
    host.setBottomPanelCentered(true);
  });

  dom.on("destroy", () => {
    try {
      root.unmount();
    } catch { /* noop */ }
  });
  host.setBottomPanelDom(dom);
}

export function showSurrenderConfirm(host: BottomToolbarHost) {
  host.closeBottomPanel();
  const cam = host.scene.cameras.main;
  const width = cam.width;
  const height = cam.height;
  const panelWidth = Math.min(560, width - 24);
  const x = (width - panelWidth) / 2;

  const container = document.createElement("div");
  container.style.width = `${panelWidth}px`;
  const root: Root = createRoot(container);
  const dom = host.scene.add.dom(x, 0, container).setOrigin(0, 0).setDepth(27);

  const cleanup = () => {
    try {
      root.unmount();
    } catch { /* noop */ }
    host.closeBottomPanel();
  };

  const onConfirm = () => {
    // Mark game over and trigger game over UI via scene
    (host.state as any).gameOver = true;
    const sceneAny: any = host.scene as any;
    if (typeof sceneAny.showGameOver === "function") sceneAny.showGameOver();
    cleanup();
  };

  const onCancel = () => cleanup();

  root.render(
    React.createElement(ConfirmModal, {
      title: "Surrender?",
      description: "This will end your current run and show the Game Over screen.",
      confirmLabel: "Yes, surrender",
      cancelLabel: "Keep playing",
      onConfirm,
      onCancel
    })
  );

  // Center vertically after mounting
  requestAnimationFrame(() => {
    const rootEl = dom.node as HTMLElement | null;
    const actualH = rootEl ? (rootEl.getBoundingClientRect().height || 0) : 0;
    const centeredY = Math.max(8, Math.floor((height - Math.min(actualH, height - 16)) / 2));
    dom.setPosition(x, centeredY);
    host.setBottomPanelCentered(true);
  });

  dom.on("destroy", () => {
    try {
      root.unmount();
    } catch { /* noop */ }
  });

  host.setBottomPanelDom(dom);
}
