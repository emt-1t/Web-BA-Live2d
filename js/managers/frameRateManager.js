/**
 * 帧率管理器
 * 负责控制应用的帧率限制
 */

class FrameRateManager {
  constructor(app) {
    this.app = app;

    // 帧率设置
    this.options = {
      enabled: true,           // 是否启用帧率限制
      targetFPS: 60           // 目标帧率
    };

    // 帧率监控
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.currentFPS = 0;
    this.fpsHistory = [];
    this.maxHistoryLength = 60; // 保存60帧的历史记录



    // 预设帧率选项
    this.fpsPresets = {
      '30': { fps: 30, name: '30 FPS (省电)' },
      '60': { fps: 60, name: '60 FPS (流畅)' },
      '120': { fps: 120, name: '120 FPS (竞技)' },
      'unlimited': { fps: 0, name: '无限制' }
    };

    this.init();

    // 设置模型加载监听器
    this.setupModelLoadingListeners();
  }

  /**
   * 初始化帧率管理器
   */
  init() {
    try {
      // 从全局设置控制器获取设置
      if (window.settingsControl && window.settingsControl.settings) {
        const settings = window.settingsControl.settings;
        if (settings.frameRateEnabled !== undefined) {
          this.options.enabled = settings.frameRateEnabled;
        }
        if (settings.targetFPS !== undefined) {
          this.options.targetFPS = settings.targetFPS;
        }


      }

      // 在模型加载期间启用临时性能优化
      this.enableLoadingOptimization();

      // 应用初始帧率设置
      this.applyFrameRateSettings();

      // 开始帧率监控
      this.startMonitoring();

      console.log("帧率管理器初始化完成", this.options);
    } catch (error) {
      console.error("帧率管理器初始化失败:", error);
    }
  }

  /**
   * 应用帧率设置
   */
  applyFrameRateSettings() {
    if (!this.app || !this.app.app) {
      console.warn("PIXI应用未找到，无法应用帧率设置");
      return;
    }

    const pixiApp = this.app.app;

    try {
      // 检查是否在Wallpaper Engine环境中
      const isWallpaperEngine = window.wallpaperEngineAPI && window.wallpaperEngineAPI.isInWallpaperEngine();

      if (this.options.enabled) {
        if (this.options.targetFPS > 0) {
          // 设置目标帧率
          const oldMaxFPS = pixiApp.ticker.maxFPS;

          // 在Wallpaper Engine中，使用更温和的帧率调整方式
          if (isWallpaperEngine) {
            // 直接设置maxFPS，避免ticker重启
            pixiApp.ticker.maxFPS = this.options.targetFPS;

            // 如果帧率变化较大，使用渐进式调整
            if (Math.abs(oldMaxFPS - this.options.targetFPS) > 30) {
              this.gradualFrameRateAdjustment(pixiApp, oldMaxFPS, this.options.targetFPS);
            }
          } else {
            // 浏览器环境中可以使用原来的方式
            pixiApp.ticker.maxFPS = this.options.targetFPS;
            if (pixiApp.ticker.started && oldMaxFPS !== this.options.targetFPS) {
              this.smoothTickerUpdate(pixiApp);
            }
          }

          console.log(`帧率限制已设置为: ${this.options.targetFPS} FPS`);
        } else {
          // 无限制帧率
          const oldMaxFPS = pixiApp.ticker.maxFPS;

          if (isWallpaperEngine) {
            // 在Wallpaper Engine中直接设置，避免ticker操作
            pixiApp.ticker.maxFPS = 0;
          } else {
            pixiApp.ticker.maxFPS = 0;
            if (pixiApp.ticker.started && oldMaxFPS !== 0) {
              this.smoothTickerUpdate(pixiApp);
            }
          }

          console.log("帧率限制已移除（无限制）");
        }

      } else {
        // 禁用帧率限制
        const oldMaxFPS = pixiApp.ticker.maxFPS;

        if (isWallpaperEngine) {
          // 在Wallpaper Engine中直接设置为无限制
          pixiApp.ticker.maxFPS = 0;
        } else {
          pixiApp.ticker.maxFPS = 0;
          if (pixiApp.ticker.started && oldMaxFPS !== 0) {
            this.smoothTickerUpdate(pixiApp);
          }
        }

        console.log("帧率管理已禁用");
      }
    } catch (error) {
      console.error("应用帧率设置失败:", error);
    }
  }

  /**
   * 平滑的ticker更新，避免突然的停止/启动
   */
  smoothTickerUpdate(pixiApp) {
    try {
      // 使用requestAnimationFrame来确保在下一帧更新
      requestAnimationFrame(() => {
        if (pixiApp.ticker.started) {
          // 暂时降低速度而不是完全停止
          const originalSpeed = pixiApp.ticker.speed;
          pixiApp.ticker.speed = 0.1;

          // 在下一帧恢复正常速度
          requestAnimationFrame(() => {
            pixiApp.ticker.speed = originalSpeed;
          });
        }
      });
    } catch (error) {
      console.error("平滑ticker更新失败:", error);
      // 回退到原始方法
      if (pixiApp.ticker.started) {
        pixiApp.ticker.stop();
        pixiApp.ticker.start();
      }
    }
  }

