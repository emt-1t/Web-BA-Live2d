// 调试工具模块 - 现代化UI设计
class DebugTools {
  constructor(app) {
    this.app = app;
    this.consoleEl = null;
    this.consoleContentEl = null;
    this.controlsEl = null;
    this.infoEl = null;
    this.loadingEl = null;
    this.folderContentEl = null;
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };
    // 骨骼和动画调试UI
    this.boneDebugUI = null;
    this.animationDebugUI = null;

    // 调试工具可见性状态
    this.isVisible = false;
  }

  // 初始化调试工具
  init() {
    // 创建调试UI元素
    this.createDebugUIElements();
    // 查找DOM元素
    this.findElements();
    // 设置控制台捕获
    this.setupConsoleCapture();
    // 设置事件监听器
    this.setupEventListeners();
    // 检查Spine版本
    this.checkSpineVersion();

    return this;
  }

  // 创建调试UI元素
  createDebugUIElements() {
    // 添加现代化调试控制台样式
    const style = document.createElement('style');
    style.textContent = `
      /* 现代化调试工具样式 - 紧凑版 */
      .debug-console {
        position: fixed;
        top: 20px;
        left: 20px;
        width: 280px;
        height: 180px;
        background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        color: #e0e0e0;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        overflow: hidden;
        display: none;
        z-index: 1000;
        transition: all 0.3s ease;
      }

      .debug-console-header {
        background: linear-gradient(90deg, #667eea, #764ba2);
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 8px 8px 0 0;
      }

      .debug-console-content {
        height: calc(100% - 32px);
        overflow-y: auto;
        padding: 8px;
        font-size: 11px;
        line-height: 1.3;
      }

      .debug-console-content::-webkit-scrollbar {
        width: 6px;
      }

      .debug-console-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }

      .debug-console-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }

      .debug-console p {
        margin: 4px 0;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: pre-wrap;
        word-break: break-word;
        transition: background-color 0.2s ease;
      }

      .debug-console .error {
        color: #ff6b6b;
        background: rgba(255, 107, 107, 0.1);
      }

      .debug-console .warning {
        color: #ffd93d;
        background: rgba(255, 217, 61, 0.1);
      }

      .debug-console .log {
        color: #74c0fc;
      }

      .debug-controls {
        position: fixed;
        top: 210px;
        left: 20px;
        background: linear-gradient(135deg, rgba(40, 40, 40, 0.95), rgba(30, 30, 30, 0.95));
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 6px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        max-width: 280px;
      }

      .debug-btn {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 500;
        transition: all 0.3s ease;
        box-shadow: 0 1px 4px rgba(102, 126, 234, 0.3);
        white-space: nowrap;
      }

      .debug-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #7c8df0, #8a5cb8);
      }

      .debug-btn:active {
        transform: translateY(0);
      }

      .debug-btn.danger {
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
      }

      .debug-btn.danger:hover {
        background: linear-gradient(135deg, #ff7979, #f55a4e);
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
      }

      .debug-btn.success {
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
        box-shadow: 0 2px 8px rgba(108, 92, 231, 0.3);
      }

      .debug-btn.success:hover {
        background: linear-gradient(135deg, #7d70e8, #b3a9ff);
        box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
      }

      .debug-panel {
        position: fixed;
        top: 20px;
        left: 320px;
        width: 240px;
        max-height: 300px;
        background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        color: #e0e0e0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden;
        display: none;
        z-index: 1002;
        transition: all 0.3s ease;
      }

      .debug-panel-header {
        background: linear-gradient(90deg, #667eea, #764ba2);
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }

      .debug-panel-content {
        padding: 8px;
        max-height: 260px;
        overflow-y: auto;
      }

      .debug-panel-content::-webkit-scrollbar {
        width: 6px;
      }

      .debug-panel-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }

      .debug-panel-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }

      .debug-search-box {
        width: 100%;
        padding: 4px 6px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        border-radius: 4px;
        font-size: 11px;
        transition: all 0.3s ease;
        box-sizing: border-box;
      }

      .debug-search-box:focus {
        outline: none;
        border-color: #667eea;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }

      .debug-search-box::placeholder {
        color: rgba(224, 224, 224, 0.6);
      }

      .debug-list-container {
        max-height: 180px;
        overflow-y: auto;
        margin-bottom: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.05);
      }

      .debug-item {
        padding: 6px 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .debug-item:last-child {
        border-bottom: none;
      }

      .debug-item:hover {
        background: rgba(102, 126, 234, 0.1);
        transform: translateX(4px);
      }

      .debug-item strong {
        color: #74c0fc;
        font-size: 11px;
      }

      .debug-item div {
        color: rgba(224, 224, 224, 0.8);
        font-size: 9px;
        margin-top: 2px;
      }

      .debug-panel-btn {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 500;
        width: 100%;
        margin-top: 6px;
        transition: all 0.3s ease;
        box-shadow: 0 1px 4px rgba(102, 126, 234, 0.3);
      }

      .debug-panel-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #7c8df0, #8a5cb8);
      }

      .debug-panel-btn.small {
        width: auto;
        padding: 3px 6px;
        font-size: 9px;
        margin: 2px 0 0 0;
      }

      .folder-content {
        position: fixed;
        top: 20px;
        left: 320px;
        width: 240px;
        max-height: 280px;
        background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        color: #e0e0e0;
        padding: 8px;
        overflow-y: auto;
        display: none;
        z-index: 1001;
        transition: all 0.3s ease;
      }

      .folder-content h3 {
        margin: 0 0 8px 0;
        color: #74c0fc;
        font-size: 12px;
        text-align: center;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .folder-content ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .folder-content li {
        padding: 4px 6px;
        cursor: pointer;
        border-radius: 4px;
        margin-bottom: 2px;
        transition: all 0.2s ease;
        font-size: 10px;
      }

      .folder-content li:hover {
        background: rgba(102, 126, 234, 0.2);
        transform: translateX(4px);
      }
    `;
    document.head.appendChild(style);

    // 创建现代化控制台元素
    const consoleEl = document.createElement('div');
    consoleEl.id = 'console';
    consoleEl.className = 'debug-console';
    consoleEl.innerHTML = `
      <div class="debug-console-header">
        <span>调试控制台</span>
        <span style="font-size: 9px; opacity: 0.8;">Ctrl+C</span>
      </div>
      <div class="debug-console-content" id="consoleContent"></div>
    `;
    document.body.appendChild(consoleEl);

    // 创建现代化控制按钮
    const controlsEl = document.createElement('div');
    controlsEl.id = 'controls';
    controlsEl.className = 'debug-controls';
    controlsEl.innerHTML = `
      <button id="toggleConsole" class="debug-btn">控制台</button>
      <button id="clearConsole" class="debug-btn danger">清除</button>
      <button id="reload" class="debug-btn success">重载</button>
      <button id="showFolder" class="debug-btn">文件</button>
      <button id="showBones" class="debug-btn">骨骼</button>
      <button id="showAnimations" class="debug-btn">动画</button>
      <button id="showDialogues" class="debug-btn">对话</button>
    `;
    document.body.appendChild(controlsEl);

    // 创建现代化文件夹内容显示区域
    const folderContentEl = document.createElement('div');
    folderContentEl.id = 'folderContent';
    folderContentEl.className = 'folder-content';
    document.body.appendChild(folderContentEl);

    // 创建现代化骨骼列表面板
    const bonesPanelEl = document.createElement('div');
    bonesPanelEl.id = 'bonesPanel';
    bonesPanelEl.className = 'debug-panel';
    bonesPanelEl.innerHTML = `
      <div class="debug-panel-header">骨骼列表</div>
      <div class="debug-panel-content">
        <input type="text" class="debug-search-box" id="boneSearch" placeholder="搜索骨骼...">
        <div id="bonesListContainer" class="debug-list-container"></div>
        <button id="closeBonesPanel" class="debug-panel-btn">关闭</button>
      </div>
    `;
    document.body.appendChild(bonesPanelEl);

    // 创建现代化动画列表面板
    const animationsPanelEl = document.createElement('div');
    animationsPanelEl.id = 'animationsPanel';
    animationsPanelEl.className = 'debug-panel';
    animationsPanelEl.innerHTML = `
      <div class="debug-panel-header">动画列表</div>
      <div class="debug-panel-content">
        <input type="text" class="debug-search-box" id="animationSearch" placeholder="搜索动画...">
        <div id="animationsListContainer" class="debug-list-container"></div>
        <button id="closeAnimationsPanel" class="debug-panel-btn">关闭</button>
      </div>
    `;
    document.body.appendChild(animationsPanelEl);

    // 创建现代化对话列表面板
    const dialoguesPanelEl = document.createElement('div');
    dialoguesPanelEl.id = 'dialoguesPanel';
    dialoguesPanelEl.className = 'debug-panel';
    dialoguesPanelEl.innerHTML = `
      <div class="debug-panel-header">对话列表</div>
      <div class="debug-panel-content">
        <input type="text" class="debug-search-box" id="dialogueSearch" placeholder="搜索对话...">
        <div id="dialoguesListContainer" class="debug-list-container"></div>
        <button id="closeDialoguesPanel" class="debug-panel-btn">关闭</button>
      </div>
    `;
    document.body.appendChild(dialoguesPanelEl);

    console.log("调试UI元素已创建");

    // 初始时隐藏所有调试元素
    this.hide();
  }
  
  // 查找DOM元素
  findElements() {
    this.consoleEl = document.getElementById('console');
    this.consoleContentEl = document.getElementById('consoleContent');
    this.controlsEl = document.getElementById('controls');
    this.infoEl = document.getElementById('info');
    this.loadingEl = document.getElementById('loading');
    this.folderContentEl = document.getElementById('folderContent');
    this.bonesPanelEl = document.getElementById('bonesPanel');
    this.animationsPanelEl = document.getElementById('animationsPanel');
    this.dialoguesPanelEl = document.getElementById('dialoguesPanel');
    this.bonesListContainerEl = document.getElementById('bonesListContainer');
    this.animationsListContainerEl = document.getElementById('animationsListContainer');
    this.dialoguesListContainerEl = document.getElementById('dialoguesListContainer');
  }
  
  // 设置事件监听器
  setupEventListeners() {
    // 设置控制按钮
    document.getElementById('toggleConsole')?.addEventListener('click', () => {
      this.toggleConsole();
    });
    
    document.getElementById('clearConsole')?.addEventListener('click', () => {
      this.clearConsole();
    });
    
    document.getElementById('reload')?.addEventListener('click', () => {
      window.location.reload();
    });
    
    document.getElementById('showFolder')?.addEventListener('click', () => {
      this.listFolderContent('2k');
    });
    
    document.getElementById('showBones')?.addEventListener('click', () => {
      this.showBonesPanel();
    });
    
    document.getElementById('showAnimations')?.addEventListener('click', () => {
      this.showAnimationsPanel();
    });

    document.getElementById('showDialogues')?.addEventListener('click', () => {
      this.showDialoguesPanel();
    });

    document.getElementById('closeBonesPanel')?.addEventListener('click', () => {
      this.bonesPanelEl.style.display = 'none';
    });

    document.getElementById('closeAnimationsPanel')?.addEventListener('click', () => {
      this.animationsPanelEl.style.display = 'none';
    });

    document.getElementById('closeDialoguesPanel')?.addEventListener('click', () => {
      this.dialoguesPanelEl.style.display = 'none';
    });
    
    // 添加骨骼搜索功能
    document.getElementById('boneSearch')?.addEventListener('input', (e) => {
      this.filterBonesList(e.target.value);
    });
    
    // 添加动画搜索功能
    document.getElementById('animationSearch')?.addEventListener('input', (e) => {
      this.filterAnimationsList(e.target.value);
    });

    // 添加对话搜索功能
    document.getElementById('dialogueSearch')?.addEventListener('input', (e) => {
      this.filterDialoguesList(e.target.value);
    });

    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'c' && e.ctrlKey) {
        this.toggleConsole();
      }
    });
  }
  
  // 检查Spine版本
  checkSpineVersion() {
    try {
      console.log("检测Spine版本");
      if (!window.spine) {
        console.error("未找到Spine对象! 请确保已正确加载spine-pixi.js和spine-core.js");
        return;
      }
      
      // 打印Spine版本信息
      if (spine.version) {
        console.log(`Spine版本: ${spine.version}`);
      } else {
        console.log("无法获取Spine版本信息");
      }
      
      // 检查是否有必要的API
      if (!spine.Spine) {
        console.warn("无法找到spine.Spine构造函数，可能版本不匹配");
      }
    } catch (error) {
      console.error("检测Spine版本失败:", error);
    }
  }
  
  // 检查依赖项
  checkDependencies() {
    if (this.loadingEl) this.loadingEl.textContent = "检查依赖项...";
    
    // 检查spine
    if (!window.spine) {
      if (this.loadingEl) this.loadingEl.textContent = "错误：未找到Spine库！";
      if (this.infoEl) {
        this.infoEl.textContent = "请确保spine-core.min.js和spine-pixi-v8.min.js正确加载";
        this.infoEl.style.color = "red";
      }
      return false;
    }
    
    // 检查PIXI
    if (!window.PIXI) {
      if (this.loadingEl) this.loadingEl.textContent = "错误：未找到PIXI库！";
      if (this.infoEl) {
        this.infoEl.textContent = "请确保pixi.min.js正确加载";
        this.infoEl.style.color = "red";
      }
      return false;
    }
    
    // 检查spine.Spine
    if (!spine.Spine) {
      if (this.loadingEl) this.loadingEl.textContent = "错误：未找到spine.Spine对象！";
      if (this.infoEl) {
        this.infoEl.textContent = "Spine和PIXI整合可能有问题，请检查版本兼容性";
        this.infoEl.style.color = "red";
      }
      return false;
    }
    
    if (this.loadingEl) this.loadingEl.textContent = "依赖项检查完成，加载模型中...";
    return true;
  }
  
  // 设置控制台捕获
  setupConsoleCapture() {
    if (!this.consoleContentEl) return;

    const appendToConsole = (type, args) => {
      // 过滤掉眼部追踪骨骼相关的日志
      const logText = Array.from(args).join(' ');
      if (logText.includes('眼睛骨骼世界坐标') || logText.includes('eye bone')) {
        return; // 不记录眼部追踪相关的日志
      }

      const line = document.createElement('p');
      line.className = type;
      line.textContent = logText;
      this.consoleContentEl.appendChild(line);
      this.consoleContentEl.scrollTop = this.consoleContentEl.scrollHeight;
    };
    
    // 覆盖控制台方法
    console.log = (...args) => {
      // 过滤掉眼部追踪骨骼日志，但其他日志仍保留到浏览器控制台
      const logText = Array.from(args).join(' ');
      if (!logText.includes('眼睛骨骼世界坐标') && !logText.includes('eye bone')) {
        this.originalConsole.log.apply(console, args);
      }
      appendToConsole('log', args);
    };
    
    console.warn = (...args) => {
      this.originalConsole.warn.apply(console, args);
      appendToConsole('warning', args);
    };
    
    console.error = (...args) => {
      this.originalConsole.error.apply(console, args);
      appendToConsole('error', args);
    };
  }
  
  // 显示/隐藏控制台
  toggleConsole() {
    if (!this.consoleEl) return;
    this.consoleEl.style.display = this.consoleEl.style.display === 'none' ? 'block' : 'none';
  }
  
  // 清除控制台内容
  clearConsole() {
    if (!this.consoleContentEl) return;
    this.consoleContentEl.innerHTML = '';
  }
  
  // 显示加载状态
  showLoading(message) {
    if (!this.loadingEl) return;
    this.loadingEl.textContent = message;
    this.loadingEl.style.display = 'block';
  }
  
  // 隐藏加载状态
  hideLoading() {
    if (!this.loadingEl) return;
    this.loadingEl.style.display = 'none';
  }
  
  // 显示信息
  showInfo(message, isError = false) {
    if (!this.infoEl) return;
    this.infoEl.textContent = message;
    this.infoEl.style.color = isError ? '#ff5252' : 'white';
    this.infoEl.style.display = 'block';
    
    // 5秒后隐藏信息
    setTimeout(() => {
      this.infoEl.style.display = 'none';
    }, 5000);
  }
  
  // 列出文件夹内容
  async listFolderContent(folder) {
    try {
      if (!this.folderContentEl) return;

      this.folderContentEl.innerHTML = `<h3>文件夹: ${folder}</h3>`;

      const response = await fetch(`./${folder}/`);

      if (!response.ok) {
        this.folderContentEl.innerHTML += `<p style="text-align: center; color: #ff6b6b; padding: 20px;">无法读取文件夹</p>`;
        this.folderContentEl.style.display = 'block';
        return;
      }

      const html = await response.text();

      // 提取文件链接
      const fileRegex = /href="([^"]+)"/g;
      const fileList = document.createElement('ul');

      let match;
      while ((match = fileRegex.exec(html)) !== null) {
        const fileName = match[1];
        if (fileName === "../") continue;

        const li = document.createElement('li');
        li.textContent = fileName;
        li.addEventListener('click', () => {
          // 如果是skel文件，尝试加载
          if (fileName.endsWith('.skel')) {
            const baseName = fileName.substring(0, fileName.length - 5);
            const atlasFile = `${baseName}.atlas`;

            // 发布事件，让app.js处理加载
            const event = new CustomEvent('loadSpineModel', {
              detail: {
                skelFile: `${folder}/${fileName}`,
                atlasFile: `${folder}/${atlasFile}`
              }
            });
            document.dispatchEvent(event);

            // 显示加载提示
            this.showInfo(`正在加载模型: ${baseName}`);
          }
        });
        fileList.appendChild(li);
      }

      if (fileList.children.length === 0) {
        this.folderContentEl.innerHTML += `<p style="text-align: center; color: #ffd93d; padding: 20px;">文件夹为空或无法读取文件列表</p>`;
      } else {
        this.folderContentEl.appendChild(fileList);
      }

      this.folderContentEl.style.display = 'block';
    } catch (error) {
      console.error("获取文件夹内容失败:", error);
      this.showInfo("获取文件夹内容失败", true);
    }
  }
  
  // 显示骨骼列表面板
  showBonesPanel() {
    if (!this.app || !this.app.currentModel || !this.app.currentModel.skeleton) {
      console.error("错误：无法获取骨骼数据，请确保模型已加载");
      this.showInfo("错误：无法获取骨骼数据，请确保模型已加载", true);
      return;
    }
    
    // 清空骨骼列表
    this.bonesListContainerEl.innerHTML = '';
    
    // 获取骨骼列表并按名称排序
    const skeleton = this.app.currentModel.skeleton;
    const bones = [...skeleton.bones];
    bones.sort((a, b) => a.data.name.localeCompare(b.data.name));
    
    // 保存骨骼列表用于搜索
    this.allBones = bones;
    
    // 添加骨骼到列表
    this.populateBonesListPanel(bones);
    
    // 显示面板
    this.bonesPanelEl.style.display = 'block';
  }
  
  // 填充骨骼列表面板
  populateBonesListPanel(bones) {
    if (bones.length === 0) {
      const noBones = document.createElement('div');
      noBones.textContent = '没有找到骨骼';
      noBones.style.textAlign = 'center';
      noBones.style.padding = '10px';
      this.bonesListContainerEl.appendChild(noBones);
      return;
    }
    
    bones.forEach((bone, index) => {
      const boneRow = document.createElement('div');
      boneRow.className = 'debug-item';
      boneRow.dataset.boneName = bone.data.name.toLowerCase();
      
      const boneInfo = document.createElement('div');
      boneInfo.innerHTML = `
        <strong>${index + 1}. ${bone.data.name}</strong>
        <div>位置: x=${bone.worldX.toFixed(2)}, y=${bone.worldY.toFixed(2)}</div>
        <div>缩放: scaleX=${bone.scaleX.toFixed(2)}, scaleY=${bone.scaleY.toFixed(2)}</div>
        <div>旋转: ${(bone.rotation).toFixed(2)}°</div>
      `;
      
      boneRow.appendChild(boneInfo);
      this.bonesListContainerEl.appendChild(boneRow);
    });
  }
  
  // 搜索骨骼
  filterBonesList(searchTerm) {
    if (!this.allBones) return;
    
    searchTerm = searchTerm.toLowerCase();
    const filteredBones = searchTerm ? 
      this.allBones.filter(bone => bone.data.name.toLowerCase().includes(searchTerm)) : 
      this.allBones;
    
    // 清空列表
    this.bonesListContainerEl.innerHTML = '';
    
    // 重新填充
    this.populateBonesListPanel(filteredBones);
  }
  
  // 显示动画列表面板
  showAnimationsPanel() {
    if (!this.app || !this.app.currentModel || !this.app.currentModel.state) {
      console.error("错误：无法获取动画数据，请确保模型已加载");
      this.showInfo("错误：无法获取动画数据，请确保模型已加载", true);
      return;
    }
    
    // 清空动画列表
    this.animationsListContainerEl.innerHTML = '';
    
    // 获取动画列表
    let animations = [];
    if (this.app.currentModel.spineData && this.app.currentModel.spineData.animations) {
      animations = this.app.currentModel.spineData.animations;
    } else if (this.app.currentModel.skeleton && this.app.currentModel.skeleton.data && this.app.currentModel.skeleton.data.animations) {
      animations = this.app.currentModel.skeleton.data.animations;
    }
    
    // 按名称排序
    animations.sort((a, b) => (a.name || a).localeCompare(b.name || b));
    
    // 保存动画列表用于搜索
    this.allAnimations = animations;
    
    // 添加动画到列表
    this.populateAnimationsListPanel(animations);
    
    // 显示面板
    this.animationsPanelEl.style.display = 'block';
  }
  
  // 填充动画列表面板
  populateAnimationsListPanel(animations) {
    if (animations.length === 0) {
      const noAnimations = document.createElement('div');
      noAnimations.textContent = '没有找到动画';
      noAnimations.style.textAlign = 'center';
      noAnimations.style.padding = '10px';
      this.animationsListContainerEl.appendChild(noAnimations);
      return;
    }
    
    // 获取当前播放的动画
    let currentAnimation = null;
    if (this.app.currentModel.state && this.app.currentModel.state.tracks && this.app.currentModel.state.tracks[0]) {
      currentAnimation = this.app.currentModel.state.tracks[0].animation;
    }
    
    animations.forEach((animation, index) => {
      const animName = animation.name || animation;
      const animationRow = document.createElement('div');
      animationRow.className = 'debug-item';
      animationRow.dataset.animationName = animName.toLowerCase();
      
      // 检查是否是当前播放的动画
      const isCurrentAnim = currentAnimation && (currentAnimation.name === animName || currentAnimation === animName);
      
      // 获取动画持续时间
      const duration = animation.duration !== undefined ? animation.duration : '未知';
      
      const animInfo = document.createElement('div');
      animInfo.innerHTML = `
        <strong>${index + 1}. ${animName}</strong> ${isCurrentAnim ? '(当前播放)' : ''}
        <div>持续时间: ${typeof duration === 'number' ? duration.toFixed(2) + '秒' : duration}</div>
      `;
      
      // 添加播放按钮
      const playButton = document.createElement('button');
      playButton.textContent = '播放此动画';
      playButton.className = 'debug-panel-btn small';
      playButton.addEventListener('click', () => {
        this.playAnimation(animName);
      });
      
      animationRow.appendChild(animInfo);
      animationRow.appendChild(playButton);
      this.animationsListContainerEl.appendChild(animationRow);
    });
  }
  
  // 搜索动画
  filterAnimationsList(searchTerm) {
    if (!this.allAnimations) return;
    
    searchTerm = searchTerm.toLowerCase();
    const filteredAnimations = searchTerm ? 
      this.allAnimations.filter(anim => {
        const name = anim.name || anim;
        return name.toLowerCase().includes(searchTerm);
      }) : 
      this.allAnimations;
    
    // 清空列表
    this.animationsListContainerEl.innerHTML = '';
    
    // 重新填充
    this.populateAnimationsListPanel(filteredAnimations);
  }
  
  // 播放指定动画
  playAnimation(animationName) {
    if (!this.app || !this.app.currentModel || !this.app.currentModel.state) {
      console.error("无法播放动画：模型或状态不可用");
      return;
    }
    
    try {
      // 先获取动画使用的骨骼信息，在播放前分析
      let animation = null;
      let animatedBones = [];
      
      // 在不同模型结构中查找动画
      if (this.app.currentModel.spineData && this.app.currentModel.spineData.animations) {
        animation = this.app.currentModel.spineData.animations.find(a => 
          (typeof a === 'string' ? a : a.name) === animationName);
      } else if (this.app.currentModel.skeleton && this.app.currentModel.skeleton.data) {
        animation = this.app.currentModel.skeleton.data.animations.find(a => 
          (typeof a === 'string' ? a : a.name) === animationName);
      }
      
      if (animation) {
        console.log(`找到动画: ${animationName}`, animation);
        
        // 分析动画使用的骨骼
        animatedBones = this.extractAnimationBones(animation);
      }
      
      // 播放动画
      this.app.currentModel.state.setAnimation(0, animationName, true);
      console.log(`播放动画: ${animationName}`);
      this.showInfo(`正在播放动画: ${animationName}`);
      
      // 显示动画的骨骼信息
      this.displayAnimatedBones(animationName, animatedBones);
    } catch (error) {
      console.error(`播放动画 ${animationName} 失败:`, error);
      this.showInfo(`播放动画失败: ${error.message}`, true);
    }
  }
  
  // 获取骨骼索引到名称的映射
  getBoneIndexToNameMap() {
    const boneMap = new Map();
    
    try {
      let bones = [];
      // 从模型中获取所有骨骼
      if (this.app.currentModel.skeleton && this.app.currentModel.skeleton.bones) {
        bones = this.app.currentModel.skeleton.bones;
      } else if (this.app.currentModel.spineData && this.app.currentModel.spineData.bones) {
        bones = this.app.currentModel.spineData.bones;
      } else if (this.app.currentModel.skeleton && this.app.currentModel.skeleton.data && this.app.currentModel.skeleton.data.bones) {
        bones = this.app.currentModel.skeleton.data.bones;
      }
      
      if (bones.length > 0) {
        console.log('找到骨骼列表，数量:', bones.length);
        
        // 根据不同结构构建映射
        bones.forEach((bone, index) => {
          if (bone) {
            if (bone.data && bone.data.name) {
              boneMap.set(index, bone.data.name);
            } else if (bone.name) {
              boneMap.set(index, bone.name);
            } else {
              boneMap.set(index, `未命名骨骼_${index}`);
            }
          }
        });
      }
      
      // 尝试另一种结构
      if (boneMap.size === 0 && this.app.currentModel.spineData && this.app.currentModel.spineData.skeletonData) {
        const skeletonData = this.app.currentModel.spineData.skeletonData;
        if (skeletonData.bones) {
          console.log('从skeletonData获取骨骼名称');
          skeletonData.bones.forEach((bone, index) => {
            if (bone && bone.name) {
              boneMap.set(index, bone.name);
            }
          });
        }
      }
      
      console.log('构建了骨骼映射，数量:', boneMap.size);
      console.log('骨骼映射示例:', Array.from(boneMap.entries()).slice(0, 5));
    } catch (error) {
      console.warn('获取骨骼映射时出错:', error);
    }
    
    return boneMap;
  }
  
  // 提取动画使用的骨骼名称
  extractAnimationBones(animation) {
    if (!animation) return [];
    
    console.log('开始提取动画使用的骨骼');
    
    // 获取骨骼索引到名称的映射
    const boneIndexToName = this.getBoneIndexToNameMap();
    const animatedBones = new Set();
    
    try {
      // 检查常见的动画结构
      
      // 检查Spine时间轨道
      if (animation.timelines) {
        console.log('分析时间轨道...');
        animation.timelines.forEach(timeline => {
          // 提取骨骼名称
          if (timeline.boneIndex !== undefined) {
            // 使用映射将索引转换为名称
            const boneName = boneIndexToName.get(timeline.boneIndex) || `bone_index_${timeline.boneIndex}`;
            animatedBones.add(boneName);
          }
          // 检查常见的骨骼属性时间轨道
          if (timeline.bone) {
            animatedBones.add(timeline.bone);
          }
        });
      }
      
      // 高版本的Spine动画结构
      if (animation.bones) {
        console.log('从动画骨骼对象中提取...');
        for (const boneName in animation.bones) {
          animatedBones.add(boneName);
        }
      }
      
      // 低版本的Spine动画结构
      if (typeof animation === 'object' && animation.name && animation.boneData) {
        console.log('从boneData提取骨骼...');
        animation.boneData.forEach(bone => {
          if (bone.name) animatedBones.add(bone.name);
        });
      }
      
      // Spine 3.8+的动画结构
      if (animation.data && animation.data.bones) {
        console.log('从高版本数据结构提取...');
        for (const boneName in animation.data.bones) {
          animatedBones.add(boneName);
        }
      }
      
      console.log('提取到动画骨骼数量:', animatedBones.size);
    } catch (error) {
      console.warn('提取动画骨骼时出错:', error);
    }
    
    return Array.from(animatedBones);
  }
  
  // 显示动画使用的骨骼
  displayAnimatedBones(animationName, animatedBones) {
    console.log(`显示动画 "${animationName}" 使用的骨骼, 数量:`, animatedBones.length);
    
    // 删除现有面板
    const oldPanel = document.getElementById('animation-bones-panel');
    if (oldPanel) {
      document.body.removeChild(oldPanel);
    }
    
    // 创建骨骼面板
    const bonesPanelEl = document.createElement('div');
    bonesPanelEl.id = 'animation-bones-panel';
    bonesPanelEl.className = 'debug-panel';
    bonesPanelEl.style.bottom = '40px'; 
    bonesPanelEl.style.left = '320px';
    
    // 添加标题
    const titleEl = document.createElement('h2');
    titleEl.textContent = `动画 "${animationName}" 使用的骨骼 (${animatedBones.length})`;
    bonesPanelEl.appendChild(titleEl);
    
    // 骨骼列表容器
    const bonesContainerEl = document.createElement('div');
    bonesContainerEl.className = 'debug-list-container';
    bonesPanelEl.appendChild(bonesContainerEl);
    
    if (animatedBones.length === 0) {
      const noBones = document.createElement('div');
      noBones.textContent = '未检测到动画使用的骨骼';
      noBones.style.textAlign = 'center';
      noBones.style.padding = '10px';
      bonesContainerEl.appendChild(noBones);
      
      // 尝试直接获取当前骨骼数据
      this.tryToGetCurrentBones(bonesContainerEl, animationName);
    } else {
      // 按照字母排序
      const sortedBones = [...animatedBones].sort();
      
      // 显示骨骼总数
      const countEl = document.createElement('div');
      countEl.style.textAlign = 'center';
      countEl.style.marginBottom = '10px';
      countEl.innerHTML = `<strong>动画使用了 ${sortedBones.length} 个骨骼</strong>`;
      bonesContainerEl.appendChild(countEl);
      
      // 在控制台输出全部骨骼名称以便调试
      console.log('动画使用的骨骼名称列表:', sortedBones);
      
      // 显示所有骨骼
      sortedBones.forEach((boneName, index) => {
        const boneEl = document.createElement('div');
        boneEl.className = 'debug-item';
        
        // 处理骨骼索引类型
        let displayName = boneName;
        let boneDetails = '';
        
        if (boneName.startsWith('bone_index_')) {
          const boneIndex = boneName.replace('bone_index_', '');
          displayName = `骨骼索引 ${boneIndex}`;
          
          // 尝试查找实际骨骼名称
          if (this.app.currentModel.skeleton && this.app.currentModel.skeleton.bones) {
            const bone = this.app.currentModel.skeleton.bones[boneIndex];
            if (bone) {
              if (bone.data && bone.data.name) {
                displayName = bone.data.name;
                boneDetails = ` (索引: ${boneIndex})`;
              } else if (bone.name) {
                displayName = bone.name;
                boneDetails = ` (索引: ${boneIndex})`;
              }
            }
          }
        }
        
        boneEl.innerHTML = `<strong>${index + 1}. ${displayName}${boneDetails}</strong>`;
        
        // 增加点击事件
        boneEl.style.cursor = 'pointer';
        boneEl.addEventListener('click', () => {
          // 尝试找到真实骨骼并显示其属性
          let boneObject = null;
          if (boneName.startsWith('bone_index_')) {
            const boneIndex = boneName.replace('bone_index_', '');
            if (this.app.currentModel.skeleton && this.app.currentModel.skeleton.bones) {
              boneObject = this.app.currentModel.skeleton.bones[boneIndex];
            }
          } else {
            // 根据名称查找骨骼
            if (this.app.currentModel.skeleton && this.app.currentModel.skeleton.bones) {
              boneObject = this.app.currentModel.skeleton.bones.find(b => 
                (b.data && b.data.name === boneName) || b.name === boneName
              );
            }
          }
          
          if (boneObject) {
            console.log('骨骼详情:', boneObject);
            this.showInfo(`选中骨骼: ${displayName}`);
          }
        });
        
        bonesContainerEl.appendChild(boneEl);
      });
    }
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', () => {
      const panel = document.getElementById('animation-bones-panel');
      if (panel) document.body.removeChild(panel);
    });
    bonesPanelEl.appendChild(closeButton);
    
    // 添加到页面
    document.body.appendChild(bonesPanelEl);
  }
  
  // 尝试获取当前骨骼信息
  tryToGetCurrentBones(containerEl, animationName) {
    if (!this.app || !this.app.currentModel) return;
    
    const skeleton = this.app.currentModel.skeleton;
    if (!skeleton || !skeleton.bones) {
      const info = document.createElement('div');
      info.textContent = '无法获取模型骨骼数据';
      info.style.color = '#f88';
      info.style.textAlign = 'center';
      info.style.padding = '10px';
      containerEl.appendChild(info);
      return;
    }
    
    // 获取当前正在变化的骨骼
    const activeBones = this.detectActiveBones(skeleton.bones);
    
    if (activeBones.length > 0) {
      const activeTitle = document.createElement('div');
      activeTitle.innerHTML = `<strong>检测到当前活动骨骼:</strong>`;
      activeTitle.style.marginTop = '15px';
      containerEl.appendChild(activeTitle);
      
      // 显示活动骨骼
      activeBones.forEach((bone, index) => {
        const boneName = bone.data ? bone.data.name : (bone.name || `骨骼${index}`);
        const boneEl = document.createElement('div');
        boneEl.className = 'debug-item';
        boneEl.style.backgroundColor = 'rgba(100, 255, 100, 0.1)';
        boneEl.innerHTML = `<strong>${index + 1}. ${boneName}</strong>`;
        containerEl.appendChild(boneEl);
      });
    }
  }
  
  // 检测活动骨骼
  detectActiveBones(bones) {
    if (!bones || !bones.length) return [];
    
    // 我们会记录每个骨骼的初始状态
    if (!this.initialBoneStates) {
      this.initialBoneStates = new Map();
      bones.forEach(bone => {
        if (bone.data && bone.data.name) {
          this.initialBoneStates.set(bone.data.name, {
            x: bone.x,
            y: bone.y,
            rotation: bone.rotation,
            scaleX: bone.scaleX,
            scaleY: bone.scaleY
          });
        }
      });
      
      // 创建一个定时器大约2秒后重置初始状态记录
      setTimeout(() => {
        this.initialBoneStates = null;
      }, 2000);
      
      return [];
    }
    
    // 对比当前状态和初始状态
    const activeBones = [];
    bones.forEach(bone => {
      if (!bone.data || !bone.data.name) return;
      
      const initialState = this.initialBoneStates.get(bone.data.name);
      if (!initialState) return;
      
      // 检查是否有变化
      const hasChanged = 
        Math.abs(bone.x - initialState.x) > 0.001 ||
        Math.abs(bone.y - initialState.y) > 0.001 ||
        Math.abs(bone.rotation - initialState.rotation) > 0.001 ||
        Math.abs(bone.scaleX - initialState.scaleX) > 0.001 ||
        Math.abs(bone.scaleY - initialState.scaleY) > 0.001;
      
      if (hasChanged) {
        activeBones.push(bone);
      }
    });
    
    return activeBones;
  }
  
  // 分析动画使用的骨骼
  analyzeAnimationBones(animationName) {
    if (!this.app || !this.app.currentModel) {
      console.error('无法获取应用或模型实例');
      return;
    }
    
    let animation = null;
    let skeleton = null;
    let bones = [];
    
    console.log('开始分析动画骨骼:', animationName);
    console.log('模型结构:', this.app.currentModel);
    
    // 获取动画和骨骼数据
    if (this.app.currentModel.spineData && this.app.currentModel.spineData.animations) {
      animation = this.app.currentModel.spineData.animations.find(a => (a.name || a) === animationName);
      skeleton = this.app.currentModel.skeleton || this.app.currentModel.spineData.skeletonData;
      console.log('使用spineData获取动画:', animation);
    } else if (this.app.currentModel.skeleton) {
      animation = this.app.currentModel.skeleton.data.animations.find(a => (a.name || a) === animationName);
      skeleton = this.app.currentModel.skeleton;
      console.log('使用skeleton获取动画:', animation);
    }
    
    // 直接获取所有骨骼
    if (this.app.currentModel.skeleton && this.app.currentModel.skeleton.bones) {
      bones = this.app.currentModel.skeleton.bones;
    } else if (this.app.currentModel.spineData && this.app.currentModel.spineData.bones) {
      bones = this.app.currentModel.spineData.bones;
    }
    
    console.log('获取到骨骼数量:', bones.length);
    
    if (!animation) {
      console.warn(`无法获取动画 ${animationName}`);
      return;
    }
    
    // 删除旧面板
    const oldPanel = document.getElementById('animation-bones-panel');
    if (oldPanel) {
      document.body.removeChild(oldPanel);
    }
    
    // 创建骨骼分析面板
    const bonesPanelEl = document.createElement('div');
    bonesPanelEl.id = 'animation-bones-panel';
    bonesPanelEl.className = 'debug-panel';
    bonesPanelEl.style.bottom = '40px'; // 调整位置不覆盖其他面板
    bonesPanelEl.style.left = '320px'; // 在控制台的右边
    
    // 添加标题
    const titleEl = document.createElement('h2');
    titleEl.textContent = `动画 "${animationName}" 使用的骨骼`;
    bonesPanelEl.appendChild(titleEl);
    
    // 骨骼列表容器
    const bonesContainerEl = document.createElement('div');
    bonesContainerEl.className = 'debug-list-container';
    bonesPanelEl.appendChild(bonesContainerEl);
    
    // 直接显示所有骨骼
    if (bones.length === 0) {
      // 尝试获取所有动画帧上的骨骼
      if (this.app.currentModel.state && this.app.currentModel.state.tracks) {
        console.log('尝试通过当前执行的动画帧获取骨骼');
        const currentTrack = this.app.currentModel.state.tracks[0];
        if (currentTrack && currentTrack.animation) {
          const trackAnimation = currentTrack.animation;
          console.log('当前轨道动画:', trackAnimation);
        }
      }
      
      const noBones = document.createElement('div');
      noBones.textContent = '无法获取骨骼数据';
      noBones.style.textAlign = 'center';
      noBones.style.padding = '10px';
      bonesContainerEl.appendChild(noBones);
    } else {
      // 按照骨骼名称排序
      const sortedBones = [...bones].sort((a, b) => {
        const nameA = a.data ? a.data.name : (a.name || '');
        const nameB = b.data ? b.data.name : (b.name || '');
        return nameA.localeCompare(nameB);
      });
      
      console.log('排序后的骨骼:', sortedBones);
      
      // 显示所有骨骼
      sortedBones.forEach((bone, index) => {
        const boneName = bone.data ? bone.data.name : (bone.name || `骨骼${index}`);
        const boneEl = document.createElement('div');
        boneEl.className = 'debug-item';
        boneEl.innerHTML = `<strong>${index + 1}. ${boneName}</strong>`;
        
        // 添加属性信息
        if (bone.x !== undefined || bone.y !== undefined) {
          const boneInfo = document.createElement('div');
          boneInfo.innerHTML = `位置: x=${bone.x?.toFixed(2) || 'N/A'}, y=${bone.y?.toFixed(2) || 'N/A'}`;
          boneEl.appendChild(boneInfo);
        }
        
        // 添加骨骼点击事件
        boneEl.style.cursor = 'pointer';
        boneEl.addEventListener('click', () => {
          console.log('骨骼详情:', bone);
          this.showInfo(`选中骨骼: ${boneName}`);
        });
        
        bonesContainerEl.appendChild(boneEl);
      });
    }
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', () => {
      const panel = document.getElementById('animation-bones-panel');
      if (panel) document.body.removeChild(panel);
    });
    bonesPanelEl.appendChild(closeButton);
    
    // 添加到页面
    document.body.appendChild(bonesPanelEl);
    
    // 从Skeleton尝试直接获取骨骼信息
    console.log('正在尝试直接访问模型骨骼...');
    
    // 直接获取当前帧信息
    if (this.app.currentModel.skeleton) {
      const skeletonBones = this.app.currentModel.skeleton.bones;
      if (skeletonBones && skeletonBones.length > 0) {
        console.log('直接从骨架获取到骨骼数量:', skeletonBones.length);
        this.updateBonesPanelWithNewData(skeletonBones, animationName);
      }
    }
  }
  
  // 更新骨骼面板显示
  updateBonesPanelWithNewData(bones, animationName) {
    if (!bones || bones.length === 0) {
      console.warn('没有骨骼数据可显示');
      return;
    }

    console.log('开始更新骨骼面板，骨骼数量:', bones.length);
    
    // 找到骨骼面板和容器
    const bonesPanelEl = document.getElementById('animation-bones-panel');
    if (!bonesPanelEl) {
      console.error('无法找到骨骼面板元素');
      return;
    }
    
    // 清空当前内容
    const listContainer = bonesPanelEl.querySelector('.debug-list-container');
    if (!listContainer) {
      console.error('无法找到骨骼列表容器');
      return;
    }
    
    listContainer.innerHTML = '';
    
    // 按照骨骼名称排序
    const sortedBones = [...bones].sort((a, b) => {
      const nameA = a.data ? a.data.name : (a.name || '');
      const nameB = b.data ? b.data.name : (b.name || '');
      return nameA.localeCompare(nameB);
    });
    
    // 显示骨骼总数
    const countEl = document.createElement('div');
    countEl.style.textAlign = 'center';
    countEl.style.marginBottom = '10px';
    countEl.innerHTML = `<strong>总计 ${sortedBones.length} 个骨骼</strong>`;
    listContainer.appendChild(countEl);
    
    // 显示所有骨骼
    sortedBones.forEach((bone, index) => {
      const boneName = bone.data ? bone.data.name : (bone.name || `骨骼${index}`);
      
      const boneEl = document.createElement('div');
      boneEl.className = 'debug-item';
      boneEl.innerHTML = `<strong>${index + 1}. ${boneName}</strong>`;
      
      // 添加属性信息
      let boneInfoHtml = '';
      
      if (bone.x !== undefined && bone.y !== undefined) {
        boneInfoHtml += `位置: x=${bone.x.toFixed(2)}, y=${bone.y.toFixed(2)}<br>`;
      }
      
      if (bone.rotation !== undefined) {
        boneInfoHtml += `旋转: ${bone.rotation.toFixed(2)}度<br>`;
      }
      
      if (bone.scaleX !== undefined && bone.scaleY !== undefined) {
        boneInfoHtml += `缩放: x=${bone.scaleX.toFixed(2)}, y=${bone.scaleY.toFixed(2)}<br>`;
      }
      
      if (boneInfoHtml) {
        const boneInfo = document.createElement('div');
        boneInfo.style.fontSize = '12px';
        boneInfo.style.color = '#aaa';
        boneInfo.innerHTML = boneInfoHtml;
        boneEl.appendChild(boneInfo);
      }
      
      // 点击显示详细信息
      boneEl.style.cursor = 'pointer';
      boneEl.addEventListener('click', () => {
        console.log('骨骼详情:', bone);
        this.showInfo(`选中骨骼: ${boneName}`);
      });
      
      listContainer.appendChild(boneEl);
    });
    
    // 更新标题
    const titleEl = bonesPanelEl.querySelector('h2');
    if (titleEl) {
      titleEl.textContent = `动画 "${animationName}" 的骨骼 (${sortedBones.length})`;
    }
  }
  
  // 获取动画使用的骨骼
  getAnimationUsedBones(animation, skeleton) {
    const usedBones = new Set();
    
    try {
      // 检查动画的时间轨道
      if (animation.timelines) {
        animation.timelines.forEach(timeline => {
          // 检查骨骼时间轨道
          if (timeline.boneIndex !== undefined) {
            const bone = skeleton.bones[timeline.boneIndex];
            if (bone) usedBones.add(bone);
          }
          // 时间轨道也可能直接有骨骼引用
          else if (timeline.bone) {
            usedBones.add(timeline.bone);
          }
        });
      }
      
      // 另一种常见的动画结构
      if (animation.bones) {
        for (const boneName in animation.bones) {
          const bone = skeleton.bones.find(b => b.data.name === boneName);
          if (bone) usedBones.add(bone);
        }
      }
      
      // 如果仅有骨骼索引数组
      if (animation.boneIndices) {
        animation.boneIndices.forEach(index => {
          const bone = skeleton.bones[index];
          if (bone) usedBones.add(bone);
        });
      }
      
      // 支持Spine 3.8+的动画结构
      if (animation.data && animation.data.bones) {
        for (const boneName in animation.data.bones) {
          const bone = skeleton.bones.find(b => b.data.name === boneName);
          if (bone) usedBones.add(bone);
        }
      }
    } catch (error) {
      console.warn('分析动画骨骼时发生错误:', error);
    }
    
    return Array.from(usedBones);
  }
  
  // 显示对话列表面板
  showDialoguesPanel() {
    if (!window.dialogueManager) {
      console.error("错误：对话管理器未找到，请确保对话系统已加载");
      this.showInfo("错误：对话管理器未找到，请确保对话系统已加载", true);
      return;
    }

    // 清空对话列表
    this.dialoguesListContainerEl.innerHTML = '';

    // 获取对话数据
    const dialogues = window.dialogueManager.dialogues;
    const dialogueArray = Object.values(dialogues);

    // 保存对话列表用于搜索
    this.allDialogues = dialogueArray;

    // 添加对话到列表
    this.populateDialoguesListPanel(dialogueArray);

    // 显示面板
    this.dialoguesPanelEl.style.display = 'block';
  }

  // 填充对话列表面板
  populateDialoguesListPanel(dialogues) {
    if (dialogues.length === 0) {
      const noDialogues = document.createElement('div');
      noDialogues.textContent = '没有找到对话';
      noDialogues.style.textAlign = 'center';
      noDialogues.style.padding = '10px';
      this.dialoguesListContainerEl.appendChild(noDialogues);
      return;
    }

    // 检查开场动画是否完成
    const isIntroComplete = window.animationControl && window.animationControl.isIntroAnimationComplete();

    dialogues.forEach((dialogue, index) => {
      const dialogueRow = document.createElement('div');
      dialogueRow.className = 'debug-item';
      dialogueRow.dataset.dialogueId = dialogue.id;

      // 获取音频文件信息
      const soundInfo = dialogue.soundFiles && dialogue.soundFiles.length > 0
        ? dialogue.soundFiles.join(', ')
        : '无语音';

      const dialogueInfo = document.createElement('div');
      dialogueInfo.innerHTML = `
        <strong>对话 ${dialogue.id}</strong>
        <div>动画A: ${dialogue.animA}</div>
        <div>动画M: ${dialogue.animM}</div>
        <div>音频: ${soundInfo}</div>
      `;

      // 添加播放按钮
      const playButton = document.createElement('button');
      playButton.textContent = '播放此对话';
      playButton.className = 'debug-panel-btn small';

      // 如果开场动画未完成，禁用按钮
      if (!isIntroComplete) {
        playButton.disabled = true;
        playButton.textContent = '等待开场动画完成';
        playButton.style.opacity = '0.5';
        playButton.style.cursor = 'not-allowed';
      } else {
        playButton.addEventListener('click', () => {
          this.playDialogue(dialogue.id);
        });
      }

      dialogueRow.appendChild(dialogueInfo);
      dialogueRow.appendChild(playButton);
      this.dialoguesListContainerEl.appendChild(dialogueRow);
    });
  }

  // 搜索对话
  filterDialoguesList(searchTerm) {
    if (!this.allDialogues) return;

    searchTerm = searchTerm.toLowerCase();
    const filteredDialogues = searchTerm ?
      this.allDialogues.filter(dialogue => {
        return dialogue.id.toString().includes(searchTerm) ||
               dialogue.animA.toLowerCase().includes(searchTerm) ||
               dialogue.animM.toLowerCase().includes(searchTerm) ||
               (dialogue.soundFiles && dialogue.soundFiles.some(file =>
                 file.toLowerCase().includes(searchTerm)));
      }) :
      this.allDialogues;

    // 清空列表
    this.dialoguesListContainerEl.innerHTML = '';

    // 重新填充
    this.populateDialoguesListPanel(filteredDialogues);
  }

  // 播放指定对话
  playDialogue(dialogueId) {
    if (!window.dialogueManager) {
      console.error("对话管理器未找到，无法播放对话");
      this.showInfo("对话管理器未找到，无法播放对话", true);
      return;
    }

    // 检查开场动画是否完成
    if (window.animationControl && !window.animationControl.isIntroAnimationComplete()) {
      console.log('开场动画尚未完成，对话功能暂不可用');
      this.showInfo('开场动画尚未完成，对话功能暂不可用', true);
      return;
    }

    try {
      console.log(`Debug工具播放对话 ${dialogueId}`);
      window.dialogueManager.playDialogue(dialogueId);
      this.showInfo(`正在播放对话 ${dialogueId}`);
    } catch (error) {
      console.error(`播放对话 ${dialogueId} 失败:`, error);
      this.showInfo(`播放对话失败: ${error.message}`, true);
    }
  }

  // 显示调试工具
  show() {
    if (this.consoleEl) this.consoleEl.style.display = 'block';
    if (this.controlsEl) this.controlsEl.style.display = 'flex';
    this.isVisible = true;
    console.log("调试工具已显示");
  }

  // 隐藏调试工具
  hide() {
    if (this.consoleEl) this.consoleEl.style.display = 'none';
    if (this.controlsEl) this.controlsEl.style.display = 'none';
    if (this.folderContentEl) this.folderContentEl.style.display = 'none';
    if (this.bonesPanelEl) this.bonesPanelEl.style.display = 'none';
    if (this.animationsPanelEl) this.animationsPanelEl.style.display = 'none';
    if (this.dialoguesPanelEl) this.dialoguesPanelEl.style.display = 'none';
    this.isVisible = false;
    console.log("调试工具已隐藏");
  }

  // 切换调试工具显示状态
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  // 根据设置更新显示状态
  updateVisibility(enabled) {
    if (enabled) {
      this.show();
    } else {
      this.hide();
    }
  }

  // 恢复原始控制台
  restoreConsole() {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
  }
}

// 将DebugTools类暴露为全局变量
window.DebugTools = DebugTools;