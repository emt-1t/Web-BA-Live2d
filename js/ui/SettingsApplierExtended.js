/**
 * SettingsApplierExtended.js - 设置应用器扩展方法
 * 包含剩余的设置应用方法
 */

// 扩展 SettingsApplier 类的方法
Object.assign(SettingsApplier.prototype, {

  /**
   * 设置BGM启用状态
   */
  setBgmEnabled(enabled) {
    // 首先尝试使用 bgmControl
    if (window.bgmControl) {
      try {
        window.bgmControl.setEnabled(enabled);
        console.log(`BGM已${enabled ? '启用' : '禁用'}（通过bgmControl）`);
        return;
      } catch (e) {
        console.error("通过bgmControl设置BGM启用状态失败:", e);
      }
    }

    // 如果bgmControl不可用，则使用旧方式
    if (window.bgmAudio) {
      try {
        if (enabled) {
          window.bgmAudio.play();
        } else {
          window.bgmAudio.pause();
        }
        console.log(`BGM已${enabled ? '启用' : '禁用'}（通过bgmAudio）`);
      } catch (e) {
        console.error("设置BGM启用状态失败:", e);
      }
    }
  },

  /**
   * 设置BGM音量（同时控制启用/禁用状态）
   */
  setBgmVolume(volume) {
    // 根据音量自动控制BGM启用状态
    const shouldEnable = volume > 0;

    // 首先尝试使用 bgmControl
    if (window.bgmControl) {
      try {
        window.bgmControl.setVolume(volume);
        window.bgmControl.setEnabled(shouldEnable);
        console.log(`BGM音量已设置为: ${volume}，${shouldEnable ? '已启用' : '已禁用'}（通过bgmControl）`);
        return;
      } catch (e) {
        console.error("通过bgmControl设置BGM音量失败:", e);
      }
    }

    // 如果bgmControl不可用，则使用旧方式
    if (window.bgmAudio) {
      try {
        window.bgmAudio.volume = volume;

        // 根据音量控制播放/暂停
        if (shouldEnable && window.bgmAudio.paused) {
          window.bgmAudio.play();
        } else if (!shouldEnable && !window.bgmAudio.paused) {
          window.bgmAudio.pause();
        }

        console.log(`BGM音量已设置为: ${volume}，${shouldEnable ? '已启用' : '已禁用'}（通过bgmAudio）`);
      } catch (e) {
        console.error("设置BGM音量失败:", e);
      }
    }
  },

  /**
   * 设置对话音效音量
   */
  setDialogueSoundVolume(volume) {
    if (window.dialogueManager) {
      try {
        window.dialogueManager.setVolume(volume);
        console.log(`对话音效音量已设置为: ${volume}`);
      } catch (e) {
        console.error("设置对话音效音量失败:", e);
      }
    }
  },

  /**
   * 设置开场动画
   */
  setIntroAnimation(enabled) {
    if (window.animationControl) {
      window.animationControl.setPlayIntroAnimation(enabled);
    }
    console.log(`开场动画已${enabled ? '启用' : '禁用'}`);
  },

  /**
   * 设置UI高度缩放
   */
  setUIScale(scale) {
    // 触发UI高度缩放事件
    document.dispatchEvent(new CustomEvent('uiScaleChanged', {
      detail: { scale: scale }
    }));
  },

  /**
   * 设置字体大小缩放
   */
  setFontSize(scale) {
    // 触发字体大小缩放事件
    document.dispatchEvent(new CustomEvent('fontSizeChanged', {
      detail: { scale: scale }
    }));
  },





  /**
   * 设置帧率限制
   */
  setFrameRateEnabled(enabled) {
    if (window.frameRateManager) {
      window.frameRateManager.setEnabled(enabled);
    }
  },

  /**
   * 设置目标帧率
   */
  setTargetFPS(fps) {
    if (window.frameRateManager) {
      window.frameRateManager.setTargetFPS(fps);
    }
  },
  /**
   * 设置文本显示启用状态
   */
  setTextDisplayEnabled(enabled) {
    if (window.textDisplayManager) {
      try {
        window.textDisplayManager.setEnabled(enabled);
        console.log(`文本显示功能已${enabled ? '启用' : '禁用'}`);
      } catch (e) {
        console.error('设置文本显示启用状态失败:', e);
      }
    } else {
      console.warn('文本显示管理器未找到');
    }
  },

  /**
   * 设置文本显示语言
   */
  setTextDisplayLanguage(language) {
    if (window.textDisplayManager) {
      try {
        window.textDisplayManager.setLanguage(language);
        console.log(`文本显示语言已设置为: ${language}`);
      } catch (e) {
        console.error('设置文本显示语言失败:', e);
      }
    } else {
      console.warn('文本显示管理器未找到');
    }
  },

  /**
   * 设置文本显示X轴位置
   */
  setTextDisplayX(x) {
    if (window.textDisplayManager) {
      try {
        // 应用设置时不显示预览，避免初始化时显示
        window.textDisplayManager.setPositionX(x, false);
        console.log(`文本显示X轴位置已设置为: ${x}%`);
      } catch (e) {
        console.error('设置文本显示X轴位置失败:', e);
      }
    } else {
      console.warn('文本显示管理器未找到');
    }
  },

  /**
   * 设置文本显示Y轴位置
   */
  setTextDisplayY(y) {
    if (window.textDisplayManager) {
      try {
        // 应用设置时不显示预览，避免初始化时显示
        window.textDisplayManager.setPositionY(y, false);
        console.log(`文本显示Y轴位置已设置为: ${y}%`);
      } catch (e) {
        console.error('设置文本显示Y轴位置失败:', e);
      }
    } else {
      console.warn('文本显示管理器未找到');
    }
  },

  /**
   * 设置文本显示透明度
   */
  setTextDisplayOpacity(opacity) {
    if (window.textDisplayManager) {
      try {
        // 应用设置时不显示预览，避免初始化时显示
        window.textDisplayManager.setOpacity(opacity, false);
        console.log(`文本显示透明度已设置为: ${opacity}%`);
      } catch (e) {
        console.error('设置文本显示透明度失败:', e);
      }
    } else {
      console.warn('文本显示管理器未找到');
    }
  },





});

console.log("SettingsApplier 扩展方法已加载");
