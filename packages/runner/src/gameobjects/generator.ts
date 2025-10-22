import { checkOverlapRect } from '../utils';

import type GameScene from '../scenes/game';

class Generator {
  // GameScene(Phaser Scene)의 인스턴스
  private readonly scene: GameScene;
  // 설정 가능한 가장 높은 위치(가장 낮은 값)
  private readonly maxY: number;
  // 설정 가능한 가장 낮은 위치(가장 큰 값)
  private readonly minY: number;

  constructor(scene: GameScene) {
    this.scene = scene;
    this.maxY = this.scene.height - 550;
    this.minY = this.scene.height - (51 + 41);
    // 2초 후 init() 메서드를 한 번 실행
    this.scene.time.delayedCall(2_000, () => this.init(), undefined, this);
  }

  /**
   * 초기 생성
   * 구름, 장애물, 코인을 한 번씩 생성
   */
  private init() {
    this.generateCloud();
    this.generateObstacle();
    this.generateCoin();
  }

  /**
   * 구름 생성 함수
   * 새로운 Cloud 객체를 만든 뒤,
   * Phaser의 time.deplayedCall을 이용해 일정 시간 이후 다시 자기 자신을 호출.
   * 이렇게 해서 구름이 계속 랜덤하게 생성됨.
   */
  private generateCloud() {
    const scale = Phaser.Utils.Array.GetRandom(Cloud.SCALES);
    new Cloud(this.scene, undefined, undefined, scale);
    this.scene.time.delayedCall(
      Phaser.Math.Between(1_000, 2_000),
      () => this.generateCloud(),
    );
  }

  /**
   * 장애물 생성 함수
   * Obstacle 객체를 만들어 Scene의 obstacles 그룹에 추가
   * 이후 랜덤한 간격으로 자기 자신을 다시 호출함.
   */
  private generateObstacle() {
    const obstacleY = Phaser.Math.Between(this.minY, this.maxY);
    const obstacle =  new Obstacle(this.scene, 2_000, obstacleY);
    const coins = (this.scene.coins?.getChildren() ?? []) as Coin[];
    coins.forEach((coin)=>{
      if (checkOverlapRect(coin, obstacle)) {
        let direction = Phaser.Math.RND.sign();
        obstacle.y = (coin.y) + 102 * direction;
        if (obstacle.y <= this.maxY || obstacle.y >= this.minY) {
          // 경계 바깥으로 나갔다면 반대 방향으로 보정
          direction = direction * -1;
          obstacle.y = (coin.y) + 102 * direction;
        }
      }
    });
    this.scene.obstacles?.add(obstacle);
    this.scene.time.delayedCall(
      Phaser.Math.Between(500, 1_500),
      () => this.generateObstacle(),
      undefined,
      this
    );
  }

  /**
   * 코인 생성 함수
   * Coin 객체를 Scene의 coins 그룹에 추가
   * 랜덤한 시간 후 자신을 다시 호출해 코인을 계속 만들어냄.
   */
  private generateCoin() {
    const coinY = Phaser.Math.Between(this.minY, this.maxY);
    const coin = new Coin(this.scene, 2_000, coinY);
    const obstacles = (this.scene.obstacles?.getChildren() ?? []) as Obstacle[];
    obstacles.forEach((obstacle)=>{
      if (checkOverlapRect(obstacle, coin)) {
        let direction = Phaser.Math.RND.sign();
        coin.y = (obstacle.y) + 102 * direction;
        if (coin.y <= this.maxY || coin.y >= this.minY) {
          // 경계 바깥으로 나갔다면 반대 방향으로 보정
          direction = direction * -1;
          coin.y = (obstacle.y) + 102 * direction;
        }
      }
    })
    this.scene.coins?.add(coin);
    this.scene.time.delayedCall(
      Phaser.Math.Between(2_000, 5_000),
      () => this.generateCoin(),
      undefined,
      this
    )
  }
}

/**
 * Cloud: 단순한 사각형 구름 객체
 * - 무작위 y 위치 / 스케일
 * - 오른쪽(2,000) -> 왼쪽(-100)으로 트윈 이동 후 제거
 */
class Cloud extends Phaser.GameObjects.Image  {
  // 구름의 기본 스케일 모음
  public static readonly SCALES = [0.7, 1, 1.3];

