# Hosting Solvox

## Recommended setup for Vercel + Render

The Vercel project serves the static frontend. Single-player chapters and answer feedback are bundled from the local question bank, so they work on Vercel without an API service. Run the Node server (API and Socket.IO) as one persistent web service, for example on Render, for multiplayer, dashboard data, and submitted feedback. Multiplayer rooms are held in server memory, so the API and Socket.IO connections must reach the same running server process.

Set the Vercel project's Root Directory to the repository root and its Framework Preset to **Vite**. The root `vercel.json` also pins `framework: "vite"`, builds the frontend workspace, and publishes `frontend/dist`. A **Services** preset without a `services` declaration produces `[MISSING_SERVICES]` before the build starts; this project uses the persistent Render backend instead of Vercel Services.

1. Create a Render web service from this repository using the included `render.yaml` blueprint. Wait until its `/health` endpoint returns `ok: true`.
2. Set `FRONTEND_ORIGIN` on Render to the exact Vercel site origin, such as `https://your-game.vercel.app` (no trailing slash). For preview deployments, include each allowed origin separated by commas.
3. Set these Vercel environment variables to the Render service URL, with no trailing slash:
   - `VITE_API_URL=https://your-game-server.onrender.com`
   - `VITE_SOCKET_URL=https://your-game-server.onrender.com`
4. Redeploy the Vercel frontend so the URLs are included in its build.

Other API calls and Socket.IO default to same-origin paths when these variables are unset, which keeps local development and the single-server deployment working. Single player does not use those API paths. Do not deploy the backend as a Vercel Function or split it across serverless instances: active rooms are process-local.

The included `vercel.json` builds and serves only the frontend. The Render service runs the backend and serves the built app too, so it can also host the entire game by itself if desired.

Multiplayer needs one long-running Node.js web service. That process serves the `/api` endpoints and Socket.IO multiplayer. A static-only Vercel deployment supports single player, but it cannot run multiplayer correctly.

## Deploy commands

Use Node.js 18 or newer and the repository root (the folder containing `package.json`). Configure the host with:

- Install: `npm ci`
- Build: `npm run build`
- Start: `npm start`
- Health check path: `/health`

The host should provide `PORT`; Solvox listens on that port and binds to `0.0.0.0`. Open the service URL after `/health` returns JSON with `"ok": true`.

For a local production run:

```sh
npm ci
npm run build
npm start
```

`npm run start:local` is a convenience command that builds and starts in one step. For development, use `npm run dev`.

## Persistent data

Mount a persistent, writable disk for the service and set `SOLVOX_DATA_DIR` to its absolute mount path. For example, if the host mounts a disk at `/var/data/solvox`, set:

```text
SOLVOX_DATA_DIR=/var/data/solvox
```

The server stores multiplayer match history, evaluation records, and submitted feedback in this directory. It creates the directory on startup and exits with a clear error if it cannot write there. Without a persistent disk, these records may disappear when the host replaces or restarts the instance. Player campaign progress is stored in the player's browser.

## Multiplayer hosting notes

- Keep one running instance. Rooms and active matches are held in memory, so restarting the service ends active rooms.
- Enable WebSocket connections. Socket.IO can fall back to HTTP polling, but a host or proxy that blocks both transports will break multiplayer.
- When the frontend is hosted separately on Vercel, set `VITE_API_URL` and `VITE_SOCKET_URL` to the backend origin. If the Node server serves the built frontend, the client uses relative `/api` and `/socket.io` paths.
- `frontend/dist` can be deployed as a separate static site for single player. Multiplayer still needs the connected backend service.

## Deployment check

After deployment, visit `/health`. A healthy response includes `ok: true`, `storage: "writable"`, and `transport: "socket.io"`. Then open the root URL and verify a single-player chapter loads. Test multiplayer with two browsers or devices; both should use the same service URL.
