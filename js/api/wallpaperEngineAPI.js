/**
 * wallpaperEngineAPI.js - Wallpaper Engine API集成
 * 仅处理基本的Wallpaper Engine环境检测和系统级功能
 */

class WallpaperEngineAPI {
  constructor() {
    this.isWallpaperEngine = false;
    this.listeners = new Map();
    this.isPaused = false; // 跟踪暂停状态，避免重复操作

    // 检测是否在Wallpaper Engine环境中
    this.detectWallpaperEngine();

    // 初始化API
    this.init();
  }

  /**
   * 检测是否在Wallpaper Engine环境中
   */
  detectWallpaperEngine() {
    // 检查是否存在Wallpaper Engine的全局对象或特定环境标识
    this.isWallpaperEngine = typeof window.wallpaperRegisterAudioListener !== 'undefined' ||
                             typeof window.wallpaperPropertyListener !== 'undefined' ||
                             window.location.protocol === 'file:';

    console.log(`Wallpaper Engine环境检测: ${this.isWallpaperEngine ? '是' : '否'}`);
  }

  /**
   * 初始化Wallpaper Engine API
   */
  init() {
    try {
      // 注册音频监听器（如果需要音频响应功能）
      this.registerAudioListener();

      // 注册属性监听器（处理系统级属性）
      this.registerPropertyListener();

      // 注册窗口可见性监听器
      this.registerVisibilityListener();

      console.log('Wallpaper Engine API初始化完成');
    } catch (error) {
      console.error('Wallpaper Engine API初始化失败:', error);
    }
  }

  /**
   * 注册音频监听器
   */
  registerAudioListener() {
    if (typeof window.wallpaperRegisterAudioListener === 'function') {
      window.wallpaperRegisterAudioListener((audioArray) => {
        this.handleAudioData(audioArray);
      });
      console.log('音频监听器已注册');
    }
  }

  /**
   * 注册属性监听器
   */
  registerPropertyListener() {
    window.wallpaperPropertyListener = {
      applyUserProperties: (properties) => {
        // 用户自定义属性处理（如果project.json中有定义）
        console.log('收到用户属性更新:', properties);
      },
      applyGeneralProperties: (properties) => {
        this.handleGeneralProperties(properties);
      }
    };
    console.log('属性监听器已注册');
  }

