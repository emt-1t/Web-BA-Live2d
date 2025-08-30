/**
 * modelManager.js - 模型管理器
 * 负责 Spine 模型的发现、加载、销毁和管理
 */

class ModelManager {
  constructor(renderManager, modelFolder = '2k') {
    this.renderManager = renderManager;
    this.spineLoader = null;
    this.modelFolder = modelFolder;

    // 当前加载的模型
    this.currentModel = null;
    this.currentModelName = 'Hihumi_home';

    // 初始化 SpineLoader
    this.initSpineLoader();
  }

  /**
   * 初始化 Spine 加载器
   */
  initSpineLoader() {
    if (this.renderManager && this.renderManager.getApp()) {
      this.spineLoader = new SpineLoader(this.renderManager.getApp());
      console.log("Spine 加载器已初始化");
    } else {
      console.error("无法初始化 Spine 加载器：渲染管理器未就绪");
    }
  }

  /**
   * 自动加载模型
   */
  async autoLoadModels() {
    try {
      console.log("开始自动加载模型...");

      // 检测是否在Wallpaper Engine环境中
      const isWallpaperEngine = this.isWallpaperEngineEnvironment();
      console.log(`环境检测: ${isWallpaperEngine ? 'Wallpaper Engine' : 'Web浏览器'}`);

      let availableModels = [];

      if (isWallpaperEngine) {
        // 在Wallpaper Engine中使用预定义模型列表
        availableModels = await this.getPredefinedModels();
        console.log("使用预定义模型列表 (Wallpaper Engine模式)");
      } else {
        // 在普通浏览器中尝试动态发现模型
        availableModels = await this.findAvailableModels();
        console.log("使用动态模型发现 (浏览器模式)");
      }

      if (availableModels.length > 0) {
        // 使用第一个找到的可用模型
        const firstModel = availableModels[0];
        await this.loadModel(firstModel.skelFile, firstModel.atlasFile);
        console.log(`成功加载模型: ${firstModel.name}`);
        this.currentModelName = firstModel.name;
        return;
      }

      // 如果没有找到可用模型，尝试fallback
      console.warn("未找到任何可用的模型文件，尝试fallback...");
      await this.tryFallbackModels();

    } catch (error) {
      console.error('自动加载模型失败:', error);
      // 尝试fallback
      await this.tryFallbackModels();
    }
  }

  /**
   * 检测是否在Wallpaper Engine环境中
   */
  isWallpaperEngineEnvironment() {
    return window.location.protocol === 'file:' ||
           typeof window.wallpaperRegisterAudioListener !== 'undefined' ||
           typeof window.wallpaperPropertyListener !== 'undefined' ||
           (window.wallpaperEngineAPI && window.wallpaperEngineAPI.isInWallpaperEngine());
  }

  /**
   * 获取预定义的模型列表 (用于Wallpaper Engine)
   */
  async getPredefinedModels() {
    const predefinedModels = [
      // 当前项目的模型
      {
        name: 'SC51000_01',
        skelFile: `${this.modelFolder}/CH0295_home.skel`,
        atlasFile: `${this.modelFolder}/CH0295_home.atlas`
      },

    ];

    // 验证这些模型是否真的存在
    const availableModels = [];
    for (const model of predefinedModels) {
      try {
        const skelRes = await fetch(model.skelFile, { method: 'HEAD' });
        const atlasRes = await fetch(model.atlasFile, { method: 'HEAD' });

        if (skelRes.ok && atlasRes.ok) {
          availableModels.push(model);
          console.log(`预定义模型验证成功: ${model.name}`);
        }
      } catch (e) {
        console.warn(`预定义模型验证失败: ${model.name}`, e);
      }
    }

    return availableModels;
  }

  /**
   * 尝试fallback模型加载
   */
  async tryFallbackModels() {
    const fallbackModels = [
      // 尝试不同分辨率的相同模型
      { name: 'CH0215_home_2k', skelFile: '2k/CH0215_home.skel', atlasFile: '2k/CH0215_home.atlas' },
      { name: 'CH0215_home_4k', skelFile: '4k/CH0215_home.skel', atlasFile: '4k/CH0215_home.atlas' },
      { name: 'CH0215_home_8k', skelFile: '8k/CH0215_home.skel', atlasFile: '8k/CH0215_home.atlas' },

    ];

    for (const model of fallbackModels) {
      try {
        console.log(`尝试fallback模型: ${model.name}`);
        await this.loadModel(model.skelFile, model.atlasFile);
        console.log(`Fallback模型加载成功: ${model.name}`);
        this.currentModelName = model.name;
        return;
      } catch (e) {
        console.warn(`Fallback模型加载失败: ${model.name}`, e);
      }
    }

    console.error("所有fallback模型都加载失败");
  }

