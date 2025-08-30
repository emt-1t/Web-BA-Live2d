/**
 * headPatControl.js - 摸头动画控制模块
 * 用于控制角色头部触摸互动功能
 */

class HeadPatControl {
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
      enabled: true,              // 是否启用摸头功能
      touchAreaVisible: true,    // 触摸区域是否可见（用于调试）
      touchAreaWidth: 900,        // 触摸区域宽度
      touchAreaHeight: 700,       // 触摸区域高度
      touchAreaOffsetX: 100,        // 触摸区域X轴偏移
      touchAreaOffsetY: -150,     // 触摸区域Y轴偏移
      targetBoneName: 'Head_Rot', // 目标骨骼名称
      patDelay: 0.2,             // 摸头开始前的延迟（秒）
      patEndDelay: 0.3,          // 摸头结束后触发结束动画的延迟（秒）
      trackClearDelay: 3.0,      // 摸头结束后清除轨道的延迟（秒）
      trackClearMixDuration: 1.0, // 轨道清除时的混合持续时间（秒）
      // 每个动画的单独速率控制
      // 动画名称设置
      patStartAnimA: 'Pat_01_A', // 摸头开始动画A
      patStartAnimASpeed: 1.0,   // 摸头开始动画A的速率
      patStartAnimM: 'Pat_01_M', // 摸头开始动画M
      patStartAnimMSpeed: 1.0,   // 摸头开始动画M的速率
      patEndAnimA: 'PatEnd_01_A', // 摸头结束动画A
      patEndAnimASpeed: 0.5,     // 摸头结束动画A的速率
      patEndAnimM: 'PatEnd_01_M', // 摸头结束动画M
      patEndAnimMSpeed: 0.5,     // 摸头结束动画M的速率
      // 轨道设置
      patStartTrackA: 6,         // 摸头开始动画A的轨道
      patStartTrackM: 7,         // 摸头开始动画M的轨道
      patEndTrackA: 6,           // 摸头结束动画A的轨道
      patEndTrackM: 7,           // 摸头结束动画M的轨道
      ...options                  // 合并用户配置
    };

    // 从全局设置控制器获取设置，如果存在的话
    if (window.settingsControl && window.settingsControl.settings) {
      const settings = window.settingsControl.settings;
      if (settings.headPatEnabled !== undefined) {
        this.options.enabled = settings.headPatEnabled;
      }
      if (settings.headPatTouchAreaVisible !== undefined) {
        this.options.touchAreaVisible = settings.headPatTouchAreaVisible;
      }
    }

    // 状态变量
    this.touchArea = null;        // 触摸区域PIXI对象
    this.targetBone = null;       // 目标骨骼
    this.isPatting = false;       // 当前是否正在摸头
    this.patCount = 0;            // 摸头计数
    this.patStartTimer = null;    // 摸头开始定时器
    this.patEndTimer = null;      // 摸头结束定时器
    this.trackClearTimer = null;  // 轨道清除定时器
    this.isIntroAnimationComplete = false; // 开场动画是否已完成
    this.enabledBySettings = this.options.enabled; // 保存设置中的启用状态

    // 初始状态下，开场动画未完成，所以强制禁用摸头功能
    this.options.enabled = false;

    // 初始化
    this.init();
  }

  /**
   * 初始化摸头控制
   */
  init() {
    console.log('初始化摸头动画控制系统...');

    // 将实例保存为全局变量，方便其他模块访问
    window.headPatControl = this;

    // 创建触摸区域
    this.createTouchArea();

    // 监听开场动画完成事件
    this.setupIntroAnimationListener();

    // 监听模型加载事件
    document.addEventListener('modelLoaded', () => {
      console.log('检测到模型加载完成，重新创建触摸区域');
      // 重置开场动画完成状态
      this.isIntroAnimationComplete = false;
      // 强制禁用摸头功能，直到开场动画完成
      this.options.enabled = false;
      // 销毁旧的触摸区域
      this.destroyTouchArea();
      // 创建新的触摸区域
      this.createTouchArea();
    });
    
    // 监听设置变化
    this.setupSettingsListener();
  }
  
  /**
   * 设置监听器，响应设置变化
   */
  setupSettingsListener() {
    // 监听设置变化事件
    document.addEventListener('settingChanged', (event) => {
      const { key, value } = event.detail;

      if (key === 'headPatEnabled') {
        // 保存设置中的启用状态
        this.enabledBySettings = value;
        
        // 只有在开场动画完成后才应用设置中的启用状态
        if (this.isIntroAnimationComplete) {
          this.setEnabled(value);
          console.log(`摸头功能设置已更新: ${value ? '启用' : '禁用'}`);
        } else {
          console.log(`摸头功能设置已保存: ${value ? '启用' : '禁用'}，但需要等待开场动画完成后才生效`);
        }
      }
      
      if (key === 'headPatTouchAreaVisible') {
        this.setTouchAreaVisible(value);
      }
    });
  }

  /**
   * 设置监听器，响应开场动画完成事件
   */
  setupIntroAnimationListener() {
    // 监听开场动画完成事件
    document.addEventListener('introAnimationComplete', () => {
      console.log('检测到开场动画完成，准备启用摸头功能');
      this.isIntroAnimationComplete = true;
      
      // 应用保存的设置状态
      this.setEnabled(this.enabledBySettings);
      console.log(`摸头功能状态根据设置${this.enabledBySettings ? '启用' : '禁用'}`);
    });
    
    // 检查动画控制器是否已存在且开场动画已完成
    if (window.animationControl && window.animationControl.isIntroAnimationComplete()) {
      console.log('检测到开场动画已完成（现有状态），启用摸头功能');
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
      console.log('模型尚未加载，无法创建摸头触摸区域');
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
      graphics.beginFill(0xFF0000, 0.3);  // 红色，30%透明度
      graphics.lineStyle(2, 0xFF0000, 0.8); // 红色边框，80%透明度
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
    graphics.on('pointerdown', this.handlePatStart.bind(this));
    graphics.on('pointerup', this.handlePatEnd.bind(this));
    graphics.on('pointerupoutside', this.handlePatEnd.bind(this));

    // 保存触摸区域引用
    this.touchArea = graphics;

    // 将触摸区域添加到主模型容器，这样它会跟随主模型的变换
    const renderManager = this.app.renderManager;
    const mainModelContainer = renderManager?.getMainModelContainer();

    if (mainModelContainer) {
      mainModelContainer.addChild(this.touchArea);
      console.log('摸头触摸区域已添加到主模型容器');
    } else {
      // 如果主模型容器不存在，回退到舞台
      this.app.app.stage.addChild(this.touchArea);
      console.log('摸头触摸区域已添加到舞台（主模型容器不可用）');
    }

    // 更新触摸区域位置
    this.updateTouchAreaPosition();

    console.log(`摸头触摸区域已创建 (interactive: ${graphics.interactive}, visible: ${this.options.touchAreaVisible})`);
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
   * 处理摸头开始
   * @param {Object} event - 交互事件
   */
  handlePatStart(event) {
    if (!this.options.enabled) {
      // 如果开场动画尚未完成，显示提示
      if (!this.isIntroAnimationComplete) {
        console.log('开场动画尚未完成，摸头功能暂不可用');
      }
      return;
    }

    // 清除之前的定时器，如果存在
    if (this.patStartTimer) {
      clearTimeout(this.patStartTimer);
      this.patStartTimer = null;
    }

    if (this.patEndTimer) {
      clearTimeout(this.patEndTimer);
      this.patEndTimer = null;
    }

    // 清除轨道清除定时器，如果存在（重复触发摸头时）
    if (this.trackClearTimer) {
      clearTimeout(this.trackClearTimer);
      this.trackClearTimer = null;
      console.log('清除了之前的轨道清除定时器（重复触发摸头）');
    }

    this.patCount++;
    console.log(`摸头开始! (第${this.patCount}次)`);

    // 设置定时器，延迟指定时间后播放摸头动画
    this.patStartTimer = setTimeout(() => {
      this.isPatting = true;
      this.playPatStartAnimation();
      console.log(`长按超过${this.options.patDelay}秒，触发摸头动画`);
    }, this.options.patDelay * 1000);
  }

  /**
   * 处理摸头结束
   * @param {Object} event - 交互事件
   */
  handlePatEnd(event) {
    if (!this.options.enabled) return;

    // 清除开始定时器，如果存在
    if (this.patStartTimer) {
      clearTimeout(this.patStartTimer);
      this.patStartTimer = null;
    }

    // 如果没有触发摸头动画，则不播放结束动画
    if (!this.isPatting) {
      console.log('摸头被取消，未达到触发时间');
      return;
    }

    console.log('摸头结束，准备播放结束动画');

    // 设置定时器，延迟指定时间后播放摸头结束动画
    this.patEndTimer = setTimeout(() => {
      this.playPatEndAnimation();
      console.log(`延迟${this.options.patEndDelay}秒后播放摸头结束动画`);
      this.isPatting = false;
    }, this.options.patEndDelay * 1000);
  }

  /**
   * 播放摸头开始动画
   */
  playPatStartAnimation() {
    // 再次检查是否可以触发摸头（开场动画是否完成）
    if (!this.isIntroAnimationComplete) {
      console.log('开场动画尚未完成，摸头功能暂不可用');
      return;
    }
    
    if (!this.app || !this.app.currentModel || !this.app.currentModel.state) {
      console.error("无法播放摸头动画：模型或状态不可用");
      return;
    }

    const animA = this.options.patStartAnimA;
    const animM = this.options.patStartAnimM;
    const trackA = this.options.patStartTrackA;
    const trackM = this.options.patStartTrackM;
    const speedA = this.options.patStartAnimASpeed; // 获取动画A的速度
    const speedM = this.options.patStartAnimMSpeed; // 获取动画M的速度

    try {
      // 同时播放两个动画，分别在不同轨道

      // 先检查并播放动画 A
      if (this.checkAnimationExists(animA)) {
        // 设置动画
        const trackEntryA = this.app.currentModel.state.setAnimation(trackA, animA, false);
        // 设置动画A的速度
        trackEntryA.timeScale = speedA;
        console.log(`播放摸头开始动画 A: ${animA} (轨道 ${trackA}, 速度 ${speedA})`);
      } else {
        console.warn(`摸头开始动画 A: ${animA} 不存在`);
      }

      // 然后检查并播放动画 M
      if (this.checkAnimationExists(animM)) {
        // 设置动画
        const trackEntryM = this.app.currentModel.state.setAnimation(trackM, animM, false);
        // 设置动画M的速度
        trackEntryM.timeScale = speedM;
        console.log(`播放摸头开始动画 M: ${animM} (轨道 ${trackM}, 速度 ${speedM})`);
      } else {
        console.warn(`摸头开始动画 M: ${animM} 不存在`);
      }

    } catch (error) {
      console.error(`播放摸头开始动画失败: ${error.message}`);
    }
  }

  /**
   * 播放摸头结束动画
   */
  playPatEndAnimation() {
    if (!this.app || !this.app.currentModel || !this.app.currentModel.state) {
      console.error("无法播放摸头结束动画：模型或状态不可用");
      return;
    }

    const animA = this.options.patEndAnimA;
    const animM = this.options.patEndAnimM;
    const trackA = this.options.patEndTrackA;
    const trackM = this.options.patEndTrackM;
    const speedA = this.options.patEndAnimASpeed; // 获取动画A的速度
    const speedM = this.options.patEndAnimMSpeed; // 获取动画M的速度

    try {
      // 同时播放两个结束动画，分别在不同轨道

      // 先检查并播放结束动画 A
      if (this.checkAnimationExists(animA)) {
        // 设置动画
        const trackEntryA = this.app.currentModel.state.setAnimation(trackA, animA, false);
        // 设置动画A的速度
        trackEntryA.timeScale = speedA;
        console.log(`播放摸头结束动画 A: ${animA} (轨道 ${trackA}, 速度 ${speedA})`);
        // 动画结束后不清除轨道，保持动画状态
        // this.app.currentModel.state.addEmptyAnimation(trackA, 0.5, 0.2);
      } else {
        console.warn(`摸头结束动画 A: ${animA} 不存在`);
      }

      // 然后检查并播放结束动画 M
      if (this.checkAnimationExists(animM)) {
        // 设置动画
        const trackEntryM = this.app.currentModel.state.setAnimation(trackM, animM, false);
        // 设置动画M的速度
        trackEntryM.timeScale = speedM;
        console.log(`播放摸头结束动画 M: ${animM} (轨道 ${trackM}, 速度 ${speedM})`);
        // 动画结束后不清除轨道，保持动画状态
        // this.app.currentModel.state.addEmptyAnimation(trackM, 0.5, 0.2);
      } else {
        console.warn(`摸头结束动画 M: ${animM} 不存在`);
      }

      // 不立即清除摸头开始动画的轨道，而是设置延迟清除
      // this.app.currentModel.state.addEmptyAnimation(this.options.patStartTrackA, 0, 0);
      // this.app.currentModel.state.addEmptyAnimation(this.options.patStartTrackM, 0, 0);

      // 设置延迟清除轨道的定时器
      this.scheduleTrackClear();

    } catch (error) {
      console.error(`播放摸头结束动画失败: ${error.message}`);
    }
  }

  /**
   * 安排延迟清除轨道
   */
  scheduleTrackClear() {
    // 清除之前的轨道清除定时器，如果存在
    if (this.trackClearTimer) {
      clearTimeout(this.trackClearTimer);
      this.trackClearTimer = null;
    }

    console.log(`设置轨道清除定时器，${this.options.trackClearDelay}秒后清除摸头动画轨道`);

    // 设置新的轨道清除定时器
    this.trackClearTimer = setTimeout(() => {
      this.clearPatTracks();
      this.trackClearTimer = null;
    }, this.options.trackClearDelay * 1000);
  }

  /**
   * 清除摸头动画轨道
   */
  clearPatTracks() {
    if (!this.app || !this.app.currentModel || !this.app.currentModel.state) {
      console.warn('无法清除摸头轨道：模型或状态不可用');
      return;
    }

    try {
      const mixDuration = this.options.trackClearMixDuration;

      // 逐渐清除摸头开始动画轨道
      this.app.currentModel.state.addEmptyAnimation(this.options.patStartTrackA, mixDuration, 0);
      this.app.currentModel.state.addEmptyAnimation(this.options.patStartTrackM, mixDuration, 0);

      // 逐渐清除摸头结束动画轨道
      this.app.currentModel.state.addEmptyAnimation(this.options.patEndTrackA, mixDuration, 0);
      this.app.currentModel.state.addEmptyAnimation(this.options.patEndTrackM, mixDuration, 0);

      console.log(`摸头动画轨道已清除 (混合时间: ${mixDuration}秒)`);
    } catch (error) {
      console.error(`清除摸头轨道失败: ${error.message}`);
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
   * 设置触摸区域可见性
   * @param {boolean} visible - 是否可见
   */
  setTouchAreaVisible(visible) {
    this.options.touchAreaVisible = visible;

    // 重新创建触摸区域以应用可见性变化
    this.destroyTouchArea();
    this.createTouchArea();

    console.log(`触摸区域可见性已${visible ? '启用' : '禁用'}`);
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

    console.log(`触摸区域大小已设置为 ${width}x${height}`);
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

    console.log(`触摸区域偏移已设置为 (${offsetX}, ${offsetY})`);
  }

  /**
   * 设置目标骨骼名称
   * @param {string} boneName - 骨骼名称
   */
  setTargetBone(boneName) {
    this.options.targetBoneName = boneName;

    // 重新创建触摸区域以使用新的目标骨骼
    this.destroyTouchArea();
    this.createTouchArea();

    console.log(`目标骨骼已设置为 ${boneName}`);
  }

  /**
   * 设置摸头动画名称
   * @param {string} animName - 动画名称
   */
  setPatAnimationName(animName) {
    this.options.patAnimationName = animName;
    console.log(`摸头动画已设置为 ${animName}`);
  }

  /**
   * 启用或禁用摸头功能
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    // 如果开场动画尚未完成，只保存设置值但不实际启用
    if (!this.isIntroAnimationComplete) {
      this.enabledBySettings = enabled;
      console.log(`摸头功能设置已保存: ${enabled ? '启用' : '禁用'}，但需要等待开场动画完成后才生效`);
      return;
    }
    
    this.options.enabled = enabled;
    console.log(`摸头功能已${enabled ? '启用' : '禁用'}`);

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
      // 从父容器移除（可能是主模型容器或舞台）
      if (this.touchArea.parent) {
        this.touchArea.parent.removeChild(this.touchArea);
      }

      // 移除事件监听
      this.touchArea.off('pointerdown');
      this.touchArea.off('pointerup');
      this.touchArea.off('pointerupoutside');

      // 销毁对象
      this.touchArea.destroy();
      this.touchArea = null;
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

    console.log('摸头控制系统已清理');
  }
}

// 将类导出为全局变量
window.HeadPatControl = HeadPatControl;
