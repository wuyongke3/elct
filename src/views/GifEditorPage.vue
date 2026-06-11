<template>
  <div class="gif-editor-container">
    <h1>GIF 编辑器</h1>
    
    <!-- 文件上传区域 -->
    <div class="upload-section">
      <div 
        class="drop-zone" 
        @dragover.prevent="handleDragOver" 
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <div v-if="!gifFile" class="drop-zone-content">
          <p>拖拽 GIF 文件到这里或点击上传</p>
          <button class="btn-primary">选择文件</button>
        </div>
        <div v-else class="file-info">
          <p><strong>文件名:</strong> {{ gifFile.name }}</p>
          <p><strong>大小:</strong> {{ formatFileSize(gifFile.size) }}</p>
          <button @click="resetEditor" class="btn-secondary">更换文件</button>
        </div>
      </div>
      <input 
        type="file" 
        ref="fileInputRef" 
        @change="handleFileSelect" 
        accept=".gif,image/gif" 
        style="display: none;" 
      />
    </div>

    <!-- GIF 预览 -->
    <div v-if="gifFile" class="preview-section">
      <h2>GIF 预览</h2>
      <div class="preview-container">
        <img :src="gifPreviewUrl" alt="GIF 预览" class="gif-preview" />
        <div class="gif-info">
          <p v-if="gifInfo"><strong>尺寸:</strong> {{ gifInfo.width }} x {{ gifInfo.height }} px</p>
          <p v-if="gifInfo"><strong>帧数:</strong> {{ gifInfo.frameCount }}</p>
          <p v-if="gifFile"><strong>文件大小:</strong> {{ formatFileSize(gifFile.size) }}</p>
        </div>
      </div>
    </div>

    <!-- 编辑工具栏 -->
    <div v-if="gifFile" class="editor-section">
      <h2>编辑工具</h2>
      
      <div class="tools-grid">
        <!-- 插入帧 -->
        <div class="tool-card">
          <h3>插入帧</h3>
          <p>在指定位置插入帧</p>
          <div class="tool-controls">
            <label>插入位置:</label>
            <input 
              v-model.number="insertFrameIndex" 
              type="number" 
              min="0" 
              :max="gifInfo ? gifInfo.frameCount : 0" 
              class="input-small"
            />
            <button @click="insertFrame" class="btn-action">插入帧</button>
          </div>
        </div>

        <!-- 删除帧 -->
        <div class="tool-card">
          <h3>删除帧</h3>
          <p>删除指定位置的帧</p>
          <div class="tool-controls">
            <label>删除位置:</label>
            <input 
              v-model.number="deleteFrameIndex" 
              type="number" 
              min="0" 
              :max="gifInfo ? gifInfo.frameCount - 1 : 0" 
              class="input-small"
            />
            <button @click="deleteFrame" class="btn-action btn-danger">删除帧</button>
          </div>
        </div>

        <!-- 压缩 -->
        <div class="tool-card">
          <h3>压缩</h3>
          <p>减小 GIF 文件大小</p>
          <div class="tool-controls">
            <label>压缩级别:</label>
            <select v-model="compressionLevel" class="input-medium">
              <option value="O1">低 (O1)</option>
              <option value="O2">中 (O2)</option>
              <option value="O3">高 (O3)</option>
            </select>
            <label>质量损失:</label>
            <input 
              v-model.number="lossyValue" 
              type="number" 
              min="1" 
              max="200" 
              placeholder="1-200" 
              class="input-small"
            />
            <button @click="compressGif" class="btn-action">压缩</button>
          </div>
        </div>

        <!-- 调整尺寸 -->
        <div class="tool-card">
          <h3>调整尺寸</h3>
          <p>改变 GIF 图片尺寸</p>
          <div class="tool-controls">
            <label>宽度:</label>
            <input 
              v-model.number="newWidth" 
              type="number" 
              min="10" 
              :placeholder="gifInfo ? String(gifInfo.width) : '宽度'" 
              class="input-small"
            />
            <label>高度:</label>
            <input 
              v-model.number="newHeight" 
              type="number" 
              min="10" 
              :placeholder="gifInfo ? String(gifInfo.height) : '高度'" 
              class="input-small"
            />
            <button @click="resizeGif" class="btn-action">调整尺寸</button>
          </div>
        </div>
        
        <!-- 其他功能 -->
        <div class="tool-card">
          <h3>其他功能</h3>
          <p>旋转、裁剪等</p>
          <div class="tool-controls">
            <label>旋转角度:</label>
            <select v-model="rotationAngle" class="input-medium">
              <option value="">无</option>
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
            <button @click="rotateGif" class="btn-action">旋转</button>
            
            <div class="crop-controls" v-if="showCropControls">
              <label>裁剪X:</label>
              <input v-model.number="cropX" type="number" min="0" class="input-small" />
              <label>裁剪Y:</label>
              <input v-model.number="cropY" type="number" min="0" class="input-small" />
              <label>宽度:</label>
              <input v-model.number="cropWidth" type="number" min="10" class="input-small" />
              <label>高度:</label>
              <input v-model.number="cropHeight" type="number" min="10" class="input-small" />
              <button @click="cropGif" class="btn-action">裁剪</button>
            </div>
            <button @click="toggleCropControls" class="btn-action btn-secondary">
              {{ showCropControls ? '隐藏裁剪' : '显示裁剪' }}
            </button>
          </div>
        </div>
        
        <!-- 下载 -->
        <div class="tool-card">
          <h3>保存</h3>
          <p>下载编辑后的GIF</p>
          <div class="tool-controls">
            <button @click="downloadGif" class="btn-action btn-success">下载 GIF</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 处理进度指示器 -->
    <div v-if="processing" class="processing-overlay">
      <div class="processing-content">
        <div class="spinner"></div>
        <p>{{ processingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
// 修复导入路径
import GifEditor from '../utils/GifEditor';

// 引用
const fileInputRef = ref<HTMLInputElement|null>(null);

// 响应式数据
const gifFile = ref<File|null>(null);
const gifPreviewUrl = ref<string>('');
const gifInfo = ref<{width: number, height: number, frameCount: number}|null>(null);
const processing = ref(false);
const processingMessage = ref('');

// 插入帧参数
const insertFrameIndex = ref(0);

// 删除帧参数
const deleteFrameIndex = ref(0);

// 压缩参数
const compressionLevel = ref('O1');
const lossyValue = ref<number|null>(30);

// 尺寸调整参数
const newWidth = ref<number|null>(null);
const newHeight = ref<number|null>(null);

// 旋转参数
const rotationAngle = ref<'90'|'180'|'270'|''>('');

// 裁剪参数
const showCropControls = ref(false);
const cropX = ref(0);
const cropY = ref(0);
const cropWidth = ref(100);
const cropHeight = ref(100);

// 计算属性
const isValidFile = computed(() => {
  return gifFile.value && gifFile.value.type === 'image/gif';
});

// 方法
const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    await loadGifFile(file);
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    if (file.type === 'image/gif') {
      await loadGifFile(file);
    } else {
      alert('请选择 GIF 格式的文件');
    }
  }
};

