/**
 * moduleManager.js - 功能模块管理器
 * 负责各个功能模块的初始化和管理
 */

class ModuleManager {
  constructor(app) {
    this.app = app;

    // 功能模块实例
    this.eyeTracking = null;
    this.bgmControl = null;
    this.animationControl = null;
    this.idleAnimationSpeedControl = null;
    this.headPatControl = null;
    this.backgroundTracking = null;
    this.dialogueTriggerControl = null;
    this.dialogueManager = null;

    // 帧率管理
    this.frameRateManager = null;

    // 模块状态
    this.modulesInitialized = false;
  }

  /**
   * 初始化所有功能模块
   */
  async initAllModules() {
    try {
      console.log("开始初始化功能模块...");

      // 初始化眼部追踪功能
      this.initEyeTracking();

      // 初始化背景音乐
      this.initBgmControl();

      // 初始化动画控制
      this.initAnimationControl();

      // 初始化待机动画倍速控制
      this.initIdleAnimationSpeedControl();

      // 初始化摸头功能（如果可用）
      this.initHeadPatControl();

      // 初始化对话管理器
      this.initDialogueManager();

      // 初始化对话触发功能（如果可用）
      this.initDialogueTriggerControl();

      // 初始化背景追踪功能（如果可用）
      this.initBackgroundTracking();

      // 初始化帧率管理器
      this.initFrameRateManager();

      this.modulesInitialized = true;
      console.log("所有功能模块初始化完成");

    } catch (error) {
      console.error("初始化功能模块失败:", error);
      throw error;
    }
  }

  /**
   * 初始化眼部追踪功能
   */
  initEyeTracking() {
    try {
      if (typeof EyeTracking !== 'undefined') {
        // 创建眼部追踪实例
        this.eyeTracking = new EyeTracking(this.app);

        // 保存为全局变量，方便其他模块访问
        window.eyeTracking = this.eyeTracking;

        console.log("眼部追踪功能已初始化");
      } else {
        console.warn("EyeTracking 类未找到，跳过初始化");
      }
    } catch (error) {
      console.error("初始化眼部追踪功能失败:", error);
    }
  }

  /**
   * 初始化背景音乐控制
   */
  initBgmControl() {
    try {
      if (typeof BgmControl !== 'undefined') {
        // 创建背景音乐控制实例
        this.bgmControl = new BgmControl();

        console.log("背景音乐功能已初始化");
      } else {
        console.warn("BgmControl 类未找到，跳过初始化");
      }
    } catch (error) {
      console.error("初始化背景音乐功能失败:", error);
    }
  }

  /**
   * 初始化动画控制
   */
  initAnimationControl() {
    try {
      if (typeof AnimationControl !== 'undefined') {
        // 创建动画控制实例
        this.animationControl = new AnimationControl(this.app);

        console.log("动画控制功能已初始化");
      } else {
        console.warn("AnimationControl 类未找到，跳过初始化");
      }
    } catch (error) {
      console.error("初始化动画控制功能失败:", error);
    }
  }

  /**
   * 初始化待机动画倍速控制
   */
  initIdleAnimationSpeedControl() {
    try {
      if (typeof IdleAnimationSpeedControl !== 'undefined' && this.animationControl) {
        // 创建待机动画倍速控制实例
        this.idleAnimationSpeedControl = new IdleAnimationSpeedControl(this.app, this.animationControl);

        console.log("待机动画倍速控制功能已初始化");
      } else {
        if (typeof IdleAnimationSpeedControl === 'undefined') {
          console.warn("IdleAnimationSpeedControl 类未找到，跳过初始化");
        }
        if (!this.animationControl) {
          console.warn("AnimationControl 实例不存在，无法初始化倍速控制");
        }
      }
    } catch (error) {
      console.error("初始化待机动画倍速控制功能失败:", error);
    }
  }

  /**
   * 初始化摸头功能
   */
  initHeadPatControl() {
    try {
      if (typeof HeadPatControl !== 'undefined') {
        this.headPatControl = new HeadPatControl(this.app);

        // 添加到PIXI的ticker以便每帧更新触摸区域位置
        const pixiApp = this.app.renderManager.getApp();
        if (pixiApp && pixiApp.ticker) {
          pixiApp.ticker.add(() => {
            if (this.headPatControl && typeof this.headPatControl.update === 'function') {
              this.headPatControl.update();
            }
          });
        }

        console.log("摸头功能已初始化");
      } else {
        console.warn("HeadPatControl 类未找到，跳过初始化");
      }
    } catch (error) {
      console.error("初始化摸头功能失败:", error);
    }
  }

  /**
   * 初始化对话管理器
   */
  initDialogueManager() {
    try {
      if (typeof DialogueManager !== 'undefined') {
        this.dialogueManager = new DialogueManager(this.app);
        console.log("对话管理器已初始化");
      } else {
        console.warn("DialogueManager 类未找到，跳过初始化");
      }
    } catch (error) {
      console.error("初始化对话管理器失败:", error);
    }
  }

