/**
 * Player 클래스
 * Phaser의 기본 도형(rectangle)을 상속받은 플레이어 오브젝트
 */
class Player extends Phaser.GameObjects.Rectangle {
  // 플레이어의 크기
  private static readonly SIZE = 32;
  // 플레이어의 색상
  private static readonly COLOR = 0x00ff00;
  // Arcade 물리 바디 (Scene에서 physics.add.existing 후 할당됨)
  public body: Phaser.Physics.Arcade.Body | null = null;
  // 점프 중인지 여부
  public jumping = false;
  // 무적 상태 여부
  public invincible = false;
  // 체력(기본값 10)
  public health = 10;

  /**
   * @param scene 현재 장면(scene) 객체
   * @param x 초기 x 위치
   * @param y 초기 y 위치
   */
  constructor(scene: Phaser.Scene, x: number, y: number/*, number: number*/) {
    // super(): 부모 클래스(Phaser.GameObjects.Rectangle)의 생성자 호출
    // (scene, x, y, width, height, color)
    // 여기에서는 32x32 크기의 초록색(0x00ff00) 사각형으로 플레이어를 생성
    super(scene, x, y, Player.SIZE, Player.SIZE, Player.COLOR);
    // 오브젝트의 기준점을 가운데(0.5, 0.5)로 설정
    this.setOrigin(0.5);
    // 현재 Scene에 이 오브젝트를 추가
    this.scene.add.existing(this);
    // 이 오브젝트에 Arcade Physics 물리 속성을 추가
    this.scene.physics.add.existing(this);
    // 크기를 1배로 설정(기본값이지만 명시적으로 지정)
    this.setScale(1);
    if (this.body) {
      // 화면 밖으로 나가지 않도록 월드 경계와 충돌 설정
      this.body.collideWorldBounds = true;
      // Y축 방향의 공기 저항(감속 효과)
      this.body.setDragY(10);
      // 물리 질량(기본값보다 무겁게 설정)
      this.body.mass = 10;
    }
  }
}

export default Player;