const loadGifFile = async (file: File) => {
  if (file.type !== 'image/gif') {
    alert('请选择 GIF 格式的文件');
    return;
  }

  // 清理之前的预览URL
  if (gifPreviewUrl.value) {
    URL.revokeObjectURL(gifPreviewUrl.value);
  }

  gifFile.value = file;
  gifPreviewUrl.value = URL.createObjectURL(file);
  
  // 获取 GIF 信息
  try {
    processing.value = true;
    processingMessage.value = '正在分析 GIF 信息...';
    
    // 创建 GifEditor 实例并获取信息
    const editor = new GifEditor();
    gifInfo.value = await editor.getGifInfo(file);
    
    // 设置默认尺寸值
    newWidth.value = gifInfo.value.width;
    newHeight.value = gifInfo.value.height;
    
    // 获取准确的帧数
    const frameCount = await editor.getFrameCount(file);
    gifInfo.value.frameCount = frameCount;
  } catch (error) {
    console.error('获取 GIF 信息失败:', error);
    alert('无法读取 GIF 文件信息');
  } finally {
    processing.value = false;
  }
};

const resetEditor = () => {
  if (gifPreviewUrl.value) {
    URL.revokeObjectURL(gifPreviewUrl.value);
  }
  
  gifFile.value = null;
  gifPreviewUrl.value = '';
  gifInfo.value = null;
  insertFrameIndex.value = 0;
  deleteFrameIndex.value = 0;
  compressionLevel.value = 'O1';
  lossyValue.value = 30;
  newWidth.value = null;
  newHeight.value = null;
  rotationAngle.value = '';
  showCropControls.value = false;
  cropX.value = 0;
  cropY.value = 0;
  cropWidth.value = 100;
  cropHeight.value = 100;
};

