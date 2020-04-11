/**
 * 座標を管理するためのクラス
 */
class Position {
  /**
   * ベクトルの長さを返す
   * @param {number} x 
   * @param {number} y 
   */
  static calcLength (x, y) {
    return Math.sqrt(x * x + y * y)
  }

  /**
   * ベクトルを単位化した結果を返す
   * @static
   * @param {number} x 
   * @param {number} y 
   */
  static calcNormal (x, y) {
    let len = Position.calcLength(x, y)
    return new Position(x / len, y / len)
  }

  /**
   * @constractor 
   * @param {number} x - x座標 
   * @param {number} y - y座標
   */
  constructor (x, y) {
    /**
     * X座標
     * @type {number}
     */
    this.x = null 

    /**
     * Y座標
     * @type {number}
     */
    this.y = null 

    this.set(x, y)
  }

  /**
   * 配置する
   * @param {number} x - 設定するx座標 
   * @param {number} y - 設定するy座標
   */
  set (x, y) {
    if (x != null) this.x = x
    if (y != null) this.y = y
  }

  /**
   * 対象のPositionクラスのインスタンスとの距離を返す
   * @param {Position} target 
   */
  distance (target) {
    let x = this.x - target.x
    let y = this.y - target.y
    return Math.sqrt(x * x + y * y)
  }

  /**
   * 対象のPositionクラスのインスタンスとの外積を求める
   * @param {Position} target 
   */
  cross (target) {
    return this.x * target.y - this.y * target.x
  }

  /**
   * 自身を単位化したベクトルを計算して返す
   */
  normalize () {
    let l = Math.sqrt(this.x * this.x + this.y * this.y)
    if (l === 0) {
      return new Position(0, 0)
    }
    let x = this.x / l
    let y = this.y / l
    return new Position(x, y)
  }

  /**
   * 指定されたラジアン分だけ自身を回転させる
   * @param {number} radian 
   */
  rotate (radian) {
    let s = Math.sin(radian)
    let c = Math.cos(radian)
    this.x = this.x * c + this.y * -s
    this.y = this.y * s + this.y * c
  }
}


/**
 * キャラクター管理のための基幹クラス
 */
class Character {
  /**
   * @constructor 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x 
   * @param {number} y 
   * @param {number} w 
   * @param {number} h 
   * @param {number} life 
   * @param {Image} image 
   */
  constructor (ctx, x, y, w, h, life, imagePath) {
    /**
     * @type {CanvasRenderingContext2D}
     */
    this.ctx = ctx

    /**
     * @type {Position}
     */
    this.position = new Position(x, y)

    /**
     * ショットの進行方向
     * @type {Position}
     */
    this.vector = new Position(0.0, -1.0)
    
    /**
     * @type {number}
     */
    this.width = w

    /**
     * @type {number}
     */
    this.height = h

    /**
     * @type {number}
     */
    this.life = life

    /**
     * @type {boolean}
     */
    this.ready = false

    /**
     * @type {number}
     */
    this.image = new Image()
    this.image.addEventListener('load', () => this.ready = true)
    this.image.src = imagePath

    /**
     * 角度。スクリーン座標だとした方向が正なので270が真上を向く
     * @type {number}
     */
    this.angle = 270 * Math.PI / 180
  }

  /**
   * 進行方向を設定する
   * @param {number} x - X 方向の移動量
   * @param {number} y - Y 方向の移動量
   */
  setVector(x, y){
      // 自身の vector プロパティに設定する
      this.vector.set(x, y);
  }

  /**
   * 角度を元に進行方向を設定する
   * @param {number} angle 
   */
  setVectorFromAngle (angle) {
    this.angle = angle
    let sin = Math.sin(angle)
    let cos = Math.cos(angle)
    this.vector.set(cos, sin)
  }

