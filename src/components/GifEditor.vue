<template>
  <div class="gif-editor">
    <h2>GIF 编辑器</h2>
    
    <!-- 文件上传区域 -->
    <div class="upload-section">
      <input 
        type="file" 
        ref="fileInputRef"
        accept=".gif" 
        @change="handleFileUpload" 
        id="gif-upload"
      />
      <label for="gif-upload" class="upload-label">
        选择 GIF 文件
      </label>
      <p v-if="selectedFile" class="file-info">
        已选择: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
      </p>
    </div>

    <!-- GIF 信息显示 -->
    <div v-if="gifInfo" class="gif-info-section">
      <h3>GIF 信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">尺寸:</span>
          <span>{{ gifInfo.width }} x {{ gifInfo.height }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">帧数:</span>
          <span>{{ gifInfo.frameCount }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">文件大小:</span>
          <span>{{ formatFileSize(selectedFile?.size || 0) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">循环次数:</span>
          <span>{{ gifInfo.loopCount || '无限' }}</span>
        </div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div v-if="previewUrl" class="preview-section">
      <h3>预览</h3>
      <img :src="previewUrl" alt="GIF Preview" class="gif-preview" />
    </div>

    <!-- 编辑工具栏 -->
    <div v-if="gifInfo" class="editor-tools">
      <h3>编辑工具</h3>
      
      <div class="tool-group">
        <h4>帧操作</h4>
        <div class="tool-row">
          <button @click="insertFrame" class="tool-btn">插入帧</button>
          <button @click="removeFrame" class="tool-btn">删除帧</button>
          <button @click="duplicateFrame" class="tool-btn">复制帧</button>
        </div>
      </div>
      
      <div class="tool-group">
        <h4>压缩设置</h4>
        <div class="tool-row">
          <label>
            压缩等级:
            <select v-model="compressLevel">
              <option value="O1">O1 (轻度)</option>
              <option value="O2">O2 (中度)</option>
              <option value="O3">O3 (深度)</option>
            </select>
          </label>
          <label>
            有损压缩程度:
            <input 
              type="range" 
              min="1" 
              max="200" 
              v-model.number="lossyValue"
              :disabled="!useLossyCompression"
            />
            <span>{{ lossyValue }}</span>
          </label>
          <label>
            <input 
              type="checkbox" 
              v-model="useLossyCompression"
            />
            启用有损压缩
          </label>
          <button @click="compressGif" class="tool-btn">压缩</button>
        </div>
      </div>
      
      <div class="tool-group">
        <h4>尺寸调整</h4>
        <div class="tool-row">
          <label>
            宽度:
            <input 
              type="number" 
              v-model.number="resizeWidth" 
              :min="10"
              :max="gifInfo?.width * 2 || 1000"
            />
          </label>
          <label>
            高度:
            <input 
              type="number" 
              v-model.number="resizeHeight" 
              :min="10"
              :max="gifInfo?.height * 2 || 1000"
            />
          </label>
          <button @click="resizeGif" class="tool-btn">调整尺寸</button>
          <button @click="resetSize" class="tool-btn secondary">重置尺寸</button>
        </div>
      </div>
      
      <div class="tool-group">
        <h4>导出</h4>
        <div class="tool-row">
          <button @click="downloadGif" class="tool-btn primary">下载处理后的GIF</button>
        </div>
      </div>
    </div>

    <!-- 进度指示器 -->
    <div v-if="processing" class="processing-overlay">
      <div class="spinner"></div>
      <p>{{ processingMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

// Refs
const fileInputRef = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const gifInfo = ref<any>(null);
const processing = ref(false);
const processingMessage = ref('处理中...');

// 状态变量
const compressLevel = ref('O1');
const lossyValue = ref(30);
const useLossyCompression = ref(false);
const resizeWidth = ref(0);
const resizeHeight = ref(0);

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || !target.files[0]) return;
  
  const file = target.files[0];
  if (!file.type.includes('gif')) {
    alert('请选择GIF文件');
    return;
  }
  
  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
  
  // 解析GIF信息
  parseGifInfo(file);
};

// 解析GIF信息
const parseGifInfo = async (file: File) => {
  processing.value = true;
  processingMessage.value = '正在分析GIF信息...';
  
  try {
    // 这里我们模拟获取GIF信息
    // 在实际实现中，我们会使用gifsicle-wasm-browser来解析GIF
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const blobUrl = URL.createObjectURL(file);
    img.src = blobUrl;
    
    await new Promise((resolve) => {
      img.onload = () => {
        // 模拟GIF信息，实际应该使用gifsicle来获取详细信息
        gifInfo.value = {
          width: img.width,
          height: img.height,
          frameCount: Math.floor(file.size / 10000) + 1, // 模拟帧数
          loopCount: 0
        };
        
        resizeWidth.value = img.width;
        resizeHeight.value = img.height;
        
        URL.revokeObjectURL(blobUrl);
        resolve(null);
      };
    });
  } catch (error) {
    console.error('解析GIF信息失败:', error);
    alert('解析GIF信息失败');
  } finally {
    processing.value = false;
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 插入帧
const insertFrame = () => {
  alert('此功能需要集成gifsicle-wasm-browser库才能实现');
  console.log('插入帧功能待实现');
};

// 删除帧
const removeFrame = () => {
  alert('此功能需要集成gifsicle-wasm-browser库才能实现');
  console.log('删除帧功能待实现');
};

// 复制帧
const duplicateFrame = () => {
  alert('此功能需要集成gifsicle-wasm-browser库才能实现');
  console.log('复制帧功能待实现');
};

// 压缩GIF
const compressGif = async () => {
  if (!selectedFile.value) return;
  
  processing.value = true;
  processingMessage.value = '正在压缩GIF...';
  
  try {
    // 这里使用gifsicle-wasm-browser进行压缩
    // 模拟压缩过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert('压缩功能需要集成gifsicle-wasm-browser库才能实现');
    console.log(`压缩设置: ${compressLevel.value}, 有损压缩: ${useLossyCompression.value ? lossyValue.value : '关闭'}`);
  } catch (error) {
    console.error('压缩失败:', error);
    alert('压缩失败');
  } finally {
    processing.value = false;
  }
};

// 调整GIF尺寸
const resizeGif = async () => {
  if (!selectedFile.value) return;
  
  processing.value = true;
  processingMessage.value = '正在调整尺寸...';
  
  try {
    // 这里使用gifsicle-wasm-browser进行尺寸调整
    // 模拟调整尺寸过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert('调整尺寸功能需要集成gifsicle-wasm-browser库才能实现');
    console.log(`调整尺寸: ${resizeWidth.value} x ${resizeHeight.value}`);
  } catch (error) {
    console.error('调整尺寸失败:', error);
    alert('调整尺寸失败');
  } finally {
    processing.value = false;
  }
};

// 重置尺寸
const resetSize = () => {
  if (gifInfo.value) {
    resizeWidth.value = gifInfo.value.width;
    resizeHeight.value = gifInfo.value.height;
  }
};

// 下载处理后的GIF
const downloadGif = () => {
  if (!previewUrl.value) return;
  
  const a = document.createElement('a');
  a.href = previewUrl.value;
  a.download = `edited-${selectedFile.value?.name || 'gif'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 清理资源
onMounted(() => {
  window.addEventListener('beforeunload', () => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
  });
});

// 暴露方法供父组件使用
defineExpose({
  handleFileUpload,
  compressGif,
  resizeGif,
  downloadGif
});
</script>

<style scoped>
.gif-editor {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.upload-section {
  margin-bottom: 20px;
}

#gif-upload {
  display: none;
}

.upload-label {
  display: inline-block;
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.upload-label:hover {
  background-color: #4a9eff;
}

.file-info {
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
}

.gif-info-section {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}

.info-label {
  font-weight: bold;
  color: #303133;
}

.preview-section {
  margin-bottom: 20px;
  text-align: center;
}

.gif-preview {
  max-width: 100%;
  max-height: 400px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.editor-tools {
  margin-top: 20px;
}

.tool-group {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.tool-group h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #303133;
}

.tool-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.tool-btn {
  padding: 8px 16px;
  background-color: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.tool-btn:hover {
  background-color: #7ecb52;
}

.tool-btn.secondary {
  background-color: #909399;
}

.tool-btn.secondary:hover {
  background-color: #a6a9ad;
}

.tool-btn.primary {
  background-color: #409eff;
}

.tool-btn.primary:hover {
  background-color: #66b1ff;
}

label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 14px;
}

label input[type="number"],
label select,
label input[type="range"] {
  padding: 5px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>