  /**
   * 渐进式帧率调整，专为Wallpaper Engine优化
   */
  gradualFrameRateAdjustment(pixiApp, fromFPS, toFPS) {
    try {
      const steps = 5; // 分5步调整
      const stepSize = (toFPS - fromFPS) / steps;
      let currentStep = 0;

      const adjustStep = () => {
        if (currentStep < steps) {
          const newFPS = fromFPS + (stepSize * currentStep);
          pixiApp.ticker.maxFPS = Math.round(newFPS);
          currentStep++;

          // 每50ms调整一次
          setTimeout(adjustStep, 50);
        } else {
          // 最终设置为目标帧率
          pixiApp.ticker.maxFPS = toFPS;
          console.log(`渐进式帧率调整完成: ${fromFPS} -> ${toFPS} FPS`);
        }
      };

      adjustStep();
    } catch (error) {
      console.error("渐进式帧率调整失败:", error);
      // 回退到直接设置
      pixiApp.ticker.maxFPS = toFPS;
    }
  }



  /**
   * 开始帧率监控
   */
  startMonitoring() {
    if (!this.app || !this.app.app) return;

    const pixiApp = this.app.app;

    // 添加帧率监控回调
    pixiApp.ticker.add(this.onFrame.bind(this));

    console.log("帧率监控已启动");
  }

  /**
   * 帧回调函数
   */
  onFrame() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // 计算当前帧率
    if (deltaTime > 0) {
      this.currentFPS = 1000 / deltaTime;

      // 添加到历史记录
      this.fpsHistory.push(this.currentFPS);
      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
      }
    }

    this.frameCount++;
    this.lastTime = currentTime;
  }



  /**
   * 设置目标帧率
   */
  setTargetFPS(fps) {
    this.options.targetFPS = fps;
    this.applyFrameRateSettings();
  }

  /**
   * 设置是否启用帧率限制
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    this.applyFrameRateSettings();
  }





  /**
   * 启用加载期间的性能优化
   */
  enableLoadingOptimization() {
    if (!this.app || !this.app.app) return;

    const pixiApp = this.app.app;
    this.loadingOptimizationActive = true;

    try {
      // 临时降低帧率以减少加载期间的渲染负担
      this.originalMaxFPS = pixiApp.ticker.maxFPS;
      pixiApp.ticker.maxFPS = 30; // 加载期间限制为30FPS

      // 临时降低渲染分辨率
      if (pixiApp.renderer) {
        this.originalResolution = pixiApp.renderer.resolution;
        pixiApp.renderer.resolution = Math.min(this.originalResolution, 1.0);
      }

      console.log("加载优化已启用：临时降低帧率和分辨率");
    } catch (error) {
      console.error("启用加载优化失败:", error);
    }
  }

  /**
   * 禁用加载期间的性能优化
   */
  disableLoadingOptimization() {
    if (!this.app || !this.app.app || !this.loadingOptimizationActive) return;

    const pixiApp = this.app.app;

    try {
      // 恢复原始帧率设置
      if (this.originalMaxFPS !== undefined) {
        pixiApp.ticker.maxFPS = this.originalMaxFPS;
      }

      // 恢复原始渲染分辨率
      if (pixiApp.renderer && this.originalResolution !== undefined) {
        pixiApp.renderer.resolution = this.originalResolution;
      }

      this.loadingOptimizationActive = false;
      console.log("加载优化已禁用：恢复正常帧率和分辨率");
    } catch (error) {
      console.error("禁用加载优化失败:", error);
    }
  }

  /**
   * 监听模型加载事件
   */
  setupModelLoadingListeners() {
    // 监听模型开始加载事件
    document.addEventListener('modelLoadStart', () => {
      this.enableLoadingOptimization();
    });



    // 监听模型加载完成事件
    document.addEventListener('modelLoaded', () => {
      // 延迟禁用优化，给模型一些时间稳定
      setTimeout(() => {
        this.disableLoadingOptimization();
        // 重新应用用户的帧率设置
        this.applyFrameRateSettings();
      }, 1000);
    });


  }



  /**
   * 获取当前帧率
   */
  getCurrentFPS() {
    return Math.round(this.currentFPS);
  }

  /**
   * 获取平均帧率
   */
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 0;
    const avg = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    return Math.round(avg);
  }

  /**
   * 获取帧率统计信息
   */
  getFrameRateStats() {
    return {
      current: this.getCurrentFPS(),
      average: this.getAverageFPS(),
      target: this.options.targetFPS,
      frameCount: this.frameCount,
      enabled: this.options.enabled
    };
  }

  /**
   * 重置帧率统计
   */
  resetStats() {
    this.frameCount = 0;
    this.fpsHistory = [];
    this.lastTime = performance.now();
    console.log("帧率统计已重置");
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.app && this.app.app) {
      // 移除帧率监控回调
      this.app.app.ticker.remove(this.onFrame.bind(this));
    }

    // 清理全局变量
    if (window.frameRateManager === this) {
      window.frameRateManager = null;
    }

    console.log("帧率管理器已清理");
  }
}

// 将类导出为全局变量
window.FrameRateManager = FrameRateManager;