  /**
   * 自身の回転量を元に座標系を回転させる
   */
  rotationDraw () {
    this.ctx.save() // 回転する前の状態を保存

    this.ctx.translate(this.position.x, this.position.y) // 自身の位置が座標系の中心点と重なるように平行移動
    this.ctx.rotate(this.angle - Math.PI * 1.5) // 座標を回転させる（270度の位置を基準にするためMath.PI * 1.5を引く。ラジアンだと2πが１週なので1.5は270）

    let offsetX = this.width / 2
    let offsetY = this.height / 2

    this.ctx.drawImage(
      this.image,
      -offsetX,
      -offsetY,
      this.width,
      this.height
    )

    this.ctx.restore() // 座標を回転させる前の状態に戻す
  }

  /**
   * キャラクターを描画する
   */
  draw () {
    let offsetX = this.width / 2
    let offsetY = this.height / 2
    this.ctx.drawImage(
      this.image,
      this.position.x - offsetX,
      this.position.y - offsetY,
      this.width,
      this.height
    )
  }
}


/**
 * Viper クラス
 */
class Viper extends Character {
  /**
   * @constructor 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x 
   * @param {number} y 
   * @param {number} w 
   * @param {number} h 
   * @param {Image} image 
   */
  constructor (ctx, x, y, w, h, imagePath) {
    super(ctx, x, y, w, h, 1, imagePath)

    /**
     * 自身の移動スピード
     * @type {number}
     */
    this.speed = 3

    /**
     * @type {boolean}
     */
    this.isComing = false

    /**
     * @type {number}
     */
    this.comingTime = null

    /**
     * @type {Position}
     */
    this.comingStartPosition = null

    /**
     * @type {Position}
     */
    this.comingEndPosition = null

    /**
     * 自信が持つショットインスタンスの配列
     * @type {Array<Shot>}
     */
    this.shotArray = null
    
    /**
     * 自信が持つシングルショットインスタンスの配列
     * @type {Array<Shot>}
     */
    this.singleShotArray = null

    /**
     * ショットを打った後のチェック用カウンター
     * @type {number}
     */
    this.shotCheckCounter = 0

    /**
     * ショットを打つことができる間隔（フレーム数）
     * @type {number}
     */
    this.shotInterval = 10
  }

  /**
   * 登場演出に関する設定を行う
   * @param {number} startX 
   * @param {number} startY 
   * @param {number} endX 
   * @param {number} endY 
   */
  setComing (startX, startY, endX, endY) {
    this.isComing = true
    this.life = 1
    this.comingTime = Date.now()
    this.position.set(startX, startY)
    this.comingStartPosition = new Position(startX, startY)
    this.comingEndPosition = new Position(endX, endY)
  }

  /**
   * ショットを設定する 
   * @param {Array<Shot>} shotArray 
   * @param {Array<Shot>} singleShotArray 
   */
  setShotArray (shotArray, singleShotArray) {
    this.shotArray = shotArray
    this.singleShotArray = singleShotArray
  }
  
