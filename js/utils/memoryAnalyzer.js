/**
 * 内存分析器
 * 专门用于分析Wallpaper Engine中的内存使用情况
 */

class MemoryAnalyzer {
  constructor() {
    this.isWallpaperEngine = window.wallpaperEngineAPI && window.wallpaperEngineAPI.isInWallpaperEngine();
    this.memoryHistory = [];
    this.maxHistoryLength = 300; // 保存5分钟的历史数据（每秒一次）
    this.monitoringInterval = null;
    this.isMonitoring = false;
    
    console.log(`内存分析器初始化 (环境: ${this.isWallpaperEngine ? 'Wallpaper Engine' : '浏览器'})`);
  }

  /**
   * 开始内存监控
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.memoryHistory = [];
    
    // 每秒记录一次内存使用情况
    this.monitoringInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 1000);
    
    console.log('内存监控已启动');
    this.logCurrentMemoryInfo();
  }

  /**
   * 停止内存监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('内存监控已停止');
    this.generateMemoryReport();
  }

  /**
   * 记录内存使用情况
   */
  recordMemoryUsage() {
    const memoryInfo = this.getDetailedMemoryInfo();
    
    this.memoryHistory.push({
      timestamp: Date.now(),
      ...memoryInfo
    });
    
    // 限制历史记录长度
    if (this.memoryHistory.length > this.maxHistoryLength) {
      this.memoryHistory.shift();
    }
  }

