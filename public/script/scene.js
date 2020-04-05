/**
 * シーンを管理するためのクラス
 */
class SceneManager {
  constructor () {
    /**
     * シーンを格納するためのオブジェクト
     * @type {object}
     */
    this.scene = {}

    /**
     * 現在アクティブなシーン
     * @type {function}
     */
    this.activeScene = null

    /**
     * 現在のシーンがアクティブになったときのタイムスタンプ
     * @type {number}
     */
    this.startTime = null

    /**
     * 現在のシーンがアクティブになってからのシーンの実行回数
     * @type {nuber}
     */
    this.frame = null
  }

  /**
   * シーンを追加する 
   * @param {string} name - シーンの名前 
   * @param {function} updateFunction - シーン中の処理 
   */
  add (name, updateFunction) {
    this.scene[name] = updateFunction
  }

  /**
   * アクティブなシーンを設定する
   * @param {string} name 
   */
  use (name) {
    if (!this.scene.hasOwnProperty(name)) {
      return
    }

    this.activeScene = this.scene[name]
    this.startTime = Date.now()
    this.frame = -1
  }

  /**
   * シーンを更新する
   */
  update () {
    let activeTime = (Date.now() - this.startTime) / 1000
    this.activeScene(activeTime)
    ++this.frame
  }
}