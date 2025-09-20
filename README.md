# Save a Planet

A browser strategy game that turns climate trade-offs into hands-on learning. Built with Next.js, Phaser, and significant AI assistance under human direction for the Tech for Social Good hackathon.

- Live dev: Next.js app at `/` (game is the default route)
- Auth: NextAuth v5 (dashboard and auth flows present, game is public)

## Quick start

- Frontend dev task: already configured in VS Code tasks to run on port 3030.
- Backend microservices (auth/users): available but not required to play the game.

## Gameplay at a glance
- Planet Health declines due to base decay and installed systems; heal gives +10% on a cooldown.
- Population Health depends on whether income per second meets needs; it grows if well-funded and shrinks otherwise.
- Replace harmful systems (Oil/Coal/Deforestation) with sustainable ones (Solar/Wind/Sustainable Farm/Reforestation) to stabilize.

See `frontend/docs/GAME_ARCHITECTURE.md` and `HACKATHON_OVERVIEW.md` for mechanics and submission-ready overview.

## AI disclosure
This project was produced with AI agents as co-developers. A senior developer directed scope, reviewed outputs, and integrated components; most of the code was authored by AI to demonstrate an AI-powered approach to climate education.
