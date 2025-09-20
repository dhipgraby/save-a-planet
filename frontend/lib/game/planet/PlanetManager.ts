import * as Phaser from "phaser";


export type GetHealthNormalized = () => number; // 0..1

export class PlanetManager {
  private scene: Phaser.Scene;
  private getHealth: GetHealthNormalized;

  private base?: Phaser.GameObjects.Image;
  private overlayA?: Phaser.GameObjects.Image;
  private overlayB?: Phaser.GameObjects.Image;
  private overlayActive?: Phaser.GameObjects.Image;
  private overlayFrame = 0;
  private overlayTimer?: Phaser.Time.TimerEvent;

  private clouds?: Phaser.GameObjects.Image;
  private cloudsBaseAlpha = 0.08;
  private cloudsDamageBoostAlpha = 0.18;
  private cloudsBaseScale = 1;

  private sizePx = 260;

  // Overlay opacity config
  private overlayOpacityMin = 0.15; // at full health
  private overlayOpacityMax = 0.85; // at zero health
  private overlayCurrentOpacity = this.overlayOpacityMin;

  // Animation timing
  private overlayFadeMs = 3000;
  private overlayFrameIntervalMs = 2200;

  constructor(scene: Phaser.Scene, getHealthNormalized: GetHealthNormalized) {
    this.scene = scene;
    this.getHealth = getHealthNormalized;
  }

  init(centerX: number, centerY: number) {
    this.destroy();
    // Base
    this.base = this.scene.add.image(centerX, centerY, "planet_base_hd").setDepth(2).setOrigin(0.5);
    this.base.setScale(this.sizePx / 1280);
    // Clouds (subtle add blend)
    this.clouds = this.scene.add.image(centerX, centerY, "planet_base_hd").setDepth(2.5).setOrigin(0.5);
    this.cloudsBaseScale = this.sizePx / 1280;
    this.clouds.setScale(this.cloudsBaseScale).setAlpha(this.cloudsBaseAlpha).setBlendMode(Phaser.BlendModes.ADD);

    // Overlays
    this.overlayFrame = 0;
    this.applyHealthVisuals();
    this.overlayA = this.scene.add.image(centerX, centerY, "planet_noise_00").setDepth(3).setOrigin(0.5);
    this.overlayA.setScale(this.sizePx / 1024).setAlpha(this.overlayCurrentOpacity);
    this.overlayB = this.scene.add.image(centerX, centerY, "planet_noise_01").setDepth(3).setOrigin(0.5);
    this.overlayB.setScale(this.sizePx / 1024).setAlpha(0);
    this.overlayActive = this.overlayA;

    this.startOverlayAnim(centerX, centerY);
  }

  onResize(width: number, height: number) {
    const cx = width / 2;
    const cy = height / 2;
    const size = Math.floor(Math.min(width, height) * 0.50);
    this.sizePx = Math.max(240, Math.min(640, size));

    if (this.base) this.base.setScale(this.sizePx / 1280).setPosition(cx, cy);
    if (this.overlayA) this.overlayA.setScale(this.sizePx / 1024).setPosition(cx, cy);
    if (this.overlayB) this.overlayB.setScale(this.sizePx / 1024).setPosition(cx, cy);
    if (this.clouds) {
      this.cloudsBaseScale = this.sizePx / 1280;
      this.clouds.setScale(this.cloudsBaseScale).setPosition(cx, cy);
    }
  }