  /**
   * キャラクターの状態を更新し、描画すを行う処理
   */
  update () {
    if (this.life <= 0) return

    let justTime = Date.now()
    
    // 登場完了していない場合は徐々にY座標を移動させる
    if (this.isComing) {
      let comingTime = (justTime - this.comingTime) / 1000
      let y = this.comingStartPosition.y - comingTime * 50

      // 登場完了位置まで移動したらフラグを変更する
      if (y <= this.comingEndPosition.y) {
          this.isComing = false
          y = this.comingEndPosition.y
      }

      this.position.set(this.position.x, y)

      if (justTime % 100 < 50) {
          this.ctx.globalAlpha = 0.5
      }
    } else {
      if (window.isKeyDown.key_ArrowLeft) {
        this.position.x -= this.speed
      }
      if (window.isKeyDown.key_ArrowRight) {
        this.position.x += this.speed
      }
      if (window.isKeyDown.key_ArrowUp) {
        this.position.y -= this.speed
      }
      if (window.isKeyDown.key_ArrowDown) {
        this.position.y += this.speed
      }

      // 自機が画面の外に出ようとしたらここで位置を書き換えて止める
      let canvasWidth = this.ctx.canvas.width
      let canvasHeight = this.ctx.canvas.height
      let tx = Math.min(Math.max(this.position.x, 0), canvasWidth)
      let ty = Math.min(Math.max(this.position.y, 0), canvasHeight)
      this.position.set(tx, ty)

      // ショットボタンを押下したらショットの位置をセット
      if (window.isKeyDown.key_z) {
        // 一定の間隔が空いていないと打てないのでチェック
        if (this.shotCheckCounter >= 0) {
          let i = 0
          for (i = 0; i < this.shotArray.length; ++i) {
            if (this.shotArray[i].life <= 0) {
              this.shotArray[i].set(this.position.x, this.position.y)
              this.shotArray[i].setPower(2)
              this.shotCheckCounter = -this.shotInterval // 打ったら次打てるまでの間隔を初期化
              break
            }
          }
          for (i = 0; i < this.singleShotArray.length; i += 2) {
            if (this.singleShotArray[i].life <= 0 && this.singleShotArray[i + 1].life <= 0) {
              // スクリーン座標だとした方向が正なので、270が真上
              let radCW = 280 * Math.PI / 180 // 右側に10傾ける
              let radCCW = 260 * Math.PI / 180 // 左側に10傾ける
              this.singleShotArray[i].set(this.position.x, this.position.y)
              this.singleShotArray[i].setPower(1)
              this.singleShotArray[i].setVectorFromAngle(radCW)
              this.singleShotArray[i + 1].set(this.position.x, this.position.y)
              this.singleShotArray[i + 1].setVectorFromAngle(radCCW)
              this.shotCheckCounter = -this.shotInterval // 打ったら次打てるまでの間隔を初期化
              break
            }
          }
        }
      }
      ++this.shotCheckCounter
    }

    this.draw()

    this.ctx.globalAlpha = 1.0
  }
}


/**
 * Shot クラス
 */
class Shot extends Character {
  /**
   * @constructor 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x 
   * @param {number} y 
   * @param {number} w 
   * @param {number} h 
   * @param {Image} image 
   */
  constructor (ctx, x, y, w, h, imagePath) {
    super(ctx, x, y, w, h, 0, imagePath)

    /**
     * 自身の移動スピード
     * @type {number}
     */
    this.speed = 7

    /**
     * 自身の攻撃力
     * @type {number}
     */
    this.power = 1

    /**
     * 自身と衝突判定する対象を格納
     * @type {Array<Character>}
     */
    this.targetArray = []

    /**
     * @type {Array<Explosion>}
     */
    this.explosionArray = []
  }

  /**
   * ショットを配置する
   * @param {number} x 
   * @param {number} y 
   */
  set (x, y, speed, power) {
    this.position.set(x, y)
    this.life = 1
    this.setSpeed(speed)
    this.setPower(power)
  }

  /**
   * ショットのスピードを設定する
   * @param {number} speed - 設定するスピード
   */
  setSpeed (speed) {
    if (speed != null && speed > 0) {
      this.speed = speed
    }
  }

  /**
   * ショットの攻撃力を設定する
   * @param {number} power 
   */
  setPower (power) {
    if (power != null && power > 0) {
      this.power = power
    }
  }

  /**
   * ショットが衝突判定を行う対象を設定する
   * @param {Array<Character>} targets 
   */
  setTargets (targets) {
    if (targets != null && Array.isArray(targets) && targets.length > 0) {
      this.targetArray = targets
    }
  }

