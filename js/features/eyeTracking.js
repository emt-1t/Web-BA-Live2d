/**
 * eyeTracking.js - 为Spine模型提供眼部追踪功能
 * 用于使角色的眼睛跟随鼠标或触摸点移动，增加互动性和沉浸感
 */

class EyeTracking {
  /**
   * 构造函数
   * @param {Object} app - App实例，用于获取spine动画
   * @param {Object} options - 配置选项
   */
  constructor(app, options = {}) {
    // 保存app引用
    this.app = app;

    // 使用独立的默认设置，不从全局设置获取配置
    const defaultSettings = {
      enabled: true,                // 是否启用眼部追踪
      intensity: 7,                 // 追踪强度 (1-10)
      smoothness: 0.95,             // 平滑度 (0-1) 值越大越平滑
      maxDistance: 200,             // 眼睛骨骼最大移动距离
      autoReset: true,              // 是否在鼠标/触摸离开或停止移动时自动重置眼睛位置
      autoResetDelay: 3000,         // 自动重置延迟（毫秒）
      eyeBoneNames: ['Touch_Eye'],  // 眼睛骨骼
      invertX: true,                // 是否反转X轴方向
      invertY: true,                // 是否反转Y轴方向
      swapXY: true,                 // 是否交换X和Y坐标
      useSpecialFix: false,         // 是否使用特殊修复
      // 摸头模式的单独参数（独立于全局设置）
      headPatIntensity: 9,          // 摸头时的追踪强度 (1-10) - 独立参数
      headPatSmoothness: 0.95,      // 摸头时的平滑度 (0-1) - 独立参数
      headPatMaxDistance: 200,      // 摸头时的最大移动距离 - 独立参数
      headPatBoneName: 'Touch_Me' // 摸头时使用的骨骼名称
    };
    console.log('眼部追踪：使用独立默认配置', defaultSettings);

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
    this.eyeBones = [];              // 眼睛骨骼引用
    this.originalPositions = [];     // 眼睛骨骼原始位置
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
    this.animationFrameId = null;    // 动画帧ID
    this.isStopped = true;           // 是否处于停止状态（用于检测首次移动）
    this.lastMoveTime = 0;           // 上次移动时间

    // 摸头模式相关状态
    this.isHeadPatMode = false;      // 当前是否处于摸头模式
    this.headPatBone = null;         // 摸头模式使用的骨骼
    this.headPatOriginalPosition = null; // 摸头骨骼的原始位置

    // 初始化
    this.init();
  }

  /**
   * 初始化眼部追踪
   */
  init() {
    console.log('初始化眼部追踪系统...');

    // 查找眼睛骨骼
    this.findEyeBones();

    // 如果启用，则添加事件监听器
    if (this.options.enabled) {
      this.enable();
    }

    // 开始更新循环
    this.startUpdateLoop();
  }

