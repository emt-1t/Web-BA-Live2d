/**
 * SettingsUI.js - 设置界面管理器
 * 负责创建和管理设置界面的UI元素
 */

class SettingsUI {
  constructor(settingsCore, settingsControls) {
    this.settingsCore = settingsCore;
    this.settingsControls = settingsControls;
    
    // 设置面板状态
    this.isVisible = false;
    
    // UI元素引用
    this.settingsButton = null;
    this.settingsPanel = null;
    this.tabContainer = null;
    
    // 初始化UI
    this.init();
  }

  /**
   * 初始化UI
   */
  init() {
    // 创建设置按钮
    this.createSettingsButton();
    // 创建设置面板
    this.createSettingsPanel();
    // 设置事件监听
    this.setupEventListeners();
    
    // 检查是否为首次访问
    this.checkFirstVisit();
    
    console.log("设置界面UI已初始化");
  }

  /**
   * 创建设置按钮
   */
  createSettingsButton() {
    this.settingsButton = document.createElement('div');
    this.settingsButton.id = 'settings-button';
    this.settingsButton.innerHTML = '⚙️'; // 使用齿轮图标
    this.settingsButton.title = '设置';

    // 设置初始样式为完全透明
    this.settingsButton.classList.add('hidden');

    // 添加到页面
    document.body.appendChild(this.settingsButton);
  }

  /**
   * 创建设置面板
   */
  createSettingsPanel() {
    // 创建面板容器
    this.settingsPanel = document.createElement('div');
    this.settingsPanel.className = 'settings-panel';
    this.settingsPanel.classList.add('hidden');

    // 添加标题
    const title = document.createElement('h2');
    title.className = 'settings-title';
    title.textContent = '壁纸控制 Wallpaper Controls';
    this.settingsPanel.appendChild(title);

    // 添加次级说明
    const subTitle = document.createElement('div');
    subTitle.className = 'settings-subtitle';
    subTitle.textContent = '（右上角可开关面板）Toggle panel at top-right';
    this.settingsPanel.appendChild(subTitle);

    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '×';
    closeButton.title = '关闭';
    closeButton.addEventListener('click', () => this.hidePanel());
    this.settingsPanel.appendChild(closeButton);

    // 创建标签页导航
    this.createTabNavigation();

    // 创建页面容器
    this.createTabPages();

    // 添加到页面
    document.body.appendChild(this.settingsPanel);
  }

  /**
   * 创建标签页导航
   */
  createTabNavigation() {
    const tabNav = document.createElement('div');
    tabNav.className = 'tab-navigation';

    const tabs = [
      { id: 'basic', label: '基础 Basic' },
      { id: 'eyeTracking', label: '视线追踪 Eye Tracking' },
      { id: 'backgroundTracking', label: '背景追踪 Background Tracking' },
      { id: 'sound', label: '声音控制 Sound' },
      { id: 'ui', label: '界面 UI' },
      { id: 'system', label: '系统 System' }
    ];

    tabs.forEach((tab, index) => {
      const tabButton = document.createElement('button');
      tabButton.className = 'tab-button';
      tabButton.dataset.tabId = tab.id;
      
      // 分离中英文
      const parts = this.settingsControls.splitLabelText(tab.label);
      
      if (parts.english) {
        const container = document.createElement('div');
        container.classList.add('tab-text-container');
        
        const chineseSpan = document.createElement('span');
        chineseSpan.textContent = parts.chinese;
        container.appendChild(chineseSpan);
        
        const englishSpan = document.createElement('span');
        englishSpan.className = 'english-text';
        englishSpan.textContent = parts.english;
        container.appendChild(englishSpan);
        
        tabButton.appendChild(container);
      } else {
        tabButton.textContent = parts.chinese;
      }

      // 第一个标签页默认激活
      if (index === 0) {
        tabButton.classList.add('active');
      }

      tabButton.addEventListener('click', () => this.switchTab(tab.id));
      tabNav.appendChild(tabButton);
    });

    this.settingsPanel.appendChild(tabNav);
  }

  /**
   * 创建标签页容器
   */
  createTabPages() {
    this.tabContainer = document.createElement('div');
    this.tabContainer.className = 'tab-container';

    const tabs = ['basic', 'eyeTracking', 'backgroundTracking', 'sound', 'ui', 'system'];

    tabs.forEach((tabId, index) => {
      const tabPage = document.createElement('div');
      tabPage.className = 'tab-page';
      tabPage.dataset.tabId = tabId;
      
      // 第一个标签页默认显示
      if (index === 0) {
        tabPage.classList.add('active');
      }

      this.tabContainer.appendChild(tabPage);
    });

    this.settingsPanel.appendChild(this.tabContainer);
  }

