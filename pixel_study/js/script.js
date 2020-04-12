(() => {
  let canvas = null
  let ctx = null
  let image = null
  let filterList = {} 
  const CANVAS_SIZE = 512

  /**
   * loadしたら処理を設定
   */
  window.addEventListener('load', () => {
    imageLoader('./image/sample.jpg', (loadedImage) => {
      image = loadedImage
      settingEvent()
      initialize()
      render()
    })
  })

  /**
   * イベントを設定する
   */
  function settingEvent () {
    let btn = document.body.querySelectorAll('.btn')
    Array.prototype.forEach.call(btn, (el) => {
      el.addEventListener('click', () => {
        let type = el.getAttribute('data-type')
        if (!filterList[type]) {
          filterList[type] = true
          el.value = el.value.replace('ON', 'OFF')
        } else {
          filterList[type] = false
          el.value = el.value.replace('OFF', 'ON')
        }
        render()
      })
    })
  }

  /**
   * canvasやコンテキストを初期化する
   */
  function initialize () {
    canvas = document.body.querySelector('#main_canvas')
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    ctx = canvas.getContext('2d')
  }

  /**
   * 描画処理を行う
   */
  function render () {
    // 画像を描画
    ctx.drawImage(image, 0, 0)
    // canvasからImageDataを抽出
    let imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    
    // フィルタ処理を実行する
    if (filterList['invert']) {
      imageData = invertFilter(imageData)
    }
    if (filterList['grayscale']) {
      imageData = grayscaleFilter(imageData)
    }
    if (filterList['binarization']) {
      imageData = binarizationFilter(imageData)
    }
    if (filterList['laplacian']) {
      imageData = laplacianFilter(imageData)
    }
    if (filterList['median']) {
      imageData = medianFilter(imageData)
    }
    if (filterList['mosic']) {
      imageData = mosicFilter(imageData, 10)
    }

    // canvasに対してImageDataを書き戻す
    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * ネガポジ反転フィルタを行う
   * @param {ImageData} imageData 
   * @return {ImageData}
   */
  function invertFilter (imageData) {
    let width = imageData.width
    let height = imageData.height
    let data = imageData.data

    // 出力用にImageDataオブジェクトを生成しておく
    let out = ctx.createImageData(width, height)

    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        // ループカウンタから該当するインデックスを求める
        // RGBAの各要素からなることを考慮して4を乗算する
        let index = (i * width + j) * 4
        // インデックスを元にRGBAの各要素にアクセスする
        // 255から減算することで色を反転させる
        out.data[index] = 255 - data[index] // R
        out.data[index + 1] = 255 - data[index + 1] // G
        out.data[index + 2] = 255 - data[index + 2] // B
        out.data[index + 3] = data[index + 3] // A(変更なし)
      }
    }
    return out
  }
  
  /**
   * グレースケールフィルタを行う
   * @param {ImageData} imageData 
   * @return {ImageData}
   */
  function grayscaleFilter (imageData) {
    let width = imageData.width
    let height = imageData.height
    let data = imageData.data
    let out = ctx.createImageData(width, height)
    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        let index = (i * width + j) * 4
        let r = data[index]
        let g = data[index + 1]
        let b = data[index + 2]
        let luminance = (r + g + b) / 3
        out.data[index] = luminance 
        out.data[index + 1] = luminance 
        out.data[index + 2] = luminance
        out.data[index + 3] = data[index + 3] // A(変更なし)
      }
    }
    return out
  }

  /**
   * 2値化フィルタを行う
   * @param {ImageData} imageData 
   * @return {ImageData}
   */
  function binarizationFilter (imageData) {
    let width = imageData.width
    let height = imageData.height
    let data = imageData.data
    let out = ctx.createImageData(width, height)
    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        let index = (i * width + j) * 4
        let r = data[index]
        let g = data[index + 1]
        let b = data[index + 2]
        let luminance = (r + g + b) / 3
        let value = luminance >= 128 ? 255 : 0
        out.data[index] = value
        out.data[index + 1] = value
        out.data[index + 2] = value
        out.data[index + 3] = data[index + 3] // A(変更なし)
      }
    }
    return out
  }

  /**
   * ラプラシアンフィルタを行う（エッジ検出）
   * @param {ImageData} imageData 
   * @return {ImageData}
   */
  function laplacianFilter (imageData) {
    let width = imageData.width
    let height = imageData.height
    let data = imageData.data
    let out = ctx.createImageData(width, height)
    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        let index = (i * width + j) * 4

        // 上下左右のピクセルの位置を求める
        let topIndex = (Math.max(i - 1, 0) * width + j) * 4
        let bottomIndex = (Math.min(i + 1, height - 1) * width + j) * 4
        let leftIndex = (i * width + Math.max(j - 1, 0)) * 4
        let rightIndex = (i * width + Math.min(j + 1, width - 1)) * 4

        // 上下左右の色は加算、中心の色は−4乗算してから加算する
        let r = data[topIndex] + data[bottomIndex] + data[leftIndex] + data[rightIndex] + data[index] * -4
        let g = data[topIndex + 1] + data[bottomIndex + 1] + data[leftIndex + 1] + data[rightIndex + 1] + data[index + 1] * -4
        let b = data[topIndex + 2] + data[bottomIndex + 2] + data[leftIndex + 2] + data[rightIndex + 2] + data[index + 2] * -4

        // 絶対値の合計を均等化してRGBに書き出す
        let value = (Math.abs(r) + Math.abs(g) + Math.abs(b)) / 3
        out.data[index] = value
        out.data[index + 1] = value
        out.data[index + 2] = value
        out.data[index + 3] = data[index + 3] // A(変更なし)
      }
    }
    return out
  }

  /**
   * メディアンフィルタを行う
   * @param {ImageData} imageData 
   * @return {ImageData}
   */
  function medianFilter (imageData) {
    let width = imageData.width
    let height = imageData.height
    let data = imageData.data
    let out = ctx.createImageData(width, height)
    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        let index = (i * width + j) * 4

        // 上下左右のピクセルの位置を求める
        let topIndex = (Math.max(i - 1, 0) * width + j) * 4
        let bottomIndex = (Math.min(i + 1, height - 1) * width + j) * 4
        let leftIndex = (i * width + Math.max(j - 1, 0)) * 4
        let rightIndex = (i * width + Math.min(j + 1, width - 1)) * 4

        // 斜めのピクセルを求める
        let topLeftIndex = (Math.max(i - 1, 0) * width + Math.max(j - 1, 0)) * 4
        let bottomLeftIndex = (Math.min(i + 1, height - 1) * width + Math.max(j - 1, 0)) * 4 
        let topRightIndex = (Math.max(i + 1, 0) * width + Math.min(j + 1, width - 1)) * 4
        let bottomRightIndex = (Math.min(i + 1, height - 1) * width + Math.min(j + 1, width - 1)) * 4

        // すべてのピクセルの輝度を求めた上で本来のインデックスとともに配列に格納
        let luminanceArray = [
          { index: index, luminance: getLuminance(data, index) },
          { index: topIndex, luminance: getLuminance(data, topIndex) },
          { index: bottomIndex, luminance: getLuminance(data, bottomIndex) },
          { index: leftIndex, luminance: getLuminance(data, leftIndex) },
          { index: rightIndex, luminance: getLuminance(data, rightIndex) },
          { index: topLeftIndex, luminance: getLuminance(data, topLeftIndex) },
          { index: bottomLeftIndex, luminance: getLuminance(data, bottomLeftIndex) },
          { index: topRightIndex, luminance: getLuminance(data, topRightIndex) },
          { index: bottomRightIndex, luminance: getLuminance(data, bottomRightIndex) }
        ]

        // 配列内の輝度値を基準にソートする
        luminanceArray.sort((a, b) => {
          return a.luminance - b.luminance
        })

        // 中央値を取り出す
        let sorted = luminanceArray[4]

        // 対象のインデックスを持つピクセルの色を書き出す
        out.data[index] = data[sorted.index]
        out.data[index + 1] = data[sorted.index + 1]
        out.data[index + 2] = data[sorted.index + 2]
        out.data[index + 3] = data[sorted.index + 3]
      }
    }
    return out
  }

  /**
   * ImageDataの要素から輝度を算出する
   * @param {Unit8ClampedArray} data 
   * @param {number} index 
   * @return {number} RGBを均等化した輝度値
   */
  function getLuminance (data, index) {
    let r = data[index]
    let g = data[index + 1]
    let b = data[index + 2]
    return (r + g + b) / 3
  }

  /**
   * モザイクフィルタを行う
   * @param {ImageData} imageData 
   * @return {ImageData}
   */
  function mosicFilter (imageData, blockSize) {
    let width = imageData.width
    let height = imageData.height
    let data = imageData.data
    let out = ctx.createImageData(width, height)
    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        let index = (i * width + j) * 4
        let x = Math.floor(j / blockSize) * blockSize
        let y = Math.floor(i / blockSize) * blockSize
        let floorIndex = (y * width + x) * 4
        out.data[index] = data[floorIndex]
        out.data[index + 1] = data[floorIndex + 1] 
        out.data[index + 2] = data[floorIndex + 2] 
        out.data[index + 3] = data[floorIndex + 3] 
      }
    }
    return out
  }

  /**
   * 画像をロードしてコールバック関数にロードした画像を与え呼び出す
   * @param {string} path 
   * @param {function} callback 
   */
  function imageLoader (path, callback) {
    let target = new Image()
    target.addEventListener('load', () => {
      if (callback) {
        callback(target)
      }
    })
    target.src = path
  }
})()