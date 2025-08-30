/**
 * backgroundTracking.js - 通过鼠标移动控制背景骨骼实现背景摇晃效果
 * 基于eyeTracking.js改编，控制背景骨骼而不是眼睛骨骼
 */

class BackgroundTracking {
  /**
   * 构造函数
   * @param {Object} app - App实例，用于获取spine动画
   * @param {Object} options - 配置选项
   */
  constructor(app, options = {}) {
    // 保存app引用
    this.app = app;

    // 从全局设置中读取配置，如果不存在则使用默认值
    const savedSettings = window.settingsControl ? window.settingsControl.settings : {};

    const defaultSettings = {
      enabled: savedSettings.backgroundTracking !== undefined ? savedSettings.backgroundTracking : true,
      intensity: savedSettings.backgroundTrackingIntensity !== undefined ? savedSettings.backgroundTrackingIntensity : 3,
      smoothness: savedSettings.backgroundSmoothness !== undefined ? savedSettings.backgroundSmoothness : 0.96,
      maxDistance: savedSettings.backgroundMaxDistance !== undefined ? savedSettings.backgroundMaxDistance : 30,
      autoReset: savedSettings.backgroundAutoReset !== undefined ? savedSettings.backgroundAutoReset : true,
      autoResetDelay: 3000,         // 自动重置延迟（毫秒）
      backgroundBoneNames: ['HIP'],        // 背景骨骼名称
      invertX: savedSettings.backgroundInvertX !== undefined ? savedSettings.backgroundInvertX : false,
      invertY: savedSettings.backgroundInvertY !== undefined ? savedSettings.backgroundInvertY : false,
      swapXY: savedSettings.backgroundSwapXY !== undefined ? savedSettings.backgroundSwapXY : false
    };

    console.log('背景追踪：从设置中加载配置', defaultSettings);

    // 将默认设置与用户提供的选项合并
    this.options = {...defaultSettings, ...options};

    // 状态变量
    this.isTracking = false;         // 当前是否正在追踪
    this.mouseX = 0;                 // 当前鼠标X坐标
    this.mouseY = 0;                 // 当前鼠标Y坐标
    this.targetX = 0;                // 目标X位置
    this.targetY = 0;                // 目标Y位置
    this.currentX = 0;               // 当前X位置
    this.currentY = 0;               // 当前Y位置
    this.resetTimeout = null;        // 重置计时器
    this.backgroundBones = [];       // 背景骨骼引用
    this.boneDataMap = null;         // 骨骼数据映射
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
    this.animationFrameId = null;    // 动画帧ID
    this.tickerFunction = null;      // PIXI ticker函数引用
    this.isStopped = true;           // 是否处于停止状态（用于检测首次移动）
    this.lastMoveTime = 0;           // 上次移动时间

    // 初始化
    this.init();
  }

  /**
   * 初始化背景追踪
   */
  init() {
    console.log('初始化背景追踪系统...');

    // 查找背景骨骼
    this.findBackgroundBones();

    // 如果启用，则添加事件监听器
    if (this.options.enabled) {
      this.enable();
    }

    // 开始更新循环
    this.startUpdateLoop();

    // 监听模型重新加载事件
    this.setupModelReloadListener();
  }

  /**
   * 设置模型重新加载监听器
   */
  setupModelReloadListener() {
    // 监听模型加载事件，重新初始化Hip骨骼
    document.addEventListener('modelLoaded', () => {
      console.log('Hip背景追踪：检测到模型重新加载，重新初始化...');

      // 清理旧的骨骼引用
      this.backgroundBones = [];
      this.originalPositions = [];

      // 重新查找背景骨骼
      setTimeout(() => {
        this.findBackgroundBones();
        console.log('背景追踪：重新初始化完成');
      }, 100); // 稍微延迟以确保模型完全加载
    });
  }

