import gifsicle from 'gifsicle-wasm-browser';

export interface GifInfo {
  width: number;
  height: number;
  frameCount: number;
  fileSize: number;
  loopCount: number;
  delays: number[];
}

export interface GifFrameInfo {
  index: number;
  delay: number;
  width: number;
  height: number;
}

/**
 * Parse the text output of gifsicle --info command
 * Returns structured GIF information
 */
function parseGifInfoText(infoText: string, fileSize: number, defaultWidth: number, defaultHeight: number): GifInfo {
  const lines = infoText.split('\n');
  let width = defaultWidth;
  let height = defaultHeight;
  let frameCount = 0;
  let loopCount = 0;
  const delays: number[] = [];

  for (const line of lines) {
    // Match logical screen size
    const screenMatch = line.match(/logical screen\s+(\d+)x(\d+)/i);
    if (screenMatch) {
      width = parseInt(screenMatch[1]);
      height = parseInt(screenMatch[2]);
    }
    // Match image lines (each frame)
    const imageMatch = line.match(/image #\d+/i);
    if (imageMatch) {
      frameCount++;
      // Try to extract delay from the image line
      const delayMatch = line.match(/(\d+(?:\.\d+)?)s/i);
      if (delayMatch) {
        delays.push(Math.round(parseFloat(delayMatch[1]) * 100));
      } else {
        delays.push(10); // default 0.1s
      }
    }
    // Match loop count
    const loopMatch = line.match(/loop count\s+(\d+)/i);
    if (loopMatch) {
      loopCount = parseInt(loopMatch[1]);
    }
  }

  return { width, height, frameCount, fileSize, loopCount, delays };
}

class GifEditor {
  /**
   * Get GIF file information
   */
  async getGifInfo(file: File): Promise<GifInfo> {
    const dimensions = await this._getDimensions(file);

    try {
      // Use gifsicle --info to get detailed info
      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`--info input.gif -o /out/info.txt`]
      });

      console.log('[getGifInfo] result files:', result.map(f => f.name));

      // --info outputs to stdout, which gifsicle-wasm-browser captures as a text file
      // Find any text-like file in the result
      for (const f of result) {
        if (f.type === 'text/plain' || f.name.endsWith('.txt') || f.name === 'info.txt') {
          const text = await f.text();
          console.log('[getGifInfo] info text:', text);
          return parseGifInfoText(text, file.size, dimensions.width, dimensions.height);
        }
      }

      // If no text output, check if the single result is the input file (info output went to stdout somehow)
      // Fallback: use -e to count frames
      console.log('[getGifInfo] no text output, using explode fallback');
      const frameCount = await this.getFrameCount(file);
      return {
        width: dimensions.width,
        height: dimensions.height,
        frameCount: frameCount || 1,
        fileSize: file.size,
        loopCount: 0,
        delays: Array(frameCount || 1).fill(10)
      };
    } catch (error) {
      console.error('[getGifInfo] error, using fallback:', error);
      const frameCount = await this.getFrameCount(file).catch(() => 1);
      return {
        width: dimensions.width,
        height: dimensions.height,
        frameCount,
        fileSize: file.size,
        loopCount: 0,
        delays: Array(frameCount).fill(10)
      };
    }
  }

  /**
   * Get frame count by exploding the GIF
   */
  async getFrameCount(file: File): Promise<number> {
    try {
      // -e explodes output as /out/frame.000, /out/frame.001, etc.
      // These files are in /out/ so they'll appear in result
      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`-e input.gif -o /out/frame.gif`]
      });
      // Count non-text output files (frame files don't end with .gif)
      return result.filter(f => !f.name.endsWith('.txt') && !f.name.endsWith('.json')).length;
    } catch (error) {
      console.error('getFrameCount error:', error);
      return Math.max(1, Math.floor(file.size / 10000));
    }
  }

  /**
   * Extract all frames from a GIF, returning individual frame blobs and their delays
   * 抽帧功能
   */
  async extractFrames(file: File): Promise<{ frames: Blob[]; delays: number[] }> {
    try {
      // -U unoptimize, -e explode into /out/frame.000, frame.001, ...
      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`-U -e input.gif -o /out/frame.gif`]
      });

      // Frame files from -e: frame.000, frame.001, etc. (NOT .gif extension)
      const frames = result.filter(f => f.name !== 'input.gif' && f.type.startsWith('image/'));
      // Sort by name to maintain order
      frames.sort((a, b) => a.name.localeCompare(b.name));

      // Extract delay info from GIF info
      let delays: number[] = [];
      const info = await this.getGifInfo(file);
      delays = info.delays.length === frames.length ? info.delays : Array(frames.length).fill(10);

      return { frames: frames.map(f => f as Blob), delays };
    } catch (error) {
      console.error('extractFrames error:', error);
      throw error;
    }
  }

  /**
   * Remove every Nth frame from a GIF (keep 1, delete every N)
   * E.g. step=2: keep 0, delete 1; keep 2, delete 3; ...
   * E.g. step=3: keep 0,1, delete 2; keep 3,4, delete 5; ...
   */
  async removeEveryNthFrame(file: File, n: number): Promise<File> {
    if (n < 1) throw new Error('间隔必须 ≥ 1');
    const info = await this.getGifInfo(file);
    const indicesToRemove: number[] = [];
    for (let i = 0; i < info.frameCount; i++) {
      // Delete every Nth frame (1-indexed from user perspective)
      // n=2: frame indices 1,3,5... (0-based), i.e. (i+1) % n === 0
      if ((i + 1) % n === 0) {
        indicesToRemove.push(i);
      }
    }
    if (indicesToRemove.length === 0) return file;
    if (indicesToRemove.length >= info.frameCount) {
      throw new Error('不能删除所有帧');
    }
    return this.removeFrames(file, indicesToRemove);
  }

  /**
   * Remove frames from a GIF at specified indices (0-based)
   * 抽帧 - 删除指定帧
   */
  async removeFrames(file: File, indicesToRemove: number[]): Promise<File> {
    try {
      if (indicesToRemove.length === 0) return file;

      // Build the frame selection: keep all frames except those to remove
      // Use gifsicle's frame selection syntax: #0 #1-3 #5 etc.
      const info = await this.getGifInfo(file);
      const allIndices = Array.from({ length: info.frameCount }, (_, i) => i);
      const keepIndices = allIndices.filter(i => !indicesToRemove.includes(i));

      if (keepIndices.length === 0) {
        throw new Error('不能删除所有帧');
      }

      // Build frame selection string
      const frameSelections = this._buildFrameSelection(keepIndices);

      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`input.gif ${frameSelections} -o /out/output.gif`]
      });

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('删除帧失败');
    } catch (error) {
      console.error('removeFrames error:', error);
      throw error;
    }
  }

  /**
   * Insert a frame by duplicating a nearby frame at a specific position
   * 插帧功能 — duplicates the closest frame and inserts it
   */
  async insertFrame(file: File, insertAfter: number): Promise<File> {
    const info = await this.getGifInfo(file);
    const srcIdx = Math.max(0, Math.min(insertAfter, info.frameCount - 1));
    return this.duplicateFrame(file, srcIdx, insertAfter);
  }

  /**
   * Duplicate a specific frame at a specific position
   * 复制帧功能
   */
  async duplicateFrame(file: File, sourceIndex: number, insertAfter: number): Promise<File> {
    try {
      const info = await this.getGifInfo(file);
      const frameIndices = Array.from({ length: info.frameCount }, (_, i) => i);

      // Insert a copy of sourceIndex at position insertAfter+1
      const insertIdx = Math.min(insertAfter + 1, info.frameCount);
      const newOrder: number[] = [];
      for (let i = 0; i < insertIdx; i++) {
        newOrder.push(i);
      }
      newOrder.push(sourceIndex);
      for (let i = insertIdx; i < info.frameCount; i++) {
        newOrder.push(i);
      }

      const frameSelection = this._buildFrameSelection(newOrder);

      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`input.gif ${frameSelection} -o /out/output.gif`]
      });

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('复制帧失败');
    } catch (error) {
      console.error('duplicateFrame error:', error);
      throw error;
    }
  }

  /**
   * Delete a single frame at the specified index
   */
  async deleteFrame(file: File, index: number): Promise<File> {
    return this.removeFrames(file, [index]);
  }

  /**
   * Compress GIF with given optimization level and optional lossy compression
   * 压缩功能
   */
  async compress(file: File, level: string = 'O2', lossy?: number, colors?: number, scale?: number): Promise<File> {
    try {
      const commands: string[] = [];

      // Build optimization flags
      const opts: string[] = [];
      opts.push(`-${level}`);

      if (lossy !== undefined && lossy > 0 && lossy <= 200) {
        opts.push(`--lossy=${lossy}`);
      }
      if (colors !== undefined && colors > 0 && colors <= 256) {
        opts.push(`--colors=${colors}`);
      }
      if (scale !== undefined && scale > 0 && scale < 1) {
        opts.push(`--scale=${scale}`);
      }

      const optStr = opts.join(' ');
      commands.push(`${optStr} input.gif -o /out/output.gif`);
      console.log('[compress] command:', commands);

      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: commands
      });

      console.log('[compress] gifsicle result:', result.map(f => f.name));

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('压缩失败：gifsicle 未返回输出文件');
    } catch (error) {
      console.error('[compress] error:', error);
      throw error;
    }
  }

  /**
   * Resize the GIF to specified dimensions
   */
  async resize(file: File, width?: number, height?: number, method?: string): Promise<File> {
    try {
      let sizeParam: string;
      if (width && height) {
        sizeParam = `${width}x${height}`;
      } else if (width) {
        sizeParam = `${width}x_`;
      } else if (height) {
        sizeParam = `_x${height}`;
      } else {
        throw new Error('必须指定宽度或高度');
      }

      const methodFlag = method ? `--resize-method ${method}` : '';

      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [
          `${methodFlag} --resize ${sizeParam} input.gif -o /out/output.gif`
        ]
      });

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('调整尺寸失败');
    } catch (error) {
      console.error('resize error:', error);
      throw error;
    }
  }

  /**
   * Scale GIF by a factor (0.5 = 50%)
   */
  async scale(file: File, factor: number): Promise<File> {
    try {
      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`--scale ${factor} -O2 input.gif -o /out/output.gif`]
      });

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('缩放失败');
    } catch (error) {
      console.error('scale error:', error);
      throw error;
    }
  }

  /**
   * Rotate the GIF by 90, 180, or 270 degrees
   */
  async rotate(file: File, degrees: 90 | 180 | 270): Promise<File> {
    try {
      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`--rotate-${degrees} input.gif -o /out/output.gif`]
      });

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('旋转失败');
    } catch (error) {
      console.error('rotate error:', error);
      throw error;
    }
  }

  /**
   * Change play speed by modifying frame delays
   * speedFactor: 2 = 2x faster, 0.5 = half speed
   */
  async changeSpeed(file: File, speedFactor: number): Promise<File> {
    try {
      const info = await this.getGifInfo(file);
      if (info.delays.length === 0) return file;

      // Build delay commands for each frame
      const delayCmds: string[] = [];
      for (let i = 0; i < info.delays.length; i++) {
        const newDelay = Math.max(1, Math.round(info.delays[i] / speedFactor));
        delayCmds.push(`-d${newDelay} "#${i}"`);
      }

      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`${delayCmds.join(' ')} input.gif -o /out/output.gif`]
      });

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('调整速度失败');
    } catch (error) {
      console.error('changeSpeed error:', error);
      throw error;
    }
  }

  /**
   * Merge multiple GIF files into one
   */
  async merge(files: File[]): Promise<File> {
    try {
      const inputs = files.map((file, i) => ({ file, name: `${i + 1}.gif` }));
      const fileNames = inputs.map(inp => inp.name).join(' ');

      const result = await gifsicle.run({
        input: inputs,
        command: [`--merge ${fileNames} -o /out/output.gif`]
      });

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('合并失败');
    } catch (error) {
      console.error('merge error:', error);
      throw error;
    }
  }

  /**
   * Crop the GIF to a specific region
   */
  async crop(file: File, x: number, y: number, width: number, height: number): Promise<File> {
    try {
      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`--crop ${x},${y}+${width}x${height} input.gif -o /out/output.gif`]
      });

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('裁剪失败');
    } catch (error) {
      console.error('crop error:', error);
      throw error;
    }
  }

  /**
   * Change loop count
   * 0 = infinite, N = loop N times
   */
  async setLoopCount(file: File, count: number): Promise<File> {
    try {
      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`--loopcount=${count} input.gif -o /out/output.gif`]
      });

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('设置循环次数失败');
    } catch (error) {
      console.error('setLoopCount error:', error);
      throw error;
    }
  }

  /**
   * Reverse the GIF animation
   */
  async reverse(file: File): Promise<File> {
    try {
      const result = await gifsicle.run({
        input: [{ file, name: 'input.gif' }],
        command: [`input.gif #-1-0 -o /out/output.gif`]
      });

      if (result.length > 0) {
        const outFile = result.find(f => f.name === 'output.gif') || result[0];
        return outFile as File;
      }

      throw new Error('翻转失败');
    } catch (error) {
      console.error('reverse error:', error);
      throw error;
    }
  }

  // --- Private helpers ---

  private _getDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法加载图片'));
      };
      img.src = url;
    });
  }

  /**
   * Build gifsicle frame selection string from array of frame indices
   * E.g., [0, 1, 2, 5, 6] => "#0-2 #5-6"
   */
  private _buildFrameSelection(indices: number[]): string {
    if (indices.length === 0) return '';

    const sorted = [...indices].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push(start === end ? `#${start}` : `#${start}-${end}`);
        start = sorted[i];
        end = sorted[i];
      }
    }
    ranges.push(start === end ? `#${start}` : `#${start}-${end}`);

    return ranges.join(' ');
  }
}

export default GifEditor;
