(() => {
    /**
     * キーの押下状態を調べるためのオブジェクト
     * このオブジェクトはプロジェクトのどこからでも参照できるように
     * windowオブジェクトを拡張しています
     */
    window.isKeyDown = {}

    /**
     * canvasの幅
     * @type {number}
     */
    const CANVAS_WIDTH = 640

    /**
     * canvasの高さ
     * @type {number}
     */
    const CANVAS_HEIGHT = 480

    /**
     * ショットの最大個数
     * @type {number}
     */
    const SHOT_MAX_COUNT = 10

    /**
     * Caanvas2D APIをラップしたユーティリティクラス
     * @type {Canvas2DUtility}
     */
    let util = null

    /**
     * 描画対象となる Canvas Element
     * @type {HTMLCanvasElement}
     */
    let canvas = null

    /**
     * Canvas2D API のコンストラクタ
     * @type {CanvasRenderingContext2D}
     */
    let ctx = null

    /**
     * イメージのインスタンス
     * @type {Image}
     */
    let image = null

    /**
     * 実行開始時のタイムスタンプ
     * @type {number}
     */
    let startTime = null

    /**
     * 自機キャラクターのインスタンス
     * @type {Viper}
     */
    let viper = null

    /**
     * ショットのインスタンスを格納する配列
     * @type {Array<Shot>}
     */
    let shotArray = []

    window.addEventListener('load', () => {
        util = new Canvas2DUtility(document.body.querySelector('#main_canvas'))
        canvas = util.canvas
        ctx = util.context
        initialize()
        loadCheck()
    })

    /**
     * 初期化
     */
    function initialize () {
        canvas.width = CANVAS_WIDTH
        canvas.height = CANVAS_HEIGHT
        isComing = true
        comingStart = Date.now()

        // 自機の初期化
        viper = new Viper(ctx, 0, 0, 64, 64, './image/viper.png')
        viper.setComing(
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT - 100
        )

        // ショットを初期化する
        for (let i = 0; i < SHOT_MAX_COUNT; i++) {
            shotArray[i] = new Shot(ctx, 0, 0, 32, 32, './image/viper_shot.png')
        }
        viper.setShotArray(shotArray)
    }

    /**
     * リソースなどの読み込みが完了したら描画を開始する
     */
    function loadCheck () {
        // 準備完了を示す真偽知
        let ready = true

        // 自機が準備完了かどうか
        ready = ready && viper.ready

        // ショットが準備完了しているかどうか
        shotArray.map((v) => {
            ready = ready && v.ready
        })

        if (ready) {
            eventSetting()
            startTime = Date.now()
            render()
        } else {
            // 0.1秒ごとに再度確認する
            setTimeout(loadCheck, 100)
        }
    }
    
    /**
     * 描画
     */
    function render () {
        ctx.globalAlpha = 1.0
        util.drawRect(0, 0, canvas.width, canvas.height, '#eeeeee')
        let nowTime = Date.now() / 1000
        shotArray.map((v) => {
            v.update()
        })
        viper.update()
        requestAnimationFrame(render)
    }

    /**
     * イベントを設定する
     */
    function eventSetting () {
        window.addEventListener('keydown', (event) => {
           isKeyDown[`key_${event.key}`] = true 
        })

        window.addEventListener('keyup', (event) => {
           isKeyDown[`key_${event.key}`] = false 
        })
    }
})()