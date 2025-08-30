// Spine 加载器模块
class SpineLoader {
  constructor(app) {
    this.app = app;

    // 纹理缓存
    this.textureCache = new Map();

    // 加载优化选项
    this.loadingOptions = {
      enableTextureCache: true,
      enableProgressiveLoading: true,
      enableTextureOptimization: true,
      maxCacheSize: 50 // 最大缓存纹理数量
    };
  }

  // 检查纹理缓存
  checkTextureCache(atlasPath) {
    if (this.loadingOptions.enableTextureCache && this.textureCache.has(atlasPath)) {
      console.log(`从缓存中获取纹理: ${atlasPath}`);
      return this.textureCache.get(atlasPath);
    }
    return null;
  }

  // 添加到纹理缓存
  addToTextureCache(atlasPath, textureData) {
    if (!this.loadingOptions.enableTextureCache) return;

    // 检查缓存大小限制（但不自动清理，避免卡顿）
    if (this.textureCache.size >= this.loadingOptions.maxCacheSize) {
      console.log(`缓存已满 (${this.textureCache.size}/${this.loadingOptions.maxCacheSize})，但不自动清理以避免卡顿`);
      // 不再自动删除缓存，让内存自然管理
      // 如果真的需要清理，用户可以手动调用清理方法
    }

    this.textureCache.set(atlasPath, textureData);
    console.log(`纹理已添加到缓存: ${atlasPath} (缓存大小: ${this.textureCache.size})`);
  }

  // 清理缓存的纹理资源（已禁用，避免频繁清理导致卡顿）
  cleanupCachedTexture(textureData) {
    // 不再执行清理操作，避免频繁清理导致卡顿
    console.log('纹理缓存清理已禁用，避免频繁清理导致卡顿');
  }

  // 清理所有缓存（已禁用）
  clearAllCache() {
    console.log('缓存清理已禁用，避免频繁清理导致卡顿');
    // 不再清理缓存，让浏览器自然管理内存
  }

  // 强制垃圾回收（已禁用）
  forceGarbageCollection() {
    console.log('强制垃圾回收已禁用，避免频繁清理导致卡顿');
    // 不再执行强制垃圾回收，让浏览器自然管理内存
  }

  // 优化纹理设置
  optimizeTexture(texture) {
    if (!this.loadingOptions.enableTextureOptimization || !texture) return;

    try {
      // 设置纹理过滤模式
      if (texture.baseTexture) {
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
        texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF; // 关闭mipmap以提高性能

        // 启用纹理缓存
        texture.baseTexture.cacheAsBitmap = true;
      }
    } catch (error) {
      console.warn("优化纹理设置失败:", error);
    }
  }

