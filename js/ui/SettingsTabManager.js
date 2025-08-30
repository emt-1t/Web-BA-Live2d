/**
 * SettingsTabManager.js - 设置标签页管理器
 * 负责初始化各个标签页的内容
 */

class SettingsTabManager {
  constructor(settingsCore, settingsUI, settingsControls) {
    this.settingsCore = settingsCore;
    this.settingsUI = settingsUI;
    this.settingsControls = settingsControls;
  }

  /**
   * 初始化所有标签页内容
   */
  initializeAllTabs() {
    console.log("开始初始化所有标签页内容...");
    this.initBasicTab();
    this.initEyeTrackingTab();
    this.initBackgroundTrackingTab();
    this.initSoundTab();
    this.initUITab();
    this.initSystemTab();
    console.log("所有标签页内容已初始化");
  }

  /**
   * 初始化基础设置标签页
   */
  initBasicTab() {
    const tabPage = this.settingsUI.getTabPage('basic');
    console.log("初始化基础标签页，tabPage:", tabPage);

    // 基础控制
    this.settingsUI.addSectionHeaderToPage('基础控制 Basic Controls', tabPage);
    console.log("添加滑块控件前，tabPage:", tabPage);
    this.settingsUI.addSliderControlToPage('整体缩放 Scale', 'scale', 0.1, 2.0, 0.01, tabPage);
    this.settingsUI.addSliderControlToPage('角色缩放（慎用△） Character Scale (Use with caution△)', 'characterScale', 0.1, 2.0, 0.01, tabPage);
    this.settingsUI.addSliderControlToPage('背景缩放（慎用△） Background Scale (Use with caution△)', 'backgroundScale', 0.1, 2.0, 0.01, tabPage);
    this.settingsUI.addSliderControlToPage('旋转角度 Rotation', 'rotation', -180, 180, 1, tabPage);
    this.settingsUI.addSliderControlToPage('X轴位置 X Position', 'positionX', -2000, 2000, 10, tabPage);
    this.settingsUI.addSliderControlToPage('Y轴位置 Y Position', 'positionY', -2000, 2000, 10, tabPage);

    // 分辨率设置
    this.addResolutionSection(tabPage);

    // 重置按钮
    this.addResetSection(tabPage);
  }

  /**
   * 初始化视线追踪设置标签页
   */
  initEyeTrackingTab() {
    const tabPage = this.settingsUI.getTabPage('eyeTracking');

    // 眼部追踪设置
    this.settingsUI.addSectionHeaderToPage('眼部追踪 Eye Tracking', tabPage);
    this.settingsUI.addSwitchControlToPage('启用视线追踪 Enable Eye Tracking', 'eyeTracking', tabPage);
    this.settingsUI.addSliderControlToPage('追踪强度 Tracking Intensity', 'trackingIntensity', 1, 10, 0.1, tabPage);
    this.settingsUI.addSliderControlToPage('平滑度 Smoothness', 'smoothness', 0.1, 0.99, 0.01, tabPage);
    this.settingsUI.addSliderControlToPage('最大移动距离 Max Distance', 'maxDistance', 50, 500, 5, tabPage);
    this.settingsUI.addSwitchControlToPage('自动归正 Auto Reset', 'autoReset', tabPage);

    // 眼部追踪映射设置
    this.settingsUI.addSectionHeaderToPage('眼部追踪映射 Eye Tracking Mapping', tabPage);
    this.settingsUI.addSwitchControlToPage('使用特殊修复 Use Special Fix', 'useSpecialFix', tabPage);
    this.settingsUI.addSwitchControlToPage('反转X轴 Invert X', 'invertX', tabPage);
    this.settingsUI.addSwitchControlToPage('反转Y轴 Invert Y', 'invertY', tabPage);
    this.settingsUI.addSwitchControlToPage('交换XY轴 Swap XY', 'swapXY', tabPage);

    // 自动修复按钮
    this.addAutoFixSection(tabPage);
  }

