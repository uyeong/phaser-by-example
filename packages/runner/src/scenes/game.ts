import Player from "../gameobjects/player";
import Generator from '../gameobjects/generator';

class Game extends Phaser.Scene {
  // 화면 크기: Phaser의 config가 string | number를 허용하므로 타입을 그대로 유지.
  // create()에서 sys.game.config 값을 다시 대입해 실제 런타임 크기를 사용.
  public width: number = 600;
  public height: number = 300;
  // 장애물 / 코인 그룹: Scene 외부(예: Generator)에서도 접근하므로 public
  // create()에서 add. group()으로 초기화.
  public obstacles: Phaser.GameObjects.Group | undefined;
  public coins: Phaser.GameObjects.Group | undefined;

  // 플레이어 오브젝트
  private player: Player | null = null;
  // 장애물 생성기 오브젝트
  // private generator!: Generator;
  // 화면 중심 좌표 캐시: 초기값을 기본 크기 기준, create()에서 실제 값으로 갱신
  private centerWidth: number = 600 / 2;
  // private centerHeight: number = 300 / 2;
  // 점수와 점수 표시 텍스트
  private score: number = 0;
  private scoreText: Phaser.GameObjects.BitmapText | null = null;
  // 입력 키, 오디오, 음악, 주기적 점수 증가 타이머, 점프 트윈
  private SPACE: Phaser.Input.Keyboard.Key | undefined;
  private audios: Record<string, Phaser.Sound.BaseSound> | undefined;
  private theme: Phaser.Sound.BaseSound | undefined;
  private updateScoreEvent: Phaser.Time.TimerEvent | undefined;
  private jumpTween: Phaser.Tweens.Tween | undefined;
  // init(data)로 받는 값
  // private name?: string;
  // private number?: number;

  constructor() {
    // 이 Scene의 키(다른 씬에서 scene.start('game')으로 진입)
    super({ key: 'game' });
  }

  /**
   * 다른 씬에서 전달하는 데이터를 받을 때 사용
   */
  // public init(data: { name?: string, number?: number }) {
  public init() {
    // this.name = data.name;
    // this.number = data.number;
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
    // 실제 config에서 화면 크기를 가져와 적용
    this.width = parseInt(String(this.sys.game.config.width), 10);
    this.height = parseInt(String(this.sys.game.config.height), 10);
    // width / height가 string|number일 수 있으므로 안전하게 파싱
    this.centerWidth = this.width / 2;
    // this.centerHeight = this.height / 2;
    // 하늘색 배경 설정
    this.cameras.main.setBackgroundColor(0x87ceeb);
    // 그룹 생성(장애물 / 코인 오브젝트 컨테이너)
    this.obstacles = this.add.group();
    this.coins = this.add.group();
    // 장애물 / 코인 / 구름을 주기적으로 생성하는 제너레이터 시작
    // this.generator = new Generator(this);
    new Generator(this);
    // 스페이스 키 입력 등록
    this.SPACE = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // 플레이어 생성
    this.player = new Player(this, this.centerWidth - 100, this.height - 200);
    // 점수 표시용 비트맵 폰트 텍스트
    this.scoreText = this.add.bitmapText(this.centerWidth, 10, 'arcade', String(this.score), 20);
    // 플레이어 <-> 장애물 충돌: 부딪히면 게임 종료 흐름으로
    this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, () => true, this);
    // 플레이어 <-> 코인 겹침: 닿으면 점수 증가 후 코인 제거
    this.physics.add.overlap(this.player, this.coins, this.hitCoin, () => true, this);
    // 오디오 객체 준비 및 배경 음악 재생
    this.loadAudios();
    this.playMusic();
    // 클릭 / 터치 시 점프
    this.input.on('pointerdown', () => this.jump(), this);
    // 생존 시간에 따라 점수를 주기적으로 증가(100ms 마다 1점)
    this.updateScoreEvent = this.time.addEvent({
      delay: 100,
      callback: () => this.updateScore(),
      callbackScope: this,
      loop: true,
    })
  }

  /**
   * update: 프레임마다 호출되는 게임 루프
   * - 스페이스 입력 감지 시 점프
   * - 바닥에 닿았을 때 점프 트윈 정지 및 회전 초기화
   */
  public update() {
    if (this.SPACE && Phaser.Input.Keyboard.JustDown(this.SPACE)) {
      this.jump();
    } else if (this.player?.body?.blocked.down) {
      this.jumpTween?.stop();
      this.player.rotation = 0;
      // ground
    }
  }

  /**
   * 장애물에 부딪혔을 때: 점수 업데이트 타이머 중지 후 게임 종료 처리
   */
  private hitObstacle() {
    this.updateScoreEvent?.destroy();
    this.finishScene();
  }

  /**
   * 코인에 닿았을 때: 효과음 + 점수 증가 + 코인 제거
   * ArcadePhysicsCallback 시그니처에 맞춰 두 번쨰 인자를 받아 처리한다.
   */
  private hitCoin: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_, coin) => {
    this.playAudio('coin');
    this.updateScore(1000);
    coin.destroy();
  }

  /**
   * 사운드 객체를 미리 만들어두고 이후 playAudio로 재생
   */
  private loadAudios() {
    this.audios = {
      jump: this.sound.add('jump'),
      coin: this.sound.add('coin'),
      dead: this.sound.add('dead'),
    }
  }

  /**
   * 배경 음악 재생: 루프로 반복
   */
  private playMusic(theme = 'theme') {
    this.theme = this.sound.add(theme);
    this.theme.stop();
    this.theme.play({
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
   * 키를 받아 해당 사운드를 재생
   */
  private playAudio(key: string) {
    this.audios?.[key]?.play();
  }

  /**
   * 점프 처리: 바닥에 있을 때만 점프 속도 부여
   */
  private jump() {
    if (!this.player || !this.player.body?.blocked.down) {
      return;
    }
    this.player.body?.setVelocityY(-300);
    this.playAudio('jump');
    this.jumpTween = this.tweens.add({
      targets: this.player,
      duration: 1000,
      angle: { from: 0, to: 360 },
      repeat: -1,
    })
  }

  /**
   * 점수 갱신 및 화면 반영
   */
  private updateScore(points = 1) {
    this.score = this.score + points;
    this.scoreText?.setText(String(this.score));
  }

  /**
   * 장면 종료 처리:
   * - 음악 정지, 사망 사운드
   * - registry에 점수 저장(문자열로), gameover 장면으로 전환
   */
  private finishScene() {
    this.theme?.stop();
    this.playAudio('dead');
    this.registry.set('score', String(this.score));
    this.scene.start('gameover');
  }
}

export default Game;
