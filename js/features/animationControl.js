/**
 * animationControl.js - 动画控制模块
 * 用于控制Spine模型的动画播放，包括开场动画的处理
 */

class AnimationControl {
  /**
   * 构造函数
   * @param {Object} app - App实例，用于获取spine动画
   * @param {Object} options - 配置选项
   */
  constructor(app, options = {}) {
    // 保存app引用
    this.app = app;
    
    // 默认设置
    this.options = {
      enabled: true,                // 是否启用动画控制
      playIntroAnimation: true,     // 是否播放开场动画
      introAnimationName: 'Start_Idle_01', // 开场动画名称
      idleAnimationName: 'Idle_01', // 默认闲置动画名称（主动画）
      idleAnimationNames: ['Idle_01', 'Idle_01_R'], // 待机动画列表
      trackIndex: 0,                // 主动画轨道索引
      ...options                    // 合并用户配置
    };
    
    // 从全局设置控制器获取开场动画设置，如果存在的话
    if (window.settingsControl && window.settingsControl.settings) {
      const settings = window.settingsControl.settings;
      this.options.playIntroAnimation = settings.introAnimation;
      console.log('动画控制：从全局设置获取开场动画设置', this.options.playIntroAnimation);
    }
    
    // 状态变量
    this.currentAnimation = '';     // 当前播放的动画名称
    this.hasPlayedIntro = false;    // 是否已经播放过开场动画
    this.introAnimationComplete = false; // 开场动画是否已经完成
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化动画控制
   */
  init() {
    console.log('初始化动画控制系统...');
    
    // 将实例保存为全局变量，方便其他模块访问
    window.animationControl = this;
    
    // 检查当前模型是否已加载
    this.checkModelAndPlayAnimation();
    
    // 监听模型加载事件
    document.addEventListener('modelLoaded', () => {
      console.log('检测到模型加载完成，准备播放动画');
      // 重置开场动画完成状态
      this.introAnimationComplete = false;
      this.checkModelAndPlayAnimation();
    });
  }
  
  /**
   * 检查模型是否已加载，并播放相应动画
   */
  checkModelAndPlayAnimation() {
    if (!this.app || !this.app.currentModel) {
      console.log('模型尚未加载，无法播放动画');
      return;
    }
    
    // 重置状态
    this.hasPlayedIntro = false;
    
    // 根据设置播放相应动画
    this.playAppropriateAnimation();
  }
  
  /**
   * 根据设置播放适当的动画
   */
  playAppropriateAnimation() {
    if (!this.app || !this.app.currentModel) return;
    
    // 如果启用了开场动画且还没播放过，先播放开场动画
    if (this.options.playIntroAnimation && !this.hasPlayedIntro) {
      this.playIntroAnimation();
    } else {
      // 否则直接播放闲置动画
      this.playIdleAnimation();
      
      // 如果直接播放闲置动画，即跳过开场动画，则标记开场动画已完成
      if (!this.introAnimationComplete) {
        this.onIntroAnimationComplete();
      }
    }
  }
  
  /**
   * 播放开场动画
   */
  playIntroAnimation() {
    if (!this.app || !this.app.currentModel) return;

    const model = this.app.currentModel;
    const introAnimName = this.options.introAnimationName;

    // 检查动画是否存在
    if (!this.checkAnimationExists(introAnimName)) {
      console.warn(`开场动画 ${introAnimName} 不存在，直接播放闲置动画`);
      this.playIdleAnimation();
      this.onIntroAnimationComplete();
      return;
    }

    console.log(`播放开场动画: ${introAnimName} (轨道 ${this.options.trackIndex})`);

    try {
      // 设置动画完成监听器
      this.setupAnimationCompleteListener(model);

      // 设置开场动画，不循环播放
      model.state.setAnimation(this.options.trackIndex, introAnimName, false);

      console.log(`开场动画 ${introAnimName} 已开始播放，完成后将自动播放待机动画`);

      this.currentAnimation = introAnimName;
      this.hasPlayedIntro = true;
    } catch (error) {
      console.error(`播放开场动画失败: ${error.message}`);
      // 出错时直接播放闲置动画
      this.playIdleAnimation();
      this.onIntroAnimationComplete();
    }
  }
  
  /**
   * 设置动画完成事件监听器
   * @param {Object} model - Spine模型实例
   */
  setupAnimationCompleteListener(model) {
    // 清除现有的监听器以避免重复
    if (model.state.listeners) {
      model.state.clearListeners();
    }
    
    // 添加新的监听器
    model.state.addListener({
      complete: (entry) => {
        // 检查是否是开场动画轨道
        if (entry.trackIndex === this.options.trackIndex && 
            entry.animation.name === this.options.introAnimationName) {
          console.log('开场动画播放完成');
          this.onIntroAnimationComplete();
        }
      }
    });
  }
  
  /**
   * 开场动画完成后触发的方法
   */
  onIntroAnimationComplete() {
    if (this.introAnimationComplete) return; // 防止重复触发

    this.introAnimationComplete = true;
    console.log('开场动画已完成，开始播放待机动画');

    // 播放待机动画
    this.playIdleAnimation();

    // 触发自定义事件，通知其他模块开场动画已完成
    const event = new CustomEvent('introAnimationComplete');
    document.dispatchEvent(event);
  }
  
  /**
   * 播放闲置动画
   */
  playIdleAnimation() {
    if (!this.app || !this.app.currentModel) return;

    const model = this.app.currentModel;
    const idleAnimNames = this.options.idleAnimationNames;

    // 尝试播放多个待机动画
    let playedCount = 0;
    let playedAnimations = [];

    for (let i = 0; i < idleAnimNames.length; i++) {
      const animName = idleAnimNames[i];
      const trackIndex = i; // 每个动画使用不同的轨道

      // 检查动画是否存在
      if (this.checkAnimationExists(animName)) {
        try {
          console.log(`播放待机动画: ${animName} (轨道 ${trackIndex})`);
          model.state.setAnimation(trackIndex, animName, true);
          playedAnimations.push(animName);
          playedCount++;
        } catch (error) {
          console.error(`播放待机动画 ${animName} 失败: ${error.message}`);
        }
      } else {
        console.warn(`待机动画 ${animName} 不存在，跳过`);
      }
    }

    if (playedCount > 0) {
      // 设置主动画为当前动画
      this.currentAnimation = playedAnimations[0];
      console.log(`成功播放 ${playedCount} 个待机动画: ${playedAnimations.join(', ')}`);
    } else {
      console.warn('没有可用的待机动画，尝试播放其他可用动画');
      this.playFirstAvailableAnimation();
    }
  }
  
  /**
   * 检查动画是否存在（简化版本）
   * @param {string} animName - 动画名称
   * @returns {boolean} 动画是否存在
   */
  checkAnimationExists(animName) {
    if (!this.app || !this.app.currentModel) return false;

    try {
      // 直接尝试获取动画，如果不存在会返回null
      const model = this.app.currentModel;
      if (model.skeleton && model.skeleton.data) {
        return model.skeleton.data.findAnimation(animName) !== null;
      }
      return false;
    } catch (error) {
      // 如果findAnimation方法不存在，回退到原始方法
      const model = this.app.currentModel;
      let animations = [];
      if (model.spineData && model.spineData.animations) {
        animations = model.spineData.animations;
      } else if (model.skeleton && model.skeleton.data && model.skeleton.data.animations) {
        animations = model.skeleton.data.animations;
      }
      return animations.some(anim => (anim.name || anim) === animName);
    }
  }
  
  /**
   * 播放第一个可用的动画（使用SpineLoader的逻辑）
   */
  playFirstAvailableAnimation() {
    if (!this.app || !this.app.currentModel) return;

    // 使用SpineLoader的自动检测逻辑，避免重复代码
    if (window.spineLoader) {
      window.spineLoader.autoDetectAndPlayAnimation(this.app.currentModel, true);
      // 更新当前动画状态
      this.updateCurrentAnimationState();
    } else {
      console.error('SpineLoader不可用，无法播放动画');
    }
  }

  /**
   * 更新当前动画状态
   */
  updateCurrentAnimationState() {
    if (!this.app || !this.app.currentModel) return;

    try {
      const currentTrack = this.app.currentModel.state.tracks[0];
      if (currentTrack && currentTrack.animation) {
        this.currentAnimation = currentTrack.animation.name;
        this.isPlaying = true;
      }
    } catch (error) {
      console.warn('无法获取当前动画状态:', error);
    }
  }
  
  /**
   * 设置是否播放开场动画
   * @param {boolean} enabled - 是否启用
   */
  setPlayIntroAnimation(enabled) {
    this.options.playIntroAnimation = enabled;
    console.log(`开场动画已${enabled ? '启用' : '禁用'}`);
    
    // 如果禁用开场动画且当前正在播放开场动画，直接切换到闲置动画
    if (!enabled && this.currentAnimation === this.options.introAnimationName) {
      this.playIdleAnimation();
      this.onIntroAnimationComplete();
    }
  }
  
  /**
   * 播放指定动画
   * @param {string} animName - 动画名称
   * @param {boolean} loop - 是否循环播放
   * @param {number} trackIndex - 动画轨道索引，默认为 0
   */
  playAnimation(animName, loop = true, trackIndex = 0) {
    if (!this.app || !this.app.currentModel) return;
    
    // 检查动画是否存在
    if (!this.checkAnimationExists(animName)) {
      console.warn(`动画 ${animName} 不存在`);
      return;
    }
    
    console.log(`播放动画: ${animName}, 循环: ${loop}, 轨道: ${trackIndex}`);
    
    try {
      this.app.currentModel.state.setAnimation(trackIndex, animName, loop);
      this.currentAnimation = animName;
    } catch (error) {
      console.error(`播放动画失败: ${error.message}`);
    }
  }
  
  /**
   * 添加动画到队列
   * @param {string} animName - 动画名称
   * @param {boolean} loop - 是否循环播放
   * @param {number} delay - 延迟时间（秒）
   * @param {number} trackIndex - 动画轨道索引，默认为 0
   */
  addAnimation(animName, loop = true, delay = 0, trackIndex = 0) {
    if (!this.app || !this.app.currentModel) return;
    
    // 检查动画是否存在
    if (!this.checkAnimationExists(animName)) {
      console.warn(`动画 ${animName} 不存在`);
      return;
    }
    
    console.log(`添加动画到队列: ${animName}, 循环: ${loop}, 延迟: ${delay}秒, 轨道: ${trackIndex}`);
    
    try {
      this.app.currentModel.state.addAnimation(trackIndex, animName, loop, delay);
    } catch (error) {
      console.error(`添加动画到队列失败: ${error.message}`);
    }
  }
  
  /**
   * 获取开场动画是否已完成
   * @returns {boolean} 开场动画是否已完成
   */
  isIntroAnimationComplete() {
    return this.introAnimationComplete;
  }

  /**
   * 获取待机动画名称列表
   * @returns {Array} 待机动画名称数组
   */
  getIdleAnimationNames() {
    return [...this.options.idleAnimationNames];
  }

  /**
   * 设置待机动画名称列表
   * @param {Array} animationNames - 动画名称数组
   */
  setIdleAnimationNames(animationNames) {
    if (Array.isArray(animationNames)) {
      this.options.idleAnimationNames = [...animationNames];
      console.log(`更新待机动画列表: ${this.options.idleAnimationNames.join(', ')}`);

      // 如果当前正在播放待机动画，重新播放
      if (this.introAnimationComplete) {
        console.log('重新播放待机动画以应用新的配置');
        this.playIdleAnimation();
      }
    } else {
      console.warn('setIdleAnimationNames: 参数必须是数组');
    }
  }

  /**
   * 检查指定动画是否在播放
   * @param {string} animationName - 动画名称
   * @returns {boolean} 是否在播放
   */
  isAnimationPlaying(animationName) {
    if (!this.app || !this.app.currentModel) return false;

    try {
      const animationState = this.app.currentModel.state;
      if (animationState && animationState.tracks) {
        for (let i = 0; i < animationState.tracks.length; i++) {
          const track = animationState.tracks[i];
          if (track && track.animation && track.animation.name === animationName) {
            return true;
          }
        }
      }
    } catch (error) {
      console.error('检查动画播放状态时出错:', error);
    }

    return false;
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    // 清除模型上的动画完成监听器
    if (this.app && this.app.currentModel && this.app.currentModel.state) {
      this.app.currentModel.state.clearListeners();
    }

    // 清理全局引用
    if (window.animationControl === this) {
      window.animationControl = null;
    }

    console.log('动画控制系统已清理');
  }
}

// 将类导出为全局变量
window.AnimationControl = AnimationControl; 