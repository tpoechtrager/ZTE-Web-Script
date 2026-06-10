#!/bin/sh
# Refresh the bundled content script from the canonical source in ../ng/.
# Run this after pulling new upstream changes, then reload the extension
# at chrome://extensions (click the reload icon on the ZTE-Web-Script-NG card).
set -e
cd "$(dirname "$0")"
cp ../ng/zte-script-ng.js ./zte-script-ng.js
echo "Updated zte-script-ng.js from ../ng/zte-script-ng.js"