  /**
   * 注册窗口可见性监听器
   */
  registerVisibilityListener() {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      const isHidden = document.hidden;
      console.log(`页面可见性变化: ${isHidden ? '隐藏' : '可见'}`);

      if (isHidden) {
        this.pauseWallpaper();
      } else {
        this.resumeWallpaper();
      }
    });

    // 监听窗口焦点变化（备用方案）
    window.addEventListener('blur', () => {
      console.log('窗口失去焦点');
      // 延迟检查，避免短暂的焦点切换
      setTimeout(() => {
        if (document.hidden) {
          this.pauseWallpaper();
        }
      }, 100);
    });

    window.addEventListener('focus', () => {
      console.log('窗口获得焦点');
      if (!document.hidden) {
        this.resumeWallpaper();
      }
    });

    console.log('窗口可见性监听器已注册');
  }

  /**
   * 处理音频数据
   * @param {Array} audioArray - 音频频谱数据
   */
  handleAudioData(audioArray) {
    this.emit('audioData', audioArray);
  }

  /**
   * 处理通用属性（系统级）
   * @param {Object} properties - 通用属性对象
   */
  handleGeneralProperties(properties) {
    console.log('收到通用属性更新:', properties);

    // 处理暂停状态
    if (properties.paused !== undefined) {
      this.handlePauseState(properties.paused);
    }

    // 处理FPS
    if (properties.fps !== undefined) {
      this.handleFPS(properties.fps);
    }

    // 触发通用属性更新事件
    this.emit('generalProperties', properties);
  }

  /**
   * 处理FPS设置
   * @param {number} fps - 目标FPS
   */
  handleFPS(fps) {
    console.log(`FPS设置: ${fps}`);
    this.emit('fpsChange', fps);

    if (window.frameRateManager && fps > 0) {
      window.frameRateManager.setEnabled(true);
      window.frameRateManager.setTargetFPS(fps);
    }
  }

  /**
   * 处理暂停状态
   * @param {boolean} paused - 是否暂停
   */
  handlePauseState(paused) {
    console.log(`壁纸状态: ${paused ? '暂停' : '运行'}`);
    this.emit('pauseState', paused);

    if (paused) {
      this.pauseWallpaper();
    } else {
      this.resumeWallpaper();
    }
  }

  /**
   * 暂停壁纸（包括视觉效果和音频）
   */
  pauseWallpaper() {
    if (this.isPaused) return; // 避免重复暂停

    this.isPaused = true;

    // 暂停视觉效果
    if (window.app?.app?.ticker) {
      window.app.app.ticker.stop();
    }

    // 暂停BGM音频
    if (window.bgmControl) {
      window.bgmControl.pause();
    } else if (window.bgmAudio) {
      window.bgmAudio.pause();
    }

    // 暂停对话音频
    if (window.dialogueManager) {
      window.dialogueManager.pauseAllAudio();
    }

    // 强制暂停所有页面中的音频元素
    this.pauseAllPageAudio();

    // 暂停其他动画系统
    if (window.animationControl) {
      window.animationControl.pauseAnimation();
    }

    console.log('壁纸已完全暂停（包括音频）');
  }

  /**
   * 恢复壁纸（包括视觉效果和音频）
   */
  resumeWallpaper() {
    if (!this.isPaused) return; // 避免重复恢复

    this.isPaused = false;

    // 恢复视觉效果
    if (window.app?.app?.ticker) {
      window.app.app.ticker.start();
    }

    // 恢复BGM音频
    if (window.bgmControl) {
      window.bgmControl.resume();
    } else if (window.bgmAudio) {
      window.bgmAudio.play().catch(e => {
        console.log('音频恢复失败（可能需要用户交互）:', e);
      });
    }

    // 恢复对话音频
    if (window.dialogueManager) {
      window.dialogueManager.resumeAllAudio();
    }

    // 强制恢复所有页面中的音频元素
    this.resumeAllPageAudio();

    // 恢复其他动画系统
    if (window.animationControl) {
      window.animationControl.resumeAnimation();
    }

    console.log('壁纸已完全恢复（包括音频）');
  }

  /**
   * 强制暂停页面中所有音频元素
   */
  pauseAllPageAudio() {
    try {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        if (!audio.paused) {
          audio.pause();
          // 标记这个音频是被我们暂停的
          audio.setAttribute('data-wallpaper-paused', 'true');
        }
      });
      console.log(`强制暂停了 ${audioElements.length} 个音频元素`);
    } catch (error) {
      console.error('强制暂停音频失败:', error);
    }
  }

  /**
   * 强制恢复页面中所有音频元素
   */
  resumeAllPageAudio() {
    try {
      const audioElements = document.querySelectorAll('audio[data-wallpaper-paused="true"]');
      audioElements.forEach(audio => {
        audio.play().catch(e => {
          console.log('恢复音频失败:', e);
        });
        // 移除暂停标记
        audio.removeAttribute('data-wallpaper-paused');
      });
      console.log(`强制恢复了 ${audioElements.length} 个音频元素`);
    } catch (error) {
      console.error('强制恢复音频失败:', error);
    }
  }

  // ===== 工具方法 =====

  /**
   * 事件发射器
   */
  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`事件监听器执行失败 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 添加事件监听器
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  /**
   * 移除事件监听器
   */
  off(event, listener) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 检查是否在Wallpaper Engine环境中
   */
  isInWallpaperEngine() {
    return this.isWallpaperEngine;
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.listeners.clear();
    console.log('Wallpaper Engine API已清理');
  }
}

// 创建全局实例
window.wallpaperEngineAPI = new WallpaperEngineAPI();

// 导出类
window.WallpaperEngineAPI = WallpaperEngineAPI;
