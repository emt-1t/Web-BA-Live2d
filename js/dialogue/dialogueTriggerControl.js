/**
 * dialogueTriggerControl.js - 对话触发控制模块
 * 用于控制角色对话触发功能，基于Hip骨骼位置
 */

class DialogueTriggerControl {
  /**
   * 构造函数
   * @param {Object} app - App实例
   * @param {Object} options - 配置选项
   */
  constructor(app, options = {}) {
    // 保存app引用
    this.app = app;

    // 默认设置
    this.options = {
      enabled: true,              // 是否启用对话触发功能
      touchAreaVisible: true,     // 触摸区域是否可见（用于调试）
      touchAreaWidth: 700,        // 触摸区域宽度
      touchAreaHeight: 700,       // 触摸区域高度
      touchAreaOffsetX: 0,        // 触摸区域X轴偏移
      touchAreaOffsetY: 100,     // 触摸区域Y轴偏移
      targetBoneName: 'Spine_B',      // 目标骨骼名称
      clickDelay: 0.1,           // 点击延迟（秒）
      // 对话相关设置
      dialogueAnimA: 'Talk_01_A', // 对话动画A
      dialogueAnimASpeed: 1.0,    // 对话动画A的速率
      dialogueAnimM: 'Talk_01_M', // 对话动画M
      dialogueAnimMSpeed: 1.0,    // 对话动画M的速率
      // 轨道设置
      dialogueTrackA: 6,          // 对话动画A的轨道
      dialogueTrackM: 7,          // 对话动画M的轨道
      ...options                  // 合并用户配置
    };

    // 从全局设置控制器获取设置，如果存在的话
    if (window.settingsControl && window.settingsControl.settingsCore) {
      const dialogueEnabled = window.settingsControl.settingsCore.getSetting('dialogueEnabled');
      if (dialogueEnabled !== undefined) {
        this.options.enabled = dialogueEnabled;
      }
    }

    // 状态变量
    this.touchArea = null;        // 触摸区域PIXI对象
    this.targetBone = null;       // 目标骨骼
    this.isTriggering = false;    // 当前是否正在触发对话
    this.clickCount = 0;          // 点击计数
    this.clickTimer = null;       // 点击定时器
    this.isIntroAnimationComplete = false; // 开场动画是否已完成
    this.enabledBySettings = this.options.enabled; // 保存设置中的启用状态

    // 初始状态下，开场动画未完成，所以强制禁用对话触发功能
    this.options.enabled = false;

    // 初始化
    this.init();
  }

  /**
   * 初始化对话触发控制
   */
  init() {
    console.log('初始化对话触发控制系统...');

    // 将实例保存为全局变量，方便其他模块访问
    window.dialogueTriggerControl = this;

    // 创建触摸区域
    this.createTouchArea();

    // 设置监听器，响应设置变化
    this.setupSettingsListener();

    // 监听开场动画完成事件
    this.setupIntroAnimationListener();

    // 监听模型加载事件
    document.addEventListener('modelLoaded', () => {
      console.log('检测到模型加载完成，重新创建对话触发区域');
      // 重置开场动画完成状态
      this.isIntroAnimationComplete = false;
      // 强制禁用对话触发功能，直到开场动画完成
      this.options.enabled = false;
      // 销毁旧的触摸区域
      this.destroyTouchArea();
      // 创建新的触摸区域
      this.createTouchArea();
    });
  }

  /**
   * 设置监听器，响应设置变化
   */
  setupSettingsListener() {
    // 监听设置变化事件
    document.addEventListener('settingChanged', (event) => {
      const { key, value } = event.detail;

      if (key === 'dialogueEnabled') {
        // 保存设置中的启用状态
        this.enabledBySettings = value;
        
        // 只有在开场动画完成后才应用设置中的启用状态
        if (this.isIntroAnimationComplete) {
          this.setEnabled(value);
          console.log(`对话触发功能设置已更新: ${value ? '启用' : '禁用'}`);
        } else {
          console.log(`对话触发功能设置已保存: ${value ? '启用' : '禁用'}，但需要等待开场动画完成后才生效`);
        }
      }
    });
  }