  /**
   * ショットが爆発エフェクトを発生できるように設定
   * @type {Array<Explosion>}
   */
  setExplosions (targets) {
    if (targets != null && Array.isArray(targets) && targets.length > 0) {
      this.explosionArray = targets
    }
  }
  /**
   * キャラクターの状態を更新し描画を行う
   */
  update () {
    // ライフが０の場合は何もしない
    if (this.life <= 0) return

    // 画面外に移動したらライフを０にする
    if (this.position.x + this.width < 0
    || this.position.x - this.width > this.ctx.canvas.width
    || this.position.y + this.height < 0 
    || this.position.y - this.height > this.ctx.canvas.height) {
      this.life = 0
    }

    // ショットを進行方向に沿って移動させる 
    this.position.x += this.vector.x * this.speed
    this.position.y += this.vector.y * this.speed

    // ショットと対象の衝突判定
    this.targetArray.map((v) => {
      if (this.life <= 0 || v.life <= 0) return
      let dist = this.position.distance(v.position)
      if (dist <= (this.width + v.width) / 4) {
        // 自キャラが対象の場合はisComingの場合は無効
        if (v instanceof Viper) {
          if (v.isComing) return
        }
        v.life -= this.power
        if (v.life <= 0) {
          if (v instanceof Enemy) {
            let score = 100
            if (v.type === 'large') {
              score = 1000
            }
            gameScore = Math.min(gameScore + score, 99999)
          } else if (v instanceof Boss) {
            gameScore = Math.min(gameScore + 15000, 99999)
          }
          for (let i = 0; i < this.explosionArray.length; ++i) {
            if (!this.explosionArray[i].life) {
              this.explosionArray[i].set(v.position.x, v.position.y)
              break
            }
          }
        }
        this.life = 0
      }
    })

    // ショットを描画
    this.rotationDraw()
  }
}

/**
 * homing shot クラス
 */
class Homing extends Shot {
  /**
   * @constructor
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x 
   * @param {number} y 
   * @param {number} w 
   * @param {number} h 
   * @param {Image} imagePath 
   */
  constructor (ctx, x, y, w, h, imagePath) {
    super(ctx, x, y, w, h, imagePath)

    /**
     * @type {number}
     */
    this.frame = 0
  }

  /**
   * ホーミングショットを配置する
   * @param {number} x 
   * @param {number} y 
   * @param {number} speed 
   * @param {number} power 
   */
  set (x, y, speed, power) {
    this.position.set(x, y)
    this.life = 1
    this.setSpeed(speed)
    this.setPower(power)
    this.frame = 0
  }

  update () {
    if (this.life <= 0) return 

    // 画面外に移動したらライフを０にする
    if (this.position.x + this.width < 0
    || this.position.x - this.width > this.ctx.canvas.width
    || this.position.y + this.height < 0 
    || this.position.y - this.height > this.ctx.canvas.height) {
      this.life = 0
    }

    // 発射されてから100フレーム立つまではホーミングする
    let target = this.targetArray[0]
    if (this.frame < 100) {
      // ターゲットとホーミングショットの相対位置からベクトルを生成
      let vector = new Position(
        target.position.x - this.position.x,
        target.position.y - this.position.y
      )
      // 生成したベクトルを単位化する
      let normalizedVector = vector.normalize()
      // 自分自身のベクトルも単位化
      this.vector = this.vector.normalize()
      // 2つの単位化済みのベクトルから外積を計算する
      let cross = this.vector.cross(normalizedVector)
      // 外戚の結果はスクリーン空間では以下のように説明できる
      // 結果が0.0　＝　真正面か真後ろ
      // 結果がプラス　＝　右半分の方向
      // 結果がマイナス　＝　左半分の方向
      // １フレームで回転できる量は度数法で約１度程度に設定する
      let rad = Math.PI / 180
      if (cross > 0.0) {
        // 右にいる場合は時計回り
        this.vector.rotate(rad)
      } else {
        // 左にいる場合は反時計回り
        this.vector.rotate(-rad)
      }
    }

    // 進行方向ベクトルを元に移動
    this.position.x += this.vector.x * this.speed
    this.position.y += this.vector.y * this.speed

    // 自身の進行方向からアングルを計算
    this.angle = Math.atan2(this.vector.y, this.vector.x)

    // 衝突判定
    this.targetArray.map((v) => {
      if (this.life <= 0 || v.life <= 0) return
      let dist = this.position.distance(v.position)
      if (dist <= (this.width + v.width) / 4) {
        if (v instanceof Viper) {
          if (v.isComing) return
        }
        v.life -= this.power
        if (v.life <= 0) {
          for (let i = 0; i < this.explosionArray.length; ++i) {
            if (!this.explosionArray[i].life) {
              this.explosionArray[i].set(v.position.x, v.position.y)
              break
            }
          }
          if (v instanceof Enemy) {
            let score = 100
            if (v.type === 'large') {
              score = 1000
            }
            gameScore = Math.min(gameScore + score, 99999)
          }
        }
        this.life = 0
      }
    })
    this.rotationDraw()
    ++this.frame
  }
}

