import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import type { GoodSystemKey } from "../../types";
import { spawnFloatingText } from "../effects/floatingText";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import GoodSystemSellModal from "@/components/game/GoodSystemSellModal";

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
  void goodKey; // parameter acknowledged; no icon placement by design
  // Per new design: do NOT add floating icons around the planet for good systems.
  // Keep UI (e.g., bottom toolbar) in sync after purchase without spawning an icon.
  host.updateBottomToolbar();
}

export function promptSell(host: GoodSystemHost, goodKey: GoodSystemKey) {
  host.closeBottomPanel();
  const cam = host.scene.cameras.main;
  const width = cam.width;
  const height = cam.height;
  const panelWidth = Math.min(820, width - 32);
  const panelMaxHeight = Math.max(260, Math.floor(cam.height * 0.72));
  const x = (width - panelWidth) / 2;
  const good = (gameConfig.goodSystems as any)[goodKey];
  const refund = Math.floor(good.buildCost * gameConfig.sellRefundPct);

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
  const onSell = () => {
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
    onClose();
  };

  const goodData = {
    key: good.key,
    name: good.name,
    description: good.description,
    pros: good.pros,
    cons: good.cons,
    iconSrc: `/game/${good.key === "sustainableFarm" ? "farm" : good.key}.png`,
    resourceIncome: good.resourceIncome,
    planetImpact: good.planetImpact
  };

  root.render(
    React.createElement(GoodSystemSellModal, {
      good: goodData,
      refund,
      onClose,
      onSell
    })
  );

  requestAnimationFrame(() => {
    const rootEl = dom.node as HTMLElement | null;
    const actualH = Math.min(panelMaxHeight, rootEl ? (rootEl.getBoundingClientRect().height || panelMaxHeight) : panelMaxHeight);
    const centeredY = Math.max(8, Math.floor((height - actualH) / 2));
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
