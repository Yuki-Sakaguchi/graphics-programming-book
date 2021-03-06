
# graphics-programming-book

技術評論社（WEB+DB PRESS plus シリーズ）より発売の、「[ゲーム&モダンJavaScript文法で2倍楽しい]グラフィックスプログラミング入門 ——リアルタイムに動く画面を描く。プログラマー直伝の基本」に収録されているサンプルファイルのリポジトリです。

# DEMO
* https://yuki-sakaguchi.github.io/graphics-programming-book/public/
* https://yuki-sakaguchi.github.io/graphics-programming-book/pixel_study/

# 学んだこと
## ゲームの数学
* ラジアン
  * 角度を弧度法という方式で表したもの。円一周で`PI * 2`（つまり　6.28）
* sin, cos
  * 基準点から任意の距離進んだ点の座標を計算するのに使った離する
  * 角度を元にして座標を求められる
* ベクトル
  * 量と向きの2つの値を表現できるもの
  * 始点と終点があればベクトルが表現できる　`終点 - 始点`
  * ベクトルの大きさを１に揃えることを`単位化`という
  * ベクトルの大きさは`Math.sqrt(x * x + y * y)`で求められる
  * 内積、外積を使えば今の進行方向から目的の進行方向に向かうためにはどっちの方を向けばいいのかなどがわかる
    * コサインは「左右の方向、もしくは垂直を判定するのに使える」
    * サインは「上下の方向、もしくは水平を判定するのに使える」
    * サイン単体、あるいはコサイン単体では、それぞれ「縦横どちらかの向きしか判定できない」
    * 単位ベクトル同士の内積　＝　コサインに相当
    * 単位ベクトル同士の外積　＝　サインに相当
    * 内積の結果が０の時はベクトル同士が垂直である
    * 内積の結果が正の数の場合は鋭角
    * 内積の結果が負の数の場合は鈍角
    * 外積の結果が０の時はベクトル同士が水平である
    * 外積の結果が正の数の場合はベクトルAからみて上（左側）にベクトルBがある
    * 外積の結果が負の数の場合はベクトルAからみて下（右側）にベクトルBがある
* 行列
  * 数値を行や列で区切って人まとまりにしたもの
* 乱数
  * コンピュータに完全な乱数はない。全ては乱数っぽい振る舞いをする計算。（擬似乱数という）
  * ランダムを作る元になる値を`seed値`と呼ぶ
  * ゲームの場合このseed値が毎回完全に違うと困る時がある
    * 敵が動く場合などでリプレイをする際に全ての動きを保存しておかなくてはいけなくなる。
    * 固定の乱数を元にしておけば、seed値さえ揃えておけば状況を再現できる
  * JSにはseed値を固定して乱数を作る機能がないので自前で用意する必要がある
* 補完関数とイージング
  * 出発地点と終了地点をなめらかに補完する関数
  * `0.0~1.0`を受け取って`0.0~1.0`返す関数する
  * 緩やかという意味の「ease」
    * easeIn = 初めは緩やかに
    * easeOut = 最後は緩やかに
* 平方根
  * ２つの座標間の距離を測るときに使う`Math.sqrt()`
    *  `sqrt`は`square root（スクエアルート）`の略
  * 平方根　＝　２乗する前の値
    * `Math.sqrt(4)` = `2`
  * 点P（1, 3）と点R（4, 5）

```js
let x = 1 - 4 //-> -3
let y = 3 - 5 //-> -2

Math.sqrt(x * x + y * y) //-> 3.605551275463989(√13）
```

## ゲームのシーンの管理のやり方
* シーン用のクラスを作ってシーンを追加して使う
* シーンごとにフレームは初期化されて、敵の追加や次のシーンへの移行などはそのフレームをみて行う

## 敵の動きの管理のやり方
* 敵の出現などはシーンにお願いする。敵の動き方は敵自体が持っている
* 敵オブジェクトがそれぞれ自身が登場した時からのフレームを持ち、それをみて動きを判定する
  * いつ玉を打つかとか、sin, cosの動き方など
* new するときに敵のタイプなども渡せるようにしてタイプによって処理を分ける
  * これも敵自体が持っている
* 敵オブジェクトにプレイヤーオブジェクトをtargetとして持たせて、玉を打つ方向だったり移動する方向を決めるために使う

## render関数
* メイン関数でrenderを呼ぶが、やることとしては以下
  * 画面背景の描画、各オブジェクトのupdate関数を実行
  * ここにロジック自体は書かない
* 自機、敵、玉、背景など、自分の動きについては自分のupdate関数で実行する
  * シーン自体の更新もシーン自体が行う
  * 今ゲームがどういう状況なのか常に監視して、一定の条件になっていた場合シーンを切り替えるようになっている

## 衝突判定
* 衝突判定をどこに持たせるかは難しい話
  * 今回の例では玉自体に持たせてる
  * 玉があたり判定をするオブジェクトをリストで持っている
    * 敵の玉の場合は自機のみ
    * 自機の玉の場合は敵のみ
  * 玉自体は自分の持っている当たり判定リストと見比べて当たっていないか確認し続ける
    * 当たってたら自分を消すのはもちろん、当たった相手にダメージを与える処理もここに書いてある
  * たぶん当たり判定用のクラスを用事して使いたいクラスでセットする感じが使い勝手良さそうだった

## ベクトルを使った方向指定
* 真下に球を打つ
* 自分の周りに球を打つ
* 前に球を打つ（斜めにも打てる）
* ホーミングで対象物の方に球を打つ

## ブラウザので音再生
* `AudioContext`というオブジェクトの操作で音を鳴らす
* Audioエレメントだと色々制限があるっぽい

## 画面描画の細かい話（ピクセル）
* 画面にあれこり処理をくわえて表示することを画像処理という
* canvasの全てのピクセルを取得し、その1つのピクセルごとに処理を加えてcanvasに描画しなした
  * ネガポジ反転、モザイクなど
* 画像処理は基本的にこの概念らしい
  * three.jsでやろうとしたbufferのやつとか、OpenGLのシェーダーとか、p5.js, processingでやった概念と一緒だった
  * 画面に何かを表示するってことはこういうことなんだと感じた
* jsだと`canvas.getContext('2d')`で取得したオブジェクトから`getImageData()`で取得できる`ImageData`オブジェクトを使える
  * `Unit8ClampedArray`という配列に入った`RGBA`の配列（実際は１次元の配列なので使うときに4つ区切りで扱ってあげる）をつかう
* 最終的には`putImageData()`でcanvasnに描画し直す
  * 取得したImageDataには複数のフィルターをかけることができるのでどんどんかけて最後にputすれば全てのフィルターが効いた状態になっている