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
   * 
   * @param {number} x - 設定するx座標 
   * @param {number} y - 設定するy座標
   */
  set (x, y) {
    if (x != null) this.x = x
    if (y != null) this.y = y
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
    this.image.addEventListener('load', () => {
      this.ready = true
    })
    this.image.src = imagePath

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
   */
  setShotArray (shotArray) {
    this.shotArray = shotArray
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
          for (let i = 0; i < this.shotArray.length; ++i) {
            if (this.shotArray[i].life <= 0) {
              this.shotArray[i].set(this.position.x, this.position.y)
              this.shotCheckCounter = -this.shotInterval // 打ったら次打てるまでの間隔を初期化
              break
            }
          }
        }
      }
    }

    ++this.shotCheckCounter

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
     * ショットの進行方向
     * @type {Position}
     */
    this.vector = new Position(0.0, -1.0)
  }

  /**
   * ショットを配置する
   * @param {number} x 
   * @param {number} y 
   */
  set (x, y) {
    this.position.set(x, y)
    this.life = 1
  }

  /**
   * ショットの進行方向を設定する 
   * @param {number} x 
   * @param {number} y 
   */
  setVector (x, y) {
    this.vector.set(x, y)
  }

  /**
   * キャラクターの状態を更新し描画を行う
   */
  update () {
    // ライフが０の場合は何もしない
    if (this.life <= 0) return

    // 画面外に移動したらライフを０にする
    if (this.position.y + this.height < 0) {
      this.life = 0
    }

    // ショットを進行方向に沿って移動させる 
    this.position.x += this.vector.x * this.speed
    this.position.y += this.vector.y * this.speed

    // ショットを描画
    this.draw()
  }
}