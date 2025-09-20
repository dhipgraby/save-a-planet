import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import { spawnFloatingText } from "../effects/floatingText";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import BadSystemModal from "@/components/game/BadSystemModal";
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
  const removeCost = gameConfig.removeBadCost;

  // Build props for React component (build list removed from this modal)
  const badData = { key: bad.key, name: bad.name, description: bad.description, pros: bad.pros, cons: bad.cons, iconSrc: host.iconSrc(bad.key), resourceIncome: bad.resourceIncome, planetImpact: bad.planetImpact };

  const container = document.createElement("div");
  // Ensure container sizing matches computed panel layout for centering logic
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
  const onRemove = () => {
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
    onClose();
  };
  // Build actions removed from this modal

  root.render(
    React.createElement(BadSystemModal, {
      bad: badData,
      removeCost,
      onClose,
      onRemove
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

  // Ensure cleanup if Phaser destroys the DOMElement externally
  dom.on("destroy", () => {
    try {
      root.unmount();
    } catch {
      console.log("Failed to unmount bad system React root");
    }
  });
  host.setBottomPanelDom(dom);
}