  /**
   * 找到所有可用的模型（预先检查文件是否存在）
   */
  async findAvailableModels() {
    const availableModels = [];

    // 尝试列出文件夹内容
    try {
      const fileList = await this.fetchFileList(this.modelFolder);
      if (fileList && fileList.length > 0) {
        // 找到所有.skel文件
        const skelFiles = fileList.filter(file => file.toLowerCase().endsWith('.skel'));

        // 检查每个skel文件是否有对应的atlas文件
        for (const skelFile of skelFiles) {
          const baseName = skelFile.substring(0, skelFile.lastIndexOf('.skel'));
          const atlasFile = `${baseName}.atlas`;

          // 确保路径正确
          const fullSkelPath = skelFile.startsWith('/') || skelFile.includes(this.modelFolder)
            ? skelFile
            : `${this.modelFolder}/${skelFile}`;

          const fullAtlasPath = atlasFile.startsWith('/') || atlasFile.includes(this.modelFolder)
            ? atlasFile
            : `${this.modelFolder}/${atlasFile}`;

          // 检查这两个文件是否都存在
          try {
            const skelRes = await fetch(fullSkelPath, { method: 'HEAD' });
            const atlasRes = await fetch(fullAtlasPath, { method: 'HEAD' });

            if (skelRes.ok && atlasRes.ok) {
              // 提取模型名称
              const nameMatch = fullSkelPath.match(/([^\/]+)\.skel$/);
              const modelName = nameMatch ? nameMatch[1] : 'unknown';

              availableModels.push({
                name: modelName,
                skelFile: fullSkelPath,
                atlasFile: fullAtlasPath
              });

              console.log(`找到可用模型: ${modelName}`);
            }
          } catch (e) {
            // 忽略检查错误，继续检查下一个
          }
        }
      }
    } catch (e) {
      console.warn("获取文件列表失败", e);
    }

    return availableModels;
  }

  /**
   * 获取文件夹下的所有文件
   */
  async fetchFileList(folder) {
    try {
      // 检测环境
      if (this.isWallpaperEngineEnvironment()) {
        console.log('Wallpaper Engine环境，跳过文件列表获取');
        return [];
      }

      const response = await fetch(`./${folder}/`);
      if (!response.ok) {
        console.warn(`无法访问文件夹: ${folder}, 状态: ${response.status}`);
        return [];
      }

      const html = await response.text();

      // 简单尝试从HTML中提取文件名
      const filePattern = /href="([^"]+\.(skel|atlas))"/g;
      const matches = [...html.matchAll(filePattern)];
      const files = matches.map(match => match[1]);

