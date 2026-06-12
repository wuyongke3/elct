<template>
  <div class="gif-tool">
    <!-- 文件上传 -->
    <div class="upload-section">
      <div
        class="drop-zone"
        :class="{ 'has-file': gifFile }"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="handleDrop"
      >
        <div v-if="!gifFile" class="drop-zone-content">
          <svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p class="drop-title">拖拽 GIF 文件到此处</p>
          <p class="drop-subtitle">或点击按钮选择文件</p>
          <button class="btn" @click.stop="triggerFileInput">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            选择文件
          </button>
        </div>
        <div v-else class="file-loaded">
          <div class="file-card">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
              <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
              <line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/>
            </svg>
            <span class="file-name">{{ gifFile.name }}</span>
            <span class="file-size">{{ formatFileSize(gifFile.size) }}</span>
            <button class="btn-ghost btn-sm" @click.stop="resetAll">更换</button>
          </div>
        </div>
      </div>
      <input type="file" ref="fileInputRef" @change="handleFileSelect" accept=".gif,image/gif" class="hidden-input" />
    </div>

    <!-- 信息栏 -->
    <div v-if="gifFile && gifInfo" class="info-bar">
      <div class="info-item">
        <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span>{{ gifInfo.width }} × {{ gifInfo.height }}</span>
        <span class="info-hint">尺寸</span>
      </div>
      <div class="info-item">
        <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        <span>{{ gifInfo.frameCount }}</span>
        <span class="info-hint">帧数</span>
      </div>
      <div class="info-item">
        <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="12" y1="12" x2="12" y2="2"/>
        </svg>
        <span>{{ formatFileSize(gifFile.size) }}</span>
        <span class="info-hint">大小</span>
      </div>
      <div class="info-item">
        <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
        <span>{{ gifInfo.loopCount === 0 ? '无限' : gifInfo.loopCount + '次' }}</span>
        <span class="info-hint">循环</span>
      </div>
    </div>

    <!-- 主体：预览 + 工具 -->
    <div v-if="gifFile" class="main-content">
      <!-- 预览面板 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h3>{{ processedPreview ? '处理结果' : '原图预览' }}</h3>
        </div>
        <div class="preview-box">
          <img :src="processedPreview || gifPreviewUrl" alt="GIF Preview" class="gif-preview" />
        </div>
        <div v-if="processedFile && originalFile" class="preview-meta">
          <div class="compare-row">
            <div class="compare-side">
              <span class="compare-label">原</span>
              <span>{{ formatFileSize(originalFile.size) }}</span>
            </div>
            <svg class="icon-xs arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
            <div class="compare-side">
              <span class="compare-label new">新</span>
              <span>{{ formatFileSize(processedFile.size) }}</span>
              <span v-if="processedFile.size < originalFile.size" class="compare-pct">
                {{ ((1 - processedFile.size / originalFile.size) * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
        <button v-if="processedFile" class="btn btn-download" @click="downloadResult">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          下载结果
        </button>
      </div>

      <!-- 工具面板 -->
      <div class="tools-panel">
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" v-html="tab.icon"></svg>
            {{ tab.label }}
          </button>
        </div>

        <!-- ======== 抽帧 ======== -->
        <div v-show="activeTab === 'extract'" class="tab-content">
          <div class="section">
            <h4>帧列表</h4>
            <p class="desc">选中要删除的帧，点击删除按钮移除它们</p>

            <div class="frame-actions">
              <button class="btn-ghost btn-sm" @click="selectAllFrames">全选</button>
              <button class="btn-ghost btn-sm" @click="deselectAllFrames">取消</button>
              <button class="btn-ghost btn-sm" @click="invertSelection">反选</button>
              <span v-if="selectedFrames.size > 0" class="badge">
                已选 {{ selectedFrames.size }} / {{ gifInfo?.frameCount || 0 }}
              </span>
            </div>

            <div class="frame-grid" v-if="framePreviews.length > 0">
              <div
                v-for="(preview, idx) in framePreviews"
                :key="idx"
                class="frame-card"
                :class="{ selected: selectedFrames.has(idx) }"
                @click="toggleFrameSelection(idx)"
              >
                <div class="frame-check"><span v-if="selectedFrames.has(idx)">&#x2713;</span></div>
                <img :src="preview" class="frame-img" />
                <span class="frame-num">#{{ idx + 1 }}</span>
              </div>
            </div>
            <div v-else class="empty">点击下方按钮加载帧预览</div>

            <div class="extract-btns">
              <button class="btn btn-secondary" @click="loadFramePreviews" :disabled="extractingFrames">
                {{ extractingFrames ? '加载中...' : '加载帧预览' }}
              </button>
              <button class="btn btn-danger" @click="deleteSelectedFrames" :disabled="selectedFrames.size === 0 || processing">
                删除选中
              </button>
              <button class="btn btn-danger-ghost" @click="deleteAllExceptFirst" :disabled="processing">
                仅保留首帧
              </button>
            </div>

            <div class="section-divider"></div>

            <h4>每隔 N 帧删除</h4>
            <p class="desc">每隔指定帧数自动删除一帧</p>
            <div class="inline-row">
              <span class="inline-label">每隔</span>
              <input v-model.number="everyNthValue" type="number" min="1" max="99" class="input" />
              <span class="inline-label">帧删 1 帧</span>
              <button class="btn btn-danger-ghost btn-sm" @click="doRemoveEveryNth" :disabled="processing || everyNthValue < 1">执行</button>
            </div>

            <div class="section-divider"></div>

            <h4>导出单帧</h4>
            <div class="inline-row">
              <span class="inline-label">帧序号</span>
              <input v-model.number="exportFrameIndex" type="number" min="0" :max="(gifInfo?.frameCount || 1) - 1" class="input" />
              <button class="btn btn-secondary btn-sm" @click="exportSingleFrame">导出</button>
            </div>
          </div>
        </div>

        <!-- ======== 压缩 ======== -->
        <div v-show="activeTab === 'compress'" class="tab-content">
          <div class="section">
            <h4>优化等级</h4>
            <div class="radio-row">
              <label
                v-for="level in ['O1', 'O2', 'O3']"
                :key="level"
                class="radio-item"
                :class="{ active: compressLevel === level }"
              >
                <input type="radio" v-model="compressLevel" :value="level" />
                <span>{{ level === 'O1' ? '快速' : level === 'O2' ? '标准' : '极致' }}</span>
              </label>
            </div>

            <div class="section-divider"></div>

            <h4>有损压缩</h4>
            <p class="desc">值越大压缩率越高，推荐 30–60。设为 0 关闭有损压缩。</p>
            <div class="slider-row">
              <input type="range" v-model.number="lossyValue" min="0" max="200" class="slider" />
              <span class="slider-val">{{ lossyValue }}</span>
            </div>

            <div class="section-divider"></div>

            <h4>颜色限制</h4>
            <select v-model.number="colorsValue" class="select">
              <option :value="0">不限制</option>
              <option :value="256">256 色</option>
              <option :value="128">128 色</option>
              <option :value="64">64 色</option>
              <option :value="32">32 色</option>
            </select>

            <div class="section-divider"></div>

            <h4>缩放</h4>
            <div class="chip-row">
              <button
                v-for="s in [1, 0.75, 0.5, 0.25]"
                :key="s"
                class="chip"
                :class="{ active: scaleValue === s }"
                @click="scaleValue = s"
              >
                {{ s === 1 ? '原尺寸' : (s * 100) + '%' }}
              </button>
            </div>

            <button class="btn btn-primary btn-lg" @click="doCompress" :disabled="processing">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              开始压缩
            </button>

            <div class="section-divider"></div>

            <h4>调整尺寸</h4>
            <div class="inline-row">
              <input v-model.number="resizeWidth" type="number" min="10" class="input" :placeholder="String(gifInfo?.width || '')" />
              <span class="inline-label">×</span>
              <input v-model.number="resizeHeight" type="number" min="10" class="input" :placeholder="String(gifInfo?.height || '')" />
              <label class="checkbox-label">
                <input type="checkbox" v-model="keepRatio" />
                <span>等比</span>
              </label>
              <button class="btn btn-secondary btn-sm" @click="doResize" :disabled="processing">调整</button>
            </div>

            <div class="section-divider"></div>

            <h4>其他</h4>
            <div class="inline-row" style="flex-wrap:wrap; gap:6px;">
              <button class="btn-ghost btn-sm" @click="doRotate(90)" :disabled="processing">旋转 90°</button>
              <button class="btn-ghost btn-sm" @click="doRotate(180)" :disabled="processing">旋转 180°</button>
              <button class="btn-ghost btn-sm" @click="doRotate(270)" :disabled="processing">旋转 270°</button>
              <button class="btn-ghost btn-sm" @click="doSetLoop(0)" :disabled="processing">无限循环</button>
              <button class="btn-ghost btn-sm" @click="doSetLoop(1)" :disabled="processing">播放 1 次</button>
              <button class="btn-ghost btn-sm" @click="doReverse" :disabled="processing">倒放</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 处理中 -->
    <div v-if="processing" class="overlay">
      <div class="overlay-card">
        <div class="spinner"></div>
        <p>{{ processingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue';
import GifEditor from '../utils/GifEditor';

const fileInputRef = ref<HTMLInputElement | null>(null);
const gifFile = ref<File | null>(null);
const gifPreviewUrl = ref('');
const gifInfo = ref<{ width: number; height: number; frameCount: number; fileSize: number; loopCount: number; delays: number[] } | null>(null);
const processing = ref(false);
const processingMessage = ref('');
const dragOver = ref(false);

const activeTab = ref<'extract' | 'compress'>('extract');
const tabs = [
  {
    id: 'extract' as const,
    label: '抽帧',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
  },
  {
    id: 'compress' as const,
    label: '压缩',
    icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  },
];

const framePreviews = ref<string[]>([]);
const selectedFrames = ref(new Set<number>());
const extractingFrames = ref(false);
const exportFrameIndex = ref(0);
const everyNthValue = ref(2);

const compressLevel = ref<'O1' | 'O2' | 'O3'>('O2');
const lossyValue = ref(40);
const colorsValue = ref(0);
const scaleValue = ref(1);
const resizeWidth = ref<number | null>(null);
const resizeHeight = ref<number | null>(null);
const keepRatio = ref(true);

const processedFile = ref<File | null>(null);
const processedPreview = ref('');
const originalFile = ref<File | null>(null);
const showOriginal = ref(false);

const triggerFileInput = () => {
  const input = fileInputRef.value;
  if (input) {
    input.value = ''; // reset so same file can be selected again
    input.click();
  }
};

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) await loadFile(file);
  target.value = ''; // allow re-selecting same file next time
};

const handleDrop = async (e: DragEvent) => {
  dragOver.value = false;
  if (e.dataTransfer?.files[0]) {
    const file = e.dataTransfer.files[0];
    if (file.type === 'image/gif') await loadFile(file);
    else alert('请选择 GIF 格式文件');
  }
};

const loadFile = async (file: File) => {
  if (file.type !== 'image/gif') { alert('请选择 GIF 格式文件'); return; }
  if (gifPreviewUrl.value) URL.revokeObjectURL(gifPreviewUrl.value);
  if (processedPreview.value) URL.revokeObjectURL(processedPreview.value);
  clearFramePreviews();
  gifFile.value = file;
  gifPreviewUrl.value = URL.createObjectURL(file);
  processedFile.value = null;
  originalFile.value = null;
  processedPreview.value = '';
  selectedFrames.value.clear();
  processing.value = true;
  processingMessage.value = '正在分析 GIF...';
  try {
    const editor = new GifEditor();
    gifInfo.value = await editor.getGifInfo(file);
    resizeWidth.value = gifInfo.value.width;
    resizeHeight.value = gifInfo.value.height;
  } catch (e) {
    console.error(e);
    alert('分析 GIF 失败');
  } finally {
    processing.value = false;
  }
};

const resetAll = () => {
  if (gifPreviewUrl.value) URL.revokeObjectURL(gifPreviewUrl.value);
  if (processedPreview.value) URL.revokeObjectURL(processedPreview.value);
  clearFramePreviews();
  gifFile.value = null;
  gifPreviewUrl.value = '';
  gifInfo.value = null;
  processedFile.value = null;
  originalFile.value = null;
  processedPreview.value = '';
  selectedFrames.value.clear();
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const loadFramePreviews = async () => {
  if (!gifFile.value) return;
  extractingFrames.value = true;
  clearFramePreviews();
  try {
    const editor = new GifEditor();
    const { frames } = await editor.extractFrames(gifFile.value);
    framePreviews.value = frames.map(f => URL.createObjectURL(f));
  } catch (e: any) {
    console.error(e);
    alert('加载帧预览失败: ' + (e?.message || String(e)));
  } finally {
    extractingFrames.value = false;
  }
};

const toggleFrameSelection = (idx: number) => {
  const next = new Set(selectedFrames.value);
  next.has(idx) ? next.delete(idx) : next.add(idx);
  selectedFrames.value = next;
};

const selectAllFrames = () => {
  if (!gifInfo.value) return;
  selectedFrames.value = new Set(Array.from({ length: gifInfo.value.frameCount }, (_, i) => i));
};
const deselectAllFrames = () => selectedFrames.value = new Set();
const invertSelection = () => {
  if (!gifInfo.value) return;
  const all = new Set(Array.from({ length: gifInfo.value.frameCount }, (_, i) => i));
  for (const s of selectedFrames.value) all.delete(s);
  selectedFrames.value = all;
};

const deleteSelectedFrames = async () => {
  if (!gifFile.value || selectedFrames.value.size === 0) return;
  if (gifInfo.value && selectedFrames.value.size >= gifInfo.value.frameCount) {
    alert('不能删除所有帧'); return;
  }
  await runOperation('正在删除选中帧...', async (editor) => {
    return editor.removeFrames(gifFile.value!, Array.from(selectedFrames.value));
  });
};

const deleteAllExceptFirst = async () => {
  if (!gifFile.value || !gifInfo.value || gifInfo.value.frameCount <= 1) return;
  const indices = Array.from({ length: gifInfo.value.frameCount - 1 }, (_, i) => i + 1);
  await runOperation('正在删除帧...', async (editor) => {
    return editor.removeFrames(gifFile.value!, indices);
  });
};

const doRemoveEveryNth = async () => {
  if (!gifFile.value || everyNthValue.value < 1) return;
  await runOperation(`每隔 ${everyNthValue.value} 帧删 1 帧...`, async (editor) => {
    return editor.removeEveryNthFrame(gifFile.value!, everyNthValue.value);
  });
};

const exportSingleFrame = async () => {
  if (!gifFile.value) return;
  try {
    processing.value = true;
    processingMessage.value = '正在导出...';
    const editor = new GifEditor();
    const { frames } = await editor.extractFrames(gifFile.value);
    if (frames[exportFrameIndex.value]) {
      const blob = frames[exportFrameIndex.value];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `frame_${exportFrameIndex.value + 1}.gif`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (e: any) {
    alert('导出失败: ' + (e?.message || String(e)));
  } finally {
    processing.value = false;
  }
};

const doCompress = async () => {
  if (!gifFile.value) return;
  await runOperation('正在压缩 GIF...', async (editor) => {
    return editor.compress(gifFile.value!, compressLevel.value, lossyValue.value || undefined, colorsValue.value || undefined, scaleValue.value < 1 ? scaleValue.value : undefined);
  }, true);
};

const doResize = async () => {
  if (!gifFile.value) return;
  await runOperation('正在调整尺寸...', async (editor) => {
    return editor.resize(gifFile.value!, resizeWidth.value || undefined, resizeHeight.value || undefined);
  });
};

const doRotate = async (deg: 90 | 180 | 270) => {
  if (!gifFile.value) return;
  await runOperation(`旋转 ${deg}°...`, async (editor) => editor.rotate(gifFile.value!, deg));
};

const doSetLoop = async (count: number) => {
  if (!gifFile.value) return;
  await runOperation('设置循环...', async (editor) => editor.setLoopCount(gifFile.value!, count));
};

const doReverse = async () => {
  if (!gifFile.value) return;
  await runOperation('倒放...', async (editor) => editor.reverse(gifFile.value!));
};

const runOperation = async (message: string, operation: (editor: GifEditor) => Promise<File>, suppressInfo = false) => {
  if (!gifFile.value) return;
  processing.value = true;
  processingMessage.value = message;
  try {
    const editor = new GifEditor();
    const orig = gifFile.value;
    const origSize = orig.size;
    originalFile.value = orig;
    const result = await operation(editor);
    if (processedPreview.value) URL.revokeObjectURL(processedPreview.value);
    processedFile.value = result;
    processedPreview.value = URL.createObjectURL(result);
    if (gifPreviewUrl.value) URL.revokeObjectURL(gifPreviewUrl.value);
    gifFile.value = result;
    gifPreviewUrl.value = URL.createObjectURL(result);
    gifInfo.value = await editor.getGifInfo(result);
    resizeWidth.value = gifInfo.value.width;
    resizeHeight.value = gifInfo.value.height;
    clearFramePreviews();
    selectedFrames.value.clear();
    if (!suppressInfo) {
      const diff = origSize - result.size;
      const pct = ((Math.abs(diff) / origSize) * 100).toFixed(1);
      alert(`操作完成\n${formatFileSize(origSize)} → ${formatFileSize(result.size)} (${diff > 0 ? '-' : '+'}${pct}%)`);
    }
  } catch (e: any) {
    console.error(e);
    alert('操作失败: ' + (e?.message || e?.toString?.() || String(e) || '未知错误'));
  } finally {
    processing.value = false;
  }
};

const downloadResult = () => {
  if (!processedPreview.value || !processedFile.value) return;
  const a = document.createElement('a');
  a.href = processedPreview.value;
  a.download = `_${gifFile.value?.name || 'output.gif'}`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

const clearFramePreviews = () => {
  for (const url of framePreviews.value) URL.revokeObjectURL(url);
  framePreviews.value = [];
};

watch([resizeWidth], ([w]) => {
  if (keepRatio.value && gifInfo.value && w) resizeHeight.value = Math.round(w * (gifInfo.value.height / gifInfo.value.width));
});
watch([resizeHeight], ([h]) => {
  if (keepRatio.value && gifInfo.value && h) resizeWidth.value = Math.round(h * (gifInfo.value.width / gifInfo.value.height));
});

onUnmounted(() => {
  if (gifPreviewUrl.value) URL.revokeObjectURL(gifPreviewUrl.value);
  if (processedPreview.value) URL.revokeObjectURL(processedPreview.value);
  clearFramePreviews();
});
</script>

<style scoped>
.gif-tool {
  --c-text: #1d1d1f;
  --c-muted: #86868b;
  --c-subtle: #aeaeb2;
  --c-accent: #0071e3;
  --c-accent-hover: #0060c0;
  --c-danger: #ff3b30;
  --c-danger-hover: #e0352b;
  --c-success: #34c759;
  --c-surface: rgba(255,255,255,0.45);
  --c-surface-hover: rgba(255,255,255,0.65);
  --c-border: rgba(0,0,0,0.06);
  --c-border-strong: rgba(0,0,0,0.10);
  --c-glass: rgba(255,255,255,0.38);
  --c-glass-hover: rgba(255,255,255,0.58);
  --shadow-sm: 0 0.5px 1px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04);
  --shadow-md: 0 0.5px 1px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06);
  --radius: 12px;
  --radius-sm: 8px;
  --radius-xs: 6px;
  --blur: blur(28px) saturate(180%);
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 28px;
  color: var(--c-text);
}

/* -- Upload -- */
.upload-section { margin-bottom: 20px; }
.hidden-input { display: none; }
.drop-zone {
  border: 1.5px dashed var(--c-border-strong);
  border-radius: var(--radius);
  padding: 44px 28px;
  text-align: center;
  background: var(--c-glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  cursor: pointer;
  transition: border-color .25s, background .25s, box-shadow .25s;
  box-shadow: var(--shadow-sm);
}
.drop-zone:hover, .drop-zone.has-file {
  border-color: var(--c-accent);
  background: rgba(0,113,227,0.06);
  box-shadow: var(--shadow-md), 0 0 0 3px rgba(0,113,227,0.08);
}
.drop-zone-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.icon-lg { width: 40px; height: 40px; color: var(--c-muted); }
.drop-title { font-size: 15px; font-weight: 500; margin: 0; color: var(--c-text); }
.drop-subtitle { font-size: 13px; color: var(--c-muted); margin: 0; }
.file-loaded { display: flex; justify-content: center; }
.file-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--c-surface); padding: 10px 20px; border-radius: var(--radius-sm);
  border: 0.5px solid var(--c-border);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  box-shadow: var(--shadow-sm);
}
.file-name { font-weight: 500; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-size { color: var(--c-muted); font-size: 13px; }

/* -- Icons -- */
.icon-xs { width: 15px; height: 15px; flex-shrink: 0; }
.icon-sm { width: 17px; height: 17px; flex-shrink: 0; }

/* -- Buttons -- */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 18px; border-radius: var(--radius-xs); font-size: 13px; font-weight: 500;
  border: none; cursor: pointer; transition: all .2s;
  background: var(--c-accent); color: #fff;
  box-shadow: 0 1px 3px rgba(0,113,227,0.25);
}
.btn:hover { background: var(--c-accent-hover); box-shadow: 0 2px 6px rgba(0,113,227,0.35); }
.btn:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }
.btn-lg { padding: 10px 28px; font-size: 14px; border-radius: var(--radius-sm); }
.btn-sm { padding: 5px 12px; font-size: 12px; }
.btn-secondary {
  background: rgba(0,0,0,0.04); color: var(--c-text);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: none;
}
.btn-secondary:hover { background: rgba(0,0,0,0.08); color: var(--c-accent); }
.btn-danger { background: var(--c-danger); box-shadow: 0 1px 3px rgba(255,59,48,0.25); }
.btn-danger:hover { background: var(--c-danger-hover); box-shadow: 0 2px 6px rgba(255,59,48,0.35); }
.btn-danger-ghost {
  background: transparent; color: var(--c-danger);
  border: 0.5px solid rgba(255,59,48,0.3);
  box-shadow: none;
}
.btn-danger-ghost:hover { background: rgba(255,59,48,0.06); border-color: var(--c-danger); }
.btn-ghost {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 12px; border-radius: var(--radius-xs); font-size: 13px;
  background: transparent; color: var(--c-muted); border: none; cursor: pointer;
  transition: all .15s;
}
.btn-ghost:hover { color: var(--c-text); background: rgba(0,0,0,0.04); }
.btn-ghost:disabled { opacity: .35; cursor: not-allowed; }
.btn-ghost.btn-sm { padding: 4px 10px; font-size: 12px; }
.btn-download {
  width: 100%; justify-content: center; margin-top: 12px;
  background: var(--c-success); box-shadow: 0 1px 3px rgba(52,199,89,0.25);
}
.btn-download:hover { background: #30b350; box-shadow: 0 2px 6px rgba(52,199,89,0.35); }

/* -- Info bar -- */
.info-bar {
  display: flex; gap: 0;
  background: var(--c-surface);
  border-radius: var(--radius); padding: 14px 0; margin-bottom: 20px;
  border: 0.5px solid var(--c-border);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  box-shadow: var(--shadow-sm);
}
.info-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding: 0 12px;
}
.info-item > span:first-of-type { font-size: 15px; font-weight: 600; }
.info-hint { font-size: 11px; color: var(--c-muted); }

/* -- Main -- */
.main-content { display: flex; gap: 24px; align-items: flex-start; }

/* -- Preview -- */
.preview-panel {
  flex: 0 0 340px; position: sticky; top: 24px;
  background: var(--c-surface); border-radius: var(--radius);
  padding: 22px; border: 0.5px solid var(--c-border);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  box-shadow: var(--shadow-md);
}
.panel-header { margin-bottom: 12px; }
.panel-header h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--c-text); }
.preview-box {
  background: rgba(0,0,0,0.02); border-radius: var(--radius-sm);
  min-height: 180px; display: flex; align-items: center; justify-content: center;
  border: 0.5px solid var(--c-border);
}
.gif-preview { max-width: 100%; max-height: 280px; border-radius: 4px; }
.preview-meta { margin-top: 14px; }
.compare-row { display: flex; align-items: center; gap: 8px; }
.compare-side { display: flex; align-items: center; gap: 5px; font-size: 13px; color: var(--c-muted); }
.compare-label {
  font-size: 10px; padding: 1px 7px; border-radius: 4px; font-weight: 600;
  background: rgba(0,0,0,0.05); color: var(--c-muted);
}
.compare-label.new { background: rgba(52,199,89,0.12); color: var(--c-success); }
.arrow-icon { color: var(--c-subtle); }
.compare-pct { color: var(--c-success); font-weight: 600; font-size: 12px; margin-left: 2px; }

/* -- Tools panel -- */
.tools-panel {
  flex: 1; min-width: 0;
  background: var(--c-surface); border-radius: var(--radius);
  border: 0.5px solid var(--c-border);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
.tabs {
  display: flex;
  border-bottom: 0.5px solid var(--c-border);
  background: rgba(0,0,0,0.015);
}
.tab-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 13px 16px; border: none; background: none;
  font-size: 13px; font-weight: 500; color: var(--c-muted); cursor: pointer;
  border-bottom: 2px solid transparent; transition: all .2s;
}
.tab-btn:hover { color: var(--c-text); background: rgba(0,0,0,0.02); }
.tab-btn.active { color: var(--c-accent); border-bottom-color: var(--c-accent); }
.tab-content { padding: 24px; }

/* -- Section -- */
.section h4 { margin: 0 0 4px; font-size: 13px; font-weight: 600; color: var(--c-text); }
.section .desc { margin: 0 0 12px; font-size: 12px; color: var(--c-muted); line-height: 1.5; }
.section-divider {
  border-top: 0.5px solid var(--c-border); margin: 20px 0;
}

/* -- Frame -- */
.frame-actions { display: flex; gap: 6px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.badge { font-size: 12px; color: var(--c-accent); font-weight: 500; }
.frame-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 8px; max-height: 380px; overflow-y: auto; margin-bottom: 14px;
}
.frame-grid::-webkit-scrollbar { width: 5px; }
.frame-grid::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
.frame-card {
  position: relative; border: 2px solid transparent; border-radius: var(--radius-xs);
  overflow: hidden; cursor: pointer; background: rgba(0,0,0,0.02);
  transition: all .15s;
}
.frame-card:hover { border-color: rgba(0,113,227,0.2); background: rgba(0,113,227,0.04); }
.frame-card.selected { border-color: var(--c-accent); background: rgba(0,113,227,0.06); }
.frame-check {
  position: absolute; top: 4px; right: 4px; z-index: 2;
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(255,255,255,0.8); border: 1.5px solid rgba(0,0,0,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}
.frame-card.selected .frame-check {
  background: var(--c-accent); border-color: var(--c-accent); color: #fff;
}
.frame-img { width: 100%; display: block; }
.frame-num { text-align: center; font-size: 11px; color: var(--c-muted); padding: 2px 0 4px; }
.empty { text-align: center; padding: 36px 0; color: var(--c-subtle); font-size: 13px; }
.extract-btns { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

/* -- Inline -- */
.inline-row { display: flex; gap: 8px; align-items: center; margin-top: 6px; }
.inline-label { font-size: 13px; color: var(--c-muted); font-weight: 500; }

/* -- Inputs -- */
.input {
  width: 72px; padding: 7px 8px;
  border: 0.5px solid rgba(0,0,0,0.10);
  border-radius: var(--radius-xs); font-size: 13px; text-align: center;
  background: rgba(0,0,0,0.02); color: var(--c-text);
  transition: border-color .2s, box-shadow .2s;
}
.input:focus { outline: none; border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(0,113,227,0.1); }
.select {
  padding: 7px 10px;
  border: 0.5px solid rgba(0,0,0,0.10);
  border-radius: var(--radius-xs); font-size: 13px;
  background: rgba(0,0,0,0.02); color: var(--c-text); cursor: pointer;
}
.select:focus { outline: none; border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(0,113,227,0.1); }

/* -- Radio -- */
.radio-row { display: flex; gap: 8px; }
.radio-item {
  display: flex; align-items: center; gap: 4px; font-size: 13px;
  color: var(--c-muted); cursor: pointer; padding: 6px 16px; border-radius: var(--radius-xs);
  border: 0.5px solid rgba(0,0,0,0.08); transition: all .15s;
  background: rgba(0,0,0,0.01);
}
.radio-item:hover { border-color: rgba(0,113,227,0.2); }
.radio-item.active { color: var(--c-accent); border-color: var(--c-accent); background: rgba(0,113,227,0.05); font-weight: 500; }
.radio-item input { display: none; }

/* -- Slider -- */
.slider-row { display: flex; align-items: center; gap: 12px; }
.slider { width: 220px; accent-color: var(--c-accent); }
.slider-val { font-size: 20px; font-weight: 700; min-width: 36px; color: var(--c-text); }

/* -- Chip -- */
.chip-row { display: flex; gap: 6px; }
.chip {
  padding: 6px 15px; border-radius: 20px;
  border: 0.5px solid rgba(0,0,0,0.08);
  background: rgba(0,0,0,0.02); font-size: 13px; cursor: pointer;
  transition: all .15s; color: var(--c-muted);
}
.chip:hover { border-color: rgba(0,113,227,0.2); color: var(--c-text); }
.chip.active { background: var(--c-accent); color: #fff; border-color: var(--c-accent); }

/* -- Checkbox -- */
.checkbox-label {
  display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--c-muted); cursor: pointer;
}
.checkbox-label input { accent-color: var(--c-accent); }

/* -- Overlay -- */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.18);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.overlay-card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
  padding: 36px 52px; border-radius: var(--radius);
  text-align: center;
  box-shadow: 0 0.5px 1px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.12);
}
.spinner {
  width: 32px; height: 32px; margin: 0 auto 16px;
  border: 2.5px solid rgba(0,0,0,0.06); border-top-color: var(--c-accent);
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
