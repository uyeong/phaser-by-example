class Opening extends Phaser.Scene {
  // 화면 크기 (런타임에 실제 값으로 설정)
  public width: number = 1_920;
  public height: number = 960;

  // 중심 좌표(런타임에 실제 값으로 설정)
  private centerWidth: number = 1_920 / 2;
  private centerHeight: number = 960 / 2;

  constructor() {
    super({ key: 'opening' });
  }

  /**
   * 장면 초기화
   * 텍스트/입력 설정 및 점수 표시
   */
  create() {
    this.width = parseInt(String(this.sys.game.config.width), 10);
    this.height = parseInt(String(this.sys.game.config.height), 10);
    this.centerWidth = this.width / 2;
    this.centerHeight = this.height / 2;
    // 배경색 설정
    this.cameras.main.setBackgroundColor('rgba(135, 206, 235, 0.85)');
    // 타이틀 문구
    this.add
      .bitmapText(this.centerWidth, this.centerHeight, 'arcade', 'Press ENTER or Click to start!', 70)
      .setOrigin(0.5);
    // 입력: 엔터 / 클릭 -> 게임 장면 재시작
    this.input.keyboard?.on('keydown-ENTER', this.startGame, this);
    this.input.on('pointerdown', this.startGame, this);
  }

  /**
   * 게임 장면으로 전환하는 메서드
   */
  private startGame() {
    this.registry.set('started', true);
    this.scene.start('game');
  }
}

export default Opening;
