/**
 * textDisplayManager.js - 文本显示管理器
 * 负责管理对话文本的显示、隐藏和动画效果
 */

class TextDisplayManager {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 默认设置
    this.options = {
      enabled: true,                    // 是否启用文本显示
      language: 'chinese',              // 默认语言 (chinese/japanese/english)
      fadeInDuration: 500,              // 淡入动画时长 (毫秒)
      fadeOutDuration: 300,             // 淡出动画时长 (毫秒)
      displayDuration: 3000,            // 文本显示持续时间 (毫秒，0表示不自动隐藏)
      fontSize: '18px',                 // 字体大小
      fontFamily: 'AlimamaFangYuan', // 字体
      textColor: 'black',               // 文字颜色（与设置界面一致）
      borderRadius: '32px',             // 圆角（与设置界面一致）
      padding: '12px 20px',             // 内边距
      maxWidth: '80%',                  // 最大宽度
      zIndex: 1000,                     // 层级
      // 位置和透明度设置
      positionX: 50,                    // X轴位置 (0-100, 百分比)
      positionY: 85,                    // Y轴位置 (0-100, 百分比)
      opacity: 90,                      // 透明度 (0-100, 百分比)
      ...options                        // 合并用户配置
    };

    // 状态变量
    this.isVisible = false;           // 是否正在显示
    this.currentText = '';            // 当前显示的文本
    this.currentLanguage = this.options.language; // 当前语言
    this.hideTimer = null;            // 自动隐藏定时器
    this.dialogueTexts = {};          // 对话文本数据

    // DOM元素
    this.container = null;            // 文本容器元素
    this.textElement = null;          // 文本元素
    this.previewContainer = null;     // 预览容器元素
    this.previewTextElement = null;   // 预览文本元素

    // 预览状态
    this.isPreviewMode = false;       // 是否处于预览模式
    this.previewTimer = null;         // 预览自动隐藏定时器