const insertFrame = async () => {
  if (!gifFile.value) return;

  try {
    processing.value = true;
    processingMessage.value = '正在插入帧...';
    
    const editor = new GifEditor();
    const newGif = await editor.insertFrame(
      gifFile.value,
      insertFrameIndex.value
    );
    
    // 更新文件和预览
    const oldPreviewUrl = gifPreviewUrl.value;
    gifFile.value = newGif;
    URL.revokeObjectURL(oldPreviewUrl);
    gifPreviewUrl.value = URL.createObjectURL(newGif);
    
    // 重新获取 GIF 信息
    gifInfo.value = await editor.getGifInfo(newGif);
    
    alert('帧插入成功！');
  } catch (error) {
    console.error('插入帧失败:', error);
    alert('插入帧失败: ' + (error as Error).message);
  } finally {
    processing.value = false;
  }
};

const deleteFrame = async () => {
  if (!gifFile.value || !gifInfo.value) return;

  if (gifInfo.value.frameCount <= 1) {
    alert('不能删除最后一个帧');
    return;
  }

  if (deleteFrameIndex.value >= gifInfo.value.frameCount) {
    alert('删除位置超出范围');
    return;
  }

  try {
    processing.value = true;
    processingMessage.value = '正在删除帧...';
    
    const editor = new GifEditor();
    const newGif = await editor.deleteFrame(
      gifFile.value,
      deleteFrameIndex.value
    );
    
    // 更新文件和预览
    const oldPreviewUrl = gifPreviewUrl.value;
    gifFile.value = newGif;
    URL.revokeObjectURL(oldPreviewUrl);
    gifPreviewUrl.value = URL.createObjectURL(newGif);
    
    // 重新获取 GIF 信息
    gifInfo.value = await editor.getGifInfo(newGif);
    
    alert('帧删除成功！');
  } catch (error) {
    console.error('删除帧失败:', error);
    alert('删除帧失败: ' + (error as Error).message);
  } finally {
    processing.value = false;
  }
};

const compressGif = async () => {
  if (!gifFile.value) return;

  try {
    processing.value = true;
    processingMessage.value = '正在压缩 GIF...';
    
    const editor = new GifEditor();
    const newGif = await editor.compress(
      gifFile.value,
      compressionLevel.value,
      lossyValue.value || undefined
    );
    
    // 更新文件和预览
    const oldPreviewUrl = gifPreviewUrl.value;
    gifFile.value = newGif;
    URL.revokeObjectURL(oldPreviewUrl);
    gifPreviewUrl.value = URL.createObjectURL(newGif);
    
    // 重新获取 GIF 信息
    gifInfo.value = await editor.getGifInfo(newGif);
    
    alert(`压缩完成！文件大小: ${formatFileSize(newGif.size)}`);
  } catch (error) {
    console.error('压缩失败:', error);
    alert('压缩失败: ' + (error as Error).message);
  } finally {
    processing.value = false;
  }
};

const resizeGif = async () => {
  if (!gifFile.value || (!newWidth.value && !newHeight.value)) return;

  try {
    processing.value = true;
    processingMessage.value = '正在调整尺寸...';
    
    const editor = new GifEditor();
    const newGif = await editor.resize(
      gifFile.value,
      newWidth.value || undefined,
      newHeight.value || undefined
    );
    
    // 更新文件和预览
    const oldPreviewUrl = gifPreviewUrl.value;
    gifFile.value = newGif;
    URL.revokeObjectURL(oldPreviewUrl);
    gifPreviewUrl.value = URL.createObjectURL(newGif);
    
    // 重新获取 GIF 信息
    gifInfo.value = await editor.getGifInfo(newGif);
    
    alert('尺寸调整完成！');
  } catch (error) {
    console.error('调整尺寸失败:', error);
    alert('调整尺寸失败: ' + (error as Error).message);
  } finally {
    processing.value = false;
  }
};

