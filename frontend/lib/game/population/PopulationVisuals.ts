import * as Phaser from "phaser";

/**
 * PopulationVisuals
 * Renders a small crowd of animated "alien" people to the right side of the planet.
 * The number of on‑screen individuals scales with populationHealth (capped) and
 * they gently wander horizontally + subtle bobbing. When population grows we fade
 * new individuals in; when it shrinks we randomly pick extras to fade out.
 */
export class PopulationVisuals {
  private scene: Phaser.Scene;
  private getPopulation: () => number; // returns populationHealth (0..max)
  private getPlanetSize: () => number; // returns current planet size (px)
  private container: Phaser.GameObjects.Container;
  private people: AlienDude[] = [];
  private lastTargetCount = 0;

  // Tunables
  private readonly maxPeople = 600; // higher cap to allow near 1:1 representation (tune for perf)
  private readonly peoplePerPop = 1; // 1:1 mapping; each population point -> one character (capped)
  private readonly spawnFadeMs = 450;
  private readonly deathFadeMs = 500;
  private readonly wanderWidth = 360; // increased horizontal wandering span for more spacing
  private readonly baseOffsetX = 260; // further to right of planet centre
  private readonly verticalSpread = 190; // more vertical variation

  // Animation timing
  private readonly walkFrameMs = 360; // swap walk1/walk2

  // Available color variants (must match preload keys in MainScene)
  private readonly colors = ["Beige", "Blue", "Green", "Pink", "Yellow"];

  constructor(scene: Phaser.Scene, getPopulation: () => number, getPlanetSize: () => number) {
    this.scene = scene;
    this.getPopulation = getPopulation;
    this.getPlanetSize = getPlanetSize;
    this.container = scene.add.container(0, 0).setDepth(6); // above planet & overlays
  }

  // Call every world build and after population changes
  public sync() {
    const pop = Math.max(0, Math.floor(this.getPopulation()));
    const target = Math.min(this.maxPeople, pop); // 1:1 up to cap
    if (target > this.people.length) {
      for (let i = this.people.length; i < target; i++) this.spawnOne();
    } else if (target < this.people.length) {
      // choose excess people to remove randomly
      Phaser.Utils.Array.Shuffle(this.people)
        .slice(0, this.people.length - target)
        .forEach(p => this.killOne(p));
      // keep only survivors
      this.people = this.people.filter(p => !p.markedForRemoval);
    }
    this.lastTargetCount = target;
    this.layout();
  }

  private spawnOne() {
    const color = Phaser.Utils.Array.GetRandom(this.colors);
    const standKey = `alien${color}_stand`;
    const walk1Key = `alien${color}_walk1`;
    const walk2Key = `alien${color}_walk2`;
    const sprite = this.scene.add.image(0, 0, standKey).setAlpha(0).setOrigin(0.5, 1);
    sprite.setScale(0.5); // reduce size
    const dude: AlienDude = {
      sprite,
      color,
      standKey,
      walk1Key,
      walk2Key,
      nextFrameAt: this.scene.time.now + Phaser.Math.Between(this.walkFrameMs / 2, this.walkFrameMs * 1.5),
      walking: false,
      vx: 0,
      targetX: 0,
      // baseY0 is the original unscaled vertical anchor; baseY is the current (possibly density-scaled) anchor
      baseY0: Phaser.Math.Between(-this.verticalSpread / 2, this.verticalSpread / 2),
      baseY: 0,
      markedForRemoval: false
    };
    this.people.push(dude);
    this.container.add(sprite);
    // fade in
    this.scene.tweens.add({ targets: sprite, alpha: 1, duration: this.spawnFadeMs, ease: "Sine.easeOut" });
    // Initial y set in first layout() (after scaling); keep sprite at 0 until then (invisible anyway due to alpha tween start)
    this.assignNewTarget(dude, true);
  }

  private killOne(dude: AlienDude) {
    if (dude.markedForRemoval) return;
    dude.markedForRemoval = true;
    this.scene.tweens.add({
      targets: dude.sprite,
      alpha: 0,
      duration: this.deathFadeMs,
      ease: "Sine.easeIn",
      onComplete: () => {
        dude.sprite.destroy();
      }
    });
  }

