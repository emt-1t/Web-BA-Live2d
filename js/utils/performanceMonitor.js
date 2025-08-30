/**
 * 性能监控工具
 * 用于监控和诊断Wallpaper Engine中的性能问题
 */

class PerformanceMonitor {
  constructor() {
    this.isEnabled = false;
    this.monitoringInterval = null;
    this.stats = {
      fps: [],
      frameTime: [],
      memoryUsage: [],
      tickerRestarts: 0,
      animationChecks: 0,
      memoryCleanups: 0
    };
    
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    
    // 检测环境
    this.isWallpaperEngine = window.wallpaperEngineAPI && window.wallpaperEngineAPI.isInWallpaperEngine();
    
    console.log(`性能监控器初始化 (环境: ${this.isWallpaperEngine ? 'Wallpaper Engine' : '浏览器'})`);
  }

  /**
   * 开始性能监控
   */
  start() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.startTime = performance.now();
    
    // 每秒收集一次性能数据
    this.monitoringInterval = setInterval(() => {
      this.collectPerformanceData();
    }, 1000);
    
    // 监听相关事件
    this.setupEventListeners();
    
    console.log('性能监控已启动');
  }

  /**
   * 停止性能监控
   */
  stop() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('性能监控已停止');
    this.printSummary();
  }

  /**
   * 收集性能数据
   */
  collectPerformanceData() {
    try {
      // 收集FPS数据
      if (window.frameRateManager) {
        const fpsStats = window.frameRateManager.getFrameRateStats();
        this.stats.fps.push(fpsStats.current);
      }

      // 收集帧时间数据
      const currentTime = performance.now();
      const frameTime = currentTime - this.lastFrameTime;
      this.stats.frameTime.push(frameTime);
      this.lastFrameTime = currentTime;

      // 收集内存数据
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        this.stats.memoryUsage.push(memoryUsage);
      }

      // 限制数据数组长度，避免内存泄漏
      const maxLength = 60; // 保留最近60秒的数据
      Object.keys(this.stats).forEach(key => {
        if (Array.isArray(this.stats[key]) && this.stats[key].length > maxLength) {
          this.stats[key] = this.stats[key].slice(-maxLength);
        }
      });

    } catch (error) {
      console.warn('收集性能数据时出错:', error);
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听动画检查事件（如果有的话）
    const originalCheckAnimationChange = window.idleAnimationSpeedControl?.checkAnimationChange;
    if (originalCheckAnimationChange) {
      window.idleAnimationSpeedControl.checkAnimationChange = () => {
        this.stats.animationChecks++;
        return originalCheckAnimationChange.call(window.idleAnimationSpeedControl);
      };
    }

    // 监听内存清理事件
    const originalPerformMemoryCleanup = window.memoryManager?.performMemoryCleanup;
    if (originalPerformMemoryCleanup) {
      window.memoryManager.performMemoryCleanup = () => {
        this.stats.memoryCleanups++;
        console.log('检测到内存清理操作');
        return originalPerformMemoryCleanup.call(window.memoryManager);
      };
    }
  }

  /**
   * 获取性能统计
   */
  getStats() {
    const runTime = (performance.now() - this.startTime) / 1000; // 秒
    
    return {
      runtime: runTime,
      environment: this.isWallpaperEngine ? 'Wallpaper Engine' : '浏览器',
      fps: {
        current: this.stats.fps[this.stats.fps.length - 1] || 0,
        average: this.calculateAverage(this.stats.fps),
        min: Math.min(...this.stats.fps),
        max: Math.max(...this.stats.fps)
      },
      frameTime: {
        average: this.calculateAverage(this.stats.frameTime),
        min: Math.min(...this.stats.frameTime),
        max: Math.max(...this.stats.frameTime)
      },
      memory: {
        current: this.stats.memoryUsage[this.stats.memoryUsage.length - 1] || 0,
        average: this.calculateAverage(this.stats.memoryUsage),
        min: Math.min(...this.stats.memoryUsage),
        max: Math.max(...this.stats.memoryUsage)
      },
      events: {
        animationChecks: this.stats.animationChecks,
        memoryCleanups: this.stats.memoryCleanups,
        animationChecksPerSecond: this.stats.animationChecks / runTime,
        memoryCleanupFrequency: runTime / (this.stats.memoryCleanups || 1)
      }
    };
  }

  /**
   * 计算平均值
   */
  calculateAverage(array) {
    if (array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }

  /**
   * 打印性能摘要
   */
  printSummary() {
    const stats = this.getStats();
    
    console.log('=== 性能监控摘要 ===');
    console.log(`运行环境: ${stats.environment}`);
    console.log(`运行时间: ${stats.runtime.toFixed(1)}秒`);
    console.log(`FPS - 当前: ${stats.fps.current}, 平均: ${stats.fps.average.toFixed(1)}, 范围: ${stats.fps.min}-${stats.fps.max}`);
    console.log(`帧时间 - 平均: ${stats.frameTime.average.toFixed(1)}ms, 范围: ${stats.frameTime.min.toFixed(1)}-${stats.frameTime.max.toFixed(1)}ms`);
    console.log(`内存使用 - 当前: ${stats.memory.current.toFixed(1)}MB, 平均: ${stats.memory.average.toFixed(1)}MB`);
    console.log(`动画检查: ${stats.events.animationChecks}次 (${stats.events.animationChecksPerSecond.toFixed(2)}次/秒)`);
    console.log(`内存清理: ${stats.events.memoryCleanups}次 (每${stats.events.memoryCleanupFrequency.toFixed(1)}秒一次)`);
    
    // 性能建议
    this.provideSuggestions(stats);
  }

  /**
   * 提供性能建议
   */
  provideSuggestions(stats) {
    console.log('\n=== 性能建议 ===');
    
    if (stats.fps.average < 30) {
      console.log('⚠️ 平均FPS较低，建议降低目标帧率或检查性能瓶颈');
    }
    
    if (stats.frameTime.max > 50) {
      console.log('⚠️ 检测到帧时间峰值过高，可能存在卡顿');
    }
    
    if (stats.events.animationChecksPerSecond > 5) {
      console.log('⚠️ 动画检查频率较高，建议增加检查间隔');
    }
    
    if (stats.events.memoryCleanupFrequency < 30) {
      console.log('⚠️ 内存清理过于频繁，建议调整清理阈值');
    }
    
    if (stats.fps.average >= 30 && stats.frameTime.max <= 50) {
      console.log('✅ 性能表现良好');
    }
  }

  /**
   * 检测卡顿
   */
  detectStuttering() {
    if (this.stats.frameTime.length < 10) return false;
    
    const recent = this.stats.frameTime.slice(-10);
    const average = this.calculateAverage(recent);
    const threshold = average * 2; // 超过平均值2倍认为是卡顿
    
    return recent.some(time => time > threshold);
  }
}

// 创建全局实例
window.performanceMonitor = new PerformanceMonitor();

// 导出类
window.PerformanceMonitor = PerformanceMonitor;

// 提供便捷的控制台命令
window.startPerformanceMonitoring = () => window.performanceMonitor.start();
window.stopPerformanceMonitoring = () => window.performanceMonitor.stop();
window.getPerformanceStats = () => window.performanceMonitor.getStats();
