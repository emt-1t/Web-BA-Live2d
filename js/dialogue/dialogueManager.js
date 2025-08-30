/**
 * dialogueManager.js - 对话管理器
 * 负责管理对话系统，包括动画播放和音频播放
 */

class DialogueManager {
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
      enabled: true,              // 是否启用对话功能
      enabledDialogueCount: 5,   // 启用的对话数量（1-10），如设置5则启用对话1-5
      soundDelay: 0.5,           // 音频延迟播放时间（秒）
      soundVolume: 1.0,          // 音频音量
      soundBasePath: 'sound/memorial_lobby/', // 音频文件基础路径
      // 动画设置
      dialogueAnimA: 'Talk_01_A', // 对话动画A
      dialogueAnimASpeed: 1.0,    // 对话动画A的速率
      dialogueAnimM: 'Talk_01_M', // 对话动画M
      dialogueAnimMSpeed: 1.0,    // 对话动画M的速率
      // 轨道设置
      dialogueTrackA: 3,          // 对话动画A的轨道
      dialogueTrackM: 4,          // 对话动画M的轨道
      ...options                  // 合并用户配置
    };

    // 对话数据 - 10个对话模板
    // soundFiles: 音频文件数组，按顺序播放
    // soundDelays: 音频延迟时间数组
    //   - 对于单个音频：soundDelays[0] 表示该音频的播放延迟时间（如果为空则使用全局设置）
    //   - 对于多个音频：soundDelays[0] 表示第一个音频的延迟，soundDelays[1] 表示第一个音频播放完后到第二个音频的间隔，以此类推
    // 没填的字段代表没有对应内容
    this.dialogues = {
      1: {
        id: 1,
        animA: 'Talk_01_A',
        animM: 'Talk_01_M',
        soundFiles: ['MemorialLobby_1_1.ogg', 'MemorialLobby_1_2.ogg'],
        soundDelays: [1.5, 1.5]  // 单个音频延迟1秒播放
      },
      2: {
        id: 2,
        animA: 'Talk_02_A',
        animM: 'Talk_02_M',
        soundFiles: ['MemorialLobby_2_1.ogg', 'MemorialLobby_2_2.ogg'],
        soundDelays: [1.5, 1.0]  // 第一条延迟0.5秒播放，播放完后等待3秒再播放第二条
      },
      3: {
        id: 3,
        animA: 'Talk_03_A',
        animM: 'Talk_03_M',
        soundFiles: ['MemorialLobby_3_1.ogg', 'MemorialLobby_3_2.ogg'],
        soundDelays: [1.5, 1.5]  // 第一条延迟0.8秒播放，播放完后等待2秒再播放第二条
      },
      4: {
        id: 4,
        animA: 'Talk_04_A',
        animM: 'Talk_04_M',
        soundFiles: ['MemorialLobby_4_1.ogg', 'MemorialLobby_4_2.ogg'],
        soundDelays: [1.0, 1.0]  // 第一条延迟0.3秒→等1秒→第二条→等1.5秒→第三条
      },
      5: {
        id: 5,
        animA: 'Talk_05_A',
        animM: 'Talk_05_M',
        soundFiles: ['MemorialLobby_5_1.ogg', 'MemorialLobby_5_2.ogg', 'MemorialLobby_5_3.ogg'],
        soundDelays: [0.5, 1.0, 1.0]  // 第一条延迟1.2秒播放，播放完后等待2.5秒再播放第二条
      },
      6: {
        id: 6,
        animA: 'Talk_06_A',
        animM: 'Talk_06_M',
        soundFiles: ['MemorialLobby_6-1.ogg'],  // 单个音频，使用自定义延迟
        soundDelays: [2.0]  // 延迟2秒播放
      },
      7: {
        id: 7,
        animA: 'Talk_07_A',
        animM: 'Talk_07_M',
        soundFiles: ['MemorialLobby_7-1.ogg'],  // 单个音频，使用全局延迟
        soundDelays: []  // 空数组表示使用全局设置的延迟时间
      },
      8: {
        id: 8,
        animA: 'Talk_08_A',
        animM: 'Talk_08_M',
        soundFiles: [],  // 没有语音文件
        soundDelays: []
      },
      9: {
        id: 9,
        animA: 'Talk_09_A',
        animM: 'Talk_09_M',
        soundFiles: [],  // 没有语音文件
        soundDelays: []
      },
      10: {
        id: 10,
        animA: 'Talk_10_A',
        animM: 'Talk_10_M',
        soundFiles: [],  // 没有语音文件
        soundDelays: []
      }
    };

    // 状态变量
    this.currentDialogue = null;   // 当前播放的对话
    this.isPlaying = false;        // 是否正在播放对话
    this.audioElements = [];       // 当前音频元素数组
    this.soundTimers = [];         // 音频延迟定时器数组
    this.currentDialogueIndex = 1; // 当前对话索引（1-10循环）
    this.trackClearTimer = null;   // 轨道清除定时器
    this.trackClearDelay = 3.0;    // 轨道清除延迟时间（秒）

    // 文本显示管理器
    this.textDisplayManager = null;

    // 初始化
    this.init();
  }

  /**
   * 初始化对话管理器
   */
  async init() {
    console.log('初始化对话管理器...');

    // 将实例保存为全局变量，方便其他模块访问
    window.dialogueManager = this;

    // 初始化文本显示管理器
    await this.initTextDisplayManager();

    // 从设置系统同步对话功能状态
    this.syncFromSettings();

    // 监听设置变化
    this.setupSettingsListener();

    // 新增：监听Wallpaper Engine的静音事件
    this.setupMuteListener();

    console.log('对话管理器初始化完成');
  }

  /**
   * 初始化文本显示管理器
   */
  async initTextDisplayManager() {
    try {
      // 检查TextDisplayManager类是否可用
      if (typeof window.TextDisplayManager === 'function') {
        this.textDisplayManager = new window.TextDisplayManager({
          enabled: true,
          language: 'chinese', // 默认中文
          displayDuration: 0,  // 不自动隐藏，由音频播放控制
          position: 'bottom'
        });
        console.log('文本显示管理器初始化成功');
      } else {
        console.warn('TextDisplayManager类未找到，文本显示功能将不可用');
      }
    } catch (error) {
      console.error('初始化文本显示管理器失败:', error);
    }
  }

  /**
   * 从设置系统同步对话功能状态
   */
  syncFromSettings() {
    try {
      if (window.settingsControl && window.settingsControl.settingsCore) {
        const dialogueEnabled = window.settingsControl.settingsCore.getSetting('dialogueEnabled');
        if (dialogueEnabled !== undefined) {
          this.setEnabled(dialogueEnabled);
          console.log(`从设置同步对话功能状态: ${dialogueEnabled ? '启用' : '禁用'}`);
        }

        const dialogueSoundVolume = window.settingsControl.settingsCore.getSetting('dialogueSoundVolume');
        if (dialogueSoundVolume !== undefined) {
          this.setVolume(dialogueSoundVolume);
          console.log(`从设置同步对话音效音量: ${dialogueSoundVolume}`);
        }
      }
    } catch (error) {
      console.error('同步设置失败:', error);
    }
  }

  /**
   * 设置监听器，响应设置变化
   */
  setupSettingsListener() {
    // 监听设置变化事件
    document.addEventListener('settingChanged', (event) => {
      const { key, value } = event.detail;

      if (key === 'dialogueEnabled') {
        this.setEnabled(value);
        console.log(`对话功能设置已更新: ${value ? '启用' : '禁用'}`);
      } else if (key === 'dialogueSoundVolume') {
        this.setVolume(value);
        console.log(`对话音效音量设置已更新: ${value}`);
      } else if (key === 'textDisplayEnabled') {
        if (this.textDisplayManager) {
          this.textDisplayManager.setEnabled(value);
        }
      } else if (key === 'textDisplayLanguage') {
        if (this.textDisplayManager) {
          this.textDisplayManager.setLanguage(value);
        }
      } else if (key === 'textDisplayX') {
        if (this.textDisplayManager) {
          // 通过设置事件触发时显示预览，让用户看到调整效果
          this.textDisplayManager.setPositionX(value, true);
        }
      } else if (key === 'textDisplayY') {
        if (this.textDisplayManager) {
          // 通过设置事件触发时显示预览，让用户看到调整效果
          this.textDisplayManager.setPositionY(value, true);
        }
      } else if (key === 'textDisplayOpacity') {
        if (this.textDisplayManager) {
          // 通过设置事件触发时显示预览，让用户看到调整效果
          this.textDisplayManager.setOpacity(value, true);
        }
      }
    });
  }

  /**
   * 新增：设置监听器，响应Wallpaper Engine的静音事件
   */
  setupMuteListener() {
    if (window.wallpaperEngineAPI) {
      window.wallpaperEngineAPI.on('muteChange', (muted) => {
        console.log(`对话管理器收到静音状态变化: ${muted}`);
        if (muted) {
          // 备份当前音量并静音
          this.savedVolume = this.options.soundVolume;
          this.setVolume(0);
        } else {
          // 恢复之前的音量
          this.setVolume(this.savedVolume !== undefined ? this.savedVolume : 1.0);
        }
      });
    }
  }

  /**
   * 播放下一个对话（按顺序循环，范围由enabledDialogueCount决定）
   */
  playNextDialogue() {
    if (!this.options.enabled) {
      console.log('对话功能已禁用');
      return;
    }

    // 检查开场动画是否已完成
    if (window.animationControl && !window.animationControl.isIntroAnimationComplete()) {
      console.log('开场动画尚未完成，对话功能暂不可用');
      return;
    }

    if (this.isPlaying) {
      console.log('对话正在播放中，跳过新的对话请求');
      return;
    }

    // 确保启用的对话数量在有效范围内
    const maxDialogues = Math.max(1, Math.min(10, this.options.enabledDialogueCount));

    // 播放当前索引的对话
    this.playDialogue(this.currentDialogueIndex);

    // 更新索引，在启用范围内循环
    this.currentDialogueIndex++;
    if (this.currentDialogueIndex > maxDialogues) {
      this.currentDialogueIndex = 1;
    }

    console.log(`下次将播放对话 ${this.currentDialogueIndex} (启用范围: 1-${maxDialogues})`);
  }

  /**
   * 播放指定对话
   * @param {number} dialogueId - 对话ID
   */
  playDialogue(dialogueId) {
    if (!this.options.enabled) {
      console.log('对话功能已禁用');
      return;
    }

    // 检查开场动画是否已完成
    if (window.animationControl && !window.animationControl.isIntroAnimationComplete()) {
      console.log('开场动画尚未完成，对话功能暂不可用');
      return;
    }

    if (this.isPlaying) {
      console.log('对话正在播放中，跳过新的对话请求');
      return;
    }

    const dialogue = this.dialogues[dialogueId];
    if (!dialogue) {
      console.warn(`对话ID ${dialogueId} 不存在`);
      return;
    }

    // 取消之前的轨道清除定时器（如果有新对话开始）
    if (this.trackClearTimer) {
      clearTimeout(this.trackClearTimer);
      this.trackClearTimer = null;
      console.log('新对话开始，取消轨道清除定时器');
    }

    const soundInfo = dialogue.soundFiles && dialogue.soundFiles.length > 0
      ? dialogue.soundFiles.join(', ')
      : '无语音';
    console.log(`开始播放对话 ${dialogueId}: ${soundInfo}`);
    this.currentDialogue = dialogue;
    this.isPlaying = true;

    // 播放动画
    this.playDialogueAnimation(dialogue);

    // 延迟播放音频
    this.playDialogueSound(dialogue);
  }

  /**
   * 播放对话动画
   * @param {Object} dialogue - 对话数据
   */
  playDialogueAnimation(dialogue) {
    if (!this.app || !this.app.currentModel || !this.app.currentModel.state) {
      console.error("无法播放对话动画：模型或状态不可用");
      return;
    }

    const animA = dialogue.animA || this.options.dialogueAnimA;
    const animM = dialogue.animM || this.options.dialogueAnimM;
    const trackA = this.options.dialogueTrackA;
    const trackM = this.options.dialogueTrackM;
    const speedA = this.options.dialogueAnimASpeed;
    const speedM = this.options.dialogueAnimMSpeed;

    try {
      // 同时播放两个动画，分别在不同轨道

      // 先检查并播放动画 A
      if (this.checkAnimationExists(animA)) {
        const trackEntryA = this.app.currentModel.state.setAnimation(trackA, animA, false);
        trackEntryA.timeScale = speedA;
        console.log(`播放对话动画 A: ${animA} (轨道 ${trackA}, 速度 ${speedA})`);

        // 监听动画A结束事件
        trackEntryA.listener = {
          complete: () => {
            console.log(`对话动画 A: ${animA} 播放完成`);
            this.onAnimationComplete();
          }
        };
      } else {
        console.warn(`对话动画 A: ${animA} 不存在`);
      }

      // 然后检查并播放动画 M
      if (this.checkAnimationExists(animM)) {
        const trackEntryM = this.app.currentModel.state.setAnimation(trackM, animM, false);
        trackEntryM.timeScale = speedM;
        console.log(`播放对话动画 M: ${animM} (轨道 ${trackM}, 速度 ${speedM})`);
      } else {
        console.warn(`对话动画 M: ${animM} 不存在`);
      }

    } catch (error) {
      console.error(`播放对话动画失败: ${error.message}`);
    }
  }

  /**
   * 播放对话音频
   * @param {Object} dialogue - 对话数据
   */
  playDialogueSound(dialogue) {
    // 检查对话功能是否启用（包含音效）
    if (!this.options.enabled) {
      console.log('对话功能已禁用，跳过音频播放');
      this.onSoundComplete(); // 对话功能禁用时直接标记完成
      return;
    }

    if (!dialogue.soundFiles || dialogue.soundFiles.length === 0) {
      console.log('该对话没有音频文件');
      this.onSoundComplete(); // 没有音频时直接标记完成
      return;
    }

    // 停止之前的音频（如果存在）
    this.stopCurrentSound();

    // 按顺序播放音频文件
    this.playAudioSequence(dialogue.soundFiles, dialogue.soundDelays, 0);
  }

  /**
   * 按顺序播放音频序列
   * @param {Array} soundFiles - 音频文件数组
   * @param {Array} soundDelays - 延迟时间数组
   * @param {number} index - 当前播放的音频索引
   */
  playAudioSequence(soundFiles, soundDelays, index) {
    if (index >= soundFiles.length) {
      // 所有音频播放完成
      this.onSoundComplete();
      return;
    }

    const soundFile = soundFiles[index];
    const soundPath = this.options.soundBasePath + soundFile;
    const isFirstAudio = index === 0;

    // 延迟逻辑：
    // - 第一个音频：优先使用 soundDelays[0]，如果没有则使用全局设置 soundDelay
    // - 后续音频：使用 soundDelays[index] 作为与前一个音频的间隔时间
    let delay;
    if (isFirstAudio) {
      delay = (soundDelays && soundDelays.length > 0 && soundDelays[0] !== undefined)
        ? soundDelays[0]
        : this.options.soundDelay;
    } else {
      delay = (soundDelays && soundDelays[index] !== undefined) ? soundDelays[index] : 0;
    }

    console.log(`将在 ${delay} 秒后播放音频 ${index + 1}/${soundFiles.length}: ${soundPath}`);

    // 设置延迟播放音频
    const timer = setTimeout(() => {
      try {
        // 创建新的音频元素
        const audioElement = new Audio(soundPath);
        audioElement.volume = this.options.soundVolume;

        // 注册到Wallpaper Engine音频系统
        this.registerAudioToWallpaperEngine(audioElement, soundPath);

        // 添加到音频元素数组
        this.audioElements.push(audioElement);

        // 设置音频事件监听器
        audioElement.addEventListener('loadeddata', () => {
          console.log(`音频加载完成: ${soundPath}`);
        });

        audioElement.addEventListener('play', () => {
          console.log(`开始播放音频 ${index + 1}/${soundFiles.length}: ${soundPath}`);
          // 显示对应的文本
          this.showDialogueText(soundFile);
        });

        audioElement.addEventListener('ended', () => {
          console.log(`音频播放完成: ${soundPath}`);
          // 隐藏文本显示
          this.hideDialogueText();
          // 从数组中移除已完成的音频
          const audioIndex = this.audioElements.indexOf(audioElement);
          if (audioIndex > -1) {
            this.audioElements.splice(audioIndex, 1);
          }
          // 播放下一个音频
          this.playAudioSequence(soundFiles, soundDelays, index + 1);
        });

        audioElement.addEventListener('error', (e) => {
          console.error(`音频播放错误: ${soundPath}`, e);
          // 从数组中移除出错的音频
          const audioIndex = this.audioElements.indexOf(audioElement);
          if (audioIndex > -1) {
            this.audioElements.splice(audioIndex, 1);
          }
          // 继续播放下一个音频
          this.playAudioSequence(soundFiles, soundDelays, index + 1);
        });

        // 播放音频
        audioElement.play().catch(error => {
          console.error(`播放音频失败: ${soundPath}`, error);
          // 从数组中移除失败的音频
          const audioIndex = this.audioElements.indexOf(audioElement);
          if (audioIndex > -1) {
            this.audioElements.splice(audioIndex, 1);
          }
          // 继续播放下一个音频
          this.playAudioSequence(soundFiles, soundDelays, index + 1);
        });

      } catch (error) {
        console.error(`创建音频失败: ${soundPath}`, error);
        // 继续播放下一个音频
        this.playAudioSequence(soundFiles, soundDelays, index + 1);
      }
    }, delay * 1000);

    // 添加到定时器数组
    this.soundTimers.push(timer);
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
   * 动画播放完成回调
   */
  onAnimationComplete() {
    console.log('对话动画播放完成');
    // 这里可以添加动画完成后的逻辑
  }

  /**
   * 音频播放完成回调
   */
  onSoundComplete() {
    console.log('对话音频序列播放完成');
    this.checkDialogueComplete();
  }

  /**
   * 检查对话是否完全结束
   */
  checkDialogueComplete() {
    // 如果音频已经播放完成，标记对话结束
    if (this.audioElements.length === 0) {
      this.isPlaying = false;
      this.currentDialogue = null;
      console.log('对话完全结束');

      // 启动轨道清除定时器
      this.scheduleTrackClear();
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

    console.log(`设置对话轨道清除定时器，${this.trackClearDelay}秒后清除对话动画轨道`);

    // 设置新的轨道清除定时器
    this.trackClearTimer = setTimeout(() => {
      this.clearDialogueTracks();
      this.trackClearTimer = null;
    }, this.trackClearDelay * 1000);
  }

  /**
   * 清除对话动画轨道
   */
  clearDialogueTracks() {
    if (!this.app || !this.app.currentModel || !this.app.currentModel.state) {
      console.warn('无法清除对话轨道：模型或状态不可用');
      return;
    }

    try {
      // 清除对话动画轨道
      this.app.currentModel.state.addEmptyAnimation(this.options.dialogueTrackA, 0.3, 0);
      this.app.currentModel.state.addEmptyAnimation(this.options.dialogueTrackM, 0.3, 0);

      console.log(`对话动画轨道已清除 (轨道 ${this.options.dialogueTrackA}, ${this.options.dialogueTrackM})`);
    } catch (error) {
      console.error(`清除对话轨道失败: ${error.message}`);
    }
  }

  /**
   * 显示对话文本
   * @param {string} audioFile - 音频文件名
   */
  showDialogueText(audioFile) {
    if (!this.textDisplayManager || !this.currentDialogue) {
      return;
    }

    // 根据当前对话ID和音频文件显示文本
    const dialogueId = `MemorialLobby_${this.currentDialogue.id}`;
    this.textDisplayManager.showText(dialogueId, audioFile);
  }

  /**
   * 隐藏对话文本
   */
  hideDialogueText() {
    if (this.textDisplayManager) {
      this.textDisplayManager.hideText();
    }
  }

  /**
   * 停止当前音频
   */
  stopCurrentSound() {
    // 隐藏文本显示
    this.hideDialogueText();

    // 停止所有音频元素
    this.audioElements.forEach(audioElement => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    });
    this.audioElements = [];

    // 清除所有定时器
    this.soundTimers.forEach(timer => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    this.soundTimers = [];
  }

  /**
   * 停止当前对话
   */
  stopCurrentDialogue() {
    if (!this.isPlaying) return;

    console.log('停止当前对话');

    // 清除轨道清除定时器
    if (this.trackClearTimer) {
      clearTimeout(this.trackClearTimer);
      this.trackClearTimer = null;
    }

    // 停止音频
    this.stopCurrentSound();

    // 清除动画轨道
    if (this.app && this.app.currentModel && this.app.currentModel.state) {
      this.app.currentModel.state.addEmptyAnimation(this.options.dialogueTrackA, 0, 0);
      this.app.currentModel.state.addEmptyAnimation(this.options.dialogueTrackM, 0, 0);
    }

    // 重置状态
    this.isPlaying = false;
    this.currentDialogue = null;
  }

  /**
   * 重置对话索引到指定位置
   * @param {number} index - 对话索引 (1-启用数量)
   */
  resetDialogueIndex(index = 1) {
    const maxDialogues = Math.max(1, Math.min(10, this.options.enabledDialogueCount));
    if (index >= 1 && index <= maxDialogues) {
      this.currentDialogueIndex = index;
      console.log(`对话索引已重置为: ${this.currentDialogueIndex} (启用范围: 1-${maxDialogues})`);
    } else {
      console.warn(`对话索引必须在1-${maxDialogues}之间 (当前启用${maxDialogues}个对话)`);
    }
  }

  /**
   * 获取当前对话索引
   * @returns {number} 当前对话索引
   */
  getCurrentDialogueIndex() {
    return this.currentDialogueIndex;
  }

  /**
   * 设置启用的对话数量
   * @param {number} count - 启用的对话数量 (1-10)
   */
  setEnabledDialogueCount(count) {
    const newCount = Math.max(1, Math.min(10, count));
    this.options.enabledDialogueCount = newCount;

    // 如果当前索引超出新的范围，重置到1
    if (this.currentDialogueIndex > newCount) {
      this.currentDialogueIndex = 1;
    }

    console.log(`已设置启用对话数量为: ${newCount} (对话1-${newCount})`);
    console.log(`当前对话索引: ${this.currentDialogueIndex}`);
  }

  /**
   * 获取启用的对话数量
   * @returns {number} 启用的对话数量
   */
  getEnabledDialogueCount() {
    return this.options.enabledDialogueCount;
  }

  /**
   * 获取对话列表信息
   * @param {boolean} onlyEnabled - 是否只返回启用的对话
   * @returns {Array} 对话列表
   */
  getDialogueList(onlyEnabled = true) {
    const allDialogues = Object.values(this.dialogues).map(dialogue => ({
      id: dialogue.id,
      soundFiles: dialogue.soundFiles,
      animA: dialogue.animA,
      animM: dialogue.animM,
      soundDelays: dialogue.soundDelays,
      enabled: dialogue.id <= this.options.enabledDialogueCount
    }));

    if (onlyEnabled) {
      return allDialogues.filter(dialogue => dialogue.enabled);
    }

    return allDialogues;
  }

  /**
   * 设置音量
   * @param {number} volume - 音量 (0.0 - 1.0)
   */
  setVolume(volume) {
    this.options.soundVolume = Math.max(0, Math.min(1, volume));

    // 更新所有当前播放的音频音量
    this.audioElements.forEach(audioElement => {
      if (audioElement) {
        audioElement.volume = this.options.soundVolume;
      }
    });

    // 如果音量设置为0（静音），暂停所有音频
    if (this.options.soundVolume === 0) {
      this.audioElements.forEach(audioElement => {
        if (audioElement && !audioElement.paused) {
          audioElement.pause();
        }
      });
    } else {
      // 如果音量不为0，恢复播放被暂停的音频
      this.audioElements.forEach(audioElement => {
        if (audioElement && audioElement.paused) {
          audioElement.play().catch(error => {
            console.warn('恢复音频播放失败:', error);
          });
        }
      });
    }

    console.log(`对话音量已设置为: ${this.options.soundVolume}`);
  }

  /**
   * 注册音频元素到Wallpaper Engine系统
   */
  registerAudioToWallpaperEngine(audioElement, soundPath) {
    try {
      // 检查是否在Wallpaper Engine环境中
      if (typeof window.wallpaperRegisterAudioListener === 'function') {
        // 设置音频元素的属性，让Wallpaper Engine能够识别和控制
        audioElement.setAttribute('data-wallpaper-audio', 'dialogue');
        audioElement.setAttribute('data-wallpaper-audio-type', 'effect');
        audioElement.setAttribute('data-wallpaper-audio-source', soundPath);

        // 尝试将音频元素添加到文档中（隐藏）
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);

        console.log(`对话音频已注册到Wallpaper Engine系统: ${soundPath}`);
      }
    } catch (error) {
      console.error('注册对话音频到Wallpaper Engine失败:', error);
    }
  }

  /**
   * 暂停所有音频
   */
  pauseAllAudio() {
    this.audioElements.forEach(audioElement => {
      if (audioElement && !audioElement.paused) {
        audioElement.pause();
      }
    });
    console.log('所有对话音频已暂停');
  }

  /**
   * 恢复所有音频
   */
  resumeAllAudio() {
    this.audioElements.forEach(audioElement => {
      if (audioElement && audioElement.paused) {
        audioElement.play().catch(error => {
          console.warn('恢复对话音频播放失败:', error);
        });
      }
    });
    console.log('所有对话音频已恢复');
  }

  /**
   * 启用或禁用对话功能
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    console.log(`对话功能已${enabled ? '启用' : '禁用'}`);

    if (!enabled) {
      this.stopCurrentDialogue();
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    console.log('清理对话管理器资源...');

    // 清除轨道清除定时器
    if (this.trackClearTimer) {
      clearTimeout(this.trackClearTimer);
      this.trackClearTimer = null;
    }

    // 停止当前对话
    this.stopCurrentDialogue();

    // 清理文本显示管理器
    if (this.textDisplayManager) {
      this.textDisplayManager.cleanup();
      this.textDisplayManager = null;
    }

    // 清理全局引用
    if (window.dialogueManager === this) {
      window.dialogueManager = null;
    }

    console.log('对话管理器资源清理完成');
  }
}

// 将类导出为全局变量
window.DialogueManager = DialogueManager;
