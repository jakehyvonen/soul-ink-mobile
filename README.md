# Soul Ink Mobile

Descriptor: shared React and Phaser controls for painting with Sigmund through the bounded Pi WebSocket contract.

Usage: pin this repository from both SoulInk and `dev-raspi`, build with Node 24, and serve the same revision at Studio `/mobile/`, Studio `/de/mobile/`, and Pi-local `/mobile/`. `/pbm/` remains a temporary redirect alias during migration.

## Commands

```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

The development server is loopback-only at `http://127.0.0.1:5171`. It proxies `/ws` to `http://127.0.0.1:8089` by default. The Pi-local build uses the unbundled `public/runtime-config.json`, connects read-only, and preserves explicit local operator handoff for the existing fallback workflow.

## Studio pairing

The Studio build replaces `dist/runtime-config.json` with the public values from `runtime-config.remote.example.json`. Its `auth: "pairing"` flow:

1. removes `#pair=...` from browser history before making a request;
2. claims the single-use token through the same-origin Studio API;
3. receives a short-lived WebSocket admission while the durable controller credential stays in a Secure, HttpOnly cookie;
4. stores only the public control-session ID in session storage; and
5. requests a fresh single-use admission after a safe reconnect.

No Supabase token, pairing secret, gateway secret, or Pi credential belongs in the browser bundle or runtime configuration.

## Safety model

- Opening Soul Ink Mobile connects read-only. `Begin Painting` is the only path that requests an operator lease.
- Studio mode always sends `local_handoff: false`; it cannot preempt a local or remote operator.
- The joystick, phone tilt, pump, and rotary controls send normalized latest values every 53 ms. The Pi owns scaling, limits, arbitration, and device authority.
- Pointer release or cancel, capture loss, blur, page hide, visibility loss, socket loss, lease loss, host suspension, and session end neutralize continuous intent.
- Reconnection starts with no active outputs and requires the user to select `Begin Painting` again before controls become live.
- `STOP ALL` remains visible above every workflow. Raw controller, maintenance, homing, calibration, settings, reconnect, and stop-clearing ports are never exposed through the Studio gateway.

The historical `server/` directory is retained only as a protocol reference. No package script starts its Socket.IO, ngrok, or raw TCP bridge. Existing `pbm` database and machine-event domain names remain compatibility contracts until a separately validated migration.
