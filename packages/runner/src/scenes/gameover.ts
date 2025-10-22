class GameOver extends Phaser.Scene {
  // 화면 크기 (런타임에 실제 값으로 설정)
  public width: number = 600;
  public height: number = 300;

  // 중심 좌표(런타임에 실제 값으로 설정)
  private centerWidth: number = 600 / 2;
  private centerHeight: number = 300 / 2;
  // 페이드인 연출용 레이어 (create에서 생성해 주입)
  // private introLayer: Phaser.GameObjects.Layer | null = null;

  constructor() {
    super({ key: 'gameover' });
  }

  /**
   * 장면 초기화
   * 텍스트/입력 설정 및 점수 표시
   */
  create() {
    // config의 width / height는 string|number일 수 있어 안전하게 변환
    this.width = parseInt(String(this.sys.game.config.width), 10);
    this.height = parseInt(String(this.sys.game.config.height), 10);
    this.centerWidth = this.width / 2;
    this.centerHeight = this.height / 2;
    // 배경색 설정
    this.cameras.main.setBackgroundColor(0x87ceeb);
    // 레이어 생성(여기에 텍스트를 얹어서 트윈 처리)
    // this.introLayer = this.add.layer();
    // 점수 표시(registry는 any 반환이므로 문자열로 변환)
    this.add
      .bitmapText(this.centerWidth, 50, 'arcade', String(this.registry.get('score') ?? '0'), 25)
      .setOrigin(0.5);
    // 타이틀 문구
    this.add
      .bitmapText(this.centerWidth, this.centerHeight, 'arcade', 'GAME OVER', 45)
      .setOrigin(0.5);
    // 가이드 문구
    this.add
      .bitmapText(this.centerWidth, 250, 'arcade', 'Press SPACE or Click to restart!', 15)
      .setOrigin(0.5);
    // 입력: 스페이스 / 클릭 -> 게임 장면 재시작
    this.input.keyboard?.on('keydown-SPACE', this.startGame, this);
    this.input.on('pointerdown', this.startGame, this);
  }

  // /**
  //  * 한 줄의 텍스트를 화면에 추가하고
  //  * 트윈(tween)으로 서서히 나타나게 만드는 메서드
  //  */
  // private showLine(text: string, y: number) {
  //   // 투명한 비트맵 텍스트 객체를 생성하고 레이어에 추가
  //   // introLayer에 포함된 모든 요소를 한꺼번에 제어할 수 있음
  //   const line = this.introLayer?.add(
  //     // 투명한 비트맵 텍스트 객체 생성
  //     this.add
  //       .bitmapText(this.centerWidth, 10), y, "pixelFont", text, 25)
  //       .setOrigin(0.5)
  //       .setAlpha(0)
  //   ) as Phaser.GameObjects.BitmapText;
  //   // 트윈 애니메이션으로 1초 동안 alpha를 1까지 증가시켜 서서히 나타나게 함
  //   this.tweens.add({
  //     targets: line,
  //     duration: 1000,
  //     alpha: 1
  //   });
  // }

  /**
   * 게임 장면으로 전환하는 메서드
   */
  private startGame() {
    this.scene.start('game');
  }
}

export default GameOver;
