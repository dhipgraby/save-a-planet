import * as Phaser from "phaser";
import { introSlides } from "./introSlides";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import IntroSequencePanel from "@/components/game/IntroSequencePanel";
import WelcomeIntroPanel from "@/components/game/WelcomeIntroPanel";

export interface IntroSequenceOptions {
  onComplete: () => void;
  onSkipToEnd?: () => void; // when user hits skip (jumps to final slide)
}

// Encapsulates the animated educational intro sequence.
export class IntroSequence {
  private scene: Phaser.Scene;
  private dom: Phaser.GameObjects.DOMElement | null = null;
  private active = false;
  private slideIndex = 0;
  private atWelcome = true;
  private readonly opts: IntroSequenceOptions;
  private root: Root | null = null;
  private centerStabilizer?: Phaser.Time.TimerEvent;
  private readonly welcomeXOffset: number = 24; // subtle push to the right for the welcome screen only

  constructor(scene: Phaser.Scene, opts: IntroSequenceOptions) {
    this.scene = scene;
    this.opts = opts;
  }

  isActive() {
    return this.active;
  }
  destroy() {
    if (this.root) {
      try {
        this.root.unmount();
      } catch (err) {
        console.log("Failed to unmount intro React root", err);
      }
      this.root = null;
    }
    if (this.dom) {
      this.dom.destroy(); this.dom = null;
    }
    // Stop any stabilizer timer and listeners
    if (this.centerStabilizer) {
      try {
        this.centerStabilizer.destroy();
      } catch (err) {
        console.log("Failed to destroy center stabilizer", err);
      }
      this.centerStabilizer = undefined;
    }
    try {
      this.scene.scale.off("resize", this.recenter, this);
    } catch (err) {
      console.warn("Failed to remove resize listener for intro sequence", err);
    }
    try {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.recenter, this);
    } catch {
      console.log("Failed to remove update listener");
    }
    this.active = false;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.slideIndex = 0;
    this.atWelcome = true;
    this.render();
  }

  private mountReact(panelWidth: number, panelHeight: number) {
    const cam = this.scene.cameras.main;
    const cx = cam.centerX + (this.atWelcome ? this.welcomeXOffset : 0);
    const cy = cam.centerY;
    const container = document.createElement("div");
    container.style.width = `${panelWidth}px`;
    container.style.maxWidth = "100%";
    container.style.maxHeight = `${panelHeight}px`;
    container.style.pointerEvents = "auto";
    const root: Root = createRoot(container);
    this.root = root;
    const dom = this.scene.add.dom(cx, cy, container).setOrigin(0.5, 0.5).setDepth(40);
    this.dom = dom;
    const onNext = () => {
      if (this.atWelcome) {
        this.atWelcome = false;
        this.updateReact(panelWidth, panelHeight);
        return;
      }
      if (this.slideIndex < introSlides.length - 1) {
        this.slideIndex++;
        this.updateReact(panelWidth, panelHeight);
      } else {
        this.destroy();
        this.opts.onComplete();
      }
    };
    const onSkip = () => {
      if (this.atWelcome) {
        // Skip intro entirely from welcome
        this.atWelcome = false;
        this.slideIndex = introSlides.length - 1;
        this.opts.onSkipToEnd?.();
        this.updateReact(panelWidth, panelHeight);
        return;
      }
      this.slideIndex = introSlides.length - 1;
      this.opts.onSkipToEnd?.();
      this.updateReact(panelWidth, panelHeight);
    };
    root.render(this.atWelcome
      ? React.createElement(WelcomeIntroPanel, { onStart: onNext, onSkip })
      : React.createElement(IntroSequencePanel, { slides: introSlides, index: this.slideIndex, onNext, onSkip })
    );
    // Recompute size after mount to ensure perfect centering
    requestAnimationFrame(() => {
      try {
        dom.updateSize();
      } catch (err) {
        console.warn("Failed to update DOM size during mount", err);
      }
      const cam2 = this.scene.cameras.main;
      const offX = this.atWelcome ? this.welcomeXOffset : 0;
      dom.setPosition(cam2.centerX + offX, cam2.centerY);
    });
    dom.on("destroy", () => {
      try {
        root.unmount();
      } catch (err) {
        console.warn("Failed to unmount React root during DOM destroy handler", err);
      }
    });
    // Also keep centered if camera resizes during intro
    this.scene.scale.on("resize", this.recenter, this);
    // Recenter once the scene starts updating and for a few frames thereafter
    this.scene.events.once(Phaser.Scenes.Events.UPDATE, this.recenter, this);
    this.startCenterStabilizer();
  }

  private updateReact(panelWidth: number, panelHeight: number) {
    if (!this.root || !this.dom) return;
    const onNext = () => {
      if (this.atWelcome) {
        this.atWelcome = false;
        this.updateReact(panelWidth, panelHeight);
        return;
      }
      if (this.slideIndex < introSlides.length - 1) {
        this.slideIndex++;
        this.updateReact(panelWidth, panelHeight);
      } else {
        this.destroy();
        this.opts.onComplete();
      }
    };
    const onSkip = () => {
      if (this.atWelcome) {
        this.atWelcome = false;
        this.slideIndex = introSlides.length - 1;
        this.opts.onSkipToEnd?.();
        this.updateReact(panelWidth, panelHeight);
        return;
      }
      this.slideIndex = introSlides.length - 1;
      this.opts.onSkipToEnd?.();
      this.updateReact(panelWidth, panelHeight);
    };
    this.root.render(this.atWelcome
      ? React.createElement(WelcomeIntroPanel, { onStart: onNext, onSkip })
      : React.createElement(IntroSequencePanel, { slides: introSlides, index: this.slideIndex, onNext, onSkip })
    );
    // After re-render, recenter based on updated content size
    const dom = this.dom;
    if (dom) {
      requestAnimationFrame(() => {
        try {
          dom.updateSize();
        } catch (err) {
          console.warn("Failed to update DOM size during updateReact", err);
        }
        const cam2 = this.scene.cameras.main;
        const offX = this.atWelcome ? this.welcomeXOffset : 0;
        dom.setPosition(cam2.centerX + offX, cam2.centerY);
      });
    }
  }

  private recenter = () => {
    if (!this.dom) return;
    const cam = this.scene.cameras.main;
    try {
      this.dom.updateSize();
    } catch (err) {
      console.warn("Failed to update DOM size while recentering", err);
    }
    const offX = this.atWelcome ? this.welcomeXOffset : 0;
    this.dom.setPosition(cam.centerX + offX, cam.centerY);
  };

  private startCenterStabilizer() {
    // During initial layout/asset load, sizes may change for a few frames.
    // Nudge center a handful of times to avoid first-frame mis-centering.
    if (this.centerStabilizer) {
      try {
        this.centerStabilizer.destroy();
      } catch (err) {
        console.warn("Failed to destroy existing center stabilizer", err);
      }
    }
    this.centerStabilizer = this.scene.time.addEvent({
      delay: 60,
      repeat: 8, // run ~9 times over ~540ms
      callback: () => this.recenter()
    });
  }

  private render() {
    const cam = this.scene.cameras.main;
    const panelWidth = Math.min(960, Math.max(340, cam.width - 40));
    const panelHeight = Math.min(700, Math.max(300, cam.height - 80));
    if (this.dom) {
      try {
        this.dom.destroy();
      } catch (err) {
        console.warn("Failed to destroy existing DOM element before re-mount", err);
      }
      this.dom = null;
    }
    this.mountReact(panelWidth, panelHeight);
  }

}