  /**
   * 初始化背景追踪设置标签页
   */
  initBackgroundTrackingTab() {
    const tabPage = this.settingsUI.getTabPage('backgroundTracking');

    // 背景追踪设置
    this.settingsUI.addSectionHeaderToPage('背景追踪 Background Tracking', tabPage);
    this.settingsUI.addSwitchControlToPage('启用背景追踪 Enable Background Tracking', 'backgroundTracking', tabPage);
    this.settingsUI.addSliderControlToPage('背景追踪强度 Background Intensity', 'backgroundTrackingIntensity', 1, 10, 0.1, tabPage);
    this.settingsUI.addSliderControlToPage('背景平滑度 Background Smoothness', 'backgroundSmoothness', 0.1, 0.99, 0.01, tabPage);
    this.settingsUI.addSliderControlToPage('背景最大距离 Background Max Distance', 'backgroundMaxDistance', 10, 100, 1, tabPage);
    this.settingsUI.addSwitchControlToPage('背景自动归正 Background Auto Reset', 'backgroundAutoReset', tabPage);

    // 背景追踪映射设置
    this.settingsUI.addSectionHeaderToPage('背景追踪映射 Background Tracking Mapping', tabPage);
    this.settingsUI.addSwitchControlToPage('背景反转X轴 Background Invert X', 'backgroundInvertX', tabPage);
    this.settingsUI.addSwitchControlToPage('背景反转Y轴 Background Invert Y', 'backgroundInvertY', tabPage);
    this.settingsUI.addSwitchControlToPage('背景交换XY轴 Background Swap XY', 'backgroundSwapXY', tabPage);
  }

  /**
   * 初始化声音控制标签页
   */
  initSoundTab() {
    const tabPage = this.settingsUI.getTabPage('sound');

    // 背景音乐设置
    this.settingsUI.addSectionHeaderToPage('背景音乐 Background Music', tabPage);
    this.settingsUI.addSliderControlToPage('BGM音量 Volume', 'bgmVolume', 0, 1, 0.01, tabPage);

    // 对话设置
    this.settingsUI.addSectionHeaderToPage('对话设置 Dialogue Settings', tabPage);
    this.settingsUI.addSwitchControlToPage('启用对话功能 Enable Dialogue', 'dialogueEnabled', tabPage);
    this.settingsUI.addSliderControlToPage('对话音效音量 Dialogue Volume', 'dialogueSoundVolume', 0, 1, 0.01, tabPage);

    // 文本显示设置
    this.settingsUI.addSectionHeaderToPage('文本显示 Text Display', tabPage);
    this.settingsUI.addSwitchControlToPage('启用文本显示 Enable Text Display', 'textDisplayEnabled', tabPage);

    // 语言选择下拉框
    const languageOptions = [
      { value: 'chinese', label: '中文 Chinese' },
      { value: 'japanese', label: '日文 Japanese' },
      { value: 'english', label: '英文 English' }
    ];
    this.settingsUI.addSelectControlToPage('显示语言 Display Language', 'textDisplayLanguage', languageOptions, tabPage);

    // 位置和透明度调整
    this.settingsUI.addSliderControlToPage('水平位置 Horizontal Position', 'textDisplayX', 0, 100, 1, tabPage);
    this.settingsUI.addSliderControlToPage('垂直位置 Vertical Position', 'textDisplayY', 0, 100, 1, tabPage);
    this.settingsUI.addSliderControlToPage('背景透明度 Background Opacity', 'textDisplayOpacity', 0, 100, 1, tabPage);
    this.settingsUI.addSliderControlToPage('字体大小 Font Size', 'textDisplayFontSize', 12, 36, 1, tabPage);

    // 添加按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'action-buttons';
    buttonContainer.style.marginTop = '8px';

    // 添加预览按钮
    const previewButton = this.settingsControls.createButton('显示预览 Show Preview', () => {
      this.showTextDisplayPreview();
    });
    previewButton.style.flex = '1';
    buttonContainer.appendChild(previewButton);

    // 添加重置按钮
    const resetButton = this.settingsControls.createButton('重置设置 Reset Settings', () => {
      this.resetTextDisplaySettings();
    });
    resetButton.classList.add('reset-button'); // 添加特殊样式
    resetButton.style.flex = '1';
    buttonContainer.appendChild(resetButton);

    tabPage.appendChild(buttonContainer);
  }

