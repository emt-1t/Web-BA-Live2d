/**
 * renderManager.js - 渲染管理器
 * 负责 PIXI 应用的创建、配置和渲染相关功能
 */

class RenderManager {
  constructor() {
    this.app = null;
    this.renderSettings = {
      antialias: true,    // 默认始终启用抗锯齿
      resolution: window.devicePixelRatio || 1,
      backgroundColor: 0x2c3e50,
      transparent: false,
      autoStart: true
    };

    // 主模型容器 - 用于隔离主模型的旋转，避免影响其他元素
    this.mainModelContainer = null;
  }

  /**
   * 初始化 PIXI 应用
   */
  async init() {
    try {
      // 创建 PIXI 应用
      this.app = new PIXI.Application();
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        resolution: this.renderSettings.resolution,
        autoDensity: true,
        resizeTo: window,
        backgroundColor: this.renderSettings.backgroundColor,
        hello: true,
        antialias: true  // 始终启用抗锯齿
      });
      
      // 将画布添加到页面
      document.body.appendChild(this.app.canvas);

      // 创建主模型容器
      this.createMainModelContainer();

      // 监听窗口大小变化事件
      window.addEventListener('resize', () => this.handleResize());

      console.log("渲染管理器初始化完成");
      return this.app;
    } catch (error) {
      console.error("初始化渲染管理器失败:", error);
      throw error;
    }
  }

  /**
   * 创建主模型容器
   */
  createMainModelContainer() {
    if (!this.app || !this.app.stage) {
      console.error("无法创建主模型容器：PIXI应用未初始化");
      return;
    }

    // 创建主模型容器
    this.mainModelContainer = new PIXI.Container();
    this.mainModelContainer.name = 'MainModelContainer';

    // 设置容器的旋转中心点为屏幕中心
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    this.mainModelContainer.pivot.set(centerX, centerY);
    this.mainModelContainer.position.set(centerX, centerY);

    // 将主模型容器添加到舞台
    this.app.stage.addChild(this.mainModelContainer);

    console.log("主模型容器已创建");
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    console.log("处理窗口大小变化");

    // 更新主模型容器的旋转中心点
    if (this.mainModelContainer) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      this.mainModelContainer.pivot.set(centerX, centerY);
      this.mainModelContainer.position.set(centerX, centerY);
    }

    // 触发自定义事件，让其他模块处理窗口大小变化
    const event = new CustomEvent('windowResize', {
      detail: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * 更新渲染设置
   */
  updateRenderSettings(settings) {
    Object.assign(this.renderSettings, settings);
    console.log('渲染设置已更新:', this.renderSettings);
    return this.renderSettings;
  }

  /**
   * 获取 PIXI 应用实例
   */
  getApp() {
    return this.app;
  }

  /**
   * 获取舞台
   */
  getStage() {
    return this.app ? this.app.stage : null;
  }

  /**
   * 获取主模型容器
   */
  getMainModelContainer() {
    return this.mainModelContainer;
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.app) {
      // 移除事件监听器
      window.removeEventListener('resize', this.handleResize);

      // 清理主模型容器
      if (this.mainModelContainer) {
        this.mainModelContainer.destroy();
        this.mainModelContainer = null;
      }

      // 销毁 PIXI 应用
      this.app.destroy(true);
      this.app = null;

      console.log("渲染管理器已清理");
    }
  }
}

// 将类导出为全局变量
window.RenderManager = RenderManager;