  /**
   * 查找背景骨骼
   */
  findBackgroundBones() {
    // 确保app和spine动画已加载
    if (!this.app || !this.app.currentModel || !this.app.currentModel.skeleton) {
      console.warn('Hip背景追踪：Spine模型未加载，无法找到Hip骨骼');
      return;
    }

    const skeleton = this.app.currentModel.skeleton;

    if (!skeleton) {
      console.warn('Hip背景追踪：无法访问骨骼数据');
      return;
    }

    // 重置背景骨骼数组
    this.backgroundBones = [];
    this.boneDataMap = new Map(); // 用于存储骨骼的原始数据

    // 查找所有可能的背景骨骼
    for (let i = 0; i < skeleton.bones.length; i++) {
      const bone = skeleton.bones[i];
      if (bone && this.options.backgroundBoneNames.includes(bone.data.name)) {
        console.log(`背景追踪：找到背景骨骼 "${bone.data.name}"`);
        this.backgroundBones.push(bone);
        // 保存骨骼的原始数据引用
        this.boneDataMap.set(bone, {
          originalX: bone.data.x,
          originalY: bone.data.y
        });
      }
    }

    // 如果没有找到背景骨骼，尝试查找更多可能的名称
    if (this.backgroundBones.length === 0) {
      // 查找包含"hip"、"body"、"torso"、"waist"的骨骼名称
      const backgroundKeywords = ['hip', 'body', 'torso', 'waist', 'pelvis', 'spine', 'root'];
      for (let i = 0; i < skeleton.bones.length; i++) {
        const bone = skeleton.bones[i];
        if (bone && bone.data.name) {
          const boneName = bone.data.name.toLowerCase();
          if (backgroundKeywords.some(keyword => boneName.includes(keyword))) {
            console.log(`背景追踪：找到可能的背景骨骼 "${bone.data.name}"`);
            this.backgroundBones.push(bone);
            // 保存骨骼的原始数据引用
            this.boneDataMap.set(bone, {
              originalX: bone.data.x,
              originalY: bone.data.y
            });
          }
        }
      }
    }

    // 如果还是没有找到，尝试使用根骨骼
    if (this.backgroundBones.length === 0 && skeleton.bones.length > 0) {
      // 查找根骨骼（没有父骨骼的骨骼）
      for (let i = 0; i < skeleton.bones.length; i++) {
        const bone = skeleton.bones[i];
        if (bone && !bone.parent) {
          console.log(`背景追踪：使用根骨骼 "${bone.data.name}"`);
          this.backgroundBones.push(bone);
          // 保存骨骼的原始数据引用
          this.boneDataMap.set(bone, {
            originalX: bone.data.x,
            originalY: bone.data.y
          });
          break; // 只使用第一个根骨骼
        }
      }
    }

    console.log(`背景追踪：共找到 ${this.backgroundBones.length} 个背景骨骼`);

    // 如果仍然没有找到背景骨骼，列出所有可用的骨骼名称以便调试
    if (this.backgroundBones.length === 0) {
      console.log('背景追踪：未找到背景骨骼，列出所有可用骨骼：');
      for (let i = 0; i < skeleton.bones.length; i++) {
        const bone = skeleton.bones[i];
        if (bone && bone.data.name) {
          console.log(`  - ${bone.data.name}`);
        }
      }
    }
  }

  /**
   * 启用背景追踪
   */
  enable() {
    if (this.isTracking) return;

    this.options.enabled = true;
    this.isTracking = true;

    // 添加事件监听器
    window.addEventListener('mousemove', this.boundHandleMouseMove);
    window.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    window.addEventListener('mouseleave', this.boundHandleMouseLeave);

    console.log('背景追踪：已启用');
  }

  /**
   * 禁用背景追踪
   */
  disable() {
    if (!this.isTracking) return;

    this.options.enabled = false;
    this.isTracking = false;

    // 移除事件监听器
    window.removeEventListener('mousemove', this.boundHandleMouseMove);
    window.removeEventListener('touchmove', this.boundHandleTouchMove);
    window.removeEventListener('mouseleave', this.boundHandleMouseLeave);

    // 重置背景位置
    this.resetBackgroundPositions();

    console.log('背景追踪：已禁用');
  }

  /**
   * 处理鼠标移动事件
   * @param {MouseEvent} event - 鼠标事件
   */
  handleMouseMove(event) {
    if (!this.isTracking || !this.options.enabled) return;

    const now = Date.now();
    const isFirstMove = this.isStopped;
    const isLongPause = now - this.lastMoveTime > 500; // 如果超过500ms没有移动，视为长时间暂停

    this.mouseX = event.clientX;
    this.mouseY = event.clientY;

    // 计算新的目标位置
    this.calculateTargetPosition();

    // 如果是从停止状态开始的首次移动，或者长时间暂停后的移动
    // 应用平滑过渡效果以避免突然的跳跃
    if (isFirstMove || isLongPause) {
      this.startSmoothTransition();
    }

    // 更新状态
    this.isStopped = false;
    this.lastMoveTime = now;

    // 如果启用了自动重置，则在每次移动时重新开始计时
    if (this.options.autoReset) {
      this.resetAutoResetTimer();
    }
  }

