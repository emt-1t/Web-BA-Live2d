/**
 * SettingsCore.js - 设置核心管理器
 * 负责设置的保存、加载、应用和默认值管理
 */

class SettingsCore {
  constructor(app) {
    this.app = app;

    // 本地存储键名
    this.STORAGE_KEY_PREFIX = 'spine_viewer_settings';
    this.FIRST_VISIT_KEY = 'spine_viewer_first_visit';
    this.LEGACY_STORAGE_KEY = 'spine_viewer_settings'; // 旧版本兼容

    // 当前模型标识符
    this.currentModelId = null;
    
    // 默认设置配置
    this.defaultSettings = {
      // 基础设置
      scale: 0.79,                // 缩放比例
      characterScale: 1.0,       // 角色缩放
      backgroundScale: 1.0,      // 背景缩放
      rotation: 0,               // 旋转角度
      positionX: 0,              // X轴位置
      positionY: 740,            // Y轴位置
      resolution: '2k',          // 分辨率

      // 视线追踪设置
      eyeTracking: true,        // 启用视线追踪
      trackingIntensity: 7,      // 追踪强度
      smoothness: 0.95,          // 平滑度 (0-1) 值越大越平滑
      maxDistance: 200,           // 最大移动距离
      autoReset: true,           // 自动归正
      useSpecialFix: false,      // 使用特殊修复
      invertX: true,             // 反转X轴
      invertY: true,             // 反转Y轴
      swapXY: true,              // 交换XY轴

      // 背景追踪设置
      backgroundTracking: false,     // 启用背景追踪
      backgroundTrackingIntensity: 3,      // 背景追踪强度
      backgroundSmoothness: 0.96,          // 背景平滑度
      backgroundMaxDistance: 30,           // 背景最大移动距离
      backgroundAutoReset: true,           // 背景自动归正
      backgroundInvertX: false,            // 背景反转X轴
      backgroundInvertY: false,            // 背景反转Y轴
      backgroundSwapXY: false,             // 背景交换XY轴

      // 音频设置
      bgmVolume: 0.0,              // BGM音量
      dialogueSoundVolume: 1.0,    // 对话音效音量

      // 动画设置
      introAnimation: true,      // 开场动画

      // UI设置
      uiScale: 1.0,              // UI高度缩放
      fontSize: 1.0,             // 字体大小缩放



      // 帧率设置
      frameRateEnabled: true,    // 启用帧率限制
      targetFPS: 60,             // 目标帧率

      // 动画设置
      idleAnimationSpeed: 1.0,   // 待机动画倍速 (1-8倍)

      // 对话系统设置
      dialogueEnabled: false,     // 启用对话功能
      dialogueTouchAreaVisible: false,  // 对话区域可见性（用于调试）

      // 文本显示设置
      textDisplayEnabled: true,   // 启用文本显示
      textDisplayLanguage: 'chinese',  // 文本显示语言 (chinese/japanese/english)
      textDisplayX: 50,           // 文本显示X轴位置 (0-100, 百分比)
      textDisplayY: 85,           // 文本显示Y轴位置 (0-100, 百分比)
      textDisplayOpacity: 90,     // 文本显示透明度 (0-100, 百分比)
      textDisplayFontSize: 18,    // 文本显示字体大小 (12-36, 像素)

      // 摸头系统设置
      headPatEnabled: true,       // 启用摸头功能
      headPatTouchAreaVisible: false,  // 摸头区域可见性（用于调试）

      // 调试工具设置
      debugEnabled: false        // 启用调试工具
    };
    
    // 当前设置（深拷贝默认设置）
    this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
    
    // 可用选项
    this.resolutionOptions = ['2k', '4k', '8k'];
    
    // 模型加载状态跟踪
    this.isModelLoading = false;
    this.pendingSettingsApplication = false;
    this.renderUpdatesPaused = false;
    this.originalTickerSpeed = 1.0;
    
    // 初始化模型监听器
    this.setupModelListeners();

    // 加载保存的设置
    this.loadSettings();
  }

  /**
   * 设置模型监听器
   */
  setupModelListeners() {
    // 监听模型加载完成事件
    document.addEventListener('modelLoaded', () => {
      this.updateCurrentModelId();
      this.loadSettings(); // 重新加载当前模型的设置
    });
  }

  /**
   * 更新当前模型标识符
   */
  updateCurrentModelId() {
    try {
      // 从模型管理器获取当前模型名称
      if (this.app && this.app.modelManager) {
        const modelName = this.app.modelManager.getCurrentModelName();
        if (modelName) {
          this.currentModelId = this.normalizeModelId(modelName);
          console.log(`当前角色ID更新为: ${this.currentModelId}`);
        }
      }

      // 如果无法获取模型名称，尝试从其他来源获取
      if (!this.currentModelId) {
        this.currentModelId = this.detectModelFromContext();
      }

      // 如果仍然无法确定，使用默认值
      if (!this.currentModelId) {
        this.currentModelId = 'CH0295';
        console.warn('无法检测当前角色，使用默认角色ID: CH0295');
      }
    } catch (error) {
      console.error('更新角色ID失败:', error);
      this.currentModelId = 'SC51000_01';
    }
  }

