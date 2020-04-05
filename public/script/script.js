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
     * 的キャラクターのインスタンス数
     * @type {number}
     */
    const ENEMY_MAX_COUNT = 10

    /**
     * 敵キャラクターのショットの最大個数
     * @type {Array<Shot>}
     */
    const ENEMY_SHOT_MAX_COUNT = 50

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
     * シーンマネージャー
     * @type {SceneManager}
     */
    let scene = null

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

    /**
     * シングルショットのインスタンスを格納する配列
     * @type {Array<Shot>}
     */
    let singleShotArray = []

    /**
     * 敵キャラクターのインスタンスを格納する配列
     * @type {Array<Enemy>}
     */
    let enemyArray = []

    /**
     * 敵キャラクターのショットのインスタンスを格納する配列
     * @type {Array<Shot>}
     */
    let enemyShotArray = []
    
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

        scene = new SceneManager()

        // 自機の初期化
        viper = new Viper(ctx, 0, 0, 64, 64, './image/viper.png')
        viper.setComing(
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT - 100
        )
        
        // 敵のキャラクターのショットを初期化
        for (let i = 0; i < ENEMY_SHOT_MAX_COUNT; ++i) {
            enemyShotArray[i] = new Shot(ctx, 0, 0, 32, 32, './image/enemy_shot.png')
        }

        // 敵キャラクターを初期化する
        for (let i = 0; i < ENEMY_MAX_COUNT; i++) {
            enemyArray[i] = new Enemy(ctx, 0, 0, 48, 48, './image/enemy_small.png')        
            enemyArray[i].setShotArray(enemyShotArray)
        }

        // ショットを初期化する
        for (let i = 0; i < SHOT_MAX_COUNT; i++) {
            shotArray[i] = new Shot(ctx, 0, 0, 32, 32, './image/viper_shot.png')
            singleShotArray[i * 2] = new Shot(ctx, 0, 0, 32, 32, './image/viper_single_shot.png')
            singleShotArray[i * 2 + 1] = new Shot(ctx, 0, 0, 32, 32, './image/viper_single_shot.png')
        }
        viper.setShotArray(shotArray, singleShotArray)
    }

    /**
     * リソースなどの読み込みが完了したら描画を開始する
     */
    function loadCheck () {
        let ready = true
        ready = ready && viper.ready
        shotArray.map((v) => ready = ready && v.ready)
        singleShotArray.map((v) => ready = ready && v.ready)
        enemyArray.map((v) => ready = ready && v.ready)
        enemyShotArray.map((v) => ready = ready && v.ready)
        if (ready) {
            eventSetting()
            sceneSetting()
            startTime = Date.now()
            render()
        } else {
            // 0.1秒ごとに再度確認する
            setTimeout(loadCheck, 100)
        }
    }

    /**
     * シーンを設定する
     */
    function sceneSetting () {
        scene.add('intro', (time) => {
            if (time > 2.0) {
                scene.use('invade')
            }
        })
        scene.add('invade', (time) => {
            // シーンのフレームが0のとき以外は即座に終了する
            if (scene.frame === 0) {
                // ライフが0の状態のキャラクターが見つかったら配置する
                for (let i = 0; i < ENEMY_MAX_COUNT; ++i) {
                    if (enemyArray[i].life <= 0) {
                        let e = enemyArray[i]
                        e.set(CANVAS_WIDTH/ 2, -e.height)
                        e.setVector(0.0, 1.0)
                        break
                    }
                }
            }
            if (scene.frame === 100) {
                scene.use('invade')
            }
        })
        scene.use('intro')
    }
    
    /**
     * 描画
     */
    function render () {
        ctx.globalAlpha = 1.0
        util.drawRect(0, 0, canvas.width, canvas.height, '#eeeeee')
        let nowTime = Date.now() / 1000
        viper.update()
        scene.update()
        shotArray.map((v) => v.update())
        singleShotArray.map((v) => v.update())
        enemyArray.map((v) => v.update())
        enemyShotArray.map((v) => v.update())
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