  /**
   * 处理触摸移动事件
   * @param {TouchEvent} event - 触摸事件
   */
  handleTouchMove(event) {
    if (!this.isTracking || !this.options.enabled) return;

    // 防止页面滚动
    event.preventDefault();

    if (event.touches.length > 0) {
      const now = Date.now();
      const isFirstMove = this.isStopped;
      const isLongPause = now - this.lastMoveTime > 500; // 如果超过500ms没有移动，视为长时间暂停

      this.mouseX = event.touches[0].clientX;
      this.mouseY = event.touches[0].clientY;

      // 计算新的目标位置
      this.calculateTargetPosition();

      // 如果是从停止状态开始的首次移动，或者长时间暂停后的移动
      // 应用平滑过渡效果以避免突然的跳跃
      if (isFirstMove || isLongPause) {
        this.startSmoothTransition();
      }

      // 更新状态
      this.isStopped = false;
      this.lastMoveTime = now;

      // 如果启用了自动重置，则在每次移动时重新开始计时
      if (this.options.autoReset) {
        this.resetAutoResetTimer();
      }
    }
  }

  /**
   * 处理鼠标离开事件
   */
  handleMouseLeave() {
    if (!this.isTracking || !this.options.enabled) return;

    // 如果启用了自动重置，使用平滑回正
    if (this.options.autoReset) {
      this.smoothlyResetBackgroundPositions();
    }
  }

  /**
   * 计算目标背景位置
   */
  calculateTargetPosition() {
    // 如果没有找到背景骨骼，直接返回
    if (this.backgroundBones.length === 0) return;

    // 获取窗口中心作为参考点
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // 计算鼠标距离中心点的偏移量，并标准化
    // 使用屏幕宽度和高度的1/4作为标准化因子
    const normalizeFactorX = window.innerWidth / 4;
    const normalizeFactorY = window.innerHeight / 4;

    let offsetX = (this.mouseX - centerX) / normalizeFactorX;
    let offsetY = (this.mouseY - centerY) / normalizeFactorY;

    // 限制最大偏移量
    offsetX = Math.max(-1, Math.min(1, offsetX));
    offsetY = Math.max(-1, Math.min(1, offsetY));

    // 应用方向反转
    if (this.options.invertX) {
      offsetX = -offsetX;
    }

    if (this.options.invertY) {
      offsetY = -offsetY;
    }

    // 应用追踪强度
    const intensity = this.options.intensity / 10;

    // 计算最终目标位置
    if (this.options.swapXY) {
      // 交换X和Y轴
      this.targetX = offsetY * this.options.maxDistance * intensity;
      this.targetY = offsetX * this.options.maxDistance * intensity;
    } else {
      // 正常映射
      this.targetX = offsetX * this.options.maxDistance * intensity;
      this.targetY = offsetY * this.options.maxDistance * intensity;
    }
  }

  /**
   * 移动背景骨骼来实现背景摇晃效果
   * 通过修改骨骼数据来实现持久的偏移效果
   */
  moveBackgroundBones() {
    if (!this.app || !this.app.currentModel || this.backgroundBones.length === 0) return;

    // 修改骨骼的基础数据，这样动画系统会基于修改后的数据进行计算
    for (let i = 0; i < this.backgroundBones.length; i++) {
      const bone = this.backgroundBones[i];

      if (bone && this.boneDataMap.has(bone)) {
        try {
          const boneData = this.boneDataMap.get(bone);

          // 修改骨骼的数据位置，而不是运行时位置
          // 这样动画系统会基于修改后的基础位置进行计算
          bone.data.x = boneData.originalX + this.currentX;
          bone.data.y = boneData.originalY + this.currentY;

          // 标记骨骼需要更新
          bone.appliedValid = false;

          // 如果有父骨骼，也标记父骨骼需要更新
          if (bone.parent) {
            bone.parent.appliedValid = false;
          }

        } catch (error) {
          // 如果发生错误，静默处理以避免影响用户体验
          console.warn('移动背景骨骼时出错:', error);
        }
      }
    }
  }

  /**
   * 更新位置
   */
  updateBackgroundPositions() {
    if (!this.isTracking || !this.options.enabled) return;

    // 使用平滑系数计算当前位置
    // 增强平滑度计算，使高值时效果更明显
    let smoothFactor = this.options.smoothness;

    // 应用指数函数增强高值区间的平滑效果
    // 当smoothness接近1时，指数函数会使其效果更加明显
    smoothFactor = Math.pow(smoothFactor, 0.7);

    // 计算新位置：当前位置和目标位置的加权平均
    // 平滑系数越高，当前位置的权重越大，移动越慢
    this.currentX = this.currentX * smoothFactor + this.targetX * (1 - smoothFactor);
    this.currentY = this.currentY * smoothFactor + this.targetY * (1 - smoothFactor);

    // 使用背景骨骼移动实现背景摇晃
    this.moveBackgroundBones();
  }