  /**
   * 规范化模型ID - 基于角色而不是模型变体
   */
  normalizeModelId(modelName) {
    if (!modelName) return 'SC51000_01';

    // 移除路径和扩展名，只保留模型名称
    let normalized = modelName.replace(/^.*[\/\\]/, '').replace(/\.(skel|atlas)$/, '');

    // 移除分辨率后缀（如_2k, _4k等）
    normalized = normalized.replace(/_\d+k$/, '');

    // 移除模型变体后缀（_home等），只保留角色编号
    normalized = normalized.replace(/_home$/, '');

    return normalized;
  }

  /**
   * 从上下文检测角色类型
   */
  detectModelFromContext() {
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const modelParam = urlParams.get('model');
    if (modelParam) {
      return this.normalizeModelId(modelParam);
    }

    // 检查页面标题或其他标识
    const title = document.title;
    if (title.includes('CH0300')) {
      return 'CH0300';
    }
    if (title.includes('CH0215')) {
      return 'CH0215';
    }
    if (title.includes('CH0221')) {
      return 'CH0221';
    }

    return null;
  }

  /**
   * 获取当前模型的存储键
   */
  getCurrentStorageKey() {
    if (!this.currentModelId) {
      this.updateCurrentModelId();
    }
    return `${this.STORAGE_KEY_PREFIX}_${this.currentModelId}`;
  }

  /**
   * 从本地存储加载设置
   */
  loadSettings() {
    try {
      // 确保有当前模型ID
      if (!this.currentModelId) {
        this.updateCurrentModelId();
      }

      const currentStorageKey = this.getCurrentStorageKey();
      let savedSettings = localStorage.getItem(currentStorageKey);

      // 如果当前模型没有保存的设置，尝试从旧版本迁移
      if (!savedSettings) {
        savedSettings = this.migrateLegacySettings();
      }

      if (savedSettings) {
        // 合并保存的设置与默认设置
        const parsedSettings = JSON.parse(savedSettings);
        this.settings = { ...this.defaultSettings, ...parsedSettings };
        console.log(`已从本地存储加载角色 ${this.currentModelId} 的设置`);
      } else {
        console.log(`未找到角色 ${this.currentModelId} 的保存设置，使用默认值`);
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
      }


    } catch (error) {
      console.error("加载设置失败:", error);
      // 发生错误时使用默认设置
      this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
    }
  }

  /**
   * 迁移旧版本设置
   */
  migrateLegacySettings() {
    try {
      const legacySettings = localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (legacySettings) {
        console.log(`为模型 ${this.currentModelId} 迁移旧版本设置`);

        // 将旧设置保存到新的键名下
        const currentStorageKey = this.getCurrentStorageKey();
        localStorage.setItem(currentStorageKey, legacySettings);

        // 可选：删除旧的设置键（注释掉以保持兼容性）
        // localStorage.removeItem(this.LEGACY_STORAGE_KEY);

        return legacySettings;
      }
    } catch (error) {
      console.error("迁移旧版本设置失败:", error);
    }
    return null;
  }

  /**
   * 保存设置到本地存储
   */
  saveSettings() {
    try {
      // 确保有当前模型ID
      if (!this.currentModelId) {
        this.updateCurrentModelId();
      }

      const settingsJson = JSON.stringify(this.settings);
      const currentStorageKey = this.getCurrentStorageKey();
      localStorage.setItem(currentStorageKey, settingsJson);
      console.log(`模型 ${this.currentModelId} 的设置已保存到本地存储`);
    } catch (error) {
      console.error("保存设置失败:", error);
    }
  }

  /**
   * 清除保存的设置
   */
  clearSavedSettings() {
    try {
      // 确保有当前模型ID
      if (!this.currentModelId) {
        this.updateCurrentModelId();
      }

      const currentStorageKey = this.getCurrentStorageKey();
      localStorage.removeItem(currentStorageKey);
      console.log(`已清除模型 ${this.currentModelId} 的本地保存设置`);
    } catch (error) {
      console.error("清除设置失败:", error);
    }
  }

  /**
   * 清除所有模型的保存设置
   */
  clearAllSavedSettings() {
    try {
      const keysToRemove = [];

      // 遍历localStorage找到所有相关的设置键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(this.STORAGE_KEY_PREFIX) || key === this.LEGACY_STORAGE_KEY)) {
          keysToRemove.push(key);
        }
      }