  /**
   * 初始化对话触发功能
   */
  initDialogueTriggerControl() {
    try {
      if (typeof DialogueTriggerControl !== 'undefined') {
        this.dialogueTriggerControl = new DialogueTriggerControl(this.app);

        // 添加到PIXI的ticker以便每帧更新触摸区域位置
        const pixiApp = this.app.renderManager.getApp();
        if (pixiApp && pixiApp.ticker) {
          pixiApp.ticker.add(() => {
            if (this.dialogueTriggerControl && typeof this.dialogueTriggerControl.update === 'function') {
              this.dialogueTriggerControl.update();
            }
          });
        }

        console.log("对话触发功能已初始化");
      } else {
        console.warn("DialogueTriggerControl 类未找到，跳过初始化");
      }
    } catch (error) {
      console.error("初始化对话触发功能失败:", error);
    }
  }

  /**
   * 初始化背景追踪功能
   */
  initBackgroundTracking() {
    try {
      if (typeof BackgroundTracking !== 'undefined') {
        this.backgroundTracking = new BackgroundTracking(this.app);

        // 将实例保存为全局变量，以便其他模块可以访问
        window.backgroundTracking = this.backgroundTracking;

        console.log("背景追踪功能已初始化");
      } else {
        console.warn("BackgroundTracking 类未找到，跳过初始化");
      }
    } catch (error) {
      console.error("初始化背景追踪功能失败:", error);
    }
  }

  /**
   * 重新初始化眼部追踪（模型加载后调用）
   */
  reinitEyeTracking() {
    if (this.eyeTracking && typeof this.eyeTracking.findEyeBones === 'function') {
      // 稍微延迟以确保模型完全加载
      setTimeout(() => {
        try {
          // 重新查找眼睛骨骼
          this.eyeTracking.findEyeBones();
          console.log("已重新初始化眼部追踪功能");

          // 确保眼部追踪处于启用状态
          if (this.eyeTracking.options && this.eyeTracking.options.enabled) {
            this.eyeTracking.enable();
          }
        } catch (error) {
          console.error("重新初始化眼部追踪时出错:", error);
        }
      }, 100);
    } else {
      console.warn("眼部追踪实例不存在或缺少 findEyeBones 方法");
    }
  }

  /**
   * 获取眼部追踪实例
   */
  getEyeTracking() {
    return this.eyeTracking;
  }

  /**
   * 获取背景音乐控制实例
   */
  getBgmControl() {
    return this.bgmControl;
  }

  /**
   * 获取动画控制实例
   */
  getAnimationControl() {
    return this.animationControl;
  }

  /**
   * 获取摸头控制实例
   */
  getHeadPatControl() {
    return this.headPatControl;
  }

  /**
   * 获取背景追踪实例
   */
  getBackgroundTracking() {
    return this.backgroundTracking;
  }

  /**
   * 初始化帧率管理器
   */
  initFrameRateManager() {
    try {
      this.frameRateManager = new FrameRateManager(this.app);

      // 将实例保存为全局变量，以便其他模块可以访问
      window.frameRateManager = this.frameRateManager;

      console.log("帧率管理器已初始化");
    } catch (error) {
      console.error("初始化帧率管理器失败:", error);
    }
  }

  /**
   * 获取帧率管理器实例
   */
  getFrameRateManager() {
    return this.frameRateManager;
  }

  /**
   * 检查模块是否已初始化
   */
  isInitialized() {
    return this.modulesInitialized;
  }

  /**
   * 清理所有模块资源
   */
  cleanup() {
    console.log("开始清理功能模块...");

    // 清理眼部追踪
    if (this.eyeTracking && typeof this.eyeTracking.cleanup === 'function') {
      this.eyeTracking.cleanup();
      this.eyeTracking = null;
    }

    // 清理背景音乐
    if (this.bgmControl && typeof this.bgmControl.cleanup === 'function') {
      this.bgmControl.cleanup();
      this.bgmControl = null;
    }

    // 清理动画控制
    if (this.animationControl && typeof this.animationControl.cleanup === 'function') {
      this.animationControl.cleanup();
      this.animationControl = null;
    }

    // 清理待机动画倍速控制
    if (this.idleAnimationSpeedControl && typeof this.idleAnimationSpeedControl.cleanup === 'function') {
      this.idleAnimationSpeedControl.cleanup();
      this.idleAnimationSpeedControl = null;
    }

    // 清理摸头控制
    if (this.headPatControl && typeof this.headPatControl.cleanup === 'function') {
      this.headPatControl.cleanup();
      this.headPatControl = null;
    }

    // 清理对话管理器
    if (this.dialogueManager && typeof this.dialogueManager.cleanup === 'function') {
      this.dialogueManager.cleanup();
      this.dialogueManager = null;
    }

    // 清理对话触发控制
    if (this.dialogueTriggerControl && typeof this.dialogueTriggerControl.cleanup === 'function') {
      this.dialogueTriggerControl.cleanup();
      this.dialogueTriggerControl = null;
    }

    // 清理背景追踪
    if (this.backgroundTracking && typeof this.backgroundTracking.cleanup === 'function') {
      this.backgroundTracking.cleanup();
      this.backgroundTracking = null;
    }

    // 清理帧率管理器
    if (this.frameRateManager && typeof this.frameRateManager.cleanup === 'function') {
      this.frameRateManager.cleanup();
      this.frameRateManager = null;
    }

    this.modulesInitialized = false;
    console.log("功能模块清理完成");
  }
}

// 将类导出为全局变量
window.ModuleManager = ModuleManager;