  /**
   * 初始化界面设置标签页
   */
  initUITab() {
    const tabPage = this.settingsUI.getTabPage('ui');

    // 界面设置
    this.settingsUI.addSectionHeaderToPage('界面设置 UI Settings', tabPage);
    this.settingsUI.addSliderControlToPage('面板高度 Panel Height', 'uiScale', 0.5, 1.5, 0.05, tabPage);
    this.settingsUI.addSliderControlToPage('字体大小 Font Size', 'fontSize', 0.8, 1.5, 0.05, tabPage);

    // 交互区域设置
    this.settingsUI.addSectionHeaderToPage('交互区域设置 Interaction Areas', tabPage);
    this.settingsUI.addSwitchControlToPage('显示摸头区域 Show Head-pat Area', 'headPatTouchAreaVisible', tabPage);
    this.settingsUI.addSwitchControlToPage('显示对话区域 Show Dialogue Area', 'dialogueTouchAreaVisible', tabPage);



    // 帧率设置
    this.addFrameRateSection(tabPage);
  }

  /**
   * 初始化系统设置标签页
   */
  initSystemTab() {
    const tabPage = this.settingsUI.getTabPage('system');

    // 系统设置
    this.settingsUI.addSectionHeaderToPage('系统设置 System Settings', tabPage);
    this.settingsUI.addSwitchControlToPage('启用开场动画 Intro Animation', 'introAnimation', tabPage);

    // 开发者工具设置
    this.settingsUI.addSectionHeaderToPage('开发者工具 Developer Tools', tabPage);
    this.settingsUI.addSwitchControlToPage('启用调试工具 Enable Debug Tools', 'debugEnabled', tabPage);

    // 动画设置
    this.settingsUI.addSectionHeaderToPage('动画设置 Animation Settings', tabPage);
    this.settingsUI.addSliderControlToPage('待机动画倍速 Idle Animation Speed', 'idleAnimationSpeed', 1.0, 16.0, 0.1, tabPage);
  }

  /**
   * 添加分辨率设置部分
   */
  addResolutionSection(page) {
    this.settingsUI.addSectionHeaderToPage('分辨率 Resolution', page);

    const resolutionControl = document.createElement('div');
    resolutionControl.className = 'resolution-control';
    resolutionControl.classList.add('control-reduced-margin');

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'resolution-buttons';
    buttonsWrapper.classList.add('reduced-margin');

    this.settingsCore.resolutionOptions.forEach(resolution => {
      const button = document.createElement('button');
      button.className = 'resolution-button';
      button.textContent = resolution;
      button.classList.add('compact');
      if (resolution === this.settingsCore.getSetting('resolution')) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => {
        this.settingsCore.updateSetting('resolution', resolution);
        
        // 更新按钮选中状态
        document.querySelectorAll('.resolution-button').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');

        // 触发设置更新事件
        document.dispatchEvent(new CustomEvent('settingChanged', {
          detail: { key: 'resolution', value: resolution }
        }));
      });

      buttonsWrapper.appendChild(button);
    });

    resolutionControl.appendChild(buttonsWrapper);

    // 添加提示文本
    const resolutionHint = document.createElement('div');
    resolutionHint.className = 'resolution-hint';
    const parts = this.settingsControls.splitLabelText('切换分辨率将重新加载模型 Changing resolution will reload the model');
    
    if (parts.english) {
      const chineseSpan = document.createElement('span');
      chineseSpan.textContent = parts.chinese;
      resolutionHint.appendChild(chineseSpan);

      const englishSpan = document.createElement('span');
      englishSpan.className = 'english-text';
      englishSpan.textContent = ' ' + parts.english;
      englishSpan.style.marginLeft = '3px';
      resolutionHint.appendChild(englishSpan);
    } else {
      resolutionHint.textContent = parts.chinese;
    }

    resolutionHint.style.marginTop = '1px';
    resolutionHint.style.fontSize = '9px';
    resolutionControl.appendChild(resolutionHint);

