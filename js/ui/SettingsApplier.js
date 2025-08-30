/**
 * SettingsApplier.js - 设置应用器
 * 负责将设置应用到各个系统和模块
 */

class SettingsApplier {
  constructor(app, settingsCore) {
    this.app = app;
    this.settingsCore = settingsCore;
    
    // 设置应用事件监听
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听设置变更事件
    document.addEventListener('settingChanged', (event) => {
      const { key, value } = event.detail;
      this.applySingleSetting(key, value);
    });

    // 监听设置需要应用事件
    document.addEventListener('settingsNeedApply', () => {
      this.applyAllSettings();
    });

    // 监听模型加载事件
    document.addEventListener('modelLoadStart', () => {
      this.settingsCore.setModelLoadingState(true);
    });

    document.addEventListener('modelLoaded', () => {
      this.settingsCore.setModelLoadingState(false);
    });


  }

  /**
   * 应用单个设置
   */
  applySingleSetting(key, value) {
    try {
      switch(key) {
        // 基础设置
        case 'scale':
          this.setScale(value);
          break;
        case 'characterScale':
          this.setCharacterScale(value);
          break;
        case 'backgroundScale':
          this.setBackgroundScale(value);
          break;
        case 'rotation':
          this.setRotation(value);
          break;
        case 'positionX':
          this.setPositionX(value);
          break;
        case 'positionY':
          this.setPositionY(value);
          break;
        case 'resolution':
          this.setResolution(value);
          break;

        // 眼部追踪设置
        case 'eyeTracking':
          this.setEyeTracking(value);
          break;
        case 'trackingIntensity':
          this.setTrackingIntensity(value);
          break;
        case 'smoothness':
          this.setSmoothness(value);
          break;
        case 'maxDistance':
          this.setMaxDistance(value);
          break;
        case 'autoReset':
          this.setAutoReset(value);
          break;
        case 'useSpecialFix':
          this.setUseSpecialFix(value);
          break;
        case 'invertX':
          this.setInvertX(value);
          break;
        case 'invertY':
          this.setInvertY(value);
          break;
        case 'swapXY':
          this.setSwapXY(value);
          break;

        // 背景追踪设置
        case 'backgroundTracking':
          this.setBackgroundTracking(value);
          break;
        case 'backgroundTrackingIntensity':
          this.setBackgroundTrackingIntensity(value);
          break;
        case 'backgroundSmoothness':
          this.setBackgroundSmoothness(value);
          break;
        case 'backgroundMaxDistance':
          this.setBackgroundMaxDistance(value);
          break;
        case 'backgroundAutoReset':
          this.setBackgroundAutoReset(value);
          break;
        case 'backgroundInvertX':
          this.setBackgroundInvertX(value);
          break;
        case 'backgroundInvertY':
          this.setBackgroundInvertY(value);
          break;
        case 'backgroundSwapXY':
          this.setBackgroundSwapXY(value);
          break;

        // 音频设置
        case 'bgmVolume':
          this.setBgmVolume(value);
          break;

        // 动画设置
        case 'introAnimation':
          this.setIntroAnimation(value);
          break;

        // UI设置
        case 'uiScale':
          this.setUIScale(value);
          break;
        case 'fontSize':
          this.setFontSize(value);
          break;



        // 帧率设置
        case 'frameRateEnabled':
          this.setFrameRateEnabled(value);
          break;
        case 'targetFPS':
          this.setTargetFPS(value);
          break;



        // 系统设置
        case 'idleAnimationSpeed':
          this.setIdleAnimationSpeed(value);
          break;
        
        // 交互区域设置
        case 'headPatTouchAreaVisible':
          this.setHeadPatTouchAreaVisible(value);
          break;
        case 'dialogueTouchAreaVisible':
          this.setDialogueTouchAreaVisible(value);
          break;

        // 对话设置
        case 'dialogueEnabled':
          this.setDialogueEnabled(value);
          break;

        // 调试工具设置
        case 'debugEnabled':
          this.setDebugEnabled(value);
          break;

        default:
          console.log(`未处理的设置: ${key} = ${value}`);
      }
    } catch (error) {
      console.error(`应用设置 ${key} 时出错:`, error);
    }
  }

  /**
   * 应用所有设置
   */
  applyAllSettings() {
    try {
      // 检查是否正在加载模型
      if (this.settingsCore.isModelLoading) {
        console.log("模型正在加载中，延迟应用设置");
        this.settingsCore.markPendingApplication();
        return;
      }

      // 批量应用设置以减少重复渲染
      this.batchApplySettings();

      console.log("所有设置已应用");
    } catch (error) {
      console.error("应用设置时出错:", error);
    }
  }

