import Player from "../gameobjects/player";
import Generator from '../gameobjects/generator';

import type { AudioMap } from '../types';

class Game extends Phaser.Scene {
  // 화면 크기: Phaser의 config가 string | number를 허용하므로 타입을 그대로 유지.
  // create()에서 sys.game.config 값을 다시 대입해 실제 런타임 크기를 사용.
  public width: number = 1_920;
  public height: number = 960;
  // 장애물 / 코인 그룹: Scene 외부(예: Generator)에서도 접근하므로 public
  // create()에서 add. group()으로 초기화.
  public obstacles: Phaser.GameObjects.Group | undefined;
  public coins: Phaser.GameObjects.Group | undefined;

  private playerObstacleCollider: Phaser.Physics.Arcade.Collider | undefined;
  // 배경 타일 이미지 오브젝트
  private far: Phaser.GameObjects.TileSprite | undefined;
  private background: Phaser.GameObjects.TileSprite | undefined;
  private foreground: Phaser.GameObjects.TileSprite | undefined;
  // 플레이어 오브젝트
  private player: Player | null = null;
  // 장애물 생성기 오브젝트
  // private generator!: Generator;
  // 화면 중심 좌표 캐시: 초기값을 기본 크기 기준, create()에서 실제 값으로 갱신
  private centerWidth: number = 1_920 / 2;
  // private centerHeight: number = 300 / 2;
  // 점수와 점수 표시 텍스트
  private score: number = 0;
  private scoreText: Phaser.GameObjects.BitmapText | null = null;
  // 오디오, 음악, 주기적 점수 증가 타이머, 점프 트윈
  private audios: AudioMap = new Map();
  private updateScoreEvent: Phaser.Time.TimerEvent | undefined;
  private updateStaminaEvent: Phaser.Time.TimerEvent | undefined;

  constructor() {
    // 이 Scene의 키(다른 씬에서 scene.start('game')으로 진입)
    super({ key: 'game' });
  }

  /**
   * preload: 게임에 필요한 리소스 로딩 단계.
   * - 사운드, 스프라이트시트, 비트맵 폰트 등을 로드한다.
   * - registry에 score 초기값을 넣어 다른 씬에서도 접근 가능하게 함.
   */
  public preload() {
    this.registry.set('score', 0);
    this.load.audio('coin', 'assets/sounds/coin.mp3');
    this.load.audio('jump', 'assets/sounds/jump.mp3');
    this.load.audio('dead', 'assets/sounds/dead.mp3');
    this.load.audio('theme', 'assets/sounds/theme.mp3');
    this.load.audio('growling', 'assets/sounds/growling.wav');
    this.load.image('opening/character', 'assets/images/opening/character.png');
    this.load.image('opening/coin', 'assets/images/opening/coin.png');
    this.load.image('spark', 'assets/images/spark.png');
    this.load.image('cloud1', 'assets/images/cloud1.png');
    this.load.image('cloud2', 'assets/images/cloud2.png');
    this.load.image('cloud3', 'assets/images/cloud3.png');
    this.load.image('cloud4', 'assets/images/cloud4.png');
    this.load.image('road', 'assets/images/road.png');
    this.load.image('far', 'assets/images/far.png');
    this.load.image('background', 'assets/images/background.png');
    this.load.image('foreground', 'assets/images/foreground.png');
    this.load.spritesheet('run', 'assets/images/run.png', { frameWidth: 329, frameHeight: 477 });
    this.load.spritesheet('jump', 'assets/images/jump.png', { frameWidth: 359, frameHeight: 477 });
    this.load.spritesheet('dead', 'assets/images/dead.png', { frameWidth: 529, frameHeight: 435 });
    this.load.spritesheet('coin', 'assets/images/coin.png', { frameWidth: 32, frameHeight: 32 });
    this.load.bitmapFont('arcade', 'assets/fonts/arcade.png', 'assets/fonts/arcade.xml');
  }

