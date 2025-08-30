/**
 * idleAnimationSpeedControl.js - 待机动画倍速控制模块
 * 专门用于控制主模型的待机动画播放倍速，支持同时控制多个待机动画
 */

class IdleAnimationSpeedControl {
  /**
   * 构造函数
   * @param {Object} app - App实例，用于获取spine动画
   * @param {Object} animationControl - 动画控制实例
   */
  constructor(app, animationControl) {
    // 保存引用
    this.app = app;
    this.animationControl = animationControl;

    // 默认设置
    this.options = {
      enabled: true,                // 是否启用倍速控制
      speed: 1.0,                   // 当前倍速 (1-16倍)
      minSpeed: 1.0,                // 最小倍速
      maxSpeed: 16.0,               // 最大倍速
      targetAnimationNames: ['Idle_01', 'Idle_01_R'] // 目标动画名称列表
    };

    // 状态变量
    this.isActive = false;          // 是否正在控制倍速
    this.originalTimeScale = 1.0;   // 原始时间缩放
    this.lastCheckedAnimations = {}; // 上次检查的各轨道动画名称
    this.checkInterval = null;      // 定时检查间隔
    this.activeIdleAnimations = new Set(); // 当前活跃的待机动画

    // 初始化
    this.init();
  }
  
  /**
   * 初始化倍速控制
   */
  init() {
    console.log('初始化待机动画倍速控制系统...');
    
    // 将实例保存为全局变量，方便其他模块访问
    window.idleAnimationSpeedControl = this;
    
    // 从设置系统获取初始倍速
    this.loadSpeedFromSettings();
    
    // 监听设置变化事件
    document.addEventListener('settingChanged', (event) => {
      if (event.detail.key === 'idleAnimationSpeed') {
        this.setSpeed(event.detail.value);
      }
    });
    
    // 监听模型加载事件
    document.addEventListener('modelLoaded', () => {
      console.log('检测到模型加载完成，重新应用倍速设置');
      this.applySpeedToCurrentAnimation();
      this.startAnimationMonitoring();
    });

    // 启动动画监控
    this.startAnimationMonitoring();

    console.log('待机动画倍速控制系统已初始化');
  }
  
  /**
   * 从设置系统加载倍速
   */
  loadSpeedFromSettings() {
    if (window.settingsControl && window.settingsControl.settingsCore) {
      const speed = window.settingsControl.settingsCore.getSetting('idleAnimationSpeed');
      if (speed !== undefined) {
        this.options.speed = speed;
        console.log(`从设置加载待机动画倍速: ${speed}x`);
      }
    }
  }
  
  /**
   * 设置动画倍速
   * @param {number} speed - 倍速值 (1-16)
   */
  setSpeed(speed) {
    // 限制倍速范围
    speed = Math.max(this.options.minSpeed, Math.min(this.options.maxSpeed, speed));
    
    this.options.speed = speed;
    console.log(`设置待机动画倍速: ${speed}x`);
    
    // 应用到当前动画
    this.applySpeedToCurrentAnimation();
    
    // 保存到设置系统
    this.saveSpeedToSettings(speed);
  }
  
  /**
   * 应用倍速到当前动画
   */
  applySpeedToCurrentAnimation() {
    if (!this.app || !this.app.currentModel) {
      console.log('模型尚未加载，无法应用倍速');
      return;
    }

    try {
      // 获取动画状态
      const animationState = this.app.currentModel.state;

      if (animationState && animationState.tracks) {
        let appliedCount = 0;
        this.activeIdleAnimations.clear();

        // 遍历所有轨道，查找待机动画
        for (let i = 0; i < animationState.tracks.length; i++) {
          const track = animationState.tracks[i];
          if (track && track.animation) {
            const animName = track.animation.name;

            // 检查是否是目标待机动画
            if (this.options.targetAnimationNames.includes(animName)) {
              // 应用倍速到特定轨道
              track.timeScale = this.options.speed;
              this.activeIdleAnimations.add(animName);
              appliedCount++;
              console.log(`已应用倍速 ${this.options.speed}x 到待机动画 ${animName} (轨道 ${i})`);
            }
          }
        }

        // 更新活跃状态
        this.isActive = appliedCount > 0;

        if (appliedCount > 0) {
          console.log(`总共应用倍速到 ${appliedCount} 个待机动画: ${Array.from(this.activeIdleAnimations).join(', ')}`);
        } else {
          console.log('当前没有播放目标待机动画');
        }
      }
    } catch (error) {
      console.error('应用动画倍速失败:', error);
    }
  }
  
  /**
   * 启动动画监控
   */
  startAnimationMonitoring() {
    // 清除之前的监控
    this.stopAnimationMonitoring();

    // 根据环境调整检查频率
    const isWallpaperEngine = window.wallpaperEngineAPI && window.wallpaperEngineAPI.isInWallpaperEngine();
    const checkInterval = isWallpaperEngine ? 250 : 100; // Wallpaper Engine中降低频率

    this.checkInterval = setInterval(() => {
      this.checkAnimationChange();
    }, checkInterval);

    console.log(`动画监控已启动 (检查间隔: ${checkInterval}ms)`);
  }