  /**
   * 批量应用设置
   */
  batchApplySettings() {
    // 暂停渲染更新
    this.pauseRenderUpdates();

    try {
      const settings = this.settingsCore.getAllSettings();
      
      // 应用基本设置
      this.applyBasicSettings(settings);
      
      // 应用追踪设置
      this.applyTrackingSettings(settings);
      

      
      // 应用系统设置
      this.applySystemSettings(settings);
      
    } finally {
      // 恢复渲染更新
      this.resumeRenderUpdates();
    }
  }

  /**
   * 应用基本设置
   */
  applyBasicSettings(settings) {
    this.setScale(settings.scale);
    this.setCharacterScale(settings.characterScale);
    this.setBackgroundScale(settings.backgroundScale);
    this.setPositionX(settings.positionX);
    this.setPositionY(settings.positionY);
    this.setRotation(settings.rotation);
  }

  /**
   * 应用追踪设置
   */
  applyTrackingSettings(settings) {
    // 眼部追踪
    this.setEyeTracking(settings.eyeTracking);
    this.setTrackingIntensity(settings.trackingIntensity);
    this.setSmoothness(settings.smoothness);
    this.setMaxDistance(settings.maxDistance);
    this.setAutoReset(settings.autoReset);
    this.setUseSpecialFix(settings.useSpecialFix);
    this.setInvertX(settings.invertX);
    this.setInvertY(settings.invertY);
    this.setSwapXY(settings.swapXY);

    // 背景追踪
    this.setBackgroundTracking(settings.backgroundTracking);
    this.setBackgroundTrackingIntensity(settings.backgroundTrackingIntensity);
    this.setBackgroundSmoothness(settings.backgroundSmoothness);
    this.setBackgroundMaxDistance(settings.backgroundMaxDistance);
    this.setBackgroundAutoReset(settings.backgroundAutoReset);
    this.setBackgroundInvertX(settings.backgroundInvertX);
    this.setBackgroundInvertY(settings.backgroundInvertY);
    this.setBackgroundSwapXY(settings.backgroundSwapXY);
  }



  /**
   * 应用系统设置
   */
  applySystemSettings(settings) {
    // 应用音频设置
    this.setBgmVolume(settings.bgmVolume);
    this.setDialogueSoundVolume(settings.dialogueSoundVolume);

    // 应用文本显示设置
    this.setTextDisplayEnabled(settings.textDisplayEnabled);
    this.setTextDisplayLanguage(settings.textDisplayLanguage);
    this.setTextDisplayX(settings.textDisplayX);
    this.setTextDisplayY(settings.textDisplayY);
    this.setTextDisplayOpacity(settings.textDisplayOpacity);

    // 应用其他系统设置
    this.setFrameRateEnabled(settings.frameRateEnabled);
    this.setTargetFPS(settings.targetFPS);
    this.setUIScale(settings.uiScale);
    this.setFontSize(settings.fontSize);
    this.setIdleAnimationSpeed(settings.idleAnimationSpeed);

    // 应用交互区域设置
    this.setHeadPatTouchAreaVisible(settings.headPatTouchAreaVisible);
    this.setDialogueTouchAreaVisible(settings.dialogueTouchAreaVisible);
    this.setDialogueEnabled(settings.dialogueEnabled);

    // 应用调试工具设置
    this.setDebugEnabled(settings.debugEnabled);
  }

  /**
   * 暂停渲染更新
   */
  pauseRenderUpdates() {
    if (this.app && this.app.app && this.app.app.ticker) {
      this.settingsCore.renderUpdatesPaused = true;
      this.settingsCore.originalTickerSpeed = this.app.app.ticker.speed;
      this.app.app.ticker.speed = 0.1;
    }
  }

  /**
   * 恢复渲染更新
   */
  resumeRenderUpdates() {
    if (this.app && this.app.app && this.app.app.ticker && this.settingsCore.renderUpdatesPaused) {
      this.app.app.ticker.speed = this.settingsCore.originalTickerSpeed || 1.0;
      this.settingsCore.renderUpdatesPaused = false;
    }
  }

  /**
   * 设置缩放
   */
  setScale(scale) {
    if (this.app && this.app.currentModel) {
      this.app.currentModel.scale.set(scale, scale);
    }
  }

  /**
   * 设置角色缩放
   */
  setCharacterScale(scale) {
    if (this.app && this.app.currentModel) {
      try {
        if (this.app.currentModel.setCharacterScale) {
          this.app.currentModel.setCharacterScale(scale);
        } else if (this.app.currentModel.skeleton) {
          const skeleton = this.app.currentModel.skeleton;
          const bones = skeleton.bones;

          if (this.app.currentModel.characterBones && this.app.currentModel.characterBones.length > 0) {
            const characterBones = this.app.currentModel.characterBones;
            characterBones.forEach(bone => {
              let boneScale = scale;
              const boneName = bone.data.name.toLowerCase();

              if (boneName.includes('head') || boneName.includes('face') ||
                 boneName.includes('hair') || boneName.includes('eye') ||
                 boneName.includes('mouth') || boneName.includes('ear')) {
                if (scale < 1.0) {
                  const compensationFactor = 1 + Math.max(0, (1 - scale) * 0.4);
                  boneScale = scale * compensationFactor;
                  boneScale = Math.max(0.5, boneScale);
                }
              }

              bone.scaleX = bone.data.scaleX * boneScale;
              bone.scaleY = bone.data.scaleY * boneScale;
            });
          }
        }
      } catch (error) {
        console.error("设置角色缩放时发生错误:", error);
      }
    }
  }