  /**
   * 设置监听器，响应开场动画完成事件
   */
  setupIntroAnimationListener() {
    // 监听开场动画完成事件
    document.addEventListener('introAnimationComplete', () => {
      console.log('检测到开场动画完成，准备启用对话触发功能');
      this.isIntroAnimationComplete = true;
      
      // 应用保存的设置状态
      this.setEnabled(this.enabledBySettings);
      console.log(`对话触发功能状态根据设置${this.enabledBySettings ? '启用' : '禁用'}`);
    });
    
    // 检查动画控制器是否已存在且开场动画已完成
    if (window.animationControl && window.animationControl.isIntroAnimationComplete()) {
      console.log('检测到开场动画已完成（现有状态），启用对话触发功能');
      this.isIntroAnimationComplete = true;
      // 应用保存的设置状态
      this.setEnabled(this.enabledBySettings);
    }
  }

  /**
   * 创建触摸区域
   */
  createTouchArea() {
    if (!this.app || !this.app.currentModel) {
      console.log('模型尚未加载，无法创建对话触发区域');
      return;
    }

    // 寻找目标骨骼
    this.findTargetBone();

    if (!this.targetBone) {
      console.warn(`未找到目标骨骼: ${this.options.targetBoneName}`);
      return;
    }

    // 创建一个矩形作为触摸区域
    const graphics = new PIXI.Graphics();

    // 设置矩形样式 - 透明填充，如果touchAreaVisible为true则添加边框
    if (this.options.touchAreaVisible) {
      // 半透明填充和边框，便于调试
      graphics.beginFill(0x00FF00, 0.3);  // 绿色，30%透明度
      graphics.lineStyle(2, 0x00FF00, 0.8); // 绿色边框，80%透明度
    } else {
      // 不可见但可交互的区域 - 使用极小的透明度，避免渲染问题
      graphics.beginFill(0x000000, 0.001);  // 极小透明度，几乎不可见但保持交互
    }

    // 绘制矩形 - 以0,0为中心点
    const width = this.options.touchAreaWidth;
    const height = this.options.touchAreaHeight;
    graphics.drawRect(-width/2, -height/2, width, height);
    graphics.endFill();

    // 使矩形可交互，但考虑开场动画状态
    graphics.interactive = this.options.enabled;
    graphics.cursor = 'pointer';

    // 添加点击/触摸事件
    graphics.on('pointerdown', this.handleTriggerStart.bind(this));
    graphics.on('pointerup', this.handleTriggerEnd.bind(this));
    graphics.on('pointerupoutside', this.handleTriggerEnd.bind(this));

    // 保存触摸区域引用
    this.touchArea = graphics;

    // 将触摸区域添加到主模型容器，这样它会跟随主模型的变换
    const renderManager = this.app.renderManager;
    const mainModelContainer = renderManager?.getMainModelContainer();

    if (mainModelContainer) {
      mainModelContainer.addChild(this.touchArea);
      console.log('对话触发区域已添加到主模型容器');
    } else {
      // 如果主模型容器不存在，回退到舞台
      this.app.app.stage.addChild(this.touchArea);
      console.log('对话触发区域已添加到舞台（主模型容器不可用）');
    }

    // 更新触摸区域位置
    this.updateTouchAreaPosition();

    console.log(`对话触发区域已创建 (interactive: ${graphics.interactive})`);
  }

  /**
   * 寻找目标骨骼
   */
  findTargetBone() {
    if (!this.app || !this.app.currentModel || !this.app.currentModel.skeleton) {
      return null;
    }

    const skeleton = this.app.currentModel.skeleton;

    // 查找目标骨骼
    this.targetBone = skeleton.findBone(this.options.targetBoneName);

    if (this.targetBone) {
      console.log(`已找到目标骨骼: ${this.options.targetBoneName}`);
    }

    return this.targetBone;
  }