  /**
   * 查找眼睛骨骼
   */
  findEyeBones() {
    // 确保app和spine动画已加载
    if (!this.app || !this.app.currentModel || !this.app.currentModel.skeleton) {
      console.warn('眼部追踪系统：Spine模型未加载，无法找到眼睛骨骼');
      return;
    }

    const skeleton = this.app.currentModel.skeleton;

    if (!skeleton) {
      console.warn('眼部追踪系统：无法访问骨骼数据');
      return;
    }

    // 重置眼睛骨骼数组
    this.eyeBones = [];
    this.originalPositions = [];

    // 查找所有可能的眼睛骨骼
    for (let i = 0; i < skeleton.bones.length; i++) {
      const bone = skeleton.bones[i];
      if (bone && this.options.eyeBoneNames.includes(bone.data.name)) {
        console.log(`眼部追踪系统：找到眼睛骨骼 "${bone.data.name}"`);
        this.eyeBones.push(bone);
        // 保存原始位置
        this.originalPositions.push({
          x: bone.x,
          y: bone.y
        });
      }
    }

    // 查找摸头模式使用的骨骼
    this.headPatBone = null;
    this.headPatOriginalPosition = null;
    for (let i = 0; i < skeleton.bones.length; i++) {
      const bone = skeleton.bones[i];
      if (bone && bone.data.name === this.options.headPatBoneName) {
        console.log(`眼部追踪系统：找到摸头模式骨骼 "${bone.data.name}"`);
        this.headPatBone = bone;
        // 保存原始位置
        this.headPatOriginalPosition = {
          x: bone.x,
          y: bone.y
        };
        break;
      }
    }

    // 如果没有找到眼睛骨骼，尝试查找更多可能的名称
    if (this.eyeBones.length === 0) {
      // 查找包含"eye"的骨骼名称
      for (let i = 0; i < skeleton.bones.length; i++) {
        const bone = skeleton.bones[i];
        if (bone && bone.data.name.toLowerCase().includes('eye')) {
          console.log(`眼部追踪系统：找到可能的眼睛骨骼 "${bone.data.name}"`);
          this.eyeBones.push(bone);
          // 保存原始位置
          this.originalPositions.push({
            x: bone.x,
            y: bone.y
          });
        }
      }
    }

    console.log(`眼部追踪系统：共找到 ${this.eyeBones.length} 个眼睛骨骼`);
    if (this.headPatBone) {
      console.log(`眼部追踪系统：找到摸头模式骨骼 "${this.options.headPatBoneName}"`);
    } else {
      console.warn(`眼部追踪系统：未找到摸头模式骨骼 "${this.options.headPatBoneName}"`);
    }
  }

  /**
   * 启用眼部追踪
   */
  enable() {
    if (this.isTracking) return;

    this.options.enabled = true;
    this.isTracking = true;

    // 添加事件监听器
    window.addEventListener('mousemove', this.boundHandleMouseMove);
    window.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    window.addEventListener('mouseleave', this.boundHandleMouseLeave);

    console.log('眼部追踪系统：已启用');
  }

