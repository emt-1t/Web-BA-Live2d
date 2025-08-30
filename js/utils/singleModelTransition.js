/**
 * singleModelTransition.js - 单模型白屏过渡特效
 * 为单模型系统提供开场白屏过渡和定时闪烁过渡效果
 */

class SingleModelTransition {
  constructor() {
    this.overlay = null;
    this.isTransitioning = false;
    this.secondFlashTimer = null;
    
    // 过渡设置
    this.settings = {
      duration: 2000,        // 开场过渡持续时间（2秒）
      flashDuration: 2000,    // 闪烁过渡持续时间（0.5秒）
      secondFlashDelay: 9300, // 第二个闪烁的延迟时间（15秒）
      enabled: true
    };
    
    this.init();
  }

  init() {
    console.log("单模型白屏过渡初始化");
    
    // 监听模型加载事件
    document.addEventListener('modelLoaded', () => {
      this.onModelLoaded();
    });
    
    // 检查是否应该预先显示白屏
    this.checkAndShowInitialWhiteScreen();
  }

  /**
   * 检查并显示初始白屏
   */
  checkAndShowInitialWhiteScreen() {
    // 检查是否启用开场动画
    const settingsControl = window.settingsControl;
    const enableIntroAnimation = settingsControl && settingsControl.settings && settingsControl.settings.introAnimation;
    
    console.log("单模型白屏：检查开场动画设置 =", enableIntroAnimation);
    
    if (enableIntroAnimation) {
      console.log("启用开场动画，显示初始白屏");
      this.createInitialOverlay();
    }
  }

  /**
   * 创建初始白屏覆盖层
   */
  createInitialOverlay() {
    // 创建DOM元素
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: white;
      z-index: 9999;
      pointer-events: none;
    `;
    
    // 添加到页面
    document.body.appendChild(this.overlay);
    console.log("单模型初始白屏覆盖层已创建");
  }

  /**
   * 模型加载完成事件处理
   */
  onModelLoaded() {
    console.log("单模型白屏：收到模型加载事件");
    
    // 检查是否启用开场动画
    const settingsControl = window.settingsControl;
    const enableIntroAnimation = settingsControl && settingsControl.settings && settingsControl.settings.introAnimation;
    
    if (enableIntroAnimation && this.overlay) {
      console.log("模型加载完成，开始单模型白屏过渡");
      this.startInitialTransition();
      
      // 设置定时器，在指定时间后触发第二个闪烁
      this.scheduleSecondFlash();
    } else if (enableIntroAnimation && !this.overlay) {
      console.log("启用开场动画但白屏未显示，立即创建并开始过渡");
      this.createInitialOverlay();
      setTimeout(() => this.startInitialTransition(), 50);
      this.scheduleSecondFlash();
    } else {
      console.log("开场动画已禁用，跳过单模型白屏过渡");
    }
  }

  /**
   * 开始初始白屏过渡
   */
  startInitialTransition() {
    if (!this.overlay || this.isTransitioning) {
      console.log("无法开始初始过渡：overlay =", !!this.overlay, "isTransitioning =", this.isTransitioning);
      return;
    }

    console.log("开始单模型初始白屏过渡");
    this.isTransitioning = true;

    // 使用CSS transition
    this.overlay.style.transition = `opacity ${this.settings.duration}ms ease-out`;
    this.overlay.style.opacity = '0';

    // 过渡完成后移除元素
    setTimeout(() => {
      this.finishInitialTransition();
    }, this.settings.duration);
  }

  /**
   * 完成初始过渡
   */
  finishInitialTransition() {
    console.log("单模型初始白屏过渡完成");
    
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
    
    this.isTransitioning = false;
  }

  /**
   * 安排第二个闪烁过渡
   */
  scheduleSecondFlash() {
    console.log(`安排第二个闪烁过渡，${this.settings.secondFlashDelay}ms后触发`);
    
    // 清除之前的定时器（如果存在）
    if (this.secondFlashTimer) {
      clearTimeout(this.secondFlashTimer);
    }
    
    // 设置新的定时器
    this.secondFlashTimer = setTimeout(() => {
      console.log("触发第二个闪烁过渡");
      this.flashTransition();
    }, this.settings.secondFlashDelay);
  }

  /**
   * 快速闪烁过渡（透明→白色→透明）
   */
  flashTransition() {
    if (this.isTransitioning) {
      console.log("正在过渡中，跳过闪烁效果");
      return;
    }

    console.log("开始单模型快速闪烁过渡");
    this.isTransitioning = true;

    // 创建闪烁覆盖层
    const flashOverlay = document.createElement('div');
    flashOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: white;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
    `;

    // 添加到页面
    document.body.appendChild(flashOverlay);

    // 第一阶段：透明→白色（0.15秒）
    setTimeout(() => {
      flashOverlay.style.transition = `opacity ${this.settings.flashDuration * 0.3}ms ease-out`;
      flashOverlay.style.opacity = '1';
    }, 10);

    // 第二阶段：保持白色（0.2秒）然后白色→透明（0.15秒）
    setTimeout(() => {
      flashOverlay.style.transition = `opacity ${this.settings.flashDuration * 0.3}ms ease-in`;
      flashOverlay.style.opacity = '0';
    }, this.settings.flashDuration * 0.7); // 在70%的时间点开始淡出

    // 清理
    setTimeout(() => {
      document.body.removeChild(flashOverlay);
      this.isTransitioning = false;
      console.log("单模型快速闪烁过渡完成");
    }, this.settings.flashDuration);
  }

  /**
   * 设置第二个闪烁的延迟时间
   */
  setSecondFlashDelay(delay) {
    this.settings.secondFlashDelay = delay;
    console.log(`第二个闪烁延迟时间已设置为: ${delay}ms`);
  }

  /**
   * 手动触发初始过渡（用于测试）
   */
  triggerInitial() {
    if (!this.overlay) {
      this.createInitialOverlay();
    }
    this.startInitialTransition();
    this.scheduleSecondFlash();
  }

  /**
   * 手动触发闪烁过渡（用于测试）
   */
  triggerFlash() {
    this.flashTransition();
  }

  /**
   * 启用/禁用特效
   */
  setEnabled(enabled) {
    this.settings.enabled = enabled;
    console.log(`单模型白屏过渡已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 清理资源
   */
  cleanup() {
    console.log("开始清理单模型白屏过渡...");
    
    // 清除定时器
    if (this.secondFlashTimer) {
      clearTimeout(this.secondFlashTimer);
      this.secondFlashTimer = null;
    }
    
    // 移除覆盖层
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
    
    this.isTransitioning = false;
    console.log("单模型白屏过渡清理完成");
  }
}

// 创建全局实例
window.singleModelTransition = new SingleModelTransition();