  /**
   * 停止动画监控
   */
  stopAnimationMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('动画监控已停止');
    }
  }

  /**
   * 检查动画变化
   */
  checkAnimationChange() {
    if (!this.app || !this.app.currentModel) {
      return;
    }

    try {
      const animationState = this.app.currentModel.state;
      if (animationState && animationState.tracks) {
        let hasChanges = false;
        let newIdleAnimations = new Set();

        // 遍历所有轨道检查动画变化
        for (let i = 0; i < animationState.tracks.length; i++) {
          const track = animationState.tracks[i];
          if (track && track.animation) {
            const currentAnimName = track.animation.name;
            const lastAnimName = this.lastCheckedAnimations[i];

            // 如果动画发生了变化
            if (currentAnimName !== lastAnimName) {
              console.log(`轨道 ${i} 动画切换检测: ${lastAnimName || '无'} -> ${currentAnimName}`);
              this.lastCheckedAnimations[i] = currentAnimName;
              hasChanges = true;
            }

            // 检查是否是目标待机动画
            if (this.options.targetAnimationNames.includes(currentAnimName)) {
              newIdleAnimations.add(currentAnimName);
            }
          } else {
            // 轨道上没有动画了
            if (this.lastCheckedAnimations[i]) {
              console.log(`轨道 ${i} 动画停止: ${this.lastCheckedAnimations[i]} -> 无`);
              this.lastCheckedAnimations[i] = '';
              hasChanges = true;
            }
          }
        }

        // 如果检测到待机动画变化，应用倍速设置
        if (hasChanges && newIdleAnimations.size > 0) {
          console.log(`检测到待机动画变化: ${Array.from(newIdleAnimations).join(', ')}`);
          // 延迟一小段时间确保动画完全切换
          setTimeout(() => {
            this.applySpeedToCurrentAnimation();
          }, 50);
        }
      }
    } catch (error) {
      console.error('检查动画变化时出错:', error);
    }
  }

  /**
   * 检查当前是否在播放目标动画
   * @returns {boolean} 是否在播放目标动画
   */
  isTargetAnimationPlaying() {
    if (!this.app || !this.app.currentModel) {
      return false;
    }

    try {
      const animationState = this.app.currentModel.state;
      if (animationState && animationState.tracks) {
        // 遍历所有轨道，检查是否有目标待机动画在播放
        for (let i = 0; i < animationState.tracks.length; i++) {
          const track = animationState.tracks[i];
          if (track && track.animation) {
            const animName = track.animation.name;
            if (this.options.targetAnimationNames.includes(animName)) {
              return true;
            }
          }
        }
      }
    } catch (error) {
      console.error('检查目标动画播放状态时出错:', error);
    }

    return false;
  }
  
  /**
   * 重置倍速为正常速度
   */
  resetSpeed() {
    this.setSpeed(1.0);
  }
  
  /**
   * 获取当前倍速
   * @returns {number} 当前倍速
   */
  getCurrentSpeed() {
    return this.options.speed;
  }
  
  /**
   * 保存倍速到设置系统
   * @param {number} speed - 倍速值
   */
  saveSpeedToSettings(speed) {
    if (window.settingsControl && window.settingsControl.settingsCore) {
      window.settingsControl.settingsCore.updateSetting('idleAnimationSpeed', speed);
    }
  }
  
  /**
   * 启用倍速控制
   */
  enable() {
    this.options.enabled = true;
    this.startAnimationMonitoring();
    this.applySpeedToCurrentAnimation();
    console.log('待机动画倍速控制已启用');
  }
  
  /**
   * 禁用倍速控制
   */
  disable() {
    this.options.enabled = false;

    // 停止动画监控
    this.stopAnimationMonitoring();

    // 重置所有轨道为正常速度
    if (this.app && this.app.currentModel && this.app.currentModel.state) {
      const animationState = this.app.currentModel.state;
      if (animationState.tracks) {
        for (let i = 0; i < animationState.tracks.length; i++) {
          const track = animationState.tracks[i];
          if (track && track.animation) {
            const animName = track.animation.name;
            if (this.options.targetAnimationNames.includes(animName)) {
              track.timeScale = 1.0;
              console.log(`重置轨道 ${i} 动画 ${animName} 速度为正常`);
            }
          }
        }
      }
    }

    this.isActive = false;
    this.activeIdleAnimations.clear();
    console.log('待机动画倍速控制已禁用');
  }
  
  /**
   * 检查是否启用
   * @returns {boolean} 是否启用
   */
  isEnabled() {
    return this.options.enabled;
  }

  /**
   * 获取当前活跃的待机动画列表
   * @returns {Array} 当前活跃的待机动画名称数组
   */
  getActiveIdleAnimations() {
    return Array.from(this.activeIdleAnimations);
  }

  /**
   * 获取目标动画名称列表
   * @returns {Array} 目标动画名称数组
   */
  getTargetAnimationNames() {
    return [...this.options.targetAnimationNames];
  }

  /**
   * 设置目标动画名称列表
   * @param {Array} animationNames - 动画名称数组
   */
  setTargetAnimationNames(animationNames) {
    if (Array.isArray(animationNames)) {
      this.options.targetAnimationNames = [...animationNames];
      console.log(`更新目标动画列表: ${this.options.targetAnimationNames.join(', ')}`);
      // 重新应用倍速设置
      this.applySpeedToCurrentAnimation();
    } else {
      console.warn('setTargetAnimationNames: 参数必须是数组');
    }
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    // 停止动画监控
    this.stopAnimationMonitoring();

    // 重置所有轨道的动画速度
    if (this.app && this.app.currentModel && this.app.currentModel.state) {
      const animationState = this.app.currentModel.state;
      if (animationState.tracks) {
        for (let i = 0; i < animationState.tracks.length; i++) {
          const track = animationState.tracks[i];
          if (track && track.animation) {
            const animName = track.animation.name;
            if (this.options.targetAnimationNames.includes(animName)) {
              track.timeScale = 1.0;
            }
          }
        }
      }
    }

    this.isActive = false;
    this.activeIdleAnimations.clear();
    this.lastCheckedAnimations = {};
    console.log('待机动画倍速控制系统已清理');
  }
}

// 将类导出为全局变量
window.IdleAnimationSpeedControl = IdleAnimationSpeedControl;
