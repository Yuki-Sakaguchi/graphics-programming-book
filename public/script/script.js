(() => {
    /**
     * キーの押下状態を調べるためのオブジェクト
     * このオブジェクトはプロジェクトのどこからでも参照できるように
     * windowオブジェクトを拡張しています
     * @global
     * @type {Object}
     */
    window.isKeyDown = {}

    /**
     * スコアを格納する
     * @global
     * @type {number}
     */
    window.gameScore = 0

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
     * 敵キャラクターのショットの最大個数
     * @type {Array<Shot>}
     */
    const ENEMY_SHOT_MAX_COUNT = 50

    /**
     * ボスキャラクターのホーミングショットの最大個数
     * @type {number}
     */
    const HOMING_MAX_COUNT = 50

    /**
     * 敵キャラクター(小)のインスタンス数
     * @type {number}
     */
    const ENEMY_SMALL_MAX_COUNT = 20

    /**
     * 敵キャラクター(大)のインスタンス数
     * @type {number}
     */
    const ENEMY_LARGE_MAX_COUNT = 5

    /**
     * 爆発エフェクトの最大個数
     * @type {number}
     */
    const EXPLOSION_MAX_COUNT = 10

    /**
     * 背景を流れる星の個数
     * @type {number}
     */
    const BACKGROUND_STAR_MAX_COUNT = 100

    /**
     * 背景を流れる星の最大サイズ
     * @type {number}
     */
    const BACKGROUND_STAR_MAX_SIZE = 3

    /**
     * 背景を流れる星の最大速度
     * @type {number}
     */
    const BACKGROUND_STAR_MAX_SPEED = 4 
    
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
     * ボスキャラクター
     * @type {Boss}
     */
    let boss = null

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
    
    /**
     * ボスキャラクターのホーミングショットのインスタンスを格納する配列
     * @type {Array<Homing>}
     */
    let homingArray = []

    /**
     * 爆発エフェクトのインスタンスを格納する配列
     * @type {Array<Explosion>}
     */
    let explosionArray = []

    /**
     * 流れる星のインスタンスを格納する配列
     * @type {Array<BackgroundStar>}
     */
    let backgroundStarArray = []

    /**
     * 再スタートするためのフラグ 
     * @type {boolean}
     */
    let restart = false

    /**
     * 効果音再生のためのSoundクラスのインスタンス
     * @type {Sound}
     */
    let sound = null

    /**
     * ページロード時の処理
     */
    window.addEventListener('load', () => {
        util = new Canvas2DUtility(document.body.querySelector('#main_canvas'))
        canvas = util.canvas
        ctx = util.context
        canvas.width = CANVAS_WIDTH
        canvas.height = CANVAS_HEIGHT
        let button = document.body.querySelector('#start_button')
        button.addEventListener('click', () => {
            button.disabled = true
            sound = new Sound()
            sound.load('./sound/explosion.mp3', (error) => {
                if (error) {
                    alert('ファイルの読み込みエラーです')
                    return
                }
                initialize()
                loadCheck()
            })
        })
    })

    /**
     * 初期化
     */
    function initialize () {
        scene = new SceneManager()

        // 自機の初期化
        viper = new Viper(ctx, 0, 0, 64, 64, './image/viper.png')
        viper.setComing(
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT - 100
        )
        viper.setShotArray(shotArray, singleShotArray)

        // 敵キャラクターを初期化する
        for (let i = 0; i < ENEMY_SMALL_MAX_COUNT; ++i) {
            enemyArray[i] = new Enemy(ctx, 0, 0, 48, 48, './image/enemy_small.png')        
            enemyArray[i].setShotArray(enemyShotArray)
            enemyArray[i].setAttackTarget(viper)
        }

        for (let i = 0; i < ENEMY_LARGE_MAX_COUNT; ++i) {
            enemyArray[ENEMY_SMALL_MAX_COUNT + i] = new Enemy(ctx, 0, 0, 64, 64, './image/enemy_large.png')
            enemyArray[ENEMY_SMALL_MAX_COUNT + i].setShotArray(enemyShotArray)
            enemyArray[ENEMY_SMALL_MAX_COUNT + i].setAttackTarget(viper)
        }

        // 爆発エフェクトを初期化する
        for (let i = 0; i < EXPLOSION_MAX_COUNT; ++i) {
            explosionArray[i] = new Explosion(ctx, 100.0, 15, 40.0, 1.0)        
            explosionArray[i].setSound(sound)
        }
        
        // 敵のキャラクターのショットを初期化
        for (let i = 0; i < ENEMY_SHOT_MAX_COUNT; ++i) {
            enemyShotArray[i] = new Shot(ctx, 0, 0, 32, 32, './image/enemy_shot.png')
            enemyShotArray[i].setTargets([viper])
            enemyShotArray[i].setExplosions(explosionArray)
        }       

        // ホーミングショットの初期化
        for (let i = 0; i < HOMING_MAX_COUNT; ++i) {
            homingArray[i] = new Homing(ctx, 0, 0, 32, 32, './image/homing_shot.png')
            homingArray[i].setTargets([viper])
            homingArray[i].setExplosions(explosionArray)
        }

        // ボスの初期化 
        boss = new Boss(ctx, 0, 0, 128, 128, './image/boss.png')
        boss.setShotArray(enemyShotArray)
        boss.setHomingArray(homingArray)
        boss.setAttackTarget(viper)
        
        // ショットを初期化する
        let contactEnemyArray = enemyArray.concat([boss])
        for (let i = 0; i < SHOT_MAX_COUNT; ++i) {
            shotArray[i] = new Shot(ctx, 0, 0, 32, 32, './image/viper_shot.png')
            singleShotArray[i * 2] = new Shot(ctx, 0, 0, 32, 32, './image/viper_single_shot.png')
            singleShotArray[i * 2 + 1] = new Shot(ctx, 0, 0, 32, 32, './image/viper_single_shot.png')
            shotArray[i].setTargets(contactEnemyArray)
            singleShotArray[i * 2].setTargets(contactEnemyArray)
            singleShotArray[i * 2 + 1].setTargets(contactEnemyArray)
            shotArray[i].setExplosions(explosionArray)
            singleShotArray[i * 2].setExplosions(explosionArray)
            singleShotArray[i * 2 + 1].setExplosions(explosionArray)
        }

        // 背景の星を初期化
        for (let i = 0; i < BACKGROUND_STAR_MAX_COUNT; ++i) {
            let size = 1 + Math.random() * (BACKGROUND_STAR_MAX_SIZE - 1)
            let speed = 1 + Math.random() * (BACKGROUND_STAR_MAX_SPEED - 1)
            backgroundStarArray[i] = new BackgroundStar(ctx, size, speed)
            let x = Math.random() * CANVAS_WIDTH
            let y = Math.random() * CANVAS_HEIGHT
            backgroundStarArray[i].set(x, y)            
        }
    }

    /**
     * リソースなどの読み込みが完了したら描画を開始する
     */
    function loadCheck () {
        let ready = true
        ready = ready && viper.ready
        shotArray.map((v) => ready = ready && v.ready)
        singleShotArray.map((v) => ready = ready && v.ready)
        homingArray.map((v) => ready = ready && v.ready)
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
            if (time > 3.0) {
                scene.use('invade_default_type')
            }
        })
        scene.add('invade_default_type', (time) => {
            // シーンのフレーム数が30で割り切れるときは敵キャラクターを配置する
            if (scene.frame === 30) {
                // ライフが0の状態のキャラクターが見つかったら配置する
                for (let i = 0; i < ENEMY_SMALL_MAX_COUNT; ++i) {
                    if (enemyArray[i].life <= 0) {
                        let e = enemyArray[i]
                        if (scene.frame % 60 === 0) {
                            e.set(-e.width, 30, 2, 'default')
                            e.setVectorFromAngle(degreesToRadians(30))
                        } else {
                            e.set(CANVAS_WIDTH + e.width, 30, 2, 'default')
                            e.setVectorFromAngle(degreesToRadians(150))
                        }
                        break
                    }
                }
            }
            if (scene.frame === 270) {
                scene.use('blank')
            }
            if (viper.life <= 0) {
                scene.use('gameover')
            }
        })
        scene.add('blank', (time) => {
            if (scene.frame === 150) {
                scene.use('invade_wave_move_type')
            }    
            if (viper.life <= 0) {
                scene.use('gameover')
            }
        })
        scene.add('invade_wave_move_type', (time) => {
            // シーンのフレームが0のとき以外は即座に終了する
            if (scene.frame % 50 === 0) {
                // ライフが0の状態のキャラクターが見つかったら配置する
                for (let i = 0; i < ENEMY_SMALL_MAX_COUNT; ++i) {
                    if (enemyArray[i].life <= 0) {
                        let e = enemyArray[i]
                        if (scene.frame <= 200) {
                            e.set(CANVAS_WIDTH * 0.2, -e.height, 2, 'wave')
                        } else {
                            e.set(CANVAS_WIDTH * 0.8, -e.height, 2, 'wave')
                        }
                        break
                    }
                }
            }
            if (scene.frame === 450) {
                scene.use('invade_large_type')
            }
            if (viper.life <= 0) {
                scene.use('gameover')
            }
        })
        scene.add('invade_large_type', (time) => {
            // シーンのフレームが0のとき以外は即座に終了する
            if (scene.frame === 100) {
                // ライフが0の状態のキャラクターが見つかったら配置する
                let i = ENEMY_SMALL_MAX_COUNT + ENEMY_LARGE_MAX_COUNT
                for (let j = ENEMY_SMALL_MAX_COUNT; j < i; ++j) {
                    if (enemyArray[j].life <= 0) {
                        let e = enemyArray[j]
                        e.set(CANVAS_WIDTH / 2, -e.height, 50, 'large')
                        break
                    }
                }
            }
            if (scene.frame === 500) {
                scene.use('invade_boss')
            }
            if (viper.life <= 0) {
                scene.use('gameover')
            }
        })
        scene.add('invade_boss', (time) => {
            if (scene.frame === 0) {
                boss.set(CANVAS_WIDTH / 2, -boss.height, 250)
                boss.setMode('invade')
            }
            if (viper.life <= 0) {
                scene.use('gameover')
                boss.setMode('escape')
            }
            if (boss.life <= 0) {
                scene.use('intro')
            }
        })
        scene.add('gameover', (time) => {
            let textWidth = CANVAS_WIDTH / 2
            let loopWidth = CANVAS_WIDTH + textWidth
            let x = CANVAS_WIDTH - (scene.frame * 2) % loopWidth
            ctx.font = 'bold 72px sans-serif'
            util.drawText('GAME OVER', x, CANVAS_HEIGHT/2, '#ffff00', textWidth)

            if (restart) {
                restart = false
                gameScore = 0
                viper.setComing(
                    CANVAS_WIDTH / 2,
                    CANVAS_HEIGHT,
                    CANVAS_WIDTH / 2,
                    CANVAS_HEIGHT - 100
                )
                scene.use('intro')
            }
        })
        scene.use('intro')
    }
    
    /**
     * 描画
     */
    function render () {
        ctx.globalAlpha = 1.0
        util.drawRect(0, 0, canvas.width, canvas.height, '#111122')
        let nowTime = (Date.now() - startTime) / 1000

        // ポイントを画面に描画
        ctx.font = 'bold 24px monospace'
        util.drawText(zeroPadding(gameScore, 5), 30, 50, '#ffffff')

        // 各オブジェクトを更新
        scene.update()
        backgroundStarArray.map((v) => v.update())
        viper.update()
        boss.update()
        enemyArray.map((v) => v.update())
        shotArray.map((v) => v.update())
        singleShotArray.map((v) => v.update())
        enemyShotArray.map((v) => v.update())
        homingArray.map((v) => v.update())
        explosionArray.map((v) => v.update())

        requestAnimationFrame(render)
    }

    /**
     * イベントを設定する
     */
    function eventSetting () {
        window.addEventListener('keydown', (event) => {
           isKeyDown[`key_${event.key}`] = true 

           if (event.key === 'Enter') {
               if (viper.life === 0) {
                   restart = true
               }
           }
        })

        window.addEventListener('keyup', (event) => {
           isKeyDown[`key_${event.key}`] = false 
        })
    }

    /**
     * 度数法の角度からラジアンを生成する
     * @param {number} degrees 
     */
    function degreesToRadians (degrees) {
        return degrees * Math.PI / 180
    }

    /**
     * 特定の範囲におけるランダムな整数の値を生成する
     * @param {number} range - 乱数を生成する範囲（0以上〜range未満） 
     */
    function gererateRandomInt (range) {
        let random = Math.random()
        return Math.floor(random * range)
    }

    /**
     * 数値の不足した桁数をゼロで埋める関数
     * @param {number} number 
     * @param {number} count 
     */
    function zeroPadding (number, count) {
        let zeroArray = new Array(count)
        let zeroString = zeroArray.join('0') + number
        return zeroString.slice(-count)
    }
})()