<p align="center">
	<img src="https://save-a-planet.vercel.app/game/logo.png" alt="Save a Planet" width="200" />
</p>

<h1 align="center">Save a Planet</h1>

<p align="center">
	A browser strategy game that turns climate trade‑offs into hands‑on learning.
	<br/>
	Built with Next.js, Phaser, and AI agents under human direction for the <strong>Tech for Social Good</strong> hackathon.
</p>

---

## 🔗 Quick links
- ▶ Game (dev): Next.js app runs at `/` (the game is the default route)
- 📚 Docs: `frontend/docs/GAME_ARCHITECTURE.md`
- 📝 Submission summary: `HACKATHON_OVERVIEW.md`

## ✨ Features
- 🌍 Planet & society simulation — balance resource income with planetary impact
- 🏭 Harmful vs. sustainable systems — replace Oil/Coal/Deforestation with Solar/Wind/Sustainable Farm/Reforestation
- 💖 Heal action — recover +10% planet health on a cooldown for clutch saves
- 📊 Clear feedback — HUD shows damage/sec, required income, and consumption cycles
- 🎵 Ambient music with a convenient in‑game mute toggle

## 🎮 How it plays (at a glance)
- Planet Health declines each second due to base decay and your installed systems.
- Population Health grows or shrinks based on whether income per second meets needs.
- Earn resources from systems and invest in sustainable ones to stabilize the planet.
- When either Planet or Population hits 0 → Game Over with score and a narrative.

## 🧰 Tech stack
- ⚛️ Next.js 14 (App Router)
- 🎮 Phaser for the game loop and visuals
- 🎨 Tailwind CSS for UI styling
- 🟦 TypeScript end‑to‑end
- 🔐 NextAuth v5 (game is public; auth flows are set up for dashboards)

## 🚀 Run locally
- Use the provided VS Code tasks to start the frontend (port 3030). The game loads at `/`.
- Backend microservices (auth/users) exist, but are not required to play.

## 🤖 AI disclosure
This project was produced with AI agents as co‑developers. A senior developer acted as the director—defining scope, reviewing outputs, and integrating components. Most of the code was authored by AI to demonstrate an AI‑powered approach to climate education.

---

If you’re reviewing for the hackathon, start at `HACKATHON_OVERVIEW.md` for a concise 1‑page summary and video outline.