  constructor(
    scene: Phaser.Scene,
    // 기본: 화면 오른쪽 밖에서 시작
    x: number = 2_000,
    // 기본: 상단 0 ~ 100 사이 무작위
    y: number = Phaser.Math.Between(68, 160),
    // 1, 1/2, 1/3 중 하나로 스케일 (작을수록 더 멀리 보이는 느낌)
    scale: number = Phaser.Utils.Array.GetRandom(Cloud.SCALES)
  ) {
    const cloudIndex = Phaser.Math.Between(1, 4);
    super(scene, x, y, `cloud${cloudIndex}`);
    // 이 오브젝트를 Scene에 등록
    scene.add.existing(this);
    this.setScale(scale);
    this.init();
  }

  /**
   * 트윈으로 우 -> 좌 이동 후 화면을 벗어나면 파괴
   */
  private init() {
    this.scene.tweens.add({
      targets: this,
      x: { from: 2_000, to: -100 },
      // duration을 스케일에 반비례하게 주면: 작은(먼) 그름일수록 더 천천히 흐름
      duration: 3_000 / this.scale,
      onComplete: () => {
        this.destroy();
      }
    })
  }
}

/**
 * Obstacle: 장애물 오브젝트
 * - 빨간 사각형(rectangle)
 * - 중력 비활성화 + (권장) immovale
 * - 트윈으로 오른쪽 -> 왼쪽 이동 후 화면 밖에서 파괴
 */
class Obstacle extends Phaser.GameObjects.Rectangle {
  // Arcade 물리 바디 (Scene에서 physics.add.existing 후 할당됨)
  public body: Phaser.Physics.Arcade.Body | null = null;
  // 장애물의 크기
  private static readonly SIZE = 102;
  // 작애물의 색상
  private static readonly COLOR = 0xff0000;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, Obstacle.SIZE, Obstacle.SIZE, Obstacle.COLOR);
    // 장면에 객체 등록
    scene.add.existing(this);
    // 장면에 물리 바디 등록
    scene.physics.add.existing(this);
    // 트윈으로만 움직일 것이므로 중력은 끔
    this.body?.setAllowGravity(false);
    // 장애물은 움직이지 않음
    this.body?.setImmovable(true);
    // const alpha = 1 / Phaser.Math.Between(1, 3);
    this.init();
  }

  /**
   * 트윈 설정: 현재 x(또는 우측 바깥) -> 왼쪽 바깥(-100)
   */
  private init() {
    this.scene.tweens.add({
      targets: this,
      x: { from: 2_000, to: -100},
      duration: 2_000,
      onComplete: () => {
        this.destroy();
      }
    });
  }
}

/**
 * Coin: 애니메이션 스프라이트 코인
 * - 중력 비활성화, 작은 원형 바디로 충돌 판정
 * - 오른쪽 -> 왼쪽 트윈 이동 후 화면 밖에서 파괴
 */
class Coin extends Phaser.GameObjects.Sprite {
  // 동전의 애니메이션 키
  private static readonly ANIM_KEY = 'coin';
  // Arcade 물리 바디 (Scene에서 physics.add.existing 후 할당됨)
  public body: Phaser.Physics.Arcade.Body | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'coin');
    // 장면에 객체 등록
    scene.add.existing(this);
    // 장면에 물리 바디 등록
    scene.physics.add.existing(this);
    // 코인은 중력 영향 없음
    this.body?.setAllowGravity(false);
    this.setScale(3.2);
    // const alpha = 1 / Phaser.Math.Between(1, 100);
    this.init();
  }

  /**
   * 트윈 설정 및 스프라이트 애니메이션 생성
   */
  private init() {
    // 트윈 설정: 현재 x(또는 우측 바깥) -> 왼쪽 바깥(-100)
    this.scene.tweens.add({
      targets: this,
      x: { from: 2000, to: -100 },
      duration: 2_000,
      onComplete: () => {
        this.destroy();
      }
    });
    // 스프라이트 애니메이션 생성
    this.anims.create({
      key: Coin.ANIM_KEY,
      frames: this.anims.generateFrameNumbers(Coin.ANIM_KEY, {
        start: 0,
        end: 7
      }),
      frameRate: 8,
    });
    // 애니메이션 재생
    this.play({ key: Coin.ANIM_KEY, repeat: -1 });
  }
}

export default Generator;
