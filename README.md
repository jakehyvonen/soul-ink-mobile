# Sigmund PBM Web

Descriptor: mobile React/Phaser controls for painting with Sigmund through a documented native WebSocket contract.

Usage: develop locally with Node 24, build `dist/`, and let the canonical Pi service mount that output at `/pbm/`. The browser never connects directly to a controller or defines physical limits.

## Commands

```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

The development server is loopback-only at `http://127.0.0.1:5171`. It proxies
`/ws` to Sigmund at `http://127.0.0.1:8089` by default, so VS Code development
uses `npm.cmd run dev` in one terminal and
`python -m pi4_debug_gui.server --hardware --pbm-memory --host 127.0.0.1 --port 8089` in
another. Open port `5171` for live Vite changes; opening `/pbm/` on port `8089`
uses the last production build instead. Set `SIGMUND_DEV_URL` before Vite only
when the local backend uses another address. A production build uses relative
asset URLs so the same output works below `/pbm/` or on a static subdomain.

For a one-process local test, run `npm.cmd run build` once, start Sigmund with
`--pbm-memory`, and open `http://127.0.0.1:8089/pbm/`. This mode connects and
moves real hardware; it replaces only PostgreSQL persistence with volatile
run, motif, and gesture recording. The app shows a persistent red warning, and
all volatile painting data disappears when Sigmund exits. Omitting
`--pbm-memory` restores mandatory PostgreSQL persistence.

## Runtime configuration

`public/runtime-config.json` is copied next to the built application and intentionally remains unbundled. It contains only public deployment settings:

```json
{
  "mode": "local",
  "controlUrl": "",
  "machineId": "sigmund-local",
  "auth": "none",
  "supabaseUrl": "",
  "supabasePublishableKey": ""
}
```

An empty local `controlUrl` resolves to `/ws` on the current origin. Remote mode requires `wss://`, `auth: "supabase"`, and a Supabase publishable key. Never place service-role keys, machine credentials, or other secrets in this file.

`runtime-config.remote.example.json` is the public-only template for the gated InMotion deployment. Copy it over `dist/runtime-config.json` only after the remote relay and dedicated Supabase project are approved and provisioned.

## Safety model

- Opening PBM connects read-only. `Begin Painting` explicitly acquires the operator lease and starts one painting session.
- The joystick, phone tilt, pump, and rotary controls send normalized latest values every 53 ms. The Pi owns scaling and clamping.
- Pointer release/cancel, capture loss, blur, page hide, visibility loss, socket loss, lease loss, and session end clear continuous intent. Reconnection starts with no active outputs.
- Syringe, recording, replay, pump, and rotary presentation follows server events. A request acceptance is not shown as physical confirmation.
- `STOP ALL` remains visible above every workflow.

The old `server/` directory is retained only as a Git-history-era protocol reference. No current package script starts its Socket.IO, ngrok, or raw TCP bridge.