  /**
   * 设置背景缩放
   */
  setBackgroundScale(scale) {
    if (this.app && this.app.currentModel) {
      try {
        if (this.app.currentModel.setBackgroundScale) {
          this.app.currentModel.setBackgroundScale(scale);
        } else if (this.app.currentModel.skeleton) {
          const skeleton = this.app.currentModel.skeleton;
          const bones = skeleton.bones;

          if (this.app.currentModel.backgroundBones && this.app.currentModel.backgroundBones.length > 0) {
            const backgroundBones = this.app.currentModel.backgroundBones;
            backgroundBones.forEach(bone => {
              bone.scaleX = bone.data.scaleX * scale;
              bone.scaleY = bone.data.scaleY * scale;
            });
          }
        }
      } catch (error) {
        console.error("设置背景缩放时发生错误:", error);
      }
    }
  }

  /**
   * 设置X轴位置
   */
  setPositionX(x) {
    if (this.app && this.app.currentModel) {
      this.app.currentModel.x = window.innerWidth / 2 + x;
    }
  }

  /**
   * 设置Y轴位置
   */
  setPositionY(y) {
    if (this.app && this.app.currentModel) {
      this.app.currentModel.y = window.innerHeight / 2 + y;
    }
  }

  /**
   * 设置旋转角度
   */
  setRotation(rotation) {
    try {
      let renderManager = null;

      if (this.app && this.app.renderManager) {
        renderManager = this.app.renderManager;
      } else if (window.app && window.app.renderManager) {
        renderManager = window.app.renderManager;
      }

      if (renderManager) {
        const mainModelContainer = renderManager.getMainModelContainer();
        if (mainModelContainer) {
          mainModelContainer.rotation = rotation * Math.PI / 180;
        }
      }
    } catch (error) {
      console.error("设置旋转角度时出错:", error);
    }
  }

  /**
   * 设置分辨率
   */
  setResolution(resolution) {
    if (!this.settingsCore.resolutionOptions.includes(resolution)) {
      console.error('无效的分辨率:', resolution);
      return;
    }

    console.log(`正在切换分辨率到: ${resolution}`);

    if (this.app) {
      try {
        if (typeof this.app.setModelFolder === 'function') {
          this.app.setModelFolder(resolution);
        } else {
          this.app.modelFolder = resolution;
        }

        // 分辨率切换时执行内存清理，然后刷新页面以清除缓存
        console.log(`分辨率切换到 ${resolution}，正在清理内存并刷新页面...`);

        // 执行内存清理
        if (window.memoryManager) {
          window.memoryManager.performMemoryCleanup();
        }

        // 延迟刷新页面，给内存清理一些时间
        setTimeout(() => {
          window.location.reload();
        }, 200);

      } catch (error) {
        console.error("切换分辨率时发生错误:", error);
      }
    }
  }

  /**
   * 设置眼部追踪
   */
  setEyeTracking(enabled) {
    if (window.eyeTracking) {
      window.eyeTracking.setEnabled(enabled);
    }
  }

  /**
   * 设置追踪强度
   */
  setTrackingIntensity(intensity) {
    if (window.eyeTracking) {
      window.eyeTracking.setIntensity(intensity);
    }
  }

  /**
   * 设置平滑度
   */
  setSmoothness(smoothness) {
    if (window.eyeTracking) {
      window.eyeTracking.setSmoothness(smoothness);
    }
  }

  /**
   * 设置最大距离
   */
  setMaxDistance(distance) {
    if (window.eyeTracking) {
      window.eyeTracking.setMaxDistance(distance);
    }
  }

  /**
   * 设置自动重置
   */
  setAutoReset(autoReset) {
    if (window.eyeTracking) {
      window.eyeTracking.setAutoReset(autoReset);
    }
  }

  /**
   * 设置特殊修复
   */
  setUseSpecialFix(useSpecialFix) {
    if (window.eyeTracking) {
      window.eyeTracking.setUseSpecialFix(useSpecialFix);
    }
  }

  /**
   * 设置反转X轴
   */
  setInvertX(invertX) {
    if (window.eyeTracking) {
      window.eyeTracking.setInvertX(invertX);
    }
  }