  /**
   * 禁用眼部追踪
   */
  disable() {
    if (!this.isTracking) return;

    this.options.enabled = false;
    this.isTracking = false;

    // 移除事件监听器
    window.removeEventListener('mousemove', this.boundHandleMouseMove);
    window.removeEventListener('touchmove', this.boundHandleTouchMove);
    window.removeEventListener('mouseleave', this.boundHandleMouseLeave);

    // 重置眼睛位置
    this.resetEyePositions();

    console.log('眼部追踪系统：已禁用');
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
      this.smoothlyResetEyePositions();
    }
  }

  /**
   * 计算目标眼睛位置
   */
  calculateTargetPosition() {
    // 根据摸头模式选择使用的骨骼
    let targetBone = null;

    if (this.isHeadPatMode && this.headPatBone) {
      // 摸头模式：使用Touch_Point骨骼
      targetBone = this.headPatBone;
    } else {
      // 正常模式：使用Touch_Eye骨骼
      if (this.eyeBones.length === 0) return;
      targetBone = this.eyeBones.find(bone => bone.data.name === 'Touch_Eye') || this.eyeBones[0];
    }

    if (!targetBone) return;

    // 获取目标骨骼的世界坐标作为参考中心
    let eyeCenterX = 0;
    let eyeCenterY = 0;

    if (this.app && this.app.currentModel) {
      // 获取模型位置
      const modelX = this.app.currentModel.x;
      const modelY = this.app.currentModel.y;

      // 获取模型缩放
      const modelScale = this.app.currentModel.scale.x;

      // 计算骨骼的世界坐标
      eyeCenterX = modelX + targetBone.worldX * modelScale;
      eyeCenterY = modelY + targetBone.worldY * modelScale;
    } else {
      // 如果无法获取模型信息，使用窗口中心作为后备方案
      eyeCenterX = window.innerWidth / 2;
      eyeCenterY = window.innerHeight / 2;
    }

    // 计算鼠标距离眼睛中心点的偏移量，并标准化
    // 使用屏幕宽度和高度的1/4作为标准化因子，使得眼睛移动更加灵敏
    const normalizeFactorX = window.innerWidth / 4;
    const normalizeFactorY = window.innerHeight / 4;

    let offsetX = (this.mouseX - eyeCenterX) / normalizeFactorX;
    let offsetY = (this.mouseY - eyeCenterY) / normalizeFactorY;

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

    // 根据摸头模式选择参数
    let intensity, maxDistance;
    if (this.isHeadPatMode) {
      // 摸头模式：使用专门的参数
      intensity = this.options.headPatIntensity / 10;
      maxDistance = this.options.headPatMaxDistance;
    } else {
      // 正常模式：使用常规参数
      intensity = this.options.intensity / 10;
      maxDistance = this.options.maxDistance;
    }

    // 计算最终目标位置
    if (this.options.swapXY) {
      // 交换X和Y轴
      this.targetX = offsetY * maxDistance * intensity;
      this.targetY = offsetX * maxDistance * intensity;
    } else {
      // 正常映射
      this.targetX = offsetX * maxDistance * intensity;
      this.targetY = offsetY * maxDistance * intensity;
    }

    // 应用特殊修复（根据用户描述的问题）
    if (this.options.useSpecialFix) {
      // 修正措施：根据用户描述的映射关系进行变换
      const tempX = this.targetX;
      const tempY = this.targetY;

      // 交换XY轴并反转Y轴
      this.targetX = tempY;
      this.targetY = -tempX;
    }
  }

  /**
   * 更新眼睛位置
   */
  updateEyePositions() {
    if (!this.isTracking || !this.options.enabled) return;

    // 根据摸头模式选择要更新的骨骼和参数
    let targetBones, targetOriginalPositions, smoothness;

    if (this.isHeadPatMode && this.headPatBone) {
      // 摸头模式：使用Touch_Point骨骼和摸头参数
      targetBones = [this.headPatBone];
      targetOriginalPositions = [this.headPatOriginalPosition];
      smoothness = this.options.headPatSmoothness;
    } else {
      // 正常模式：使用Touch_Eye骨骼和常规参数
      if (this.eyeBones.length === 0) return;
      targetBones = this.eyeBones;
      targetOriginalPositions = this.originalPositions;
      smoothness = this.options.smoothness;
    }

    // 使用平滑系数计算当前位置
    // 增强平滑度计算，使高值时效果更明显
    let smoothFactor = smoothness;

    // 应用指数函数增强高值区间的平滑效果
    // 当smoothness接近1时，指数函数会使其效果更加明显
    smoothFactor = Math.pow(smoothFactor, 0.7);

    // 计算新位置：当前位置和目标位置的加权平均
    // 平滑系数越高，当前位置的权重越大，移动越慢
    this.currentX = this.currentX * smoothFactor + this.targetX * (1 - smoothFactor);
    this.currentY = this.currentY * smoothFactor + this.targetY * (1 - smoothFactor);

    // 应用位置到目标骨骼
    for (let i = 0; i < targetBones.length; i++) {
      const bone = targetBones[i];
      const originalPos = targetOriginalPositions[i];

      if (bone && originalPos) {
        // 设置新的位置（原始位置 + 偏移量）
        bone.x = originalPos.x + this.currentX;
        bone.y = originalPos.y + this.currentY;
      }
    }
  }

  /**
   * 重置眼睛位置到原始状态（立即重置，没有动画）
   */
  resetEyePositions() {
    // 重置目标和当前位置
    this.targetX = 0;
    this.targetY = 0;
    this.currentX = 0;
    this.currentY = 0;

    // 标记为已停止状态
    this.isStopped = true;

    // 重置所有眼睛骨骼到原始位置
    this.resetEyeBones();

    // 同时重置摸头骨骼到原始位置
    this.resetHeadPatBone();
  }

  /**
   * 开始平滑过渡
   * 当眼睛从停止状态开始移动时使用，避免突然的跳跃
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
   * 平滑地重置眼睛位置到原始状态（有动画效果）
   */
  smoothlyResetEyePositions() {
    // 只将目标位置设置为原点
    // 当前位置不变，让updateEyePositions中的平滑插值来处理过渡
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
      this.smoothlyResetEyePositions();
    }, this.options.autoResetDelay);
  }

  /**
   * 检测是否处于摸头模式
   * @returns {boolean} 是否处于摸头模式
   */
  isInHeadPatMode() {
    // 检查全局摸头控制器是否存在且正在摸头
    return window.headPatControl && window.headPatControl.isPatting;
  }

  /**
   * 处理模式切换时的骨骼位置重置
   * @param {boolean} previousMode - 之前的模式状态
   * @param {boolean} currentMode - 当前的模式状态
   */
  handleModeSwitch(previousMode, currentMode) {
    if (previousMode && !currentMode) {
      // 从摸头模式切换到正常模式：平滑重置Touch_Point骨骼，确保Touch_Eye骨骼处于原始位置
      this.smoothlyResetHeadPatBone();
      this.resetEyeBones(); // Touch_Eye骨骼立即重置，因为它将开始被使用
      console.log('眼部追踪系统：从摸头模式切换到正常模式，平滑重置Touch_Point骨骼');
    } else if (!previousMode && currentMode) {
      // 从正常模式切换到摸头模式：平滑重置Touch_Eye骨骼，确保Touch_Point骨骼处于原始位置
      this.smoothlyResetEyeBones();
      this.resetHeadPatBone(); // Touch_Point骨骼立即重置，因为它将开始被使用
      console.log('眼部追踪系统：从正常模式切换到摸头模式，平滑重置Touch_Eye骨骼');
    }

    // 重置追踪位置状态，为新模式做准备
    this.targetX = 0;
    this.targetY = 0;
    this.currentX = 0;
    this.currentY = 0;
  }

  /**
   * 重置Touch_Eye骨骼到原始位置
   */
  resetEyeBones() {
    for (let i = 0; i < this.eyeBones.length; i++) {
      const bone = this.eyeBones[i];
      const originalPos = this.originalPositions[i];

      if (bone && originalPos) {
        bone.x = originalPos.x;
        bone.y = originalPos.y;
      }
    }
  }

  /**
   * 重置Touch_Point骨骼到原始位置
   */
  resetHeadPatBone() {
    if (this.headPatBone && this.headPatOriginalPosition) {
      this.headPatBone.x = this.headPatOriginalPosition.x;
      this.headPatBone.y = this.headPatOriginalPosition.y;
    }
  }

  /**
   * 平滑地重置Touch_Eye骨骼到原始位置
   */
  smoothlyResetEyeBones() {
    if (this.eyeBones.length === 0) return;

    // 记录当前骨骼位置
    const currentPositions = [];
    for (let i = 0; i < this.eyeBones.length; i++) {
      const bone = this.eyeBones[i];
      if (bone) {
        currentPositions.push({
          x: bone.x,
          y: bone.y
        });
      }
    }

    // 创建平滑动画
    let animationFrames = 0;
    const maxFrames = 45; // 约0.5秒的动画时间
    const smoothResetAnimation = () => {
      animationFrames++;
      const progress = animationFrames / maxFrames;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // 缓出效果

      // 为每个骨骼插值到原始位置
      for (let i = 0; i < this.eyeBones.length; i++) {
        const bone = this.eyeBones[i];
        const originalPos = this.originalPositions[i];
        const currentPos = currentPositions[i];

        if (bone && originalPos && currentPos) {
          // 线性插值
          bone.x = currentPos.x + (originalPos.x - currentPos.x) * easeProgress;
          bone.y = currentPos.y + (originalPos.y - currentPos.y) * easeProgress;
        }
      }

      // 如果动画未结束，继续下一帧
      if (animationFrames < maxFrames) {
        requestAnimationFrame(smoothResetAnimation);
      } else {
        // 动画结束，确保骨骼精确回到原始位置
        this.resetEyeBones();
      }
    };

    // 开始动画
    requestAnimationFrame(smoothResetAnimation);
  }

  /**
   * 平滑地重置Touch_Point骨骼到原始位置
   */
  smoothlyResetHeadPatBone() {
    if (!this.headPatBone || !this.headPatOriginalPosition) return;

    // 记录当前骨骼位置
    const currentPosition = {
      x: this.headPatBone.x,
      y: this.headPatBone.y
    };

    // 创建平滑动画
    let animationFrames = 0;
    const maxFrames = 30; // 约0.5秒的动画时间
    const smoothResetAnimation = () => {
      animationFrames++;
      const progress = animationFrames / maxFrames;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // 缓出效果

      // 线性插值到原始位置
      this.headPatBone.x = currentPosition.x + (this.headPatOriginalPosition.x - currentPosition.x) * easeProgress;
      this.headPatBone.y = currentPosition.y + (this.headPatOriginalPosition.y - currentPosition.y) * easeProgress;

      // 如果动画未结束，继续下一帧
      if (animationFrames < maxFrames) {
        requestAnimationFrame(smoothResetAnimation);
      } else {
        // 动画结束，确保骨骼精确回到原始位置
        this.resetHeadPatBone();
      }
    };

    // 开始动画
    requestAnimationFrame(smoothResetAnimation);
  }

  /**
   * 开始更新循环
   */
  startUpdateLoop() {
    // 取消之前的动画帧
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // 更新函数
    const update = () => {
      // 检查摸头模式状态变化
      const currentHeadPatMode = this.isInHeadPatMode();
      if (currentHeadPatMode !== this.isHeadPatMode) {
        const previousMode = this.isHeadPatMode;
        this.isHeadPatMode = currentHeadPatMode;

        // 在模式切换时重置骨骼位置
        this.handleModeSwitch(previousMode, this.isHeadPatMode);

        if (this.isHeadPatMode) {
          console.log(`眼部追踪系统：摸头模式启用 - 使用独立参数 (强度:${this.options.headPatIntensity}, 平滑度:${this.options.headPatSmoothness}, 最大距离:${this.options.headPatMaxDistance})`);
        } else {
          console.log(`眼部追踪系统：摸头模式禁用 - 恢复常规参数 (强度:${this.options.intensity}, 平滑度:${this.options.smoothness}, 最大距离:${this.options.maxDistance})`);
        }
      }

      this.updateEyePositions();
      this.animationFrameId = requestAnimationFrame(update);
    };

    // 开始更新循环
    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * 停止更新循环
   */
  stopUpdateLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 设置是否启用眼部追踪
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
    console.log(`眼部追踪系统：强度设置为 ${this.options.intensity}`);
  }

  /**
   * 设置平滑度
   * @param {number} smoothness - 平滑度 (0-1)，值越大移动越平滑
   */
  setSmoothness(smoothness) {
    this.options.smoothness = Math.max(0, Math.min(1, smoothness));
    console.log(`眼部追踪系统：平滑度设置为 ${this.options.smoothness} (值越大移动越平滑)`);
  }

  /**
   * 设置最大距离
   * @param {number} distance - 最大移动距离
   */
  setMaxDistance(distance) {
    this.options.maxDistance = Math.max(0, distance);
    console.log(`眼部追踪系统：最大距离设置为 ${this.options.maxDistance}`);
  }

  /**
   * 设置是否自动重置
   * @param {boolean} autoReset - 是否自动重置
   */
  setAutoReset(autoReset) {
    this.options.autoReset = autoReset;
    console.log(`眼部追踪系统：自动重置${autoReset ? '启用' : '禁用'}`);
  }

  /**
   * 设置自动重置延迟
   * @param {number} delay - 延迟时间（毫秒）
   */
  setAutoResetDelay(delay) {
    this.options.autoResetDelay = Math.max(100, delay);
    console.log(`眼部追踪系统：自动重置延迟设置为 ${this.options.autoResetDelay}ms`);
  }

  /**
   * 设置眼睛骨骼名称
   * @param {Array<string>} names - 骨骼名称数组
   */
  setEyeBoneNames(names) {
    if (Array.isArray(names) && names.length > 0) {
      this.options.eyeBoneNames = names;
      // 重新查找骨骼
      this.findEyeBones();
    }
  }

  /**
   * 设置是否反转X轴
   * @param {boolean} invert - 是否反转
   */
  setInvertX(invert) {
    this.options.invertX = invert;
    console.log(`眼部追踪系统：X轴反转已${invert ? '启用' : '禁用'}`);
  }

  /**
   * 设置是否反转Y轴
   * @param {boolean} invert - 是否反转
   */
  setInvertY(invert) {
    this.options.invertY = invert;
    console.log(`眼部追踪系统：Y轴反转已${invert ? '启用' : '禁用'}`);
  }

  /**
   * 设置是否交换XY轴
   * @param {boolean} swap - 是否交换
   */
  setSwapXY(swap) {
    this.options.swapXY = swap;
    console.log(`眼部追踪系统：XY轴交换已${swap ? '启用' : '禁用'}`);
  }

  /**
   * 设置是否使用特殊修复
   * @param {boolean} use - 是否使用
   */
  setUseSpecialFix(use) {
    this.options.useSpecialFix = use;
    console.log(`眼部追踪系统：特殊修复已${use ? '启用' : '禁用'}`);
  }

  /**
   * 尝试自动修复坐标映射问题
   * 会依次尝试不同的组合，直到找到正确的映射
   */
  autoFixMapping() {
    console.log('眼部追踪系统：开始自动修复坐标映射');

    // 重置所有选项
    this.options.invertX = false;
    this.options.invertY = false;
    this.options.swapXY = false;
    this.options.useSpecialFix = false;

    // 针对眼睛竖着的模型，尝试多种修复方案
    console.log('眼部追踪系统：检测到可能是眼睛方向异常的模型，尝试修复方案...');

    // 方案1：交换XY轴 + 反转Y轴（适用于眼睛竖着且方向相反的情况）
    this.options.swapXY = true;
    this.options.invertY = true;
    console.log('眼部追踪系统：已应用修复方案1 - 交换XY轴并反转Y轴');
    console.log('如果眼睛移动仍不正确，请尝试手动调整其他选项：');
    console.log('- 如果左右相反，启用"反转X轴"');
    console.log('- 如果上下相反，禁用"反转Y轴"');
    console.log('- 如果方向完全错误，尝试启用"特殊修复"');
  }

  /**
   * 设置摸头模式的追踪强度
   * @param {number} intensity - 追踪强度 (1-10)
   */
  setHeadPatIntensity(intensity) {
    this.options.headPatIntensity = Math.max(0, Math.min(10, intensity));
    console.log(`眼部追踪系统：摸头模式强度设置为 ${this.options.headPatIntensity}`);
  }

  /**
   * 设置摸头模式的平滑度
   * @param {number} smoothness - 平滑度 (0-1)，值越大移动越平滑
   */
  setHeadPatSmoothness(smoothness) {
    this.options.headPatSmoothness = Math.max(0, Math.min(1, smoothness));
    console.log(`眼部追踪系统：摸头模式平滑度设置为 ${this.options.headPatSmoothness}`);
  }

  /**
   * 设置摸头模式的最大距离
   * @param {number} distance - 最大移动距离
   */
  setHeadPatMaxDistance(distance) {
    this.options.headPatMaxDistance = Math.max(0, distance);
    console.log(`眼部追踪系统：摸头模式最大距离设置为 ${this.options.headPatMaxDistance}`);
  }

  /**
   * 设置摸头模式使用的骨骼名称
   * @param {string} boneName - 骨骼名称
   */
  setHeadPatBoneName(boneName) {
    this.options.headPatBoneName = boneName;
    // 重新查找骨骼
    this.findEyeBones();
    console.log(`眼部追踪系统：摸头模式骨骼设置为 ${boneName}`);
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

    // 重置状态
    this.eyeBones = [];
    this.originalPositions = [];
    this.headPatBone = null;
    this.headPatOriginalPosition = null;

    console.log('眼部追踪系统：已清理');
  }
}

// 将类导出为全局变量
window.EyeTracking = EyeTracking;