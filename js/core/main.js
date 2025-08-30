

// 主入口文件
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log("正在初始化应用...");

    // 创建主应用实例
    const app = new App();

    // 将app设置为全局变量，以便其他模块可以访问
    window.app = app;

    // 创建调试工具 - 检查DebugTools是否已定义
    let debug;
    if (typeof DebugTools !== 'undefined') {
      // 如果debug.js已加载，则使用完整的DebugTools
      debug = new DebugTools(app);
      debug.init();

      // 将debug实例暴露为全局变量，供SettingsApplier使用
      window.debug = debug;

      // 根据设置决定是否显示调试工具
      const debugEnabled = app.settingsControl?.settingsCore?.getSetting('debugEnabled') || false;
      debug.updateVisibility(debugEnabled);

      // 监听设置变化
      document.addEventListener('settingChanged', (event) => {
        if (event.detail.key === 'debugEnabled') {
          debug.updateVisibility(event.detail.value);
        }
      });
    } else {
      // 如果debug.js未加载，则创建一个简易的空实现
      debug = {
        // 必要的方法空实现
        init: () => {},
        checkDependencies: () => true,
        showInfo: (msg, isError) => {
          // 不显示任何信息
          // const infoEl = document.getElementById('info');
          // if (infoEl) {
          //   infoEl.textContent = msg;
          //   infoEl.style.color = isError ? 'red' : 'white';
          //   setTimeout(() => { infoEl.style.display = 'none'; }, 5000);
          // }
        },
        hideLoading: () => {
          const loadingEl = document.getElementById('loading');
          if (loadingEl) loadingEl.style.display = 'none';
        },
        updateVisibility: () => {}
      };

      // 将简易版debug实例也暴露为全局变量
      window.debug = debug;
      console.log("调试模块未加载，使用简易版调试工具");
    }

    // 将调试工具注入应用
    app.setDebugTools(debug);

    // 检查依赖
    if (!debug.checkDependencies()) {
      console.error("依赖项检查失败，无法继续初始化");
      return;
    }

    // 初始化设置界面（在应用初始化前）
    const settingsControl = new SettingsControl(app);
    // 将设置控制器保存为全局变量，以便其他模块可以访问
    window.settingsControl = settingsControl;

    // 尝试从本地存储加载分辨率设置
    const savedResolution = settingsControl.settings.resolution;
    if (savedResolution && savedResolution !== '2k') {
      console.log(`应用保存的分辨率设置: ${savedResolution}`);
      // 在初始化前设置模型文件夹
      app.modelFolder = savedResolution;
    }

    // 初始化应用
    await app.init();

    // 如果有保存的分辨率设置，在初始化后确保ModelManager也更新了
    if (savedResolution && savedResolution !== '2k') {
      if (typeof app.setModelFolder === 'function') {
        app.setModelFolder(savedResolution);
        console.log(`已同步ModelManager的分辨率设置: ${savedResolution}`);
      }
    }



    // 设置模型加载事件监听器
    document.addEventListener('loadSpineModel', (e) => {
      const { skelFile, atlasFile } = e.detail;
      app.loadModel(skelFile, atlasFile).catch(err => {
        console.error(`加载模型失败: ${skelFile}`, err);
      });
    });

    console.log("应用初始化完成");
    debug.hideLoading();

    // 注意：摸头功能和背景追踪功能现在由 ModuleManager 自动初始化

    // 应用所有保存的设置
    if (settingsControl) {
      settingsControl.applySettings();
      console.log("已应用所有保存的设置");
    }

    // 移除旧的壁纸控制界面初始化
    // const wallpaperControl = new WallpaperControl();

  } catch (error) {
    console.error("应用启动失败:", error);

    // 显示错误信息
    const errorEl = document.getElementById('info');
    if (errorEl) {
      errorEl.textContent = `初始化失败: ${error.message}`;
      errorEl.style.color = 'red';
    }

    // 隐藏加载提示
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  }
});