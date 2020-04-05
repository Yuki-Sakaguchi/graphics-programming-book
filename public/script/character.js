/**
 * 座標を管理するためのクラス
 */
class Position {
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
    super(ctx, x, y, w, h, 0, imagePath)

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
    if (this.position.y + this.height < 0 
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
        v.life -= this.power
        if (v.life <= 0) {
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
   */
  fire (x = 0.0, y = 1.0) {
    for (let i = 0; i < this.shotArray.length; ++i) {
      if (this.shotArray[i].life <= 0) {
        this.shotArray[i].set(this.position.x, this.position.y)
        this.shotArray[i].setSpeed(5.0)
        this.shotArray[i].setVector(x, y)
        break
      }
    }
  }

  /**
   * 更新
   */
  update () {
    if (this.life <= 0) {
      return
    }
    switch (this.type) {
      case 'default':
      default:
        if (this.frame === 50) {
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
     * @type {number}
     */
    this.fireSize = size

    /**
     * @type {Array<Position>}
     */
    this.firePosition = []

    /**
     * @type {Array<Position>}
     */
    this.fireVector = []
  }

  /**
   * 位置を設定
   * @param {number} x 
   * @param {number} y 
   */
  set (x, y) {
    for (let i = 0; i < this.count; ++i) {
      this.firePosition[i] = new Position(x, y)
      let r = Math.random() * Math.PI * 2.0 // 0〜6.28（一周分の数値）
      let s = Math.sin(r)
      let c = Math.cos(r)
      this.fireVector[i] = new Position(c, s)
    }
    this.life = true
    this.startTime = Date.now()
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
    let progress = Math.min(time / this.timeRange, 1.0)

    // 進捗に合わせて描画
    for (let i = 0; i < this.firePosition.length; ++i) {
      let d = this.radius * progress
      let x = this.firePosition[i].x + this.fireVector[i].x * d
      let y = this.firePosition[i].y + this.fireVector[i].y * d
      this.ctx.fillRect(
        x - this.fireSize/2,
        y - this.fireSize/2,
        this.fireSize,
        this.fireSize
      )
    }

    if (progress >= 1.0) {
      this.life = false
    }
  }
}