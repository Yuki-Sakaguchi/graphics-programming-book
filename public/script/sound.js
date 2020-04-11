/**
 * 効果音をならすためのクラス
 */
class Sound {
  /**
   * @constructor
   */
  constructor () {
    /**
     * @type {AudioContext}
     */
    this.ctx = new AudioContext()

    /**
     * @type {AudioBuffer}
     */
    this.source = null
  }

  /**
   * オーディオファイルをロードする
   * @param {string} audioPath 
   * @param {function} callback 
   */
  load (audioPath, callback) {
    fetch(audioPath)
    .then((responce) => {
      // ロード完了したレスポンスからAudioBuffer生成のためのデータを取り出す
      return responce.arrayBuffer()  
    })
    .then((buffer) => {
      // 取り出したデータからAudioBufferを生成する
      return this.ctx.decodeAudioData(buffer)
    })
    .then((decodeAudio) => {
      // 再利用できるようにAudioBufferをプロパティに保存し、callback関数を実行
      this.source = decodeAudio
      callback()
    })
    .catch(() => {
      callback('error')
    })
  }

  /**
   * AudioBufferからAudioBufferSourceNodeを再生する
   */
  play () {
    let node = new AudioBufferSourceNode(this.ctx, { buffer: this.source })
    node.connect(this.ctx.destination)
    node.addEventListener('ended', () => {
      node.stop()
      node.disconnect()
      node = null
    })
    node.start()
  }
}