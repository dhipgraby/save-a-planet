import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";

export interface GameOverData {
  tick: number;
  planetHealth: number;
  populationHealth: number;
  installed: Array<{ type: "bad" | "good"; key: string }>;
}

export function showGameOverScreen(scene: Phaser.Scene, data: GameOverData, onRestart: () => void) {
  const cam = scene.cameras.main;
  const width = cam.width;
  const height = cam.height;
  const seconds = data.tick * (gameConfig.tickDurationMs / 1000);
  const score = Math.floor((seconds / 10) * 1 + data.planetHealth / 100 + data.populationHealth);

  // Depth constants (higher than HUD / heal button ~ < 20 earlier)
  const DEPTH_BACKDROP = 400;
  const DEPTH_PANEL = 401;
  const DEPTH_CONTENT = 402;

  // Dark translucent backdrop (clicks blocked underneath)
  const backdrop = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
    .setDepth(DEPTH_BACKDROP)
    .setInteractive();

  // Panel container a bit above bars (shift up ~40px) and slightly higher on tall screens
  const centerYOffset = -40; // raise so bars appear below
  const container = scene.add.container(width / 2, height / 2 + centerYOffset).setDepth(DEPTH_CONTENT);

  // Panel background box with subtle border + glow accent
  const panelW = Math.min(640, width - 80);
  // Increased panel height to fit content comfortably
  const panelH = 560;
  const panel = scene.add.graphics().setDepth(DEPTH_PANEL);
  panel.fillStyle(0x0f172a, 0.72).fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 18);
  panel.lineStyle(2, 0x1e293b, 1).strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 18);
  // top gradient bar accent
  panel.fillGradientStyle(0x1e293b, 0x1e293b, 0x334155, 0x334155, 0.55)
    .fillRect(-panelW / 2 + 2, -panelH / 2 + 2, panelW - 4, 42);
  // soft outer glow using duplicate stroked rects
  for (let i = 0; i < 3; i++) {
    panel.lineStyle(1, 0x38bdf8, 0.12 - i * 0.03).strokeRoundedRect(-panelW / 2 - i, -panelH / 2 - i, panelW + i * 2, panelH + i * 2, 20 + i);
  }

  // Title
  const title = scene.add.text(0, -panelH / 2 + 24, "GAME OVER", {
    fontFamily: "monospace",
    fontSize: "55px",
    color: "#ffffff",
    stroke: "#e04d4dff",
    strokeThickness: 6,
    fontStyle: "bold"
  }).setOrigin(0.5, 0.2);
  scene.tweens.add({ targets: title, alpha: { from: 0.7, to: 1 }, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

  // Score (below title)
  const scoreText = scene.add.text(0, -panelH / 2 + 78, `${score}`, {
    fontFamily: "monospace",
    fontSize: "88px",
    color: "#ffe259",
    stroke: "#e04d4dff",
    strokeThickness: 10,
    fontStyle: "bold"
  }).setOrigin(0.5, 0);
  scene.tweens.add({ targets: scoreText, scale: { from: 0.90, to: 1 }, duration: 1000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

  // WORLD SCORE label
  const scoreLabel = scene.add.text(0, scoreText.y + scoreText.height - 14, "WORLD SCORE", {
    fontFamily: "monospace",
    fontSize: "20px",
    color: "#fcd34d",
    stroke: "#78350f",
    strokeThickness: 3,
    fontStyle: "bold"
  }).setOrigin(0.5, -0.2);

  // Humorous encouragement directly under the score label
  const humor = scene.add.text(0, scoreLabel.y + scoreLabel.height + 6,
    "You did your best. The planet filed a polite “do better” request for next run. 🌱", {
    fontFamily: "monospace",
    fontSize: "16px",
    color: "#facc15",
    align: "center",
    wordWrap: { width: panelW - 120 }
  }).setOrigin(0.5, -0.2);

  // Stats (LEFT aligned now)
  const goodCount = data.installed.filter(s => s.type === "good").length;
  const badCount = data.installed.filter(s => s.type === "bad").length;
  const lines: string[] = [];
  lines.push(`⏱️ Time Survived: ${seconds.toFixed(1)}s`);
  lines.push(`🌍 Planet Health: ${Math.max(0, data.planetHealth).toFixed(0)}/${gameConfig.planet.max}`);
  lines.push(`👥 Population: ${Math.max(0, data.populationHealth).toFixed(0)}/${gameConfig.population.max}`);
  lines.push(`✅ Good Systems Built: ${goodCount}`);
  lines.push(`⚠️ Remaining Bad Systems: ${badCount}`);
  lines.push(`📈 Efficiency Score: ${score}`);

  // Shift stats down to avoid overlapping the centralized score/humor block
  const statsTop = humor.y + humor.height + 28;
  const statsText = scene.add.text(-panelW / 2 + 36, statsTop, lines.join("\n"), {
    fontFamily: "monospace",
    fontSize: "19px",
    lineSpacing: 8,
    color: "#e5e7eb",
    align: "left"
  }).setOrigin(0, 0);

  // Narrative (wrap inside panel width)
  const narrative = computeNarrative(data.planetHealth, data.populationHealth, goodCount, badCount);
  const narrativeText = scene.add.text(-panelW / 2 + 36, statsText.y + statsText.height + 20, narrative, {
    fontFamily: "monospace",
    fontSize: "17px",
    color: "#93c5fd",
    wordWrap: { width: panelW - 72 }
  }).setOrigin(0, 0);

  // Restart button: yellow gradient rounded pill
  const btnW = 200;
  const btnY = panelH / 2 - 50;
  const btnH = 50;
  const grad = scene.add.graphics({ x: -btnW / 2, y: btnY - btnH / 2 }).setDepth(DEPTH_CONTENT).setInteractive(new Phaser.Geom.Rectangle(0, 0, btnW, btnH), Phaser.Geom.Rectangle.Contains);
  const drawButton = (hover = false) => {
    grad.clear();
    const top = hover ? 0xfde047 : 0xfcd34d;
    const bottom = hover ? 0xfbbf24 : 0xf59e0b;
    const radius = 24;
    // gradient simulation with two stacked rounded rects (outer then inner)
    grad.fillStyle(bottom, 1).fillRoundedRect(0, 0, btnW, btnH, radius);
    grad.fillStyle(top, 1).fillRoundedRect(0, 0, btnW, btnH - 4, radius);
    grad.lineStyle(2, hover ? 0xfacc15 : 0xd97706, 1).strokeRoundedRect(0, 0, btnW, btnH, radius);
    grad.setAlpha(0.96);
  };
  drawButton();
  const btnLabel = scene.add.text(0, btnY, "RESTART", {
    fontFamily: "monospace",
    fontSize: "24px",
    color: "#1f1300",
    fontStyle: "bold",
    stroke: "#ffffff",
    strokeThickness: 2
  }).setOrigin(0.5);
  grad.on("pointerover", () => {
    drawButton(true); btnLabel.setScale(1.04);
  });
  grad.on("pointerout", () => {
    drawButton(false); btnLabel.setScale(1);
  });
  grad.on("pointerdown", () => {
    grad.disableInteractive(); cleanup(); onRestart();
  });

  container.add([panel, title, scoreText, scoreLabel, humor, statsText, narrativeText, grad, btnLabel]);

  function cleanup() {
    backdrop.destroy();
    container.destroy();
  }
}

function computeNarrative(planet: number, pop: number, good: number, bad: number): string {
  if (planet <= 0 && pop <= 0) return "Both the planet and civilization collapsed. A stark lesson in delayed action.";
  if (planet <= 0) return "Civilization endured briefly, but the planet ecosystem failed. Balance came too late.";
  if (pop <= 0) return "The planet survives, but society dwindled. Sustainability needs people to champion it.";
  if (good > bad * 2) return "You built a strong foundation of sustainable systems—future generations may yet thrive.";
  if (good > bad) return "Progress was made, but lingering harmful systems held back recovery.";
  if (bad > good * 2) return "Extraction and damage outweighed restoration—turning point missed.";
  return "A fragile balance was maintained, but momentum faded before true recovery.";
}