/**
 * 敵クラス 
 */        
class Enemy extends Character {
  constructor (ctx, x, y, w, h, imagePath) {
    super(ctx, x, y, w, h, 0, imagePath)

    /**
     * 自身のタイプ
     * @type {string}
     */
    this.type = 'default'

    /**
     * 自身のフレーム
     * @type {number}
     */
    this.frame = 0

    /**
     * @type {number}
     */
    this.speed = 3

    /**
     * 自身がもつショットインスタンスの配列
     * @type {Array<Shot>}
     */
    this.shotArray = null
    
    /**
     * 自身が攻撃対象とするCharacter由来のインスタンス
     * @type {Character}
     */
    this.attackTarget = null
  }

  /**
   * 配置する
   * @param {number} x 
   * @param {number} y 
   * @param {number} life 
   * @param {string} type 
   */
  set (x, y, life = 1, type = 'default') {
    this.position.set(x, y)
    this.life = life
    this.type = type
    this.frame = 0
  }

  /**
   * ショットを設定する 
   * @param {Array<Shot>} shotArray 
   */
  setShotArray (shotArray) {
    this.shotArray = shotArray
  }
  
  /**
   * 自身から指定された方向にショットを放つ
   * @param {number} [x=0.0] - 進行方向ベクトルのX要素 
   * @param {number} [y=1.0] - 進行方向ベクトルのY要素 
   * @param {number} [speed=5.0] - ショットのスピード
   */
  fire (x = 0.0, y = 1.0, speed = 5.0) {
    for (let i = 0; i < this.shotArray.length; ++i) {
      if (this.shotArray[i].life <= 0) {
        this.shotArray[i].set(this.position.x, this.position.y)
        this.shotArray[i].setSpeed(speed)
        this.shotArray[i].setVector(x, y)
        break
      }
    }
  }

  /**
   * 攻撃対象を設定する
   * @param {Character} target - 自身が攻撃対象とするインスタンス
   */
  setAttackTarget (target) {
    this.attackTarget = target
  }

  /**
   * 更新
   */
  update () {
    if (this.life <= 0) {
      return
    }
    switch (this.type) {

      // 蛇行しながらプレイヤーに向かってたまを打つ
      case 'wave':
        if (this.frame % 60 === 0) {
          let tx = this.attackTarget.position.x - this.position.x
          let ty = this.attackTarget.position.y - this.position.y
          let tv = Position.calcNormal(tx, ty)
          this.fire(tv.x, tv.y, 4.0)
        }
        this.position.x += Math.sin(this.frame / 10)
        this.position.y += 2.0
        if (this.position.y - this.height > this.ctx.canvas.height) {
          this.life = 0
        }
        break

      // 周囲にたまを放つ
      case 'large':
        if (this.frame % 50 === 0) {
          for (let i = 0; i < 360; i += 45) {
            let r = i * Math.PI / 180
            let s = Math.sin(r)
            let c = Math.cos(r)
            this.fire(c, s, 3.0)
          }
        }
        this.position.x += Math.sin((this.frame + 90) / 50) * 2.0
        this.position.y += 1.0
        if (this.position.y - this.height > this.ctx.canvas.height) {
          this.life = 0
        }
        break

      // まっすぐたまを打つ
      case 'default':
      default:
        if (this.frame === 100) {
          this.fire()
        }
        this.position.x += this.vector.x * this.speed
        this.position.y += this.vector.y * this.speed
        if (this.position.y - this.height > this.ctx.canvas.height) {
          this.life = 0
        }
        break
    }
    this.draw()
    ++this.frame
  }
}


/**
 * 爆発クラス
 */