  private assignNewTarget(d: AlienDude, immediate = false) {
    // horizontal wandering around 0..wanderWidth (later offset to right of planet)
    d.targetX = Phaser.Math.Between(-this.wanderWidth / 2, this.wanderWidth / 2);
    // Slightly slower wander when we have very large crowds to reduce churn
    const densityFactor = Phaser.Math.Clamp(this.people.length / 400, 0, 1); // 0..1
    const baseSpeed = Phaser.Math.FloatBetween(18, 34);
    const speed = Phaser.Math.Linear(baseSpeed, baseSpeed * 0.55, densityFactor);
    d.vx = speed * (d.targetX < d.sprite.x ? -1 : 1); // px/sec
    d.walking = true;
    if (immediate) d.sprite.x = d.targetX; // spawn without sliding (optional: comment to have slide)
  }

  // Re-layout relative to planet size (call on resize + sync)
  public layout() {
    const cam = this.scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const planetSize = this.getPlanetSize();
    const offsetX = planetSize / 2 + this.baseOffsetX * (planetSize / 400); // scale offset relative to planet size
    // For large populations, push crowd slightly further out & down for readability
    const crowdSize = this.people.length;
    const outwardShift = Phaser.Math.Linear(0, 40, Phaser.Math.Clamp(crowdSize / 500, 0, 1));
    const downwardShift = Phaser.Math.Linear(planetSize * 0.07, planetSize * 0.11, Phaser.Math.Clamp(crowdSize / 500, 0, 1));
    this.container.setPosition(cx + offsetX + outwardShift, cy + downwardShift);
    // Scale previously assigned baseY0 (never re-randomised) so the vertical distribution smoothly compresses with density
    const density = Phaser.Math.Clamp(this.people.length / 500, 0, 1);
    const effectiveSpread = Phaser.Math.Linear(this.verticalSpread, this.verticalSpread * 0.65, density);
    const scale = effectiveSpread / this.verticalSpread;
    this.people.forEach(p => {
      p.baseY = p.baseY0 * scale;
      p.sprite.y = p.baseY;
    });
  }

  public update(dt: number) {
    // If container or scene no longer active (during restart), skip
    if (!this.container.active || !(this.scene as any).sys || (this.scene as any).sys.isDestroyed) return;
    const now = this.scene.time.now;
    for (const p of this.people) {
      if (p.markedForRemoval) continue;
      const sprite = p.sprite;
      if (!sprite || !sprite.scene || (sprite as any).destroyed) continue;
      // movement
      if (p.walking) {
        const dir = Math.sign(p.vx);
        sprite.x += (p.vx * dt) / 1000;
        if ((dir < 0 && sprite.x <= p.targetX) || (dir > 0 && sprite.x >= p.targetX)) {
          sprite.x = p.targetX;
          p.walking = false;
          p.nextFrameAt = now + Phaser.Math.Between(800, 2000);
          if (this.scene.textures.exists(p.standKey)) {
            try {
              sprite.setTexture(p.standKey);
            } catch { /* ignore if destroyed mid-call */ }
          }
          this.scene.time.delayedCall(Phaser.Math.Between(800, 2200), () => this.assignNewTarget(p));
        }
      }
      // frame swap
      if (now >= p.nextFrameAt) {
        if (p.walking) {
          if (sprite.texture && sprite.texture.key) {
            const current = sprite.texture.key;
            const nextKey = current === p.walk1Key ? p.walk2Key : p.walk1Key;
            const useKey = this.scene.textures.exists(nextKey) ? nextKey : (this.scene.textures.exists(p.walk1Key) ? p.walk1Key : null);
            if (useKey) {
              try {
                sprite.setTexture(useKey);
              } catch { /* safe ignore */ }
            }
          }
          p.nextFrameAt = now + this.walkFrameMs;
        } else {
          p.nextFrameAt = now + Phaser.Math.Between(400, 900);
        }
      }
      // bobbing
      if (p.walking) {
        sprite.y = p.baseY + Math.sin(now / 260 + sprite.x * 0.05) * 4;
        sprite.setFlipX(p.vx < 0);
      } else {
        sprite.y = p.baseY + Math.sin(now / 900 + sprite.x * 0.08) * 2;
      }
    }
  }

  // Explicit cleanup to call before scene restart to avoid update after destroy
  public destroy() {
    this.people.forEach(p => {
      if (p.sprite && p.sprite.scene) p.sprite.destroy();
    });
    this.people = [];
    if (this.container && this.container.scene) this.container.destroy();
  }
}

interface AlienDude {
    sprite: Phaser.GameObjects.Image;
    color: string;
    standKey: string;
    walk1Key: string;
    walk2Key: string;
    nextFrameAt: number;
    walking: boolean;
    vx: number; // horizontal velocity
    targetX: number;
    baseY0: number; // original anchor before scaling
    baseY: number;
    markedForRemoval: boolean;
}
