/**
 * bgmControl.js - 背景音乐控制模块
 * 用于加载和控制背景音乐播放
 */

class BgmControl {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 默认设置
    this.options = {
      enabled: true,             // 是否启用背景音乐
      bgmPath: 'sound/Theme.wav', // 背景音乐路径
      autoPlay: true,            // 是否自动播放
      loop: true,                // 是否循环播放
      fadeInTime: 2000,          // 淡入时间（毫秒）
      fadeOutTime: 1000,         // 淡出时间（毫秒）
      ...options                 // 合并用户配置
    };

    // 从全局设置控制器获取音量设置，如果存在的话
    if (window.settingsControl && window.settingsControl.settings) {
      const settings = window.settingsControl.settings;
      // 直接获取 settingsControl 中的音量值
      this.options.volume = settings.bgmVolume;
      console.log('背景音乐：从全局设置获取音量', this.options.volume);
    } else {
      // 仅当 settingsControl 不可用时设置默认音量
      this.options.volume = 0.01;
      console.log('背景音乐：无法获取全局设置，使用默认音量', this.options.volume);
    }

    // 音频元素
    this.audioElement = null;

    // 状态变量
    this.isPlaying = false;
    this.isLoaded = false;
    this.fadeInterval = null;

    // 初始化
    this.init();
  }

  /**
   * 初始化背景音乐
   */
  init() {
    console.log('初始化背景音乐系统...');

    // 确保从 settingsControl 获取最新的音量设置
    this.updateVolumeFromSettings();

    // 创建音频元素
    this.audioElement = new Audio();
    this.audioElement.src = this.options.bgmPath;
    this.audioElement.loop = this.options.loop;
    this.audioElement.volume = 0; // 初始音量为0，用于淡入效果

    // 设置音频事件监听器
    this.setupEventListeners();

    // 预加载音频
    this.preload();

    // 将实例保存为全局变量，方便其他模块访问
    window.bgmAudio = this.audioElement;
    window.bgmControl = this;

    // 注册到Wallpaper Engine音频系统
    this.registerToWallpaperEngine();

    // 注册Wallpaper Engine API监听器
    this.setupWallpaperEngineListeners();
  }

  /**
   * 注册到Wallpaper Engine音频系统
   */
  registerToWallpaperEngine() {
    try {
      // 检查是否在Wallpaper Engine环境中
      if (typeof window.wallpaperRegisterAudioListener === 'function') {
        console.log('检测到Wallpaper Engine环境，注册音频元素');

        // 将音频元素注册到Wallpaper Engine
        // 这样Wallpaper Engine就能控制这个音频元素了
        if (this.audioElement) {
          // 设置音频元素的属性，让Wallpaper Engine能够识别和控制
          this.audioElement.setAttribute('data-wallpaper-audio', 'bgm');
          this.audioElement.setAttribute('data-wallpaper-audio-type', 'background');

          // 尝试将音频元素添加到文档中（隐藏）
          this.audioElement.style.display = 'none';
          document.body.appendChild(this.audioElement);

          console.log('BGM音频已注册到Wallpaper Engine系统');
        }
      } else {
        console.log('非Wallpaper Engine环境，跳过音频注册');
      }
    } catch (error) {
      console.error('注册到Wallpaper Engine失败:', error);
    }
  }

  /**
   * 设置Wallpaper Engine API监听器
   */
  setupWallpaperEngineListeners() {
    // 检查Wallpaper Engine API是否可用
    if (window.wallpaperEngineAPI) {
      console.log('注册BGM控制器到Wallpaper Engine API');

      // 监听音量变化
      window.wallpaperEngineAPI.on('volumeChange', (volume) => {
        console.log(`Wallpaper Engine音量变化: ${volume}`);
        this.setVolume(volume);
      });

      // 监听静音变化
      window.wallpaperEngineAPI.on('muteChange', (muted) => {
        console.log(`Wallpaper Engine静音变化: ${muted}`);
        if (muted) {
          this.setVolume(0);
        } else {
          // 恢复之前的音量
          const savedVolume = window.settingsControl ?
            window.settingsControl.settings.bgmVolume : 0.01;
          this.setVolume(savedVolume);
        }
      });

      // 监听暂停状态变化
      window.wallpaperEngineAPI.on('pauseState', (paused) => {
        console.log(`Wallpaper Engine暂停状态: ${paused}`);
        if (paused) {
          this.pause();
        } else {
          this.resume();
        }
      });

      console.log('Wallpaper Engine API监听器已注册');
    } else {
      console.log('Wallpaper Engine API不可用，跳过监听器注册');
    }
  }

  /**
   * 从 settingsControl 更新音量设置
   */
  updateVolumeFromSettings() {
    // 重新检查 settingsControl 是否可用
    if (window.settingsControl && window.settingsControl.settings) {
      const settings = window.settingsControl.settings;
      // 直接获取 settingsControl 中的音量值
      this.options.volume = settings.bgmVolume;
      console.log('背景音乐：从全局设置重新获取音量', this.options.volume);
    }
  }

  /**
   * 设置音频事件监听器
   */
  setupEventListeners() {
    // 音频加载完成
    this.audioElement.addEventListener('canplaythrough', () => {
      console.log('背景音乐加载完成');
      this.isLoaded = true;

      // 如果设置了自动播放，则开始播放
      if (this.options.enabled && this.options.autoPlay && !this.isPlaying) {
        this.play();
      }
    });

    // 音频播放结束
    this.audioElement.addEventListener('ended', () => {
      if (!this.options.loop) {
        console.log('背景音乐播放结束');
        this.isPlaying = false;
      }
    });

    // 音频错误处理
    this.audioElement.addEventListener('error', (e) => {
      console.error('背景音乐加载错误:', e);
    });
  }

  /**
   * 预加载音频
   */
  preload() {
    try {
      console.log(`开始加载背景音乐: ${this.options.bgmPath}`);
      this.audioElement.load();
    } catch (error) {
      console.error('预加载背景音乐失败:', error);
    }
  }

  /**
   * 播放背景音乐
   */
  play() {
    if (!this.options.enabled) return;

    try {
      // 如果已经在播放，则不做任何操作
      if (this.isPlaying) return;

      // 确保使用最新的音量设置
      this.updateVolumeFromSettings();

      console.log('开始播放背景音乐');

      // 播放音频
      const playPromise = this.audioElement.play();

      // 处理播放承诺（现代浏览器中play方法返回Promise）
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            // 淡入音量
            this.fadeIn();
          })
          .catch(error => {
            // 自动播放被阻止（通常是由于浏览器策略）
            console.warn('自动播放被阻止，需要用户交互:', error);

            // 设置一次性点击事件来启动播放
            const startPlayback = () => {
              this.audioElement.play()
                .then(() => {
                  this.isPlaying = true;
                  this.fadeIn();
                })
                .catch(e => console.error('播放失败:', e));

              // 移除事件监听器
              document.removeEventListener('click', startPlayback);
              document.removeEventListener('touchstart', startPlayback);
            };

            document.addEventListener('click', startPlayback, { once: true });
            document.addEventListener('touchstart', startPlayback, { once: true });
          });
      } else {
        // 旧版浏览器不返回Promise
        this.isPlaying = true;
        this.fadeIn();
      }
    } catch (error) {
      console.error('播放背景音乐失败:', error);
    }
  }

  /**
   * 暂停背景音乐
   */
  pause() {
    if (!this.isPlaying) return;

    try {
      // 淡出后暂停
      this.fadeOut(() => {
        this.audioElement.pause();
        this.isPlaying = false;
        console.log('背景音乐已暂停');
      });
    } catch (error) {
      console.error('暂停背景音乐失败:', error);
      // 如果淡出失败，直接暂停
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  /**
   * 恢复背景音乐播放
   */
  resume() {
    if (this.isPlaying) return;
    if (!this.isLoaded) return;

    try {
      console.log('恢复背景音乐播放');

      // 播放音频
      const playPromise = this.audioElement.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            // 淡入音量
            this.fadeIn();
          })
          .catch(error => {
            console.error('恢复播放失败:', error);
          });
      } else {
        this.isPlaying = true;
        this.fadeIn();
      }
    } catch (error) {
      console.error('恢复背景音乐播放失败:', error);
    }
  }

  /**
   * 停止背景音乐
   */
  stop() {
    if (!this.isPlaying) return;

    try {
      // 淡出后停止
      this.fadeOut(() => {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
        console.log('背景音乐已停止');
      });
    } catch (error) {
      console.error('停止背景音乐失败:', error);
    }
  }

  /**
   * 设置音量（同时根据音量自动控制启用状态）
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    // 确保音量在有效范围内
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    this.options.volume = normalizedVolume;

    // 根据音量自动控制启用状态
    const shouldEnable = normalizedVolume > 0;

    // 如果音量为0，禁用BGM
    if (!shouldEnable && this.isPlaying) {
      this.stop();
      this.options.enabled = false;
    }
    // 如果音量大于0，启用BGM
    else if (shouldEnable && !this.options.enabled) {
      this.options.enabled = true;
      if (this.isLoaded && !this.isPlaying) {
        this.play();
      }
    }
    // 如果正在播放，立即应用新音量
    else if (this.isPlaying) {
      this.audioElement.volume = normalizedVolume;
    }

    console.log(`背景音乐音量设置为: ${normalizedVolume}，${shouldEnable ? '已启用' : '已禁用'}`);
  }

  /**
   * 设置是否启用背景音乐
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;

    if (enabled) {
      if (!this.isPlaying && this.isLoaded) {
        this.play();
      }
    } else {
      if (this.isPlaying) {
        this.stop();
      }
    }

    console.log(`背景音乐已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 淡入音量效果
   */
  fadeIn() {
    // 清除可能存在的淡出计时器
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    // 确保使用最新的音量设置
    this.updateVolumeFromSettings();

    // 设置初始音量为0
    this.audioElement.volume = 0;

    // 计算每一步的音量增量
    const steps = 20; // 淡入的步数
    const increment = this.options.volume / steps;
    const stepTime = this.options.fadeInTime / steps;

    let currentStep = 0;

    this.fadeInterval = setInterval(() => {
      currentStep++;

      // 计算新音量
      const newVolume = Math.min(this.options.volume, currentStep * increment);
      this.audioElement.volume = newVolume;

      // 完成淡入后清除定时器
      if (currentStep >= steps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, stepTime);
  }

  /**
   * 淡出音量效果
   * @param {Function} callback - 淡出完成后的回调函数
   */
  fadeOut(callback) {
    // 清除可能存在的淡入计时器
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    // 获取当前音量
    const startVolume = this.audioElement.volume;

    // 计算每一步的音量减量
    const steps = 20; // 淡出的步数
    const decrement = startVolume / steps;
    const stepTime = this.options.fadeOutTime / steps;

    let currentStep = 0;

    this.fadeInterval = setInterval(() => {
      currentStep++;

      // 计算新音量
      const newVolume = Math.max(0, startVolume - currentStep * decrement);
      this.audioElement.volume = newVolume;

      // 完成淡出后清除定时器并执行回调
      if (currentStep >= steps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        this.audioElement.volume = 0;

        if (typeof callback === 'function') {
          callback();
        }
      }
    }, stepTime);
  }

  /**
   * 更新背景音乐路径
   * @param {string} path - 新的背景音乐路径
   */
  updateBgmPath(path) {
    const wasPlaying = this.isPlaying;

    // 如果正在播放，先停止
    if (wasPlaying) {
      this.stop();
    }

    // 更新路径
    this.options.bgmPath = path;
    this.audioElement.src = path;

    // 重置状态
    this.isLoaded = false;

    // 预加载新音频
    this.preload();

    // 如果之前在播放，加载完成后自动播放
    if (wasPlaying) {
      this.options.autoPlay = true;
    }

    console.log(`背景音乐路径更新为: ${path}`);
  }



  /**
   * 清理资源
   */
  cleanup() {
    // 停止播放
    this.stop();

    // 清除事件监听器
    this.audioElement.removeEventListener('canplaythrough', null);
    this.audioElement.removeEventListener('ended', null);
    this.audioElement.removeEventListener('error', null);

    // 清除淡入/淡出计时器
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    console.log('背景音乐系统已清理');
  }
}

// 将类导出为全局变量
window.BgmControl = BgmControl;