const rotateGif = async () => {
  if (!gifFile.value || !rotationAngle.value) return;

  try {
    processing.value = true;
    processingMessage.value = '正在旋转 GIF...';
    
    const editor = new GifEditor();
    const newGif = await editor.rotate(
      gifFile.value,
      parseInt(rotationAngle.value) as 90|180|270
    );
    
    // 更新文件和预览
    const oldPreviewUrl = gifPreviewUrl.value;
    gifFile.value = newGif;
    URL.revokeObjectURL(oldPreviewUrl);
    gifPreviewUrl.value = URL.createObjectURL(newGif);
    
    // 重新获取 GIF 信息
    gifInfo.value = await editor.getGifInfo(newGif);
    
    alert('旋转完成！');
  } catch (error) {
    console.error('旋转失败:', error);
    alert('旋转失败: ' + (error as Error).message);
  } finally {
    processing.value = false;
  }
};

const toggleCropControls = () => {
  showCropControls.value = !showCropControls.value;
};

const cropGif = async () => {
  if (!gifFile.value) return;

  try {
    processing.value = true;
    processingMessage.value = '正在裁剪 GIF...';
    
    const editor = new GifEditor();
    const newGif = await editor.crop(
      gifFile.value,
      cropX.value,
      cropY.value,
      cropWidth.value,
      cropHeight.value
    );
    
    // 更新文件和预览
    const oldPreviewUrl = gifPreviewUrl.value;
    gifFile.value = newGif;
    URL.revokeObjectURL(oldPreviewUrl);
    gifPreviewUrl.value = URL.createObjectURL(newGif);
    
    // 重新获取 GIF 信息
    gifInfo.value = await editor.getGifInfo(newGif);
    
    alert('裁剪完成！');
  } catch (error) {
    console.error('裁剪失败:', error);
    alert('裁剪失败: ' + (error as Error).message);
  } finally {
    processing.value = false;
  }
};

const downloadGif = () => {
  if (!gifFile.value) return;
  
  const a = document.createElement('a');
  a.href = gifPreviewUrl.value;
  a.download = `edited-${gifFile.value.name}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 组件卸载时清理 URL 对象
onUnmounted(() => {
  if (gifPreviewUrl.value) {
    URL.revokeObjectURL(gifPreviewUrl.value);
  }
});
</script>

<style scoped>
.gif-editor-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.upload-section {
  margin-bottom: 30px;
}

.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
  background-color: #fafafa;
}

.drop-zone:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.drop-zone-content p {
  margin-bottom: 15px;
  color: #666;
}

.file-info {
  text-align: left;
}

.file-info p {
  margin: 5px 0;
}

.preview-section {
  margin-bottom: 30px;
}

.preview-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.gif-preview {
  max-width: 400px;
  max-height: 400px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.gif-info {
  flex: 1;
}

.gif-info p {
  margin: 5px 0;
  padding: 5px 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
}

.editor-section {
  margin-bottom: 30px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.tool-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tool-card h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.tool-card p {
  color: #666;
  font-size: 0.9em;
  margin: 8px 0;
}

.tool-controls {
  margin-top: 15px;
}

.tool-controls label {
  display: inline-block;
  width: 80px;
  font-size: 0.9em;
  margin-right: 5px;
  color: #555;
}

.tool-controls input,
.tool-controls select {
  padding: 5px;
  margin: 5px 5px 5px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9em;
}

.input-small {
  width: 80px;
}

.input-medium {
  width: 100px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-action {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  margin: 3px;
}

.btn-action:hover {
  background-color: #218838;
}

.btn-danger {
  background-color: #dc3545;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-success {
  background-color: #28a745;
}

.btn-success:hover {
  background-color: #218838;
}

.crop-controls {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ccc;
}

.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.processing-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 300px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #007bff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>