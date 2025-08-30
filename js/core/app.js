// 主应用程序模块 - 重构版本
class App {
  constructor() {
    // 管理器实例
    this.renderManager = null;
    this.modelManager = null;

    this.moduleManager = null;

    // 调试工具
    this.debug = null;

    // 基础配置
    this.modelFolder = '2k';
  }

  // 设置调试工具
  setDebugTools(debug) {
    this.debug = debug || {
      showInfo: () => {},
      hideLoading: () => {}
    };
  }

  async init() {
    try {
      // 初始化渲染管理器
      this.renderManager = new RenderManager();
      await this.renderManager.init();

      // 初始化模型管理器
      this.modelManager = new ModelManager(this.renderManager, this.modelFolder);



      // 初始化功能模块管理器
      this.moduleManager = new ModuleManager(this);

      // 加载当前文件夹下的模型
      await this.modelManager.autoLoadModels();

      // 初始化所有功能模块
      await this.moduleManager.initAllModules();

      // 监听窗口大小变化事件
      document.addEventListener('windowResize', () => this.handleWindowResize());

      // 确保在模型加载完成后应用保存的设置
      if (window.settingsControl) {
        this.log("正在应用保存的设置...");
        window.settingsControl.applySettings();
        // SPR设置已经在applySettings()中调用了，不需要重复调用
      }

      this.log("应用初始化完成");
      return this;
    } catch (error) {
      this.logError("初始化应用失败:", error);
      throw error;
    }
  }

  // 委托给模型管理器的方法
  async loadModel(skelPath, atlasPath) {
    const result = await this.modelManager.loadModel(skelPath, atlasPath);

    // 模型加载完成后，重新初始化眼部追踪
    if (this.moduleManager) {
      this.moduleManager.reinitEyeTracking();
    }

    return result;
  }

  // 自动加载模型 - 委托给模型管理器
  async autoLoadModels() {
    if (this.modelManager) {
      const result = await this.modelManager.autoLoadModels();

      // 模型加载完成后，重新初始化眼部追踪和其他功能
      if (this.moduleManager) {
        this.moduleManager.reinitEyeTracking();
        this.log("已重新初始化眼部追踪功能");
      }

      return result;
    } else {
      throw new Error("模型管理器未初始化");
    }
  }

  // 设置模型文件夹并更新模型管理器
  setModelFolder(folder) {
    this.modelFolder = folder;
    if (this.modelManager) {
      this.modelManager.modelFolder = folder;
      this.log(`主模型文件夹已更新为: ${folder}`);
    }

  }

  // 获取当前模型
  get currentModel() {
    return this.modelManager ? this.modelManager.getCurrentModel() : null;
  }

  // 获取当前模型名称
  getCurrentModelName() {
    return this.modelManager ? this.modelManager.getCurrentModelName() : '';
  }

  // 设置模型位置
  setModelPosition(x, y) {
    if (this.modelManager) {
      this.modelManager.setModelPosition(x, y);
    }
  }

  // 设置模型缩放
  setModelScale(scale) {
    if (this.modelManager) {
      this.modelManager.setModelScale(scale);
    }
  }

  // 居中显示模型
  centerModel() {
    if (this.modelManager) {
      this.modelManager.centerModel();
    }
  }

  // 处理窗口大小变化
  handleWindowResize() {
    this.log("应用处理窗口大小变化");

    // 委托给模型管理器处理
    if (this.modelManager) {
      this.modelManager.handleWindowResize();
    }


  }

  // 委托给渲染管理器的方法
  updateRenderSettings(settings) {
    if (this.renderManager) {
      return this.renderManager.updateRenderSettings(settings);
    }
    return {};
  }

  // 获取 PIXI 应用实例
  get app() {
    return this.renderManager ? this.renderManager.getApp() : null;
  }

  // 日志辅助方法
  log(...args) {
    console.log(...args);
  }

  logWarning(...args) {
    console.warn(...args);
  }

  logError(...args) {
    console.error(...args);
  }

  // 清理资源
  cleanup() {
    this.log("开始清理应用资源...");

    // 清理功能模块
    if (this.moduleManager) {
      this.moduleManager.cleanup();
      this.moduleManager = null;
    }



    // 清理模型管理器
    if (this.modelManager) {
      this.modelManager.cleanup();
      this.modelManager = null;
    }

    // 清理渲染管理器
    if (this.renderManager) {
      this.renderManager.cleanup();
      this.renderManager = null;
    }

    // 移除事件监听器
    document.removeEventListener('windowResize', this.handleWindowResize);

    this.log("应用资源清理完成");
  }
}

// 将App类暴露为全局变量
window.App = App;