class Explosion {
  /**
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} radius 
   * @param {number} count 
   * @param {number} size 
   * @param {number} timeRange 
   * @param {string} color 
   */
  constructor (ctx, radius, count, size, timeRange, color = '#ff1166') {
    /**
     * @type {CanvasRenderingContext2D}
     */
    this.ctx = ctx

    /**
     * @type {boolean}
     */
    this.life = false

    /**
     * @type {string}
     */
    this.color = color
    
    /**
     * @type {Position}
     */
    this.position = null

    /**
     * @type {number}
     */
    this.radius = radius

    /**
     * @type {number}
     */
    this.count = count

    /**
     * @type {number}
     */
    this.startTime = 0
    
    /**
     * @type {number}
     */
    this.timeRange = timeRange
    
    /**
     * @type {number} - 火花の1つ当たりの最大の大きさ（幅、高さ）
     */
    this.fireBaseSize = size

    /**
     * @type {Array<Position>} - 火花の1つ中の大きさを格納する
     */
    this.fireSize = []

    /**
     * @type {Array<Position>}
     */
    this.firePosition = []

    /**
     * @type {Array<Position>}
     */
    this.fireVector = []

    /**
     * @type {Sound}
     */
    this.sound = null
  }

  /**
   * 位置を設定
   * @param {number} x 
   * @param {number} y 
   */
  set (x, y) {
    for (let i = 0; i < this.count; ++i) {
      this.firePosition[i] = new Position(x, y)
      let vr = Math.random() * Math.PI * 2.0 // 0〜6.28（一周分の数値）
      let s = Math.sin(vr)
      let c = Math.cos(vr)
      let mr = Math.random()
      this.fireVector[i] = new Position(c * mr, s * mr)
      this.fireSize[i] = (Math.random() * 0.5 + 0.5) * this.fireBaseSize
    }
    this.life = true
    this.startTime = Date.now()

    if (this.sound) {
      this.sound.play()
    }
  }

  /**
   * 効果音を設定
   * @param {Sound} sound 
   */
  setSound (sound) {
    this.sound = sound
  }

  /**
   * 更新
   */
  update () {
    if (!this.life) return 
    // 色を設定
    this.ctx.fillStyle = this.color
    this.ctx.globalAlpha = 0.5
    // 発生した時間との差分を取得
    let time = (Date.now() - this.startTime) / 1000
    // 爆発終了までの進捗
    let ease = simpleEaseIn(1.0 - Math.min(time / this.timeRange, 1.0))
    let progress = 1.0 - ease

    // 進捗に合わせて描画
    for (let i = 0; i < this.firePosition.length; ++i) {
      let d = this.radius * progress
      let x = this.firePosition[i].x + this.fireVector[i].x * d
      let y = this.firePosition[i].y + this.fireVector[i].y * d
      let s = 1.0 - progress
      this.ctx.fillRect(
        x - (this.fireSize[i] * s)/2,
        y - (this.fireSize[i] * s)/2,
        this.fireSize[i] * s,
        this.fireSize[i] * s
      )
    }

    if (progress >= 1.0) {
      this.life = false
    }
  }
}


/**
 * 背景の星クラス
 */
class BackgroundStar {
  /**
   * @constructor
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} size 
   * @param {number} speed 
   * @param {string} color 
   */
  constructor (ctx, size, speed, color = '#ffffff') {
    /**
     * @type {CanvasRenderingContext2D}
     */
    this.ctx = ctx

    /**
     * @type {number}
     */
    this.size = size

    /**
     * @type {number}
     */
    this.speed = speed

    /**
     * @type {string}
     */
    this.color = color

    /**
     * @type {Position}
     */
    this.position = null
  }

  /**
   * 位置を設定する
   * @param {number} x 
   * @param {number} y 
   */
  set (x, y) {
    this.position = new Position(x, y)
  }

  /**
   * 更新
   */
  update () {
    this.ctx.fillStyle = this.color
    this.position.y += this.speed
    this.ctx.fillRect(
      this.position.x - this.size / 2,
      this.position.y - this.size / 2,
      this.size,
      this.size
    )
    if (this.position.y + this.size > this.ctx.canvas.height) {
      this.position.y = -this.size
    }
  }
}