  /**
   * 设置反转Y轴
   */
  setInvertY(invertY) {
    if (window.eyeTracking) {
      window.eyeTracking.setInvertY(invertY);
    }
  }

  /**
   * 设置交换XY轴
   */
  setSwapXY(swapXY) {
    if (window.eyeTracking) {
      window.eyeTracking.setSwapXY(swapXY);
    }
  }

  /**
   * 设置背景追踪
   */
  setBackgroundTracking(enabled) {
    if (window.backgroundTracking) {
      window.backgroundTracking.setEnabled(enabled);
    }
  }

  /**
   * 设置背景追踪强度
   */
  setBackgroundTrackingIntensity(intensity) {
    if (window.backgroundTracking) {
      window.backgroundTracking.setIntensity(intensity);
    }
  }

  /**
   * 设置背景平滑度
   */
  setBackgroundSmoothness(smoothness) {
    if (window.backgroundTracking) {
      window.backgroundTracking.setSmoothness(smoothness);
    }
  }

  /**
   * 设置背景最大距离
   */
  setBackgroundMaxDistance(distance) {
    if (window.backgroundTracking) {
      window.backgroundTracking.setMaxDistance(distance);
    }
  }

  /**
   * 设置背景自动重置
   */
  setBackgroundAutoReset(autoReset) {
    if (window.backgroundTracking) {
      window.backgroundTracking.setAutoReset(autoReset);
    }
  }

  /**
   * 设置背景反转X轴
   */
  setBackgroundInvertX(invertX) {
    if (window.backgroundTracking) {
      window.backgroundTracking.setInvertX(invertX);
    }
  }

  /**
   * 设置背景反转Y轴
   */
  setBackgroundInvertY(invertY) {
    if (window.backgroundTracking) {
      window.backgroundTracking.setInvertY(invertY);
    }
  }

  /**
   * 设置背景交换XY轴
   */
  setBackgroundSwapXY(swapXY) {
    if (window.backgroundTracking) {
      window.backgroundTracking.setSwapXY(swapXY);
    }
  }

  /**
   * 设置待机动画倍速
   */
  setIdleAnimationSpeed(speed) {
    if (window.idleAnimationSpeedControl) {
      window.idleAnimationSpeedControl.setSpeed(speed);
    }
  }

  /**
   * 设置摸头区域可见性
   */
  setHeadPatTouchAreaVisible(visible) {
    // 更新全局摸头控制器的触摸区域可见性
    if (window.headPatControl) {
      window.headPatControl.options.touchAreaVisible = visible;
      
      // 重新创建触摸区域以应用可见性变化
      if (window.headPatControl.destroyTouchArea && window.headPatControl.createTouchArea) {
        window.headPatControl.destroyTouchArea();
        window.headPatControl.createTouchArea();
      }
      
      console.log(`摸头区域可见性已设置为: ${visible ? '显示' : '隐藏'}`);
    }
  }

  /**
   * 设置对话区域可见性
   */
  setDialogueTouchAreaVisible(visible) {
    // 更新全局对话触发控制器的触摸区域可见性
    if (window.dialogueTriggerControl) {
      window.dialogueTriggerControl.options.touchAreaVisible = visible;
      
      // 重新创建触摸区域以应用可见性变化
      if (window.dialogueTriggerControl.destroyTouchArea && window.dialogueTriggerControl.createTouchArea) {
        window.dialogueTriggerControl.destroyTouchArea();
        window.dialogueTriggerControl.createTouchArea();
      }
      
      console.log(`对话区域可见性已设置为: ${visible ? '显示' : '隐藏'}`);
    }
  }

  /**
   * 设置对话启用状态
   */
  setDialogueEnabled(enabled) {
    // 更新对话管理器的启用状态
    if (window.dialogueManager) {
      window.dialogueManager.options.enabled = enabled;
      console.log(`对话功能已${enabled ? '启用' : '禁用'}`);
    }

    // 更新对话触发控制器的启用状态
    if (window.dialogueTriggerControl) {
      window.dialogueTriggerControl.setEnabled(enabled);
    }
  }

  /**
   * 设置调试工具启用状态
   */
  setDebugEnabled(enabled) {
    // 更新调试工具的显示状态
    if (window.debug && typeof window.debug.updateVisibility === 'function') {
      window.debug.updateVisibility(enabled);
      console.log(`调试工具已${enabled ? '启用' : '禁用'}`);
    } else {
      console.log(`调试工具设置已保存: ${enabled ? '启用' : '禁用'}，但调试工具实例不可用`);
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 移除事件监听器
    document.removeEventListener('settingChanged', null);
    document.removeEventListener('settingsNeedApply', null);
    document.removeEventListener('modelLoaded', null);
    document.removeEventListener('modelLoadStart', null);

  }
}