  // 加载Spine数据
  async loadSpine(skeletonPath, atlasPath) {
    try {
      console.log(`开始加载模型数据 - 骨骼: ${skeletonPath}, 图集: ${atlasPath}`);

      // 检查纹理缓存
      const cachedTexture = this.checkTextureCache(atlasPath);
      if (cachedTexture) {
        console.log("使用缓存的纹理数据");
        return cachedTexture;
      }

      // 检查PIXI是否可用
      if (typeof PIXI === 'undefined') {
        throw new Error('PIXI库未加载');
      }

      if (!PIXI.Assets) {
        throw new Error('PIXI.Assets不可用，可能是版本不兼容');
      }

      // 预加载骨骼数据和图集
      const skelAlias = `spineData_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const atlasAlias = `spineAtlas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`使用别名: 骨骼=${skelAlias}, 图集=${atlasAlias}`);

      // 使用唯一别名以避免缓存问题
      try {
        PIXI.Assets.add({alias: skelAlias, src: skeletonPath});
        PIXI.Assets.add({alias: atlasAlias, src: atlasPath});
        console.log('资源已添加到PIXI.Assets');
      } catch (addError) {
        console.error('添加资源到PIXI.Assets失败:', addError);
        throw new Error(`无法添加资源: ${addError.message}`);
      }

      try {
        console.log('开始加载资源...');
        const loadResult = await PIXI.Assets.load([skelAlias, atlasAlias]);
        console.log(`模型文件加载成功:`, loadResult);
        console.log(`骨骼文件: ${skeletonPath} -> ${skelAlias}`);
        console.log(`图集文件: ${atlasPath} -> ${atlasAlias}`);

        // 优化加载的纹理
        if (loadResult[atlasAlias]) {
          this.optimizeTexture(loadResult[atlasAlias]);
        }

        // 创建返回数据
        const spineData = { skeleton: skelAlias, atlas: atlasAlias };

        // 添加到缓存
        this.addToTextureCache(atlasPath, spineData);

        return spineData;
      } catch (loadError) {
        console.error(`模型文件加载失败:`, loadError);
        console.error(`错误详情:`, {
          message: loadError.message,
          stack: loadError.stack,
          skelPath: skeletonPath,
          atlasPath: atlasPath
        });
        throw new Error(`无法加载模型文件: ${loadError.message}`);
      }
    } catch (error) {
      console.error("加载 Spine 数据失败:", error);
      throw error;
    }
  }

  // 创建Spine实例
  createSpineInstance(spineData, options = {}) {
    try {
      console.log(`创建 Spine 实例...`);
      console.log('spineData:', spineData);

      // 检查spine库是否可用
      if (typeof spine === 'undefined') {
        throw new Error('Spine库未加载');
      }

      if (!spine.Spine) {
        throw new Error('spine.Spine不可用，可能是版本不兼容');
      }

      // 检查输入数据
      if (!spineData || !spineData.skeleton || !spineData.atlas) {
        throw new Error('无效的spineData，缺少skeleton或atlas');
      }

      console.log('开始创建Spine对象...');
      const spineModel = spine.Spine.from({
        skeleton: spineData.skeleton,
        atlas: spineData.atlas,
        scale: options.scale || 1.0,
      });

      if (!spineModel) {
        throw new Error("创建Spine对象失败，返回了空值");
      }

      console.log(`Spine 对象创建成功，类型: ${spineModel.constructor.name}`);

      // 设置默认混合时间
      try {
        if (spineModel.state && spineModel.state.data) {
          spineModel.state.data.defaultMix = options.defaultMix || 0.2;
          console.log('默认混合时间设置成功');
        } else {
          console.warn("无法设置默认混合时间，state或state.data不存在");
        }
      } catch (mixError) {
        console.warn("设置默认混合时间失败:", mixError);
      }

      // 添加到舞台或主模型容器
      if (!this.app || !this.app.stage) {
        throw new Error('PIXI应用或舞台不可用');
      }

      // 主模型添加到主模型容器
      const renderManager = window.app?.renderManager;
      const mainModelContainer = renderManager?.getMainModelContainer();

      if (mainModelContainer) {
        mainModelContainer.addChild(spineModel);
        console.log(`主模型已添加到主模型容器`);
      } else {
        // 如果主模型容器不存在，回退到直接添加到舞台
        this.app.stage.addChild(spineModel);
        console.log(`主模型已添加到舞台（主模型容器不可用）`);
      }

      return spineModel;
    } catch (createError) {
      console.error("创建Spine模型失败:", createError);
      console.error("错误详情:", {
        message: createError.message,
        stack: createError.stack,
        spineData: spineData,
        options: options
      });
      throw createError;
    }
  }

  // 加载并显示 Spine 模型
  async loadAndDisplaySpine(skeletonPath, atlasPath, options = {}) {
    try {
      // 加载Spine数据
      const spineData = await this.loadSpine(skeletonPath, atlasPath);

      // 创建实例
      const spineModel = this.createSpineInstance(spineData, options);

      // 如果启用了自动检测动画
      if (options.autoDetectAnimation) {
        this.autoDetectAndPlayAnimation(spineModel, options.loop !== false);
      }
      // 否则使用指定的动画
      else if (options.animation && spineModel.state) {
        console.log(`播放指定动画: ${options.animation}`);
        spineModel.state.setAnimation(0, options.animation, options.loop !== false);
      }

      // 设置位置
      try {
        if (options.position === 'center') {
          spineModel.x = window.innerWidth / 2;
          spineModel.y = window.innerHeight / 2;

          // 尝试获取边界，可能会失败
          try {
            const bounds = spineModel.getBounds();
            if (bounds && bounds.height) {
              spineModel.y += bounds.height / 2;
            }
          } catch (e) {
            console.warn("无法获取模型边界:", e);
          }
        } else if (options.x !== undefined && options.y !== undefined) {
          spineModel.x = options.x;
          spineModel.y = options.y;
        }

        console.log(`Spine 模型位置设置完成: x=${spineModel.x}, y=${spineModel.y}`);
      } catch (posError) {
        console.warn("设置模型位置时出错:", posError);
      }

      return spineModel;
    } catch (error) {
      console.error("加载 Spine 模型失败:", error);
      throw error;
    }
  }

  // 自动检测并播放动画
  autoDetectAndPlayAnimation(spineModel, loop = true) {
    try {
      // 检查spineModel是否存在且有效
      if (!spineModel) {
        console.error("自动检测动画失败: Spine模型为空");
        return;
      }

      console.log("检查模型结构...", spineModel);

      // 打印出Spine对象的结构以便调试
      if (spineModel.spineData) {
        console.log("spineData存在");
      } else {
        console.warn("spineData不存在!");
      }

      // 直接获取动画列表的替代方法
      let animations = [];

      // 方法1: 尝试从spineData中获取
      if (spineModel.spineData && spineModel.spineData.animations) {
        animations = spineModel.spineData.animations;
        console.log("从spineData获取动画成功");
      }
      // 方法2: 尝试从skeleton中获取
      else if (spineModel.skeleton && spineModel.skeleton.data && spineModel.skeleton.data.animations) {
        animations = spineModel.skeleton.data.animations;
        console.log("从skeleton获取动画成功");
      }
      // 方法3: 尝试从state中获取可用动画
      else if (spineModel.state && spineModel.state.data && spineModel.state.data.skeletonData) {
        const skeletonData = spineModel.state.data.skeletonData;
        if (skeletonData.animations) {
          animations = skeletonData.animations;
          console.log("从state获取动画成功");
        }
      }

      if (!animations || animations.length === 0) {
        console.warn("未找到任何动画，尝试使用animate方法");
        // 方法4: 如果其他方法都失败，尝试调用animate方法
        if (spineModel.animate) {
          try {
            spineModel.animate();
            console.log("使用animate方法播放动画");
            return;
          } catch (e) {
            console.warn("animate方法失败:", e);
          }
        }

        console.warn("模型没有可用的动画");
        return;
      }

      console.log("找到动画:", animations.map(a => a.name || a).join(', '));

      // 按优先级尝试播放动画
      const animationPriority = [
        // 常见的闲置动画名称
        'Idle', 'idle', 'Idle_01', 'idle_01', 'Stand', 'stand',
        // 常见的循环动画
        'Loop', 'loop', 'Default', 'default',
        // 其他可能的动画名称
        'Animation', 'animation'
      ];

      // 首先尝试按优先级播放
      for (const animName of animationPriority) {
        const anim = animations.find(a => {
          // 处理不同的动画对象结构
          const name = a.name || a;
          return name === animName || (typeof name === 'string' && name.includes(animName));
        });

        if (anim) {
          const animName = anim.name || anim;
          console.log(`自动播放动画: ${animName}`);
          try {
            if (spineModel.state) {
              spineModel.state.setAnimation(0, animName, loop);
              return;
            }
          } catch (e) {
            console.warn(`设置动画 ${animName} 失败:`, e);
          }
        }
      }

      // 如果没有匹配的优先级动画，播放第一个动画
      try {
        const firstAnim = animations[0];
        const firstAnimName = firstAnim.name || firstAnim;
        console.log(`未找到优先级动画，播放第一个动画: ${firstAnimName}`);
        if (spineModel.state) {
          spineModel.state.setAnimation(0, firstAnimName, loop);
        }
      } catch (e) {
        console.warn("播放第一个动画失败:", e);
      }
    } catch (error) {
      console.error("自动检测动画失败:", error);
    }
  }

  // 清理SpineLoader资源（轻量化清理）
  cleanup() {
    console.log('开始清理SpineLoader资源（轻量化）...');

    // 不再清理缓存，避免频繁清理导致卡顿
    // this.clearAllCache();

    // 不再强制垃圾回收
    // this.forceGarbageCollection();

    // 只清理必要的引用
    this.app = null;

    console.log('SpineLoader轻量化清理完成（缓存保留）');
  }
}

// 将SpineLoader类暴露为全局变量
window.SpineLoader = SpineLoader;