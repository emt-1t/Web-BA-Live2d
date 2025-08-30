// 壁纸控制界面模块
class WallpaperControl {
  constructor() {
    // 壁纸控制状态
    this.isControlVisible = false;
    // 控制按钮和面板引用
    this.controlButton = null;
    this.controlPanel = null;
    
    // 初始化
    this.init();
  }
  
  // 初始化方法
  init() {
    // 创建控制按钮
    this.createControlButton();
    // 创建控制面板
    this.createControlPanel();
    // 设置事件监听
    this.setupEventListeners();
    
    console.log("壁纸控制界面已初始化");
  }
  
  // 创建控制按钮
  createControlButton() {
    // 创建控制按钮
    this.controlButton = document.createElement('div');
    this.controlButton.id = 'wallpaper-control-button';
    this.controlButton.innerHTML = '⚙️'; // 使用齿轮图标
    this.controlButton.title = '壁纸控制';
    
    // 应用样式
    this.controlButton.style.position = 'fixed';
    this.controlButton.style.top = '15px';
    this.controlButton.style.right = '15px';
    this.controlButton.style.width = '70px';
    this.controlButton.style.height = '70px';
    this.controlButton.style.borderRadius = '50%';
    this.controlButton.style.backgroundColor = 'rgba(0, 0, 0, 0)'; // 完全透明
    this.controlButton.style.color = 'rgba(255, 255, 255, 0)'; // 完全透明
    this.controlButton.style.fontSize = '36px';
    this.controlButton.style.display = 'flex';
    this.controlButton.style.justifyContent = 'center';
    this.controlButton.style.alignItems = 'center';
    this.controlButton.style.cursor = 'pointer';
    this.controlButton.style.transition = 'all 0.3s ease';
    this.controlButton.style.zIndex = '2000';
    this.controlButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0)'; // 初始无阴影
    
    // 添加到页面
    document.body.appendChild(this.controlButton);
  }
  
  // 创建控制面板
  createControlPanel() {
    // 创建控制面板容器
    this.controlPanel = document.createElement('div');
    this.controlPanel.id = 'wallpaper-control-panel';
    
    // 应用样式 - 屏幕正中心长方形
    this.controlPanel.style.position = 'fixed';
    this.controlPanel.style.top = '50%';
    this.controlPanel.style.left = '50%';
    this.controlPanel.style.transform = 'translate(-50%, -50%)';
    this.controlPanel.style.width = '600px';
    this.controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    this.controlPanel.style.padding = '30px';
    this.controlPanel.style.borderRadius = '15px';
    this.controlPanel.style.color = 'white';
    this.controlPanel.style.display = 'none';
    this.controlPanel.style.zIndex = '1999';
    this.controlPanel.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.7)';
    
    // 添加面板标题
    const title = document.createElement('h3');
    title.textContent = '壁纸控制面板';
    title.style.margin = '0 0 30px 0';
    title.style.textAlign = 'center';
    title.style.fontSize = '24px';
    title.style.padding = '0 0 15px 0';
    title.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
    this.controlPanel.appendChild(title);
    
    // 暂时不添加具体控制，后续再实现
    const comingSoon = document.createElement('p');
    comingSoon.textContent = '更多控制选项即将推出...';
    comingSoon.style.textAlign = 'center';
    comingSoon.style.opacity = '0.7';
    comingSoon.style.padding = '50px 0';
    comingSoon.style.fontSize = '20px';
    this.controlPanel.appendChild(comingSoon);
    
    // 添加到页面
    document.body.appendChild(this.controlPanel);
  }
  
  // 设置事件监听
  setupEventListeners() {
    // 鼠标移入按钮时
    this.controlButton.addEventListener('mouseenter', () => {
      this.controlButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      this.controlButton.style.color = 'rgba(255, 255, 255, 1)';
      this.controlButton.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    });
    
    // 鼠标移出按钮时
    this.controlButton.addEventListener('mouseleave', () => {
      // 如果面板未显示，恢复全透明状态
      if (!this.isControlVisible) {
        this.controlButton.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        this.controlButton.style.color = 'rgba(255, 255, 255, 0)';
        this.controlButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0)';
      }
    });
    
    // 点击按钮时
    this.controlButton.addEventListener('click', () => {
      this.toggleControlPanel();
    });
    
    // 点击面板外部时关闭面板
    document.addEventListener('click', (event) => {
      if (this.isControlVisible && 
          event.target !== this.controlButton && 
          !this.controlPanel.contains(event.target)) {
        this.hideControlPanel();
      }
    });
  }
  
  // 切换控制面板显示状态
  toggleControlPanel() {
    if (this.isControlVisible) {
      this.hideControlPanel();
    } else {
      this.showControlPanel();
    }
  }
  
  // 显示控制面板
  showControlPanel() {
    this.controlPanel.style.display = 'block';
    this.isControlVisible = true;
    this.controlButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    this.controlButton.style.color = 'rgba(255, 255, 255, 1)';
    this.controlButton.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  }
  
  // 隐藏控制面板
  hideControlPanel() {
    this.controlPanel.style.display = 'none';
    this.isControlVisible = false;
    this.controlButton.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    this.controlButton.style.color = 'rgba(255, 255, 255, 0)';
    this.controlButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0)';
  }
}

// 将类导出为全局变量
window.WallpaperControl = WallpaperControl; 