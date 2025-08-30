/**
 * SettingsControls.js - 设置控件创建器
 * 负责创建各种UI控件（滑块、开关、按钮等）
 */

class SettingsControls {
  constructor(settingsCore) {
    this.settingsCore = settingsCore;
  }

  /**
   * 分离中英文标签
   */
  splitLabelText(text) {
    // 针对特殊的模式处理：
    // 1. "角色缩放（慎用△）Character Scale (Use with caution△)" 这样的模式
    // 2. "启用视线追踪 Enable" 这样的简单模式

    // 尝试匹配"xxx（xxx）"后面跟着英文的模式
    const specialPattern = /^(.+?(?:\([^)]*\)|（[^）]*）))\s+([A-Za-z].+)$/;
    const specialMatch = text.match(specialPattern);

    if (specialMatch) {
      return {
        chinese: specialMatch[1],
        english: specialMatch[2]
      };
    }

    // 尝试匹配普通的中文后跟英文的模式
    const normalPattern = /^(.+?)\s+([A-Za-z].+)$/;
    const normalMatch = text.match(normalPattern);

    if (normalMatch) {
      return {
        chinese: normalMatch[1],
        english: normalMatch[2]
      };
    }

    // 如果都不匹配，返回原文本作为中文
    return { chinese: text, english: '' };
  }

  /**
   * 判断滑动条是否需要透明度效果
   */
  shouldUseTransparencyEffect(settingKey) {
    // 需要透明度效果的滑动条：用户调整时需要看到界面变化来判断效果
    const transparencyEffectKeys = [
      'textDisplayX',       // 水平位置
      'textDisplayY',       // 垂直位置
      'textDisplayOpacity', // 背景透明度
      'textDisplayFontSize' // 字体大小
      // 注意：uiScale（面板高度）不需要透明度效果
    ];

    return transparencyEffectKeys.includes(settingKey);
  }

  /**
   * 格式化数值显示（去除尾随的0）
   */
  formatValue(value) {
    // 如果是整数，直接显示
    if (Number.isInteger(value)) {
      return value.toString();
    }

    // 对于小数，根据大小决定显示精度
    const absValue = Math.abs(value);
    let formattedValue;

    if (absValue >= 10) {
      // 大于等于10的数值，最多显示1位小数
      formattedValue = value.toFixed(1);
    } else if (absValue >= 1) {
      // 1-10之间的数值，最多显示2位小数
      formattedValue = value.toFixed(2);
    } else if (absValue >= 0.1) {
      // 0.1-1之间的数值，最多显示2位小数
      formattedValue = value.toFixed(2);
    } else {
      // 小于0.1的数值，最多显示3位小数
      formattedValue = value.toFixed(3);
    }

    // 去除尾随的0和不必要的小数点
    // 例如: "1.00" -> "1", "0.50" -> "0.5", "0.030" -> "0.03"
    return parseFloat(formattedValue).toString();
  }

  /**
   * 创建操作按钮
   */
  createButton(text, onClickHandler) {
    const button = document.createElement('button');
    button.className = 'action-button';

    // 分离中英文
    const parts = this.splitLabelText(text);

    // 处理有英文部分的情况
    if (parts.english) {
      // 采用垂直布局，英文在下方
      const container = document.createElement('div');
      container.classList.add('vertical-layout');

      const chineseSpan = document.createElement('span');
      chineseSpan.textContent = parts.chinese;

      const englishSpan = document.createElement('span');
      englishSpan.className = 'english-text';
      englishSpan.textContent = parts.english;

      container.appendChild(chineseSpan);
      container.appendChild(englishSpan);
      button.appendChild(container);
    } else {
      button.textContent = parts.chinese;
    }

    button.addEventListener('click', onClickHandler);
    return button;
  }

  /**
   * 添加滑块控件
   */
  addSliderControl(labelText, settingKey, min, max, step, container) {
    console.log("addSliderControl 被调用，参数:", { labelText, settingKey, container });
    const control = document.createElement('div');
    control.className = 'slider-control';

    const labelContainer = document.createElement('div');
    labelContainer.className = 'control-label';
    labelContainer.classList.add('flexible');

    // 分离中英文标签
    const parts = this.splitLabelText(labelText);

    const label = document.createElement('span');
    label.classList.add('label-flex');

    // 处理有英文部分的情况
    if (parts.english) {
      const chineseSpan = document.createElement('span');
      chineseSpan.textContent = parts.chinese;
      label.appendChild(chineseSpan);

      const englishSpan = document.createElement('span');
      englishSpan.className = 'english-text';
      englishSpan.textContent = ' ' + parts.english;
      englishSpan.classList.add('text-spacing');
      label.appendChild(englishSpan);
    } else {
      label.textContent = parts.chinese;
    }

    labelContainer.appendChild(label);

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'value-display';
    valueDisplay.textContent = this.formatValue(this.settingsCore.getSetting(settingKey));
    valueDisplay.classList.add('enhanced');
    labelContainer.appendChild(valueDisplay);

    control.appendChild(labelContainer);

    // 创建自定义滑块容器
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'custom-slider-container';

    // 创建滑块轨道
    const sliderTrack = document.createElement('div');
    sliderTrack.className = 'custom-slider-track';

    // 创建滑块填充
    const sliderFill = document.createElement('div');
    sliderFill.className = 'custom-slider-fill';

    // 创建滑块手柄
    const sliderThumb = document.createElement('div');
    sliderThumb.className = 'custom-slider-thumb';

    // 组装滑块
    sliderTrack.appendChild(sliderFill);
    sliderContainer.appendChild(sliderTrack);
    sliderContainer.appendChild(sliderThumb);

    // 存储滑块数据
    sliderContainer.dataset.settingKey = settingKey;
    sliderContainer.dataset.min = min;
    sliderContainer.dataset.max = max;
    sliderContainer.dataset.step = step;
    sliderContainer.dataset.value = this.settingsCore.getSetting(settingKey);

    // 初始化滑块位置
    this.updateSliderPosition(sliderContainer, this.settingsCore.getSetting(settingKey));

    // 添加滑块事件处理
    this.addSliderEventListeners(sliderContainer, valueDisplay);

    // 为特定的滑条添加特殊样式类
    if (settingKey === 'uiScale') {
      control.classList.add('ui-height-slider');
    }

    // 初始化手柄状态
    sliderThumb.classList.add('normal');

    control.appendChild(sliderContainer);
    container.appendChild(control);

    return control;
  }

  /**
   * 添加开关控件
   */
  addSwitchControl(labelText, settingKey, container) {
    const control = document.createElement('div');
    control.className = 'switch-control';
    control.classList.add('control-reduced-margin');

    // 分离中英文标签
    const parts = this.splitLabelText(labelText);

    // 创建标签容器
    const labelContainer = document.createElement('div');
    labelContainer.className = 'control-label';
    labelContainer.classList.add('flex-layout');

    // 创建中文部分
    const chineseText = document.createElement('span');
    chineseText.textContent = parts.chinese;
    labelContainer.appendChild(chineseText);

    // 如果有英文部分，添加英文
    if (parts.english) {
      const englishText = document.createElement('span');
      englishText.className = 'english-text switch-english';
      englishText.textContent = parts.english;
      englishText.classList.add('text-spacing');
      labelContainer.appendChild(englishText);
    }

    control.appendChild(labelContainer);

    // 开关部分
    const switchWrapper = document.createElement('div');
    switchWrapper.className = 'switch-wrapper';
    switchWrapper.classList.add('no-shrink');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.settingsCore.getSetting(settingKey);
    checkbox.className = 'toggle-switch';
    checkbox.id = `switch-${settingKey}`;

    const switchLabel = document.createElement('label');
    switchLabel.htmlFor = `switch-${settingKey}`;
    switchLabel.className = 'switch-label';

    switchWrapper.appendChild(checkbox);
    switchWrapper.appendChild(switchLabel);

    checkbox.addEventListener('change', () => {
      this.settingsCore.updateSetting(settingKey, checkbox.checked);
      // 触发设置更新事件
      document.dispatchEvent(new CustomEvent('settingChanged', {
        detail: { key: settingKey, value: checkbox.checked }
      }));
    });

    control.appendChild(switchWrapper);
    container.appendChild(control);

    return control;
  }

  /**
   * 添加下拉选择控件
   */
  addSelectControl(labelText, settingKey, options, container) {
    const control = document.createElement('div');
    control.className = 'select-control';
    control.classList.add('control-reduced-margin');

    // 分离中英文标签
    const parts = this.splitLabelText(labelText);

    // 创建标签容器
    const labelContainer = document.createElement('div');
    labelContainer.className = 'control-label';
    labelContainer.classList.add('flex-layout');

    // 创建中文部分
    const chineseText = document.createElement('span');
    chineseText.textContent = parts.chinese;
    labelContainer.appendChild(chineseText);

    // 如果有英文部分，添加英文
    if (parts.english) {
      const englishText = document.createElement('span');
      englishText.className = 'english-text select-english';
      englishText.textContent = parts.english;
      englishText.classList.add('text-spacing');
      labelContainer.appendChild(englishText);
    }

    control.appendChild(labelContainer);

    // 下拉选择框部分
    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'select-wrapper';
    selectWrapper.classList.add('no-shrink');

    const select = document.createElement('select');
    select.className = 'custom-select';
    select.id = `select-${settingKey}`;

    // 添加选项
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      select.appendChild(optionElement);
    });

    // 设置当前值
    select.value = this.settingsCore.getSetting(settingKey);

    // 添加事件监听器
    select.addEventListener('change', (e) => {
      const newValue = e.target.value;
      this.settingsCore.updateSetting(settingKey, newValue);

      // 触发设置更新事件
      document.dispatchEvent(new CustomEvent('settingChanged', {
        detail: { key: settingKey, value: newValue }
      }));
    });

    selectWrapper.appendChild(select);
    control.appendChild(selectWrapper);
    container.appendChild(control);

    return control;
  }

  /**
   * 更新滑块位置
   */
  updateSliderPosition(sliderContainer, value) {
    const min = parseFloat(sliderContainer.dataset.min);
    const max = parseFloat(sliderContainer.dataset.max);
    const percentage = ((value - min) / (max - min)) * 100;

    const sliderFill = sliderContainer.querySelector('.custom-slider-fill');
    const sliderThumb = sliderContainer.querySelector('.custom-slider-thumb');

    if (sliderFill) {
      sliderFill.style.width = `${percentage}%`;
    }

    if (sliderThumb) {
      sliderThumb.style.left = `${percentage}%`;
    }
  }

  /**
   * 添加滑块事件监听器
   */
  addSliderEventListeners(sliderContainer, valueDisplay) {
    let isDragging = false;
    let lastValue = null;

    // 优化的数值计算函数
    const calculateValue = (clientX) => {
      const rect = sliderContainer.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));

      const min = parseFloat(sliderContainer.dataset.min);
      const max = parseFloat(sliderContainer.dataset.max);
      const step = parseFloat(sliderContainer.dataset.step);

      let value = min + (percentage / 100) * (max - min);

      // 改进的步长处理，避免浮点数精度问题
      if (step > 0) {
        const stepDecimals = (step.toString().split('.')[1] || '').length;
        value = Math.round(value / step) * step;
        value = parseFloat(value.toFixed(stepDecimals));
      }

      // 确保值在范围内
      value = Math.max(min, Math.min(max, value));
      return value;
    };

    // 直接更新函数，保持高响应频率
    const updateSlider = (value) => {
      // 只在值发生变化时更新DOM
      if (value !== lastValue) {
        sliderContainer.dataset.value = value;
        this.updateSliderPosition(sliderContainer, value);
        valueDisplay.textContent = this.formatValue(value);
        lastValue = value;
      }
    };

    // 直接设置更新函数，保持原有响应速度
    const updateSetting = (value) => {
      const settingKey = sliderContainer.dataset.settingKey;

      // 立即更新设置和触发事件
      this.settingsCore.updateSetting(settingKey, value);
      document.dispatchEvent(new CustomEvent('settingChanged', {
        detail: { key: settingKey, value: value }
      }));
    };

    const handleMove = (clientX) => {
      if (!isDragging) return;

      const value = calculateValue(clientX);
      updateSlider(value);
      updateSetting(value);
    };

    // 开始拖拽时的效果处理
    const startDragging = (clientX) => {
      isDragging = true;
      lastValue = parseFloat(sliderContainer.dataset.value);

      // 检查是否需要透明度效果
      const settingKey = sliderContainer.dataset.settingKey;
      const needsTransparencyEffect = this.shouldUseTransparencyEffect(settingKey);

      if (needsTransparencyEffect) {
        // 找到设置面板并添加透明度效果
        const settingsPanel = document.querySelector('.settings-panel');
        if (settingsPanel) {
          // 添加拖拽状态类
          settingsPanel.classList.add('slider-dragging');

          // 找到当前滑动条的父容器并标记为活跃状态
          const sliderControl = sliderContainer.closest('.slider-control');
          if (sliderControl) {
            sliderControl.classList.add('dragging-active');
          }
        }
      }

      // 添加手柄拖拽样式，禁用过渡动画以提高跟手性
      const sliderThumb = sliderContainer.querySelector('.custom-slider-thumb');
      if (sliderThumb) {
        sliderThumb.classList.add('grabbing');
        sliderThumb.classList.remove('normal');
        sliderThumb.style.transition = 'none'; // 拖拽时禁用过渡动画
      }

      // 立即处理初始位置
      handleMove(clientX);
    };

    // 结束拖拽时的效果处理
    const stopDragging = () => {
      isDragging = false;

      // 检查是否使用了透明度效果
      const settingKey = sliderContainer.dataset.settingKey;
      const needsTransparencyEffect = this.shouldUseTransparencyEffect(settingKey);

      if (needsTransparencyEffect) {
        // 找到设置面板并移除透明度效果
        const settingsPanel = document.querySelector('.settings-panel');
        if (settingsPanel) {
          // 移除拖拽状态类
          settingsPanel.classList.remove('slider-dragging');

          // 移除所有滑动条的活跃状态
          const allSliderControls = settingsPanel.querySelectorAll('.slider-control.dragging-active');
          allSliderControls.forEach(control => {
            control.classList.remove('dragging-active');
          });
        }
      }

      // 恢复手柄样式和过渡动画
      const sliderThumb = sliderContainer.querySelector('.custom-slider-thumb');
      if (sliderThumb) {
        sliderThumb.classList.remove('grabbing');
        sliderThumb.classList.add('normal');
        sliderThumb.style.transition = ''; // 恢复过渡动画
      }
    };

    // 优化的鼠标事件处理
    const mouseDownHandler = (e) => {
      startDragging(e.clientX);
      e.preventDefault();
      e.stopPropagation();
    };

    const mouseMoveHandler = (e) => {
      if (isDragging) {
        handleMove(e.clientX);
        e.preventDefault();
      }
    };

    const mouseUpHandler = () => {
      if (isDragging) {
        stopDragging();
      }
    };

    // 优化的触摸事件处理
    const touchStartHandler = (e) => {
      if (e.touches.length === 1) {
        startDragging(e.touches[0].clientX);
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const touchMoveHandler = (e) => {
      if (isDragging && e.touches.length === 1) {
        handleMove(e.touches[0].clientX);
        e.preventDefault();
      }
    };

    const touchEndHandler = () => {
      if (isDragging) {
        stopDragging();
      }
    };

    // 绑定事件监听器
    sliderContainer.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mousemove', mouseMoveHandler, { passive: false });
    document.addEventListener('mouseup', mouseUpHandler);

    sliderContainer.addEventListener('touchstart', touchStartHandler, { passive: false });
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler);
    document.addEventListener('touchcancel', touchEndHandler);
  }

  /**
   * 刷新控件显示
   */
  refreshControl(settingKey) {
    // 更新滑块
    const sliders = document.querySelectorAll(`[data-setting-key="${settingKey}"]`);
    sliders.forEach(slider => {
      const value = this.settingsCore.getSetting(settingKey);
      slider.dataset.value = value;
      this.updateSliderPosition(slider, value);
      
      const control = slider.closest('.slider-control');
      if (control) {
        const valueDisplay = control.querySelector('.value-display');
        if (valueDisplay) {
          valueDisplay.textContent = this.formatValue(value);
        }
      }
    });

    // 更新开关
    const switches = document.querySelectorAll(`#switch-${settingKey}`);
    switches.forEach(switchEl => {
      switchEl.checked = this.settingsCore.getSetting(settingKey);
    });

    // 更新下拉选择框
    const selects = document.querySelectorAll(`#select-${settingKey}`);
    selects.forEach(selectEl => {
      selectEl.value = this.settingsCore.getSetting(settingKey);
    });
  }
}

// 导出类
window.SettingsControls = SettingsControls;