  applyHealthVisuals() {
    const health = Phaser.Math.Clamp(this.getHealth(), 0, 1);
    // Base brightness
    if (this.base) {
      const baseBrightness = 0.75 + (0.25 * health);
      this.base.setTint(Phaser.Display.Color.GetColor(255 * baseBrightness, 255 * baseBrightness, 255 * baseBrightness));
    }
    // Clouds alpha
    if (this.clouds) {
      const damage = 1 - health;
      const targetAlpha = this.cloudsBaseAlpha + damage * (this.cloudsDamageBoostAlpha - this.cloudsBaseAlpha);
      this.clouds.setAlpha(targetAlpha);
    }
    // Overlay opacity from health
    this.overlayCurrentOpacity = this.overlayOpacityMin + (1 - health) * (this.overlayOpacityMax - this.overlayOpacityMin);

    const overlays: Phaser.GameObjects.Image[] = [];
    if (this.overlayA) overlays.push(this.overlayA);
    if (this.overlayB) overlays.push(this.overlayB);

    if (overlays.length) {
      let overlayTint: number = 0xffffff;
      if (health > 0.66) overlayTint = 0xffffff;
      else if (health > 0.33) overlayTint = 0xffc241;
      else overlayTint = 0xff4d4d;
      overlays.forEach(o => o.setTint(overlayTint));
      if (this.overlayActive) this.overlayActive.setAlpha(this.overlayCurrentOpacity);

      // Low health pulse (avoid stacking if fading)
      if (health < 0.33 && this.overlayActive) {
        const activeTweens = this.scene.tweens.getTweensOf(this.overlayActive);
        const hasPulse = activeTweens.some((tw: any) => (tw as any).data?.some?.((d: any) => d.key === "alpha" && d.duration === 1400));
        if (!hasPulse) {
          this.scene.tweens.add({
            targets: this.overlayActive,
            alpha: { from: this.overlayCurrentOpacity * 0.75, to: Math.min(this.overlayCurrentOpacity * 1.15, this.overlayOpacityMax) },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
      }
    }
  }

  private startOverlayAnim(centerX: number, centerY: number) {
    if (this.overlayTimer) this.overlayTimer.remove(false);
    this.overlayTimer = this.scene.time.addEvent({
      delay: this.overlayFrameIntervalMs,
      loop: true,
      callback: () => {
        this.overlayFrame = (this.overlayFrame + 1) % 28;
        const n = this.overlayFrame.toString().padStart(2, "0");
        const outgoing = this.overlayActive;
        const incoming = (outgoing === this.overlayA) ? this.overlayB : this.overlayA;
        if (!incoming || !outgoing) return; // safety guard if destroyed during restart
        this.scene.tweens.killTweensOf(incoming);
        this.scene.tweens.killTweensOf(outgoing);

        incoming
          .setTexture(`planet_noise_${n}`)
          .setPosition(centerX, centerY)
          .setScale(this.sizePx / 1024)
          .setAlpha(0)
          .setDepth(3);

        this.applyHealthVisuals();
        const targetAlpha = this.overlayCurrentOpacity;
        const fadeDur = this.overlayFadeMs;
        this.scene.tweens.add({ targets: incoming, alpha: targetAlpha, duration: fadeDur, ease: "Sine.easeInOut" });
        this.scene.tweens.add({ targets: outgoing, alpha: 0, duration: fadeDur, ease: "Sine.easeInOut" });
        this.overlayActive = incoming;
      }
    });
  }

  getKeepObjects(): Phaser.GameObjects.GameObject[] {
    const arr: Phaser.GameObjects.GameObject[] = [];
    if (this.base) arr.push(this.base);
    if (this.overlayA) arr.push(this.overlayA);
    if (this.overlayB) arr.push(this.overlayB);
    if (this.clouds) arr.push(this.clouds);
    return arr;
  }

  getSizePx() {
    return this.sizePx;
  }

  destroy() {
    if (this.overlayTimer) {
      this.overlayTimer.remove(false); this.overlayTimer = undefined;
    }
    if (this.base) {
      this.base.destroy(); this.base = undefined;
    }
    if (this.overlayA) {
      this.overlayA.destroy(); this.overlayA = undefined;
    }
    if (this.overlayB) {
      this.overlayB.destroy(); this.overlayB = undefined;
    }
    if (this.clouds) {
      this.clouds.destroy(); this.clouds = undefined;
    }
  }
}