  /**
   * 更新触摸区域位置
   */
  updateTouchAreaPosition() {
    if (!this.touchArea || !this.targetBone || !this.app.currentModel) {
      return;
    }

    // 获取骨骼的世界坐标
    const model = this.app.currentModel;
    const worldPos = this.getBoneWorldPosition(this.targetBone);

    // 应用偏移
    this.touchArea.position.x = worldPos.x + this.options.touchAreaOffsetX;
    this.touchArea.position.y = worldPos.y + this.options.touchAreaOffsetY;

    // 如果模型有缩放，应用相同的缩放到触摸区域
    this.touchArea.scale.x = model.scale.x;
    this.touchArea.scale.y = model.scale.y;
  }

  /**
   * 获取骨骼的世界坐标
   * @param {Object} bone - 骨骼对象
   * @returns {Object} - 世界坐标 {x, y}
   */
  getBoneWorldPosition(bone) {
    if (!bone || !this.app.currentModel) {
      return { x: 0, y: 0 };
    }

    // 获取骨骼的世界坐标
    const model = this.app.currentModel;

    // 获取骨骼在模型空间中的位置
    const boneX = bone.worldX;
    const boneY = bone.worldY;

    // 由于触摸区域现在也在主模型容器中，我们只需要相对于模型的位置
    // 不需要考虑主模型容器的变换，因为触摸区域会自动跟随容器变换
    const worldX = model.position.x + boneX * model.scale.x;
    const worldY = model.position.y + boneY * model.scale.y;

    return { x: worldX, y: worldY };
  }

  /**
   * 处理触发开始
   * @param {Object} event - 交互事件
   */
  handleTriggerStart(event) {
    if (!this.options.enabled) {
      // 如果开场动画尚未完成，显示提示
      if (!this.isIntroAnimationComplete) {
        console.log('开场动画尚未完成，对话功能暂不可用');
      }
      return;
    }

    // 清除之前的定时器，如果存在
    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
      this.clickTimer = null;
    }

    this.clickCount++;
    console.log(`对话触发开始! (第${this.clickCount}次)`);

