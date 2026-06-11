<script setup lang="ts">
import { ref } from 'vue';
import GifEditorPage from './views/GifEditorPage.vue';

const showGifEditor = ref(false);

const openGifEditor = () => {
  showGifEditor.value = true;
};
</script>

<template>
  <div>
    <div class="titlebar">Cool titlebar</div>
    <div class="app-container">
      <header class="app-header">
        <h1>Electron Vue GIF 编辑器</h1>
        <button @click="openGifEditor" class="main-btn" v-if="!showGifEditor">
          打开 GIF 编辑器
        </button>
      </header>
      
      <main class="app-main">
        <GifEditorPage v-if="showGifEditor" />
        <div v-else class="welcome-screen">
          <h2>欢迎使用 GIF 编辑器</h2>
          <p>这是一个功能强大的 GIF 编辑工具，支持：</p>
          <ul>
            <li>✅ 显示 GIF 基础信息（帧数、大小、尺寸）</li>
            <li>✅ 插入帧和删除帧</li>
            <li>✅ 压缩 GIF 文件</li>
            <li>✅ 调整 GIF 尺寸</li>
            <li>✅ 用户手动上传 GIF</li>
          </ul>
          <p>点击上方按钮开始编辑您的 GIF 文件！</p>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
.titlebar {
  height: 30px;
  background: blue;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-container {
  min-height: calc(100vh - 30px);
  background-color: #f5f5f5;
}

.app-header {
  padding: 20px;
  text-align: center;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  margin: 0 0 20px 0;
  color: #333;
}

.main-btn {
  padding: 12px 24px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.main-btn:hover {
  background-color: #66b1ff;
}

.app-main {
  padding: 20px;
}

.welcome-screen {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  padding: 40px 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.welcome-screen h2 {
  color: #303133;
  margin-bottom: 20px;
}

.welcome-screen p {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}

.welcome-screen ul {
  text-align: left;
  max-width: 400px;
  margin: 20px auto;
  padding-left: 20px;
}

.welcome-screen li {
  margin-bottom: 10px;
  color: #606266;
}
</style>