      // 删除找到的所有设置键
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`已删除设置键: ${key}`);
      });

      console.log("已清除所有模型的本地保存设置");
    } catch (error) {
      console.error("清除所有设置失败:", error);
    }
  }

  /**
   * 重置为默认设置
   */
  resetToDefaults() {
    this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
    this.clearSavedSettings();
    console.log(`已重置模型 ${this.currentModelId} 的所有设置为默认值`);
  }

  /**
   * 获取所有已保存的模型列表
   */
  getSavedModelsList() {
    const savedModels = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX + '_')) {
          const modelId = key.replace(this.STORAGE_KEY_PREFIX + '_', '');
          savedModels.push(modelId);
        }
      }
    } catch (error) {
      console.error("获取已保存模型列表失败:", error);
    }

    return savedModels;
  }

  /**
   * 导出当前模型的设置
   */
  exportCurrentModelSettings() {
    try {
      const exportData = {
        modelId: this.currentModelId,
        settings: this.settings,
        exportTime: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error("导出设置失败:", error);
      return null;
    }
  }

  /**
   * 导入模型设置
   */
  importModelSettings(importData) {
    try {
      const data = typeof importData === 'string' ? JSON.parse(importData) : importData;

      if (!data.modelId || !data.settings) {
        throw new Error("无效的导入数据格式");
      }

      // 保存到指定模型的存储键
      const targetStorageKey = `${this.STORAGE_KEY_PREFIX}_${data.modelId}`;
      localStorage.setItem(targetStorageKey, JSON.stringify(data.settings));

      // 如果导入的是当前模型，立即应用设置
      if (data.modelId === this.currentModelId) {
        this.settings = { ...this.defaultSettings, ...data.settings };
        console.log(`已导入并应用模型 ${data.modelId} 的设置`);
      } else {
        console.log(`已导入模型 ${data.modelId} 的设置`);
      }

      return true;
    } catch (error) {
      console.error("导入设置失败:", error);
      return false;
    }
  }

  /**
   * 复制设置到其他模型
   */
  copySettingsToModel(targetModelId) {
    try {
      if (!targetModelId || targetModelId === this.currentModelId) {
        console.warn("无效的目标模型ID或与当前模型相同");
        return false;
      }

      const targetStorageKey = `${this.STORAGE_KEY_PREFIX}_${targetModelId}`;
      const settingsJson = JSON.stringify(this.settings);
      localStorage.setItem(targetStorageKey, settingsJson);

      console.log(`已将当前设置复制到模型 ${targetModelId}`);
      return true;
    } catch (error) {
      console.error("复制设置失败:", error);
      return false;
    }
  }

  /**
   * 手动切换到指定模型的设置
   */
  switchToModel(modelId) {
    try {
      // 保存当前模型的设置
      this.saveSettings();

      // 切换到新模型
      const oldModelId = this.currentModelId;
      this.currentModelId = this.normalizeModelId(modelId);

      // 加载新模型的设置
      this.loadSettings();

      console.log(`已从模型 ${oldModelId} 切换到模型 ${this.currentModelId}`);

      // 触发设置变更事件
      document.dispatchEvent(new CustomEvent('modelSettingsSwitched', {
        detail: {
          oldModelId: oldModelId,
          newModelId: this.currentModelId
        }
      }));

      return true;
    } catch (error) {
      console.error("切换模型设置失败:", error);
      return false;
    }
  }

  /**
   * 获取当前模型ID
   */
  getCurrentModelId() {
    return this.currentModelId;
  }

  /**
   * 更新单个设置
   */
  updateSetting(key, value) {
    if (this.settings.hasOwnProperty(key)) {
      this.settings[key] = value;
      this.saveSettings();
      console.log(`模型 ${this.currentModelId} 的设置 ${key} 更新为 ${value}`);
      return true;
    } else {
      console.warn(`未知的设置键: ${key}`);
      return false;
    }
  }

  /**
   * 获取设置值
   */
  getSetting(key) {
    return this.settings[key];
  }

  /**
   * 获取所有设置
   */
  getAllSettings() {
    return { ...this.settings };
  }

  /**
   * 检查是否为首次访问
   */
  checkFirstVisit() {
    try {
      const hasVisited = localStorage.getItem(this.FIRST_VISIT_KEY);
      return !hasVisited;
    } catch (error) {
      console.error("检查首次访问状态失败:", error);
      return false;
    }
  }

  /**
   * 标记已访问
   */
  markAsVisited() {
    try {
      localStorage.setItem(this.FIRST_VISIT_KEY, 'true');
      console.log("已标记为已访问");
    } catch (error) {
      console.error("标记访问状态失败:", error);
    }
  }

  /**
   * 重置首次访问标记
   */
  resetFirstVisitFlag() {
    try {
      localStorage.removeItem(this.FIRST_VISIT_KEY);
      console.log("已重置首次访问标记，下次加载时将自动打开设置面板");
    } catch (error) {
      console.error("重置首次访问标记失败:", error);
    }
  }



  /**
   * 设置模型加载状态
   */
  setModelLoadingState(isLoading) {
    this.isModelLoading = isLoading;
    if (!isLoading && this.pendingSettingsApplication) {
      this.pendingSettingsApplication = false;
      // 触发设置应用事件
      document.dispatchEvent(new CustomEvent('settingsNeedApply'));
    }
  }

  /**
   * 检查是否有待应用的设置
   */
  hasPendingApplication() {
    return this.pendingSettingsApplication;
  }

  /**
   * 标记有待应用的设置
   */
  markPendingApplication() {
    this.pendingSettingsApplication = true;
  }
}

// 导出类
window.SettingsCore = SettingsCore;
