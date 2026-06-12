<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import GifEditorPage from "./views/GifEditorPage.vue";

const isMaximized = ref(false);

const minimize = () => window.electronAPI?.minimize();
const toggleMaximize = () => {
  window.electronAPI?.maximize();
  isMaximized.value = !isMaximized.value;
};
const closeWin = () => window.electronAPI?.close();

onMounted(async () => {
  if (window.electronAPI) {
    isMaximized.value = await window.electronAPI.isMaximized();
    window.electronAPI.onMaximizeChange((max: boolean) => {
      isMaximized.value = max;
    });
  }
});
</script>

<template>
  <div class="app-shell">
    <div class="titlebar">
      <!-- 红绿灯 -->
      <div class="traffic-lights">
        <button class="tl-btn close" @click="closeWin">
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          >
            <line x1="3" y1="3" x2="9" y2="9" />
            <line x1="9" y1="3" x2="3" y2="9" />
          </svg>
        </button>
        <button class="tl-btn minimize" @click="minimize">
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          >
            <line x1="3" y1="6" x2="9" y2="6" />
          </svg>
        </button>
        <button class="tl-btn maximize" @click="toggleMaximize">
          <svg
            v-if="!isMaximized"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          >
            <rect x="2" y="2" width="8" height="8" rx="1" />
          </svg>
          <svg
            v-else
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          >
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <line x1="1" y1="1" x2="3" y2="3" />
            <line x1="11" y1="11" x2="9" y2="9" />
            <line x1="1" y1="11" x2="3" y2="9" />
            <line x1="11" y1="1" x2="9" y2="3" />
          </svg>
        </button>
      </div>
      <!-- 标题 -->
      <div class="titlebar-title">
        <svg
          class="titlebar-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
        </svg>
        <span class="titlebar-text">GIF 工具箱</span>
      </div>
    </div>
    <div class="app-body">
      <GifEditorPage />
    </div>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background: transparent;
  color: #1d1d1f;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-radius: 0;
  overflow: hidden;
  /* Slightly darker, more opaque background for the whole window */
  background: rgba(220, 220, 228, 0.82);
  backdrop-filter: blur(60px) saturate(200%);
  -webkit-backdrop-filter: blur(60px) saturate(200%);
}

/* ====== Titlebar: macOS-style distinct header region ====== */
.titlebar {
  height: 40px;
  min-height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  position: relative;
  /* Slightly different tone so it reads as a header */
  background: rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(60px);
  -webkit-backdrop-filter: blur(60px);
  -webkit-app-region: drag;
  user-select: none;
  /* Subtle bottom border to separate from content */
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
}

/* Traffic lights (red/yellow/green) */
.traffic-lights {
  display: flex;
  gap: 8px;
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  -webkit-app-region: no-drag;
  z-index: 2;
}

.tl-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s;
}
.tl-btn.close {
  background: #ff5f57;
}
.tl-btn.minimize {
  background: #febc2e;
}
.tl-btn.maximize {
  background: #28c840;
}
.tl-btn svg {
  opacity: 0;
  transition: opacity 0.15s;
  width: 6px;
  height: 6px;
  color: rgba(0, 0, 0, 0.55);
}
.traffic-lights:hover .tl-btn svg {
  opacity: 1;
}

/* Title text — centered, draggable */
.titlebar-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 6px;
  -webkit-app-region: drag;
}
.titlebar-icon {
  width: 15px;
  height: 15px;
  color: rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}
.titlebar-text {
  color: rgba(0, 0, 0, 0.6);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

/* Content area */
.app-body {
  flex: 1;
  overflow-y: auto;
  -webkit-app-region: no-drag;
}

/* Custom scrollbar */
.app-body::-webkit-scrollbar {
  width: 6px;
}
.app-body::-webkit-scrollbar-track {
  background: transparent;
}
.app-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 3px;
}
.app-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>