  /**
   * 重置背景位置到原始状态（立即重置，没有动画）
   */
  resetBackgroundPositions() {
    // 重置目标和当前位置
    this.targetX = 0;
    this.targetY = 0;
    this.currentX = 0;
    this.currentY = 0;

    // 标记为已停止状态
    this.isStopped = true;

    // 重置所有背景骨骼的数据到原始状态
    for (let i = 0; i < this.backgroundBones.length; i++) {
      const bone = this.backgroundBones[i];

      if (bone && this.boneDataMap.has(bone)) {
        const boneData = this.boneDataMap.get(bone);

        // 恢复骨骼数据到原始位置
        bone.data.x = boneData.originalX;
        bone.data.y = boneData.originalY;

        // 标记骨骼需要更新
        bone.appliedValid = false;

        // 如果有父骨骼，也标记父骨骼需要更新
        if (bone.parent) {
          bone.parent.appliedValid = false;
        }
      }
    }
  }

  /**
   * 开始平滑过渡
   * 当背景从停止状态开始移动时使用，避免突然的跳跃
   */
  startSmoothTransition() {
    // 存储原始平滑度设置
    const originalSmoothness = this.options.smoothness;

    // 临时增加平滑度使开始移动更加自然
    this.options.smoothness = 0.98;

    // 逐渐恢复到原始平滑度
    let frames = 0;
    const maxFrames = 30; // 半秒左右

    const transitionAnimation = () => {
      frames++;

      if (frames < maxFrames) {
        // 平滑过渡到原始平滑度
        const progress = frames / maxFrames;
        this.options.smoothness = 0.98 - (0.98 - originalSmoothness) * progress;

        // 只有在还在追踪且没有被禁用的情况下才继续动画
        if (this.isTracking && this.options.enabled && !this.isStopped) {
          requestAnimationFrame(transitionAnimation);
        } else {
          // 如果已经停止追踪，立即恢复原始平滑度
          this.options.smoothness = originalSmoothness;
        }
      } else {
        // 动画结束，恢复原始平滑度
        this.options.smoothness = originalSmoothness;
      }
    };

    // 开始过渡动画
    requestAnimationFrame(transitionAnimation);
  }

  /**
   * 平滑地重置背景位置到原始状态（有动画效果）
   */
  smoothlyResetBackgroundPositions() {
    // 只将目标位置设置为原点
    // 当前位置不变，让updateBackgroundPositions中的平滑插值来处理过渡
    this.targetX = 0;
    this.targetY = 0;

    // 标记为已停止，以便下次移动时有平滑过渡
    this.isStopped = true;

    // 为了让回正效果更加明显，可以临时增加平滑度
    const originalSmoothness = this.options.smoothness;

    // 创建一个临时的回正动画
    let animationFrames = 0;
    const maxFrames = 60; // 约1秒的动画时间
    const resetAnimation = () => {
      // 增加临时平滑度使回正更加自然
      const resetSmoothness = 0.95 + (animationFrames / maxFrames) * 0.03;
      this.options.smoothness = Math.min(0.98, resetSmoothness);

      // 更新帧计数
      animationFrames++;

      // 如果动画未结束且目标没有被改变（用户没有移动鼠标），继续动画
      if (animationFrames < maxFrames && this.targetX === 0 && this.targetY === 0) {
        requestAnimationFrame(resetAnimation);
      } else {
        // 恢复原始平滑度
        this.options.smoothness = originalSmoothness;
      }
    };

    // 开始回正动画
    resetAnimation();
  }

  /**
   * 重置自动重置计时器
   */
  resetAutoResetTimer() {
    // 清除现有计时器
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }

    // 设置新计时器
    this.resetTimeout = setTimeout(() => {
      // 使用平滑回正替代立即回正
      this.smoothlyResetBackgroundPositions();
    }, this.options.autoResetDelay);
  }

  /**
   * 开始更新循环
   * 使用PIXI ticker确保与动画系统同步，并在动画更新后执行
   */
  startUpdateLoop() {
    // 取消之前的动画帧
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // 移除之前的ticker监听器
    if (this.tickerFunction && this.app && this.app.app && this.app.app.ticker) {
      this.app.app.ticker.remove(this.tickerFunction);
    }

    // 创建ticker更新函数
    this.tickerFunction = () => {
      this.updateBackgroundPositions();
    };

    // 优先使用PIXI ticker，确保与动画系统同步
    if (this.app && this.app.app && this.app.app.ticker) {
      // 使用较低的优先级，确保在Spine动画更新之后执行
      this.app.app.ticker.add(this.tickerFunction, null, PIXI.UPDATE_PRIORITY.LOW);
      console.log('背景追踪：使用PIXI ticker进行更新（低优先级）');
    } else {
      // 后备方案：使用requestAnimationFrame
      const update = () => {
        this.updateBackgroundPositions();
        this.animationFrameId = requestAnimationFrame(update);
      };
      this.animationFrameId = requestAnimationFrame(update);
      console.log('背景追踪：使用requestAnimationFrame进行更新');
    }
  }

  /**
   * 停止更新循环
   */
  stopUpdateLoop() {
    // 停止requestAnimationFrame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // 移除PIXI ticker监听器
    if (this.tickerFunction && this.app && this.app.app && this.app.app.ticker) {
      this.app.app.ticker.remove(this.tickerFunction);
      this.tickerFunction = null;
    }
  }

  /**
   * 设置是否启用背景追踪
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    if (enabled && !this.isTracking) {
      this.enable();
    } else if (!enabled && this.isTracking) {
      this.disable();
    }
  }

  /**
   * 设置追踪强度
   * @param {number} intensity - 追踪强度 (1-10)
   */
  setIntensity(intensity) {
    this.options.intensity = Math.max(0, Math.min(10, intensity));
    console.log(`背景追踪：强度设置为 ${this.options.intensity}`);
  }

  /**
   * 设置平滑度
   * @param {number} smoothness - 平滑度 (0-1)，值越大移动越平滑
   */
  setSmoothness(smoothness) {
    this.options.smoothness = Math.max(0, Math.min(1, smoothness));
    console.log(`背景追踪：平滑度设置为 ${this.options.smoothness} (值越大移动越平滑)`);
  }

  /**
   * 设置最大距离
   * @param {number} distance - 最大移动距离
   */
  setMaxDistance(distance) {
    this.options.maxDistance = Math.max(0, distance);
    console.log(`背景追踪：最大距离设置为 ${this.options.maxDistance}`);
  }

  /**
   * 设置是否自动重置
   * @param {boolean} autoReset - 是否自动重置
   */
  setAutoReset(autoReset) {
    this.options.autoReset = autoReset;
    console.log(`背景追踪：自动重置${autoReset ? '启用' : '禁用'}`);
  }

  /**
   * 设置自动重置延迟
   * @param {number} delay - 延迟时间（毫秒）
   */
  setAutoResetDelay(delay) {
    this.options.autoResetDelay = Math.max(100, delay);
    console.log(`背景追踪：自动重置延迟设置为 ${this.options.autoResetDelay}ms`);
  }

  /**
   * 设置背景骨骼名称
   * @param {Array<string>} names - 骨骼名称数组
   */
  setBackgroundBoneNames(names) {
    if (Array.isArray(names) && names.length > 0) {
      this.options.backgroundBoneNames = names;
      // 重新查找骨骼
      this.findBackgroundBones();
    }
  }

  /**
   * 设置是否反转X轴
   * @param {boolean} invert - 是否反转
   */
  setInvertX(invert) {
    this.options.invertX = invert;
    console.log(`背景追踪：X轴反转已${invert ? '启用' : '禁用'}`);
  }

  /**
   * 设置是否反转Y轴
   * @param {boolean} invert - 是否反转
   */
  setInvertY(invert) {
    this.options.invertY = invert;
    console.log(`背景追踪：Y轴反转已${invert ? '启用' : '禁用'}`);
  }

  /**
   * 设置是否交换XY轴
   * @param {boolean} swap - 是否交换
   */
  setSwapXY(swap) {
    this.options.swapXY = swap;
    console.log(`背景追踪：XY轴交换已${swap ? '启用' : '禁用'}`);
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.disable();
    this.stopUpdateLoop();

    // 清除计时器
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }

    // 恢复所有骨骼的原始数据
    for (let i = 0; i < this.backgroundBones.length; i++) {
      const bone = this.backgroundBones[i];
      if (bone && this.boneDataMap.has(bone)) {
        const boneData = this.boneDataMap.get(bone);

        // 恢复骨骼数据到原始位置
        bone.data.x = boneData.originalX;
        bone.data.y = boneData.originalY;

        // 标记骨骼需要更新
        bone.appliedValid = false;
      }
    }

    // 重置状态
    this.backgroundBones = [];
    this.boneDataMap = null;
    this.tickerFunction = null;

    console.log('背景追踪：已清理');
  }
}

// 将类导出为全局变量
window.BackgroundTracking = BackgroundTracking;