  /**
   * 切换标签页
   */
  switchTab(tabId) {
    // 更新标签按钮状态
    const tabButtons = this.settingsPanel.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.tabId === tabId);
    });

    // 更新标签页显示
    const tabPages = this.tabContainer.querySelectorAll('.tab-page');
    tabPages.forEach(page => {
      page.classList.toggle('active', page.dataset.tabId === tabId);
    });

    console.log(`切换到标签页: ${tabId}`);
  }

  /**
   * 添加部分标题到指定页面
   */
  addSectionHeaderToPage(titleText, page) {
    const header = document.createElement('div');
    header.className = 'section-header';

    // 分离中英文标签
    const parts = this.settingsControls.splitLabelText(titleText);

    // 处理有英文部分的情况
    if (parts.english) {
      const chineseSpan = document.createElement('span');
      chineseSpan.textContent = parts.chinese;
      header.appendChild(chineseSpan);

      const englishSpan = document.createElement('span');
      englishSpan.className = 'english-text';
      englishSpan.textContent = ' ' + parts.english;
      englishSpan.style.marginLeft = '3px';
      header.appendChild(englishSpan);
    } else {
      header.textContent = parts.chinese;
    }

    header.style.marginBottom = '3px';
    page.appendChild(header);
  }

  /**
   * 添加滑块控件到指定页面
   */
  addSliderControlToPage(labelText, settingKey, min, max, step, page) {
    return this.settingsControls.addSliderControl(labelText, settingKey, min, max, step, page);
  }

  /**
   * 添加开关控件到指定页面
   */
  addSwitchControlToPage(labelText, settingKey, page) {
    return this.settingsControls.addSwitchControl(labelText, settingKey, page);
  }

  /**
   * 添加下拉选择控件到指定页面
   */
  addSelectControlToPage(labelText, settingKey, options, page) {
    return this.settingsControls.addSelectControl(labelText, settingKey, options, page);
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 点击设置按钮
    this.settingsButton.addEventListener('click', () => {
      this.togglePanel();
    });

    // 鼠标移入按钮
    this.settingsButton.addEventListener('mouseenter', () => {
      this.settingsButton.classList.remove('hidden');
      this.settingsButton.classList.add('visible');
    });

    // 鼠标移出按钮
    this.settingsButton.addEventListener('mouseleave', () => {
      if (!this.isVisible) {
        this.settingsButton.classList.remove('visible');
        this.settingsButton.classList.add('hidden');
      }
    });

    // 点击面板外部时关闭面板
    document.addEventListener('click', (event) => {
      if (this.isVisible &&
          event.target !== this.settingsButton &&
          !this.settingsPanel.contains(event.target)) {
        this.hidePanel();
      }
    });

    // 监听字体大小变化事件
    document.addEventListener('fontSizeChanged', (event) => {
      this.applyFontSize(event.detail.scale);
    });
  }

  /**
   * 检查是否为首次访问
   */
  checkFirstVisit() {
    if (this.settingsCore.checkFirstVisit()) {
      // 首次访问，标记已访问并延迟打开设置面板
      this.settingsCore.markAsVisited();

      // 延迟1秒打开设置面板，确保页面完全加载
      setTimeout(() => {
        this.showPanel();
        console.log("首次访问：自动打开设置面板");
      }, 1000);
    } else {
      console.log("非首次访问：设置面板保持关闭状态");
    }
  }

  /**
   * 切换面板显示
   */
  togglePanel() {
    if (this.isVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  /**
   * 显示面板
   */
  showPanel() {
    this.settingsPanel.classList.remove('hidden');
    this.settingsPanel.classList.add('visible');
    this.isVisible = true;
    this.settingsButton.classList.remove('hidden');
    this.settingsButton.classList.add('visible');
  }

  /**
   * 隐藏面板
   */
  hidePanel() {
    this.settingsPanel.classList.remove('visible');
    this.settingsPanel.classList.add('hidden');
    this.isVisible = false;
    this.settingsButton.classList.remove('visible');
    this.settingsButton.classList.add('hidden');
  }

  /**
   * 获取指定标签页
   */
  getTabPage(tabId) {
    return this.tabContainer.querySelector(`[data-tab-id="${tabId}"]`);
  }

  /**
   * 刷新UI显示
   */
  refreshUI() {
    // 刷新所有控件
    Object.keys(this.settingsCore.getAllSettings()).forEach(key => {
      this.settingsControls.refreshControl(key);
    });
  }

  /**
   * 应用UI高度缩放（调整整个设置面板的高度）
   */
  applyUIScale(scale) {
    if (this.settingsPanel && this.tabContainer) {
      // 计算整个设置面板的高度
      // 基础面板高度约为 88vh（占据大部分屏幕高度）
      const basePanelHeight = 88;
      const newPanelHeight = Math.round(basePanelHeight * scale);

      // 调整整个设置面板的高度
      this.settingsPanel.style.height = `${newPanelHeight}vh`;
      this.settingsPanel.style.maxHeight = `${newPanelHeight}vh`;

      // 计算标签页容器的相应高度
      // 面板中除了标签页容器外，还有标题、导航等固定部分约占 18vh
      const baseContentHeight = 70;
      const newContentHeight = Math.round(baseContentHeight * scale);

      // 同时调整标签页容器的高度，确保滚动条能正确工作
      this.tabContainer.style.height = `${newContentHeight}vh`;
      this.tabContainer.style.maxHeight = `${newContentHeight}vh`;

      console.log(`设置面板高度已设置为: ${newPanelHeight}vh，内容区域高度: ${newContentHeight}vh (缩放比例: ${scale})`);
    }
  }

  /**
   * 应用字体大小缩放
   */
  applyFontSize(scale) {
    if (this.settingsPanel) {
      // 设置CSS变量来控制字体大小
      this.settingsPanel.style.setProperty('--font-scale', scale);
      console.log(`字体大小已设置为: ${scale}倍`);
    }
  }
}

// 导出类
window.SettingsUI = SettingsUI;