  /**
   * 获取详细的内存信息
   */
  getDetailedMemoryInfo() {
    const info = {
      jsHeap: null,
      pixiMemory: null,
      spineMemory: null,
      textureMemory: null,
      totalEstimated: 0
    };

    // 1. JavaScript堆内存
    if (performance.memory) {
      info.jsHeap = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        usedMB: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1),
        totalMB: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1),
        limitMB: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)
      };
      info.totalEstimated += performance.memory.usedJSHeapSize;
    }

    // 2. PIXI渲染器内存估算
    if (window.app && window.app.renderManager && window.app.renderManager.app) {
      const renderer = window.app.renderManager.app.renderer;
      info.pixiMemory = this.estimatePixiMemory(renderer);
      info.totalEstimated += info.pixiMemory.estimated;
    }

    // 3. Spine模型内存估算
    if (window.app && window.app.currentModel) {
      info.spineMemory = this.estimateSpineMemory(window.app.currentModel);
      info.totalEstimated += info.spineMemory.estimated;
    }

    // 4. 纹理内存估算
    info.textureMemory = this.estimateTextureMemory();
    info.totalEstimated += info.textureMemory.estimated;

    // 转换为MB
    info.totalEstimatedMB = (info.totalEstimated / 1024 / 1024).toFixed(1);

    return info;
  }

  /**
   * 估算PIXI内存使用
   */
  estimatePixiMemory(renderer) {
    let estimated = 0;
    const details = {
      canvasSize: 0,
      buffers: 0,
      other: 0
    };

    try {
      // 画布内存
      if (renderer.view) {
        const canvas = renderer.view;
        details.canvasSize = canvas.width * canvas.height * 4; // RGBA
        estimated += details.canvasSize;
      }

      // 估算其他PIXI开销
      details.other = 10 * 1024 * 1024; // 估算10MB基础开销
      estimated += details.other;

    } catch (error) {
      console.warn('估算PIXI内存时出错:', error);
    }

    return {
      estimated,
      estimatedMB: (estimated / 1024 / 1024).toFixed(1),
      details
    };
  }

  /**
   * 估算Spine模型内存使用
   */
  estimateSpineMemory(spineModel) {
    let estimated = 0;
    const details = {
      skeleton: 0,
      animations: 0,
      attachments: 0
    };

    try {
      if (spineModel.skeleton) {
        // 骨骼数据估算
        const boneCount = spineModel.skeleton.bones.length;
        details.skeleton = boneCount * 1024; // 每个骨骼约1KB
        
        // 动画数据估算
        if (spineModel.skeleton.data && spineModel.skeleton.data.animations) {
          const animCount = spineModel.skeleton.data.animations.length;
          details.animations = animCount * 50 * 1024; // 每个动画约50KB
        }
        
        // 附件数据估算
        if (spineModel.skeleton.slots) {
          details.attachments = spineModel.skeleton.slots.length * 10 * 1024; // 每个插槽约10KB
        }
      }

      estimated = details.skeleton + details.animations + details.attachments;

    } catch (error) {
      console.warn('估算Spine内存时出错:', error);
    }

    return {
      estimated,
      estimatedMB: (estimated / 1024 / 1024).toFixed(1),
      details
    };
  }

  /**
   * 估算纹理内存使用
   */
  estimateTextureMemory() {
    let estimated = 0;
    const details = {
      pixiTextures: 0,
      spineTextures: 0,
      count: 0
    };

    try {
      // PIXI纹理缓存
      if (PIXI.utils && PIXI.utils.TextureCache) {
        for (const key in PIXI.utils.TextureCache) {
          const texture = PIXI.utils.TextureCache[key];
          if (texture && texture.baseTexture && texture.baseTexture.resource) {
            const width = texture.baseTexture.width || 0;
            const height = texture.baseTexture.height || 0;
            const textureSize = width * height * 4; // RGBA
            details.pixiTextures += textureSize;
            details.count++;
          }
        }
      }

      estimated = details.pixiTextures + details.spineTextures;

    } catch (error) {
      console.warn('估算纹理内存时出错:', error);
    }

    return {
      estimated,
      estimatedMB: (estimated / 1024 / 1024).toFixed(1),
      details
    };
  }

  /**
   * 输出当前内存信息
   */
  logCurrentMemoryInfo() {
    const info = this.getDetailedMemoryInfo();
    
    console.log('=== 当前内存使用情况 ===');
    
    if (info.jsHeap) {
      console.log(`JS堆内存: ${info.jsHeap.usedMB}MB / ${info.jsHeap.totalMB}MB (限制: ${info.jsHeap.limitMB}MB)`);
    }
    
    if (info.pixiMemory) {
      console.log(`PIXI内存估算: ${info.pixiMemory.estimatedMB}MB`);
    }
    
    if (info.spineMemory) {
      console.log(`Spine模型估算: ${info.spineMemory.estimatedMB}MB`);
    }
    
    if (info.textureMemory) {
      console.log(`纹理内存估算: ${info.textureMemory.estimatedMB}MB (${info.textureMemory.details.count}个纹理)`);
    }
    
    console.log(`总估算内存使用: ${info.totalEstimatedMB}MB`);
    
    // 在Wallpaper Engine中给出建议
    if (this.isWallpaperEngine) {
      const totalMB = parseFloat(info.totalEstimatedMB);
      if (totalMB > 500) {
        console.warn('⚠️ 内存使用较高，可能影响性能');
      } else if (totalMB > 200) {
        console.log('ℹ️ 内存使用正常');
      } else {
        console.log('✅ 内存使用较低');
      }
    }
  }

  /**
   * 生成内存使用报告
   */
  generateMemoryReport() {
    if (this.memoryHistory.length === 0) {
      console.log('没有内存使用历史数据');
      return;
    }

    const jsHeapUsage = this.memoryHistory
      .filter(record => record.jsHeap)
      .map(record => record.jsHeap.used / 1024 / 1024);

    const totalUsage = this.memoryHistory
      .map(record => record.totalEstimated / 1024 / 1024);

    console.log('=== 内存使用报告 ===');
    console.log(`监控时长: ${(this.memoryHistory.length / 60).toFixed(1)}分钟`);
    
    if (jsHeapUsage.length > 0) {
      console.log(`JS堆内存 - 平均: ${this.average(jsHeapUsage).toFixed(1)}MB, 最大: ${Math.max(...jsHeapUsage).toFixed(1)}MB, 最小: ${Math.min(...jsHeapUsage).toFixed(1)}MB`);
    }
    
    console.log(`总内存估算 - 平均: ${this.average(totalUsage).toFixed(1)}MB, 最大: ${Math.max(...totalUsage).toFixed(1)}MB, 最小: ${Math.min(...totalUsage).toFixed(1)}MB`);
    
    // 检测内存泄漏
    this.detectMemoryLeaks();
  }

  /**
   * 检测内存泄漏
   */
  detectMemoryLeaks() {
    if (this.memoryHistory.length < 60) return; // 至少需要1分钟数据

    const recentData = this.memoryHistory.slice(-60); // 最近1分钟
    const earlyData = this.memoryHistory.slice(0, 60); // 最早1分钟

    const recentAvg = this.average(recentData.map(r => r.totalEstimated));
    const earlyAvg = this.average(earlyData.map(r => r.totalEstimated));

    const growthRate = (recentAvg - earlyAvg) / earlyAvg;

    if (growthRate > 0.1) { // 增长超过10%
      console.warn(`⚠️ 检测到可能的内存泄漏，内存增长率: ${(growthRate * 100).toFixed(1)}%`);
    } else {
      console.log('✅ 未检测到明显的内存泄漏');
    }
  }

  /**
   * 计算平均值
   */
  average(array) {
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }

  /**
   * 获取内存历史数据
   */
  getMemoryHistory() {
    return [...this.memoryHistory];
  }
}

// 创建全局实例
window.memoryAnalyzer = new MemoryAnalyzer();

// 导出类
window.MemoryAnalyzer = MemoryAnalyzer;

// 提供便捷的控制台命令
window.startMemoryAnalysis = () => window.memoryAnalyzer.startMonitoring();
window.stopMemoryAnalysis = () => window.memoryAnalyzer.stopMonitoring();
window.checkMemoryNow = () => window.memoryAnalyzer.logCurrentMemoryInfo();