    // 设置定时器，延迟指定时间后播放对话动画
    this.clickTimer = setTimeout(() => {
      this.isTriggering = true;
      this.playDialogueAnimation();
      console.log(`点击超过${this.options.clickDelay}秒，触发对话动画`);
    }, this.options.clickDelay * 1000);
  }

  /**
   * 处理触发结束
   * @param {Object} event - 交互事件
   */
  handleTriggerEnd(event) {
    if (!this.options.enabled) return;

    // 清除开始定时器，如果存在
    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
      this.clickTimer = null;
    }

    // 如果没有触发对话动画，则直接触发
    if (!this.isTriggering) {
      console.log('快速点击，直接触发对话');
      this.playDialogueAnimation();
    }

    this.isTriggering = false;
  }

  /**
   * 播放对话动画
   */
  playDialogueAnimation() {
    // 再次检查是否可以触发对话（开场动画是否完成）
    if (!this.isIntroAnimationComplete) {
      console.log('开场动画尚未完成，对话功能暂不可用');
      return;
    }
    
    // 使用对话管理器按顺序播放对话
    if (window.dialogueManager) {
      const currentIndex = window.dialogueManager.getCurrentDialogueIndex();
      console.log(`触发对话 ${currentIndex}`);
      window.dialogueManager.playNextDialogue();
    } else {
      console.warn('对话管理器未找到，无法播放对话');
    }
  }

  /**
   * 检查动画是否存在
   * @param {string} animName - 动画名称
   * @returns {boolean} 是否存在
   */
  checkAnimationExists(animName) {
    if (!this.app || !this.app.currentModel) return false;

    const model = this.app.currentModel;

    // 获取动画列表
    let animations = [];
    if (model.spineData && model.spineData.animations) {
      animations = model.spineData.animations;
    } else if (model.skeleton && model.skeleton.data && model.skeleton.data.animations) {
      animations = model.skeleton.data.animations;
    }

    // 检查动画是否存在
    return animations.some(anim => (anim.name || anim) === animName);
  }

  /**
   * 设置触摸区域是否可见
   * @param {boolean} visible - 是否可见
   */
  setTouchAreaVisible(visible) {
    this.options.touchAreaVisible = visible;

    // 重新创建触摸区域以应用可见性变化
    this.destroyTouchArea();
    this.createTouchArea();

    console.log(`对话触发区域可见性已设置为 ${visible ? '可见' : '不可见'}`);
  }

  /**
   * 设置触摸区域大小
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  setTouchAreaSize(width, height) {
    this.options.touchAreaWidth = width;
    this.options.touchAreaHeight = height;

    // 重新创建触摸区域以应用大小变化
    this.destroyTouchArea();
    this.createTouchArea();

    console.log(`对话触发区域大小已设置为 ${width}x${height}`);
  }

  /**
   * 设置触摸区域偏移
   * @param {number} offsetX - X轴偏移
   * @param {number} offsetY - Y轴偏移
   */
  setTouchAreaOffset(offsetX, offsetY) {
    this.options.touchAreaOffsetX = offsetX;
    this.options.touchAreaOffsetY = offsetY;

    // 更新触摸区域位置
    this.updateTouchAreaPosition();

    console.log(`对话触发区域偏移已设置为 X:${offsetX}, Y:${offsetY}`);
  }

  /**
   * 设置目标骨骼名称
   * @param {string} boneName - 骨骼名称
   */
  setTargetBone(boneName) {
    this.options.targetBoneName = boneName;

    // 重新查找目标骨骼
    this.findTargetBone();

    // 重新创建触摸区域
    this.destroyTouchArea();
    this.createTouchArea();

    console.log(`对话触发目标骨骼已设置为 ${boneName}`);
  }

  /**
   * 启用或禁用对话触发功能
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    // 如果开场动画尚未完成，只保存设置值但不实际启用
    if (!this.isIntroAnimationComplete) {
      this.enabledBySettings = enabled;
      console.log(`对话触发功能设置已保存: ${enabled ? '启用' : '禁用'}，但需要等待开场动画完成后才生效`);
      return;
    }
    
    this.options.enabled = enabled;
    console.log(`对话触发功能已${enabled ? '启用' : '禁用'}`);

    // 如果禁用，确保触摸区域不可交互
    if (this.touchArea) {
      this.touchArea.interactive = enabled;
    }
  }

  /**
   * 销毁触摸区域
   */
  destroyTouchArea() {
    if (this.touchArea) {
      // 移除事件监听器
      this.touchArea.off('pointerdown');
      this.touchArea.off('pointerup');
      this.touchArea.off('pointerupoutside');

      // 从父容器中移除
      if (this.touchArea.parent) {
        this.touchArea.parent.removeChild(this.touchArea);
      }

      // 销毁对象
      this.touchArea.destroy();
      this.touchArea = null;

      console.log('对话触发区域已销毁');
    }
  }

  /**
   * 更新（每帧调用）
   */
  update() {
    // 更新触摸区域位置以跟随骨骼
    this.updateTouchAreaPosition();
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 销毁触摸区域
    this.destroyTouchArea();

    // 移除事件监听器
    document.removeEventListener('modelLoaded', null);
    document.removeEventListener('introAnimationComplete', null);
    document.removeEventListener('settingChanged', null);

    console.log('对话触发控制系统已清理');
  }
}

// 将类导出为全局变量
window.DialogueTriggerControl = DialogueTriggerControl;