    page.appendChild(resolutionControl);
  }

  /**
   * 添加重置按钮部分
   */
  addResetSection(page) {
    this.settingsUI.addSectionHeaderToPage('重置 Reset', page);

    const resetButton = this.settingsControls.createButton('重置所有设置 Reset All Settings', () => {
      if (confirm('确定要重置所有设置吗？这将清除所有自定义配置。\nAre you sure you want to reset all settings? This will clear all custom configurations.')) {
        this.settingsCore.resetToDefaults();
        this.settingsUI.refreshUI();
        // 触发设置应用事件
        document.dispatchEvent(new CustomEvent('settingsNeedApply'));
        console.log('所有设置已重置为默认值');
      }
    });

    page.appendChild(resetButton);
  }

  /**
   * 添加自动修复按钮部分
   */
  addAutoFixSection(page) {
    const autoFixButton = this.settingsControls.createButton('自动修复眼球映射 Auto Fix Eye Mapping', () => {
      console.log('开始自动修复眼球映射...');
      
      if (window.eyeTracking) {
        window.eyeTracking.autoFixMapping();
        
        // 更新设置以反映自动修复的结果
        this.settingsCore.updateSetting('useSpecialFix', window.eyeTracking.options.useSpecialFix);
        this.settingsCore.updateSetting('invertX', window.eyeTracking.options.invertX);
        this.settingsCore.updateSetting('invertY', window.eyeTracking.options.invertY);
        this.settingsCore.updateSetting('swapXY', window.eyeTracking.options.swapXY);
        
        // 刷新UI以显示新的设置状态
        this.settingsUI.refreshUI();
        
        console.log('眼球映射自动修复完成，请测试眼球追踪效果');
      } else {
        console.warn("眼部追踪实例不存在，无法执行自动修复");
      }
    });

    page.appendChild(autoFixButton);
  }





  /**
   * 添加帧率设置部分
   */
  addFrameRateSection(page) {
    this.settingsUI.addSectionHeaderToPage('帧率设置 Frame Rate Settings', page);

    this.settingsUI.addSwitchControlToPage('启用帧率限制 Enable Frame Rate Limit', 'frameRateEnabled', page);

    // 帧率选择按钮
    const control = document.createElement('div');
    control.className = 'framerate-control';
    control.classList.add('control-reduced-margin');

    const parts = this.settingsControls.splitLabelText('目标帧率 Target FPS');
    const label = document.createElement('div');
    label.className = 'control-label';

    if (parts.english) {
      const chineseSpan = document.createElement('span');
      chineseSpan.textContent = parts.chinese;
      label.appendChild(chineseSpan);

      const englishSpan = document.createElement('span');
      englishSpan.className = 'english-text';
      englishSpan.textContent = ' ' + parts.english;
      englishSpan.style.marginLeft = '3px';
      label.appendChild(englishSpan);
    } else {
      label.textContent = parts.chinese;
    }

    control.appendChild(label);

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'framerate-buttons';

    const frameRates = [30, 60, 120, 0]; // 0 表示无限制

    frameRates.forEach(fps => {
      const button = document.createElement('button');
      button.className = 'framerate-button';
      button.textContent = fps === 0 ? '无限制' : `${fps}`;

      if (fps === this.settingsCore.getSetting('targetFPS')) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => {
        this.settingsCore.updateSetting('targetFPS', fps);

        // 更新按钮选中状态
        buttonsWrapper.querySelectorAll('.framerate-button').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');

        // 触发设置更新事件
        document.dispatchEvent(new CustomEvent('settingChanged', {
          detail: { key: 'targetFPS', value: fps }
        }));
      });

      buttonsWrapper.appendChild(button);
    });

    control.appendChild(buttonsWrapper);
    page.appendChild(control);
  }

  /**
   * 重置文本显示设置
   */
  resetTextDisplaySettings() {
    // 重置为默认值
    const defaultSettings = {
      textDisplayX: 50,
      textDisplayY: 85,
      textDisplayOpacity: 90,
      textDisplayFontSize: 18
    };

    // 更新设置
    Object.keys(defaultSettings).forEach(key => {
      this.settingsCore.updateSetting(key, defaultSettings[key]);

      // 触发设置更新事件
      document.dispatchEvent(new CustomEvent('settingChanged', {
        detail: { key: key, value: defaultSettings[key] }
      }));
    });

    // 刷新UI显示
    Object.keys(defaultSettings).forEach(key => {
      this.settingsControls.refreshControl(key);
    });

    // 显示预览效果
    if (window.textDisplayManager) {
      window.textDisplayManager.showPreview();
    }

    console.log('文本显示位置和透明度已重置为默认值');
  }

  /**
   * 显示文本显示预览
   */
  showTextDisplayPreview() {
    if (window.textDisplayManager) {
      window.textDisplayManager.showPreview();
      console.log('手动显示文本预览');
    } else {
      console.warn('文本显示管理器未找到');
    }
  }
}

// 导出类
window.SettingsTabManager = SettingsTabManager;
