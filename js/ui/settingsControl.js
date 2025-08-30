/**
 * SettingsControl.js - 设置界面主控制器（重构版）
 * 使用模块化架构，组合各个功能模块
 */

class SettingsControl {
  constructor(app) {
    this.app = app;
    
    // 初始化各个模块
    this.settingsCore = new SettingsCore(app);
    this.settingsControls = new SettingsControls(this.settingsCore);
    this.settingsUI = new SettingsUI(this.settingsCore, this.settingsControls);
    this.settingsApplier = new SettingsApplier(app, this.settingsCore);
    this.settingsTabManager = new SettingsTabManager(this.settingsCore, this.settingsUI, this.settingsControls);
    
    // 设置UI缩放事件监听
    this.setupUIScaleListener();

    // 设置字体大小事件监听
    this.setupFontSizeListener();
    
    // 初始化标签页内容
    this.initializeTabContent();
    
    // 使用保存的分辨率初始化模型
    this.initializeWithSavedResolution();
    
    console.log("设置界面主控制器已初始化（重构版）");
  }

  /**
   * 初始化标签页内容
   */
  initializeTabContent() {
    this.settingsTabManager.initializeAllTabs();
  }

  /**
   * 使用保存的分辨率初始化模型
   */
  initializeWithSavedResolution() {
    const resolution = this.settingsCore.getSetting('resolution');
    if (this.app && resolution !== '2k') {
      console.log(`应用保存的分辨率设置: ${resolution}`);
      this.app.modelFolder = resolution;
      console.log(`已设置模型文件夹为: ${resolution}，将在初始化完成后应用设置`);
    } else {
      // 如果是默认分辨率，直接应用其他设置
      this.applySettings();
    }
  }

  /**
   * 设置UI高度缩放事件监听
   */
  setupUIScaleListener() {
    document.addEventListener('uiScaleChanged', (event) => {
      const { scale } = event.detail;
      this.settingsUI.applyUIScale(scale);
    });
  }

  /**
   * 设置字体大小缩放事件监听
   */
  setupFontSizeListener() {
    document.addEventListener('fontSizeChanged', (event) => {
      const { scale } = event.detail;
      this.settingsUI.applyFontSize(scale);
    });
  }

  // ===== 兼容性方法 - 保持与原有代码的兼容性 =====

  /**
   * 获取设置对象（兼容性）
   */
  get settings() {
    return this.settingsCore.getAllSettings();
  }

  /**
   * 保存设置（兼容性）
   */
  saveSettings() {
    return this.settingsCore.saveSettings();
  }

  /**
   * 加载设置（兼容性）
   */
  loadSettings() {
    return this.settingsCore.loadSettings();
  }

  /**
   * 应用设置（兼容性）
   */
  applySettings() {
    return this.settingsApplier.applyAllSettings();
  }

  /**
   * 更新设置（兼容性）
   */
  updateSetting(key, value) {
    return this.settingsCore.updateSetting(key, value);
  }

  /**
   * 显示面板（兼容性）
   */
  showPanel() {
    return this.settingsUI.showPanel();
  }

  /**
   * 隐藏面板（兼容性）
   */
  hidePanel() {
    return this.settingsUI.hidePanel();
  }

  /**
   * 切换面板（兼容性）
   */
  togglePanel() {
    return this.settingsUI.togglePanel();
  }

  /**
   * 刷新UI（兼容性）
   */
  refreshUI() {
    return this.settingsUI.refreshUI();
  }

  /**
   * 重置为默认设置（兼容性）
   */
  resetToDefaults() {
    this.settingsCore.resetToDefaults();
    this.settingsUI.refreshUI();
    this.applySettings();
  }

  /**
   * 清除保存的设置（兼容性）
   */
  clearSavedSettings() {
    return this.settingsCore.clearSavedSettings();
  }

  /**
   * 重置首次访问标记（兼容性）
   */
  resetFirstVisitFlag() {
    return this.settingsCore.resetFirstVisitFlag();
  }

  /**
   * 获取面板可见状态（兼容性）
   */
  get isVisible() {
    return this.settingsUI.isVisible;
  }

  // ===== 拖拽兼容性方法 =====

  /**
   * 设置SPR X轴位置（兼容性 - 供拖拽控制使用）
   */
  setSprPositionX(x) {
    if (this.settingsApplier.setSprPositionX) {
      return this.settingsApplier.setSprPositionX(x);
    }
  }

  /**
   * 设置SPR Y轴位置（兼容性 - 供拖拽控制使用）
   */
  setSprPositionY(y) {
    if (this.settingsApplier.setSprPositionY) {
      return this.settingsApplier.setSprPositionY(y);
    }
  }

  /**
   * 设置Arona X轴位置（兼容性 - 供拖拽控制使用）
   */
  setAronaPositionX(x) {
    if (this.settingsApplier.setAronaPositionX) {
      return this.settingsApplier.setAronaPositionX(x);
    }
  }

  /**
   * 设置Arona Y轴位置（兼容性 - 供拖拽控制使用）
   */
  setAronaPositionY(y) {
    if (this.settingsApplier.setAronaPositionY) {
      return this.settingsApplier.setAronaPositionY(y);
    }
  }
}

// 导出类
window.SettingsControl = SettingsControl;