  /**
   * create: 오브젝트 생성 및 초기화
   * - 화면 크기 / 중심 좌표 계산
   * - 배경색, 그룹 생성, 생성기(Generator) 시작
   * - 입력 키 설정, 플레이어 생성, 점수 텍스트 생성
   * - 충돌 / 겹침(콜라이더 / 오버랩) 설정
   * - 오디오 로드 및 음악 재생
   * - 포인터 입력과 점수 업데이트 타이머 등록
   */
  public create() {
    // 게임 점수 초기화
    this.score = 0;
    this.registry.set('score', 0);
    // 키보드 입력 활성화
    this.input.keyboard && (this.input.keyboard.enabled = true);
    this.input.enabled = true;
    // 실제 config에서 화면 크기를 가져와 적용
    this.width = parseInt(String(this.sys.game.config.width), 10);
    this.height = parseInt(String(this.sys.game.config.height), 10);
    this.centerWidth = this.width / 2;
    // 하늘색 배경 설정
    this.cameras.main.setBackgroundColor(0xecf4fa);
    // 그룹 생성(장애물 / 코인 오브젝트 컨테이너)
    this.obstacles = this.add.group();
    this.coins = this.add.group();
    // 장애물 / 코인 / 구름을 주기적으로 생성하는 제너레이터 시작
    // this.generator = new Generator(this);
    new Generator(this);
    // 배경 화면 타일 스프라이트 생성
    this.far = this.add.tileSprite(0, 258, this.width, this.height, 'far').setOrigin(0);
    this.background = this.add.tileSprite(0, 323, this.width, this.height, 'background').setOrigin(0);
    this.foreground = this.add.tileSprite(0, 602, this.width, this.height, 'foreground').setOrigin(0);
    // 바닥 이미지 생성
    this.add.image(0, 911, "road").setOrigin(0, 0);
    // 플레이어 생성
    this.player = new Player(this, this.audios, this.centerWidth - 480, this.height - 640);
    // 플레이어 스테미나 텍스트 생성
    const staminaText = this.add.bitmapText(40, 160, "arcade", "STAMINA: 100", 120 );
    staminaText.setDepth(1000);
    staminaText.setTint(0xbbbbbb);
    // 일정 시간마다 스태미나 감소 타이머 설정
    this.updateStaminaEvent = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.player && !this.player.isExhausted()) {
          this.player.reduceStamina(1);
          staminaText.setText("STAMINA: " + this.player?.stamina.toFixed(0));
        }
      },
      loop: true
    });
    // 바닥 생성
    const floor = this.add.rectangle(0, this.height - 41, this.width, 41, 0x000000, 0)
      .setOrigin(0, 0);
    this.physics.add.existing(floor, true); // true → static body (정적)
    this.physics.add.collider(this.player, floor);
    // 점수 표시용 비트맵 폰트 텍스트
    this.scoreText = this.add.bitmapText(40, 40, 'arcade', `SCORE: ${String(this.score)}`, 120);
    this.scoreText?.setDepth(1000);
    this.scoreText?.setTint(0xbbbbbb);
    // 플레이어 <-> 장애물 충돌: 부딪히면 게임 종료 흐름으로
    this.playerObstacleCollider = this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, () => true, this);
    // 플레이어 <-> 코인 겹침: 닿으면 점수 증가 후 코인 제거
    this.physics.add.overlap(this.player, this.coins, this.hitCoin, () => true, this);
    // 오디오 객체 준비 및 배경 음악 재생
    this.loadAudios();
    // 클릭 / 터치 시 점프
    this.input.keyboard?.on('keydown-SPACE', this.handleKeyDownSpace, this);
    this.input.keyboard?.on('keyup-SPACE', this.handleKeyUpSpace, this);
    this.input.on('pointerdown', this.handleKeyDownSpace, this);
    this.input.on('pointerup', this.handleKeyUpSpace, this);
    // 생존 시간에 따라 점수를 주기적으로 증가(100ms 마다 1점)
    this.updateScoreEvent = this.time.addEvent({
      delay: 100,
      callback: () => this.updateScore(),
      callbackScope: this,
      loop: true,
    });
    if (!this.registry.get('started')) {
      this.scene.pause();
      this.scene.launch('opening');
    } else {
      this.playMusic();
    }
  }

  /**
   * update: 프레임마다 호출되는 게임 루프
   * - 스페이스 입력 감지 시 점프
   * - 바닥에 닿았을 때 점프 트윈 정지 및 회전 초기화
   */
  public update() {
    if (this.player?.died) {
      return;
    }
    if (this.far) {
      this.far.tilePositionX = this.far.tilePositionX + 5;
    }
    if (this.background) {
      this.background.tilePositionX = this.background.tilePositionX + 10 ;
    }
    if (this.foreground) {
      this.foreground.tilePositionX = this.foreground.tilePositionX + 15;
    }
    if (this.player && this.player.body) {
      const delta = this.game.loop.delta / 1000;
      const nextBottom = this.player.body.bottom + Math.max(0, this.player.body.velocity.y) * delta;
      if (nextBottom >= 900) {
        this.player.run();
      }
    }
    if (this.player?.isExhausted()) {
      this.finishScene();
      this.player?.die(() => {
        // GameOver 장면을 현재 씬 위로 배치하여 표시
        this.scene.launch('gameover');
        this.scene.pause();
      }, 'hunger');
    }
  }

  /**
   * 장애물에 부딪혔을 때
   */
  private hitObstacle() {
    this.finishScene();
    this.player?.die(() => {
      // GameOver 장면을 현재 씬 위로 배치하여 표시
      this.scene.launch('gameover');
      this.scene.pause();
    }, 'crash');
  }

  /**
   * 코인에 닿았을 때: 효과음 + 점수 증가 + 코인 제거
   * ArcadePhysicsCallback 시그니처에 맞춰 두 번쨰 인자를 받아 처리한다.
   */
  private hitCoin: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_, coin) => {
    if (this.player?.died) {
      return;
    }
    this.audios.get('coin')?.play();
    this.updateScore(1000);
    this.player && (this.player.stamina = 100);
    coin.destroy();
  }

  /**
   * 사운드 객체를 미리 만들어두고 이후 playAudio로 재생
   */
  private loadAudios() {
    this.audios.set('theme', this.sound.add('theme'));
    this.audios.set('jump', this.sound.add('jump'));
    this.audios.set('coin', this.sound.add('coin'));
    this.audios.set('dead', this.sound.add('dead'));
    this.audios.set('growling', this.sound.add('growling'));
  }

  /**
   * 배경 음악 재생: 루프로 반복
   */
  private playMusic() {
    const theme = this.audios.get('theme');
    theme?.stop();
    theme?.play({
      mute: false,
      volume: 1,
      rate: 1,
      detune: 0,
      seek: 0,
      loop: true,
      delay: 0
    });
  }

  /**
   * 점수 갱신 및 화면 반영
   */
  private updateScore(points = 1) {
    this.score = this.score + points;
    this.scoreText?.setText(`SCORE: ${String(this.score)}`);
  }

  /**
   * 장면 종료 처리:
   * - 음악 정지, 사망 사운드
   * - registry에 점수 저장(문자열로), gameover 장면으로 전환
   */
  private finishScene() {
    this.input.keyboard && (this.input.keyboard.enabled = false);
    this.input.enabled = false;
    this.tweens.pauseAll();
    this.audios.get('theme')?.stop();
    this.registry.set('score', String(this.score));
    this.playerObstacleCollider && (this.playerObstacleCollider.active = false);
    this.updateScoreEvent?.destroy();
    this.updateStaminaEvent?.destroy();
  }

  private handleKeyDownSpace() {
    if (!this.player?.body?.blocked.down) {
      return;
    }
    this.player.jump();
  }

  private handleKeyUpSpace() {
    if (!this.player?.jumping) {
      return;
    }
    this.player.land();
  }
}

export default Game;
