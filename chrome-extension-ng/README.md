# ZTE-Web-Script-NG — Chrome Extension

A Chrome/Chromium extension that auto-injects [`zte-script-ng.js`](../ng/zte-script-ng.js)
into your ZTE router's admin page, so you no longer have to paste it into the
DevTools console every time.

**For ZTE G5TC and later models** (the NG / rewritten script). For older routers
(MC7010, MC888, MC889, …) use the `legacy/` script instead.

## Install (Load unpacked)

1. Open `chrome://extensions` in Chrome/Edge/Brave/any Chromium browser.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this `chrome-extension-ng/` folder.
4. Open your router admin page (e.g. `http://192.168.0.1`). The control panel
   appears automatically once you're logged in — no console paste needed.

> The extension stays installed across browser restarts. You can disable it
> anytime from `chrome://extensions`.

## What it matches

The extension only runs on common router admin IPs (both `http` and `https`):

`192.168.0.1`, `192.168.1.1`, `192.168.2.1`, `192.168.3.1`, `192.168.4.1`,
`192.168.5.1`, `192.168.254.1`

If your router uses a different IP, add it to the `matches` array in
[`manifest.json`](./manifest.json) and reload the extension.

## How it works

`manifest.json` registers `zte-script-ng.js` as a content script that runs in the
page's **MAIN world** (`"world": "MAIN"`). That makes it behave identically to
pasting the script into the DevTools console — same page context, same cookies,
same `fetch("/ubus/")` calls. The script needs no special permissions, no jQuery,
and no Greasemonkey APIs.

## Updating the script

`zte-script-ng.js` here is a copy of `../ng/zte-script-ng.js`. After pulling new
upstream changes, refresh the copy and reload the extension:

```sh
./update.sh
```

Then click the reload icon on the extension's card in `chrome://extensions`.