/**
 * ボスキャラクターのクラス
 */
class Boss extends Character {
  /**
   * @constructor
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x 
   * @param {number} y 
   * @param {number} w 
   * @param {number} h 
   * @param {Image} imagePath 
   */
  constructor (ctx, x, y, w, h, imagePath) {
    super(ctx, x, y, w, h, 0, imagePath)

    /**
     * 自身のモード
     * @type {string}
     */
    this.mode = ''

    /**
     * @type {number}
     */
    this.frame = 0

    /**
     * @type {number}
     */
    this.speed = 3

    /**
     * @type {Array<Shot>}
     */
    this.shotArray = null

    /**
     * @type {Array<Homing>}
     */
    this.homingArray = null

    /**
     * @type {Character}
     */
    this.attackTarget = null
  }

  /**
   * ボスを配置する
   * @param {number} x 
   * @param {number} y 
   * @param {number} life 
   */
  set (x, y, life = 1) {
    this.position.set(x, y)
    this.life = life
    this.frame = 0
  }

  /**
   * モードを設定する
   * @param {string} mode 
   */
  setMode (mode) {
    this.mode = mode
  }

  /**
   * ショットを設定する
   * @param {Array<Shot>} shotArray 
   */
  setShotArray (shotArray) {
    this.shotArray = shotArray
  }

  /**
   * ショーミングショットを設定する
   * @param {Array<Homing>} homingArray 
   */
  setHomingArray (homingArray) {
    this.homingArray = homingArray
  }

  /**
   * 攻撃対象を設定する
   * @param {Character} target 
   */
  setAttackTarget (target) {
    this.attackTarget = target
  }

  /**
   * 更新
   */
  update () {
    if (this.life <= 0) return

    switch (this.mode) {
      // 出現演出時
      case 'invade':
        this.position.y += this.speed
        if (this.position.y > 100) {
          this.position.y = 100
          this.mode = 'floating'
          this.frame = 0
        }
        break
      
      // 退避する演出
      case 'escape':
        this.position.y -= this.speed
        if (this.position.y < -this.height) {
          this.life = 0
        }
        break
      
      // とどまっているとき
      case 'floating':
        if (this.frame % 1000 < 500) {
          // 配置後、500フレーム以内の場合
          if (this.frame % 200 > 140 && this.frame % 10 === 0) {
            let tx = this.attackTarget.position.x - this.position.x
            let ty = this.attackTarget.position.y - this.position.y
            let tv = Position.calcNormal(tx, ty)
            this.fire(tv.x, tv.y)
          }
        } else {
          // 配置後、500フレーム以降の場合
          if (this.frame % 50 === 0) {
            this.homingFire(0, 1, 3.5)
          }
        }
        // 常に左右に移動し続ける
        this.position.x += Math.cos(this.frame / 100) * 2.0
        break
    }
    this.draw()
    ++this.frame
  }

  /**
   * 自信から指定された方向にショットを放つ
   * @param {number} x 
   * @param {number} y 
   * @param {number} speed 
   */
  fire (x = 0.0, y = 1.0, speed = 0.5) {
    for (let i = 0; i < this.shotArray.length; ++i) {
      if (this.shotArray[i].life <= 0) {
        this.shotArray[i].set(this.position.x , this.position.y)
        this.shotArray[i].setSpeed(speed)
        this.shotArray[i].setVector(x, y)
        break
      }
    }
  }

  /**
   * 自信から指定された方向にホーミングショットを放つ
   * @param {number} x 
   * @param {number} y 
   * @param {number} speed 
   */
  homingFire (x = 0.0, y = 1.0, speed = 3.0) {
    for (let i = 0; i < this.homingArray.length; ++i) {
      if (this.homingArray[i].life <= 0) {
        this.homingArray[i].set(this.position.x, this.position.y)
        this.homingArray[i].setSpeed(speed)
        this.homingArray[i].setVector(x, y)
        break
      }
    }
  }
}

function simpleEaseIn (t) {
  return t * t * t * t
}