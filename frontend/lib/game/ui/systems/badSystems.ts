import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
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
  const cards = goods.map(g => {
    const pros = (g?.pros ?? []).slice(0, 2);
    const cons = (g?.cons ?? []).slice(0, 1);
    return `
    <div class="sap-card">
      <div class="sap-card-icon"><img src="${host.iconSrc(g.key)}" width="36" height="36" alt="${g.name}"/></div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:900;font-size:14px;">${g.name}</div>
        <div style="opacity:.92;font-size:12px;margin:4px 0 4px;">${g.blurb}</div>
        <div class="sap-tags">
          <span class="sap-tag">Build: ${g.buildCost}</span>
          <span class="sap-tag">Pop req: ${g.populationRequired}</span>
          <span class="sap-tag">💰 +${(g.resourceIncome / tickSec).toFixed(1)}/s</span>
          <span class="sap-tag">🔥 ${(g.planetImpact / tickSec).toFixed(1)}/s</span>
        </div>
        ${(pros.length || cons.length) ? `<div style=\"display:flex;gap:12px;margin-top:6px;\">${
          pros.length ? `<div style=\"flex:1;min-width:0;\"><div style=\"font-weight:800;color:#86efac;margin-bottom:4px;\">Why it's good</div><ul style=\"margin:0;padding-left:16px;\">${pros.map((p: string)=>`<li>${p}</li>`).join("")}</ul></div>` : ""
        }${
          cons.length ? `<div style=\"flex:1;min-width:0;\"><div style=\"font-weight:800;color:#fca5a5;margin-bottom:4px;\">Trade-offs</div><ul style=\"margin:0;padding-left:16px;\">${cons.map((c: string)=>`<li>${c}</li>`).join("")}</ul></div>` : ""
        }</div>` : ""}
      </div>
      <button data-build="${g.key}" class="sap-btn sap-btn-build"><span class="sap-btn-icon" aria-hidden="true">⚒️</span>Build</button>
    </div>`;
  }).join("");
  const html = `
    <style>
      @keyframes sap-pop {0%{transform:scale(.88);opacity:0;}60%{transform:scale(1.04);opacity:1;}100%{transform:scale(1);} }
      .sap-modal { width:${panelWidth}px; max-height:${panelMaxHeight}px; overflow:auto; color:#e5e7eb; padding:16px;
        background:linear-gradient(180deg, rgba(11,18,32,.96), rgba(8,13,24,.96)); border:1px solid #1f2937; border-radius:14px;
        box-shadow:0 12px 36px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04); backdrop-filter: blur(6px);
        will-change:transform,opacity; animation:sap-pop 420ms cubic-bezier(0.34,1.56,0.64,1) both; }
      .sap-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
  .sap-title { font-weight:900; font-size:22px; letter-spacing:.2px; color:#eaf2ff; }
  .sap-close { background:#334155; color:#ffffff; border:1px solid #475569; border-radius:10px; padding:5px 9px; cursor:pointer; text-shadow:0 1px 0 rgba(0,0,0,.55); font-size:13px; }
  .sap-top { display:flex; gap:16px; align-items:flex-start; margin-bottom:18px; }
  .sap-top img { background:#0f172a; border:1px solid #1f2937; border-radius:12px; padding:10px; }
  .sap-cols { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .sap-col h4 { margin:0 0 6px; font-weight:900; font-size:15px; }
      .sap-pros h4 { color:#86efac; } .sap-cons h4 { color:#fca5a5; }
      .sap-list { margin:0; padding-left:0; list-style:none; }
  .sap-list li { display:flex; align-items:flex-start; gap:10px; margin:6px 0; font-size:14px; }
  .sap-li-icon { width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; margin-top:2px; font-size:16px; }
      .sap-actions { display:flex; gap:8px; margin: 12px 0; }
      .sap-btn { display:inline-flex; align-items:center; gap:8px; padding:7px 11px; border:none; border-radius:10px; font-weight:700; cursor:pointer; color:#ffffff;
        text-shadow:0 2px 2px rgba(0,0,0,.75), 0 0 6px rgba(0,0,0,.45); font-size:14px;
        box-shadow:0 6px 16px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06); transition: transform 120ms ease, filter 120ms ease; }
      .sap-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }
      .sap-btn:active { transform: translateY(0); filter: brightness(0.98); }
      .sap-btn-danger { background: linear-gradient(180deg,#f87171,#dc2626); border:1px solid #b91c1c; }
      .sap-btn-primary { background: linear-gradient(180deg,#60a5fa,#2563eb); border:1px solid #1d4ed8; }
      .sap-btn-build { background: linear-gradient(180deg,#34d399,#059669); border:1px solid #047857; }
      .sap-btn-icon { width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; }
      .sap-card { background:#0b1220; border:1px solid #1f2937; border-radius:12px; padding:12px; display:flex; gap:12px; align-items:flex-start; }
  .sap-card-icon { width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center; background:#0f172a; border-radius:10px; border:1px solid #1f2937; }
      .sap-tags { display:flex; gap:10px; flex-wrap:wrap; font-size:12px; opacity:.9; }
      .sap-tag { display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:999px; background:#0f172a; border:1px solid #1f2937; }
    </style>
    <div class="sap-modal">
      <div class="sap-header">
        <div class="sap-title">Manage ${bad.name}</div>
        <button data-close class="sap-close">Close</button>
      </div>
      <div class="sap-top">
        <img src="${host.iconSrc(bad.key)}" width="54" height="54" alt="${bad.name}"/>
        <div style="flex:1;min-width:0;opacity:.95;">
          <div style="margin-bottom:6px;opacity:.95;font-size:14px;line-height:1.35;">${bad.description}</div>
          <div class="sap-cols">
            <div class="sap-col sap-pros">
              <h4>Pros</h4>
              <ul class="sap-list">${bad.pros.map((p: string) => `<li><span class='sap-li-icon' style="color:#86efac;">✔️</span><span>${p}</span></li>`).join("")}</ul>
            </div>
            <div class="sap-col sap-cons">
              <h4>Cons</h4>
              <ul class="sap-list">${bad.cons.map((c: string) => `<li><span class='sap-li-icon' style="color:#fbbf24;">⚠️</span><span>${c}</span></li>`).join("")}</ul>
            </div>
          </div>
        </div>
      </div>
      <div class="sap-actions">
        <button data-remove class="sap-btn sap-btn-danger"><span class="sap-btn-icon">🗑️</span>Remove (${removeCost})</button>
        <button data-open-build class="sap-btn sap-btn-primary"><span class="sap-btn-icon">➕</span>Build Good System</button>
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
    const target = ev.target as HTMLElement; if (!target) return;
    const t = target.closest("[data-close],[data-remove],[data-open-build],[data-build]") as HTMLElement | null;
    if (!t) return;
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
