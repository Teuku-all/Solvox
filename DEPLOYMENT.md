# Hosting Solvox

Solvox needs one long-running Node.js web service. That process serves the built frontend, the `/api` endpoints, and Socket.IO multiplayer from the same origin. Deploy the repository as a web service with WebSocket support; a static-only site or serverless function setup will not run multiplayer correctly.

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
- Keep frontend and backend on the same origin. The client uses relative `/api` and `/socket.io` paths; the server already serves all three parts together.
- Do not deploy `frontend/dist` as a separate static site. `npm run build` creates it, and the Node service serves it.

## Deployment check

After deployment, visit `/health`. A healthy response includes `ok: true`, `storage: "writable"`, and `transport: "socket.io"`. Then open the root URL and verify a single-player chapter loads. Test multiplayer with two browsers or devices; both should use the same service URL.