    // 初始化
    this.init();
  }

  /**
   * 初始化文本显示管理器
   */
  async init() {
    console.log('初始化文本显示管理器...');

    // 创建DOM元素
    this.createElements();

    // 加载对话文本数据
    await this.loadDialogueTexts();

    // 将实例保存为全局变量
    window.textDisplayManager = this;

    // 从设置系统同步状态
    this.syncFromSettings();

    // 监听设置变化
    this.setupSettingsListener();

    console.log('文本显示管理器初始化完成');
  }

  /**
   * 创建DOM元素
   */
  createElements() {
    // 创建主容器元素
    this.container = document.createElement('div');
    this.container.id = 'dialogue-text-container';

    // 创建文本元素
    this.textElement = document.createElement('div');
    this.textElement.id = 'dialogue-text-content';
    this.container.appendChild(this.textElement);

    // 创建预览容器元素
    this.previewContainer = document.createElement('div');
    this.previewContainer.id = 'dialogue-text-preview-container';

    // 创建预览文本元素
    this.previewTextElement = document.createElement('div');
    this.previewTextElement.id = 'dialogue-text-preview-content';
    this.updatePreviewText();
    this.previewContainer.appendChild(this.previewTextElement);

    // 应用初始样式
    this.updateContainerStyles();
    this.updatePreviewContainerStyles(true); // 强制隐藏预览容器

    // 添加到页面
    document.body.appendChild(this.container);
    document.body.appendChild(this.previewContainer);
  }

  /**
   * 更新容器样式
   */
  updateContainerStyles() {
    if (!this.container) return;

    const opacity = this.options.opacity / 100; // 转换为0-1范围
    const isTransparent = opacity === 0; // 判断是否完全透明

    // 基础样式（始终应用）
    let baseStyles = `
      position: fixed;
      left: ${this.options.positionX}%;
      top: ${this.options.positionY}%;
      transform: translate(-50%, -50%);
      color: ${this.options.textColor};
      font-family: ${this.options.fontFamily}, 'Microsoft YaHei', Arial, sans-serif;
      font-size: ${this.options.fontSize};
      padding: ${this.options.padding};
      max-width: ${this.options.maxWidth};
      z-index: ${this.options.zIndex};
      opacity: 0;
      visibility: hidden;
      transition: opacity ${this.options.fadeInDuration}ms ease-in-out,
                  visibility ${this.options.fadeInDuration}ms ease-in-out;
      text-align: center;
      word-wrap: break-word;
    `;

    // 背景相关样式（根据透明度线性调节）
    let backgroundStyles = '';
    if (!isTransparent) {
      // 计算线性调节的模糊强度 (0-8px)
      const blurStrength = Math.round(8 * opacity);
      // 计算线性调节的饱和度 (100%-120%)
      const saturation = Math.round(100 + 20 * opacity);

      backgroundStyles = `
        /* 使用CSS变量控制背景透明度 */
        --bg-opacity: ${opacity};
        background: rgba(255, 255, 255, calc(0.04 * var(--bg-opacity)));
        backdrop-filter: blur(${blurStrength}px) saturate(${saturation}%);
        -webkit-backdrop-filter: blur(${blurStrength}px) saturate(${saturation}%);
        border: 1px solid rgba(255, 255, 255, calc(0.1 * var(--bg-opacity)));
        border-radius: ${this.options.borderRadius};
        box-shadow:
          0 8px 32px rgba(0, 0, 0, calc(0.3 * var(--bg-opacity))),
          0 0 0 1px rgba(255, 255, 255, calc(0.1 * var(--bg-opacity))),
          inset 0 1px 0 rgba(255, 255, 255, calc(0.2 * var(--bg-opacity)));
      `;
    } else {
      // 完全透明时，确保移除所有背景效果
      backgroundStyles = `
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        border: none;
        border-radius: 0;
        box-shadow: none;
      `;
    }

    this.container.style.cssText = baseStyles + backgroundStyles;
  }

  /**
   * 更新预览容器样式
   * @param {boolean} forceHidden - 是否强制隐藏（用于初始化）
   */
  updatePreviewContainerStyles(forceHidden = false) {
    if (!this.previewContainer) return;

    const opacity = this.options.opacity / 100; // 转换为0-1范围
    const isTransparent = opacity === 0; // 判断是否完全透明

    // 如果强制隐藏或不在预览模式，确保容器隐藏
    const isVisible = this.isPreviewMode && !forceHidden;

    // 基础样式（始终应用）
    let baseStyles = `
      position: fixed;
      left: ${this.options.positionX}%;
      top: ${this.options.positionY}%;
      transform: translate(-50%, -50%);
      color: ${this.options.textColor};
      font-family: ${this.options.fontFamily}, 'Microsoft YaHei', Arial, sans-serif;
      font-size: ${this.options.fontSize};
      padding: ${this.options.padding};
      max-width: ${this.options.maxWidth};
      z-index: ${this.options.zIndex + 1}; /* 比主容器层级高 */
      opacity: ${isVisible ? '1' : '0'};
      visibility: ${isVisible ? 'visible' : 'hidden'};
      transition: opacity 300ms ease-in-out,
                  visibility 300ms ease-in-out;
      text-align: center;
      word-wrap: break-word;
    `;

    // 背景相关样式（根据透明度线性调节）
    let backgroundStyles = '';
    if (!isTransparent) {
      // 计算线性调节的模糊强度 (0-8px)
      const blurStrength = Math.round(8 * opacity);
      // 计算线性调节的饱和度 (100%-120%)
      const saturation = Math.round(100 + 20 * opacity);

      backgroundStyles = `
        /* 使用CSS变量控制背景透明度 */
        --bg-opacity: ${opacity};
        background: rgba(255, 255, 255, calc(0.04 * var(--bg-opacity)));
        backdrop-filter: blur(${blurStrength}px) saturate(${saturation}%);
        -webkit-backdrop-filter: blur(${blurStrength}px) saturate(${saturation}%);
        border-radius: ${this.options.borderRadius};
        box-shadow:
          0 8px 32px rgba(0, 0, 0, calc(0.3 * var(--bg-opacity))),
          0 0 0 1px rgba(255, 255, 255, calc(0.1 * var(--bg-opacity))),
          inset 0 1px 0 rgba(255, 255, 255, calc(0.2 * var(--bg-opacity)));

        /* 添加预览标识 - 透明度也线性调节 */
        border: 2px dashed rgba(72, 151, 223, calc(0.6 * var(--bg-opacity)));
      `;
    } else {
      // 完全透明时，确保移除所有背景效果，但保留预览标识
      backgroundStyles = `
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        border-radius: 0;
        box-shadow: none;

        /* 透明模式下的预览标识 - 使用文字颜色的虚线边框 */
        border: 2px dashed rgba(72, 151, 223, 0.8);
      `;
    }

    this.previewContainer.style.cssText = baseStyles + backgroundStyles;
  }

  /**
   * 加载对话文本数据
   */
  async loadDialogueTexts() {
    try {
      const response = await fetch('data/dialogue-texts.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.dialogueTexts = await response.json();
      console.log('对话文本数据加载完成:', Object.keys(this.dialogueTexts).length, '个对话');
    } catch (error) {
      console.error('加载对话文本数据失败:', error);
      this.dialogueTexts = {};
    }
  }

  /**
   * 显示文本
   * @param {string} dialogueId - 对话ID (如 'MemorialLobby_1')
   * @param {string} audioFile - 音频文件名 (如 'MemorialLobby_1_1.ogg')
   */
  showText(dialogueId, audioFile) {
    if (!this.options.enabled) {
      return;
    }

    // 查找对应的文本
    const text = this.getTextForAudio(dialogueId, audioFile);
    if (!text) {
      console.warn(`未找到对话文本: ${dialogueId} - ${audioFile}`);
      return;
    }

    // 隐藏当前文本（如果有）
    this.hideText();

    // 设置新文本
    this.currentText = text;
    this.textElement.textContent = text;

    // 显示文本
    this.showContainer();

    console.log(`显示文本 [${this.currentLanguage}]: ${text}`);
  }

  /**
   * 根据音频文件获取对应文本
   * @param {string} dialogueId - 对话ID
   * @param {string} audioFile - 音频文件名
   * @returns {string|null} 文本内容
   */
  getTextForAudio(dialogueId, audioFile) {
    const dialogue = this.dialogueTexts[dialogueId];
    if (!dialogue || !dialogue.segments) {
      return null;
    }

    // 查找匹配的音频段落
    const segment = dialogue.segments.find(seg => seg.audio === audioFile);
    if (!segment || !segment.text) {
      return null;
    }

    // 返回当前语言的文本
    return segment.text[this.currentLanguage] || segment.text.chinese || '';
  }

  /**
   * 显示容器
   */
  showContainer() {
    if (this.isVisible) {
      return;
    }

    this.isVisible = true;
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '1';

    // 设置自动隐藏定时器
    if (this.options.displayDuration > 0) {
      this.clearHideTimer();
      this.hideTimer = setTimeout(() => {
        this.hideText();
      }, this.options.displayDuration);
    }
  }

  /**
   * 隐藏文本
   */
  hideText() {
    if (!this.isVisible) {
      return;
    }

    this.isVisible = false;
    this.container.style.opacity = '0';
    
    // 延迟隐藏容器
    setTimeout(() => {
      if (!this.isVisible) { // 确保在延迟期间没有重新显示
        this.container.style.visibility = 'hidden';
      }
    }, this.options.fadeOutDuration);

    this.clearHideTimer();
    console.log('隐藏文本显示');
  }

  /**
   * 清除自动隐藏定时器
   */
  clearHideTimer() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  /**
   * 设置语言
   * @param {string} language - 语言 (chinese/japanese/english)
   */
  setLanguage(language) {
    if (['chinese', 'japanese', 'english'].includes(language)) {
      this.currentLanguage = language;
      this.updatePreviewText(); // 更新预览文本
      console.log(`文本显示语言已设置为: ${language}`);

      // 如果当前正在显示文本，更新显示
      if (this.isVisible && this.currentText) {
        // 这里需要重新获取当前显示的文本并更新
        // 由于我们需要知道当前的dialogueId和audioFile，这个功能需要在调用方处理
      }
    } else {
      console.warn(`不支持的语言: ${language}`);
    }
  }

  /**
   * 设置是否启用
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    console.log(`文本显示功能已${enabled ? '启用' : '禁用'}`);

    if (!enabled) {
      this.hideText();
    }
  }

  /**
   * 设置X轴位置
   * @param {number} x - X轴位置 (0-100)
   * @param {boolean} showPreview - 是否显示预览（默认true）
   */
  setPositionX(x, showPreview = true) {
    this.options.positionX = Math.max(0, Math.min(100, x));
    this.updateContainerStyles();
    this.updatePreviewContainerStyles();
    if (showPreview) {
      this.showPreview(); // 显示预览
    }
    console.log(`文本显示X轴位置已设置为: ${this.options.positionX}%`);
  }

  /**
   * 设置Y轴位置
   * @param {number} y - Y轴位置 (0-100)
   * @param {boolean} showPreview - 是否显示预览（默认true）
   */
  setPositionY(y, showPreview = true) {
    this.options.positionY = Math.max(0, Math.min(100, y));
    this.updateContainerStyles();
    this.updatePreviewContainerStyles();
    if (showPreview) {
      this.showPreview(); // 显示预览
    }
    console.log(`文本显示Y轴位置已设置为: ${this.options.positionY}%`);
  }

  /**
   * 设置透明度
   * @param {number} opacity - 透明度 (0-100)
   * @param {boolean} showPreview - 是否显示预览（默认true）
   */
  setOpacity(opacity, showPreview = true) {
    this.options.opacity = Math.max(0, Math.min(100, opacity));
    this.updateContainerStyles();
    this.updatePreviewContainerStyles();
    if (showPreview) {
      this.showPreview(); // 显示预览
    }
    console.log(`文本显示透明度已设置为: ${this.options.opacity}%`);
  }

  /**
   * 设置字体大小
   * @param {number} fontSize - 字体大小 (12-36, 像素)
   * @param {boolean} showPreview - 是否显示预览（默认true）
   */
  setFontSize(fontSize, showPreview = true) {
    this.options.fontSize = `${Math.max(12, Math.min(36, fontSize))}px`;
    this.updateContainerStyles();
    this.updatePreviewContainerStyles();
    if (showPreview) {
      this.showPreview(); // 显示预览
    }
    console.log(`文本显示字体大小已设置为: ${this.options.fontSize}`);
  }

  /**
   * 显示预览气泡
   */
  showPreview() {
    if (!this.previewContainer) return;

    // 进入预览模式
    this.isPreviewMode = true;

    // 显示预览容器
    this.previewContainer.style.visibility = 'visible';
    this.previewContainer.style.opacity = '1';

    // 清除之前的定时器
    this.clearPreviewTimer();

    // 设置自动隐藏定时器（3秒后隐藏）
    this.previewTimer = setTimeout(() => {
      this.hidePreview();
    }, 3000);

    console.log('显示文本位置预览');
  }

  /**
   * 隐藏预览气泡
   */
  hidePreview() {
    if (!this.previewContainer || !this.isPreviewMode) return;

    // 退出预览模式
    this.isPreviewMode = false;

    // 隐藏预览容器
    this.previewContainer.style.opacity = '0';

    // 延迟隐藏容器
    setTimeout(() => {
      if (!this.isPreviewMode) { // 确保在延迟期间没有重新显示
        this.previewContainer.style.visibility = 'hidden';
      }
    }, 300);

    this.clearPreviewTimer();
    console.log('隐藏文本位置预览');
  }

  /**
   * 清除预览定时器
   */
  clearPreviewTimer() {
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
  }

  /**
   * 更新预览文本内容
   */
  updatePreviewText() {
    if (!this.previewTextElement) return;

    const previewTexts = {
      chinese: '这是文本显示预览效果',
      japanese: 'テキスト表示プレビュー',
      english: 'Text Display Preview'
    };

    const currentText = previewTexts[this.currentLanguage] || previewTexts.chinese;
    this.previewTextElement.textContent = `📍 ${currentText}`;
  }

  /**
   * 从设置系统同步状态
   */
  syncFromSettings() {
    try {
      if (window.settingsControl && window.settingsControl.settingsCore) {
        const textDisplayEnabled = window.settingsControl.settingsCore.getSetting('textDisplayEnabled');
        if (textDisplayEnabled !== undefined) {
          this.setEnabled(textDisplayEnabled);
        }

        const textDisplayLanguage = window.settingsControl.settingsCore.getSetting('textDisplayLanguage');
        if (textDisplayLanguage !== undefined) {
          this.setLanguage(textDisplayLanguage);
        }

        // 同步位置和透明度设置时不显示预览
        const textDisplayX = window.settingsControl.settingsCore.getSetting('textDisplayX');
        if (textDisplayX !== undefined) {
          this.setPositionX(textDisplayX, false); // 不显示预览
        }

        const textDisplayY = window.settingsControl.settingsCore.getSetting('textDisplayY');
        if (textDisplayY !== undefined) {
          this.setPositionY(textDisplayY, false); // 不显示预览
        }

        const textDisplayOpacity = window.settingsControl.settingsCore.getSetting('textDisplayOpacity');
        if (textDisplayOpacity !== undefined) {
          this.setOpacity(textDisplayOpacity, false); // 不显示预览
        }

        const textDisplayFontSize = window.settingsControl.settingsCore.getSetting('textDisplayFontSize');
        if (textDisplayFontSize !== undefined) {
          this.setFontSize(textDisplayFontSize, false); // 不显示预览
        }
      }
    } catch (error) {
      console.error('同步文本显示设置失败:', error);
    }
  }

  /**
   * 设置监听器，响应设置变化
   */
  setupSettingsListener() {
    document.addEventListener('settingChanged', (event) => {
      const { key, value } = event.detail;

      if (key === 'textDisplayEnabled') {
        this.setEnabled(value);
      } else if (key === 'textDisplayLanguage') {
        this.setLanguage(value);
      } else if (key === 'textDisplayX') {
        // 通过设置事件触发时显示预览
        this.setPositionX(value, true);
      } else if (key === 'textDisplayY') {
        // 通过设置事件触发时显示预览
        this.setPositionY(value, true);
      } else if (key === 'textDisplayOpacity') {
        // 通过设置事件触发时显示预览
        this.setOpacity(value, true);
      } else if (key === 'textDisplayFontSize') {
        // 通过设置事件触发时显示预览
        this.setFontSize(value, true);
      }
    });
  }

  /**
   * 更新样式
   * @param {Object} styleOptions - 样式选项
   */
  updateStyles(styleOptions = {}) {
    Object.assign(this.options, styleOptions);
    
    // 更新容器样式
    if (this.container) {
      this.container.style.background = this.options.backgroundColor;
      this.container.style.color = this.options.textColor;
      this.container.style.fontSize = this.options.fontSize;
      this.container.style.borderRadius = this.options.borderRadius;
      this.container.style.padding = this.options.padding;
      this.container.style.maxWidth = this.options.maxWidth;
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    console.log('清理文本显示管理器资源...');

    // 清除定时器
    this.clearHideTimer();
    this.clearPreviewTimer();

    // 移除DOM元素
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    if (this.previewContainer && this.previewContainer.parentNode) {
      this.previewContainer.parentNode.removeChild(this.previewContainer);
    }

    // 清理全局引用
    if (window.textDisplayManager === this) {
      window.textDisplayManager = null;
    }

    console.log('文本显示管理器资源清理完成');
  }
}

// 将类导出为全局变量
window.TextDisplayManager = TextDisplayManager;
