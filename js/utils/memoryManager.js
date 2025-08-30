/**
 * 内存管理器
 * 负责监控和清理内存使用，防止缓存满导致的性能问题
 */

class MemoryManager {
  constructor() {
    this.isEnabled = false; // 默认禁用自动清理，避免频繁清理导致卡顿
    this.monitoringInterval = null;
    this.cleanupThreshold = 0.95; // 设置很高的阈值，基本不会触发自动清理
    this.lastCleanupTime = 0;
    this.cleanupCooldown = 300000; // 增加到5分钟清理冷却时间
    
    // 内存使用统计
    this.memoryStats = {
      used: 0,
      total: 0,
      percentage: 0,
      lastUpdate: 0
    };

    // 检测是否在Wallpaper Engine环境中
    this.isWallpaperEngine = this.detectWallpaperEngine();
    
    this.init();
  }

  /**
   * 检测是否在Wallpaper Engine环境中
   */
  detectWallpaperEngine() {
    return typeof window.wallpaperEngineAPI !== 'undefined' && 
           window.wallpaperEngineAPI.isInWallpaperEngine();
  }

  /**
   * 初始化内存管理器
   */
  init() {
    console.log('内存管理器初始化（自动清理已禁用）...');

    // 默认不启动监控，避免频繁清理导致卡顿
    if (this.isEnabled) {
      const monitorInterval = 60000; // 如果启用，使用1分钟间隔
      this.startMemoryMonitoring(monitorInterval);
      console.log(`内存监控已启动 (监控间隔: ${monitorInterval}ms)`);
    } else {
      console.log('内存自动清理已禁用，避免频繁清理导致卡顿');
    }

    // 监听页面卸载事件
    window.addEventListener('beforeunload', () => {
      this.performFinalCleanup();
    });

    console.log('内存管理器初始化完成');
  }

  /**
   * 开始内存监控
   */
  startMemoryMonitoring(interval = 30000) {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, interval);
  }

  /**
   * 检查内存使用情况
   */
  checkMemoryUsage() {
    try {
      // 尝试获取内存信息
      let memoryInfo = null;
      
      // 方法1: 使用performance.memory (Chrome)
      if (performance.memory) {
        memoryInfo = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      // 方法2: 使用navigator.deviceMemory (部分浏览器)
      else if (navigator.deviceMemory) {
        const estimatedUsed = navigator.deviceMemory * 1024 * 1024 * 1024 * 0.3; // 估算30%使用率
        memoryInfo = {
          used: estimatedUsed,
          total: navigator.deviceMemory * 1024 * 1024 * 1024,
          limit: navigator.deviceMemory * 1024 * 1024 * 1024
        };
      }

      if (memoryInfo) {
        this.updateMemoryStats(memoryInfo);
        
        // 检查是否需要清理
        if (this.shouldPerformCleanup()) {
          this.performMemoryCleanup();
        }
      }
    } catch (error) {
      console.warn('检查内存使用情况时出错:', error);
    }
  }

  /**
   * 更新内存统计
   */
  updateMemoryStats(memoryInfo) {
    this.memoryStats = {
      used: memoryInfo.used,
      total: memoryInfo.total,
      percentage: memoryInfo.used / memoryInfo.total,
      lastUpdate: Date.now()
    };

    // 在Wallpaper Engine中，如果内存使用率较高，输出警告
    if (this.isWallpaperEngine && this.memoryStats.percentage > 0.7) {
      console.warn(`内存使用率较高: ${(this.memoryStats.percentage * 100).toFixed(1)}%`);
    }
  }

  /**
   * 判断是否应该执行清理
   */
  shouldPerformCleanup() {
    const now = Date.now();
    const timeSinceLastCleanup = now - this.lastCleanupTime;
    
    return this.memoryStats.percentage > this.cleanupThreshold && 
           timeSinceLastCleanup > this.cleanupCooldown;
  }

  /**
   * 执行内存清理（已禁用，避免频繁清理导致卡顿）
   */
  performMemoryCleanup() {
    console.log('内存清理已禁用，避免频繁清理导致卡顿');

    // 只更新最后清理时间，不执行实际清理
    this.lastCleanupTime = Date.now();

    // 如果真的需要清理，可以手动调用 performManualCleanup()
    console.log('如需手动清理，请调用: window.memoryManager.performManualCleanup()');
  }

  /**
   * 手动内存清理（仅在必要时使用）
   */
  performManualCleanup() {
    console.log('执行手动内存清理...');
    const startTime = Date.now();

    try {
      // 只执行最基本的清理，避免过度清理
      this.forceGarbageCollection();

      const cleanupTime = Date.now() - startTime;
      console.log(`手动内存清理完成，耗时: ${cleanupTime}ms`);

    } catch (error) {
      console.error('手动内存清理时出错:', error);
    }
  }

  /**
   * 清理PIXI资源（已禁用）
   */
  cleanupPixiResources() {
    console.log('PIXI资源清理已禁用，避免频繁清理导致卡顿');
    // 不再执行任何PIXI资源清理操作
  }

  /**
   * 强制垃圾回收
   */
  forceGarbageCollection() {
    try {
      // 如果在支持的环境中，触发垃圾回收
      if (window.gc && typeof window.gc === 'function') {
        window.gc();
        console.log('已触发垃圾回收');
      }
    } catch (error) {
      console.warn('强制垃圾回收时出错:', error);
    }
  }

  /**
   * 执行最终清理（页面卸载时）
   */
  performFinalCleanup() {
    console.log('执行最终清理（轻量化）...');

    // 停止监控
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // 不再执行内存清理，避免页面卸载时的卡顿
    console.log('页面卸载时不执行内存清理，避免卡顿');
  }

  /**
   * 获取内存统计信息
   */
  getMemoryStats() {
    return { ...this.memoryStats };
  }

  /**
   * 设置清理阈值
   */
  setCleanupThreshold(threshold) {
    this.cleanupThreshold = Math.max(0.5, Math.min(0.95, threshold));
    console.log(`内存清理阈值已设置为: ${(this.cleanupThreshold * 100).toFixed(1)}%`);
  }

  /**
   * 启用/禁用内存管理
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      this.startMemoryMonitoring();
    } else if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log(`内存管理器已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.performFinalCleanup();
    console.log('内存管理器已清理');
  }
}

// 创建全局实例
window.memoryManager = new MemoryManager();

// 导出类
window.MemoryManager = MemoryManager;
