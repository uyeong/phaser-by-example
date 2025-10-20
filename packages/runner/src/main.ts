import Phaser from 'phaser'

class GameScene extends Phaser.Scene {
  private rectangle?: Phaser.GameObjects.Rectangle

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    // 배경색 설정
    this.cameras.main.setBackgroundColor('#34495e')

    // 사각형 생성 (화면 중앙에)
    this.rectangle = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      100,
      100,
      0x3498db
    )

    // 사각형에 상호작용 추가
    this.rectangle.setInteractive()
    this.rectangle.on('pointerdown', () => {
      // 클릭할 때마다 색상 변경
      const colors = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      this.rectangle?.setFillStyle(randomColor)
    })

    // 텍스트 추가
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 80,
      'Click the rectangle!',
      {
        fontSize: '16px',
        color: '#ecf0f1',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5)

    // 키보드 입력 처리
    this.input.keyboard?.on('keydown-SPACE', () => {
      // 스페이스바를 누르면 사각형 회전
      this.tweens.add({
        targets: this.rectangle,
        angle: 360,
        duration: 500,
        ease: 'Power2'
      })
    })
  }

  update() {
    // 사각형이 있다면 부드럽게 움직이기
    if (this.rectangle) {
      this.rectangle.x = this.cameras.main.width / 2 + Math.sin(this.time.now * 0.001) * 20
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#2c3e50',
  scene: GameScene,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
}

// 게임 시작
new Phaser.Game(config)