      console.log(`从文件夹 ${folder} 发现文件:`, files);
      return files;
    } catch (e) {
      console.warn('无法获取文件列表:', e);
      return [];
    }
  }

  /**
   * 规范化路径，避免双斜杠问题
   */
  normalizePath(path) {
    // 替换多个连续斜杠为单个斜杠
    let normalized = path.replace(/\/+/g, '/');

    // 确保2k文件夹只出现一次
    if (normalized.includes(`${this.modelFolder}/${this.modelFolder}`)) {
      normalized = normalized.replace(`${this.modelFolder}/${this.modelFolder}`, this.modelFolder);
    }

    return normalized;
  }

  /**
   * 加载单个模型
   */
  async loadModel(skelPath, atlasPath) {
    try {
      // 触发模型加载开始事件
      const loadStartEvent = new CustomEvent('modelLoadStart');
      document.dispatchEvent(loadStartEvent);
      console.log("已触发模型加载开始事件");

      // 清除之前加载的模型
      this.clearCurrentModel();

      // 规范化路径
      const normalizedSkelPath = this.normalizePath(skelPath);
      const normalizedAtlasPath = this.normalizePath(atlasPath);

      console.log(`尝试加载模型: ${normalizedSkelPath}, ${normalizedAtlasPath}`);

      // 在Wallpaper Engine环境中，跳过HEAD检查，直接尝试加载
      if (!this.isWallpaperEngineEnvironment()) {
        // 检查文件是否存在 (仅在非Wallpaper Engine环境中)
        try {
          const skelRes = await fetch(normalizedSkelPath, { method: 'HEAD' });
          const atlasRes = await fetch(normalizedAtlasPath, { method: 'HEAD' });

          if (!skelRes.ok) {
            throw new Error(`找不到模型文件: ${normalizedSkelPath} (状态: ${skelRes.status})`);
          }

          if (!atlasRes.ok) {
            throw new Error(`找不到图集文件: ${normalizedAtlasPath} (状态: ${atlasRes.status})`);
          }

          console.log("文件存在性检查通过");
        } catch (e) {
          console.error("检查文件失败:", e);
          throw e;
        }
      } else {
        console.log("Wallpaper Engine环境，跳过文件存在性检查");
      }

      // 加载模型
      console.log("开始加载Spine数据...");
      const spineData = await this.spineLoader.loadSpine(normalizedSkelPath, normalizedAtlasPath);
      console.log("Spine数据加载成功");

      // 提取模型名称
      const match = normalizedSkelPath.match(/([^\/]+)\.skel$/);
      if (match && match[1]) {
        this.currentModelName = match[1];
      }

      // 创建模型实例并设置位置
      this.currentModel = this.spineLoader.createSpineInstance(spineData);

      // 添加骨骼分离功能
      this.separateCharacterAndBackground();

      // 居中显示模型
      this.centerModel();

      console.log(`成功加载模型: ${this.currentModelName}`);

      // 触发模型加载完成事件
      const event = new CustomEvent('modelLoaded');
      document.dispatchEvent(event);
      console.log("已触发模型加载完成事件");

      return this.currentModel;
    } catch (error) {
      console.error("加载模型失败:", error);
      throw error;
    }
  }

  /**
   * 识别并分离角色和背景骨骼
   * 在模型加载后调用此方法
   */
  separateCharacterAndBackground() {
    if (!this.currentModel || !this.currentModel.skeleton) {
      console.error("模型尚未初始化，无法分离骨骼");
      return;
    }

    // 初始化骨骼列表
    this.currentModel.backgroundBones = [];
    this.currentModel.characterBones = [];

    const skeleton = this.currentModel.skeleton;
    const bones = skeleton.bones;

    // 尝试按名称识别背景和角色骨骼
    bones.forEach(bone => {
      const name = bone.data.name.toLowerCase();

      // 识别常见的背景骨骼名称
      if (name.includes('bg') ||
          name.includes('background') ||
          name.includes('scene') ||
          name.includes('env') ||
          name.includes('environment') ||
          name.includes('sky') ||
          name.includes('floor') ||
          name.includes('ground') ||
          name.includes('cloud') ||
          name.includes('landscape') ||
          name.includes('decoration') ||
          name.includes('back')) {
        this.currentModel.backgroundBones.push(bone);
      } else {
        // 其他骨骼视为角色骨骼
        this.currentModel.characterBones.push(bone);
      }
    });

    console.log(`骨骼分离完成: 找到${this.currentModel.backgroundBones.length}个背景骨骼，${this.currentModel.characterBones.length}个角色骨骼`);

    // 调试输出背景骨骼
    if (this.currentModel.backgroundBones.length > 0) {
      console.log("背景骨骼:");
      this.currentModel.backgroundBones.forEach((bone, index) => {
        console.log(`${index + 1}. ${bone.data.name}`);
      });
    }
  }

  /**
   * 居中显示模型
   */
  centerModel() {
    if (!this.currentModel) return;

    this.currentModel.x = window.innerWidth / 2;
    this.currentModel.y = window.innerHeight / 2;
  }

  /**
   * 设置模型位置
   */
  setModelPosition(x, y) {
    if (!this.currentModel) return;

    this.currentModel.x = window.innerWidth / 2 + x;
    this.currentModel.y = window.innerHeight / 2 + y;
  }

  /**
   * 设置模型缩放
   */
  setModelScale(scale) {
    if (!this.currentModel) return;

    this.currentModel.scale.set(scale, scale);
  }

  /**
   * 获取当前模型名称
   */
  getCurrentModelName() {
    return this.currentModelName;
  }

  /**
   * 获取当前模型
   */
  getCurrentModel() {
    return this.currentModel;
  }

  /**
   * 清除当前模型
   */
  clearCurrentModel() {
    if (this.currentModel && this.renderManager) {
      console.log("清除当前模型");
      try {
        const stage = this.renderManager.getStage();
        // 移除模型
        if (stage && stage.removeChild) {
          stage.removeChild(this.currentModel);
        }

        // 如果模型有销毁方法，调用它
        if (this.currentModel.destroy) {
          this.currentModel.destroy();
        }

        // 设置当前模型为null
        this.currentModel = null;
      } catch (e) {
        console.warn("清除当前模型时出错:", e);
      }
    }
  }

  /**
   * 处理窗口大小变化
   */
  handleWindowResize() {
    console.log("模型管理器处理窗口大小变化");

    // 更新模型位置
    if (this.currentModel) {
      // 尝试从settingsControl获取设置
      let positionX = 0;
      let positionY = 0;
      let rotation = 0;

      // 尝试获取全局SettingsControl实例
      const settingsControl = window.settingsControl;
      if (settingsControl && settingsControl.settings) {
        positionX = settingsControl.settings.positionX || 0;
        positionY = settingsControl.settings.positionY || 0;
        rotation = settingsControl.settings.rotation || 0;

        // 应用位置
        this.setModelPosition(positionX, positionY);
      } else {
        // 如果没有设置信息，居中显示
        this.centerModel();
      }

      // 更新主模型容器的旋转中心点
      const mainModelContainer = this.renderManager.getMainModelContainer();
      if (mainModelContainer) {
        // 主模型容器的旋转中心点已在renderManager中处理
        // 这里只需要重新应用旋转角度
        mainModelContainer.rotation = rotation * Math.PI / 180;

        console.log(`窗口大小变化后重新应用: X=${positionX}, Y=${positionY}, 旋转=${rotation}度`);
      }
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    console.log("开始清理模型管理器资源...");

    // 清理当前模型
    this.clearCurrentModel();

    // 清理SpineLoader资源
    if (this.spineLoader && typeof this.spineLoader.cleanup === 'function') {
      this.spineLoader.cleanup();
    }
    this.spineLoader = null;

    // 清理引用
    this.renderManager = null;
    this.currentModel = null;
    this.currentModelName = '';

    console.log("模型管理器资源清理完成");
  }
}

// 将类导出为全局变量
window.ModelManager = ModelManager;
