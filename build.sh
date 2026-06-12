#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== Building Vite + Electron ==="
npx vite build

echo "=== Building installer ==="
case "$(uname -s)" in
  Darwin)  npx electron-builder --mac ;;
  Linux*)  npx electron-builder --linux ;;
  MINGW*|MSYS*) npx electron-builder --win ;;
esac

echo "=== Build complete! ==="
case "$(uname -s)" in
  Darwin) ls dist/mac/*.{dmg,pkg} 2>/dev/null ;;
  Linux*) ls dist/linux/*.AppImage 2>/dev/null ;;
  MINGW*|MSYS*) ls dist/windows/*.exe 2>/dev/null ;;
esac
