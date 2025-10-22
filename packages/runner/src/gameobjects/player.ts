import type { AudioMap } from '../types';

/**
 * Player 클래스
 * Phaser의 기본 도형(rectangle)을 상속받은 플레이어 오브젝트
 */
class Player extends Phaser.GameObjects.Sprite {
  // Player 객체의 애니메이션 키 정의
  private static readonly ANIM_RUN_KEY = 'run';
  private static readonly ANIM_JUMP_KEY = 'jump';
  private static readonly ANIM_LAND_KEY = 'land';
  private static readonly ANIM_DEAD_KEY = 'dead';
  // Arcade 물리 바디 (Scene에서 physics.add.existing 후 할당됨)
  public body: Phaser.Physics.Arcade.Body | null = null;
  // 점프 중인지 여부
  public jumping = false;
  // 죽었는지 여부
  public died = false;
  // 스테미나(기본값 100)
  public stamina = 100;
  // 외부에서 전달 받는 사운드 모음
  private audios: AudioMap;

  constructor(scene: Phaser.Scene, audios: AudioMap, x: number, y: number/*, number: number*/) {
    // super(): 부모 클래스(Phaser.GameObjects.Sprite)의 생성자 호출
    // (scene, x, y, texture, frame)
    super(scene, x, y, 'run');
    this.audios = audios;
    // 오브젝트의 기준점을 가운데(0.5, 0.5)로 설정
    this.setOrigin(0.5);
    // 현재 Scene에 이 오브젝트를 추가
    this.scene.add.existing(this);
    // 이 오브젝트에 Arcade Physics 물리 속성을 추가
    this.scene.physics.add.existing(this);
    // 크기를 0.35배로 설정(기본값이지만 명시적으로 지정)
    this.setScale(0.35);
    if (this.body) {
      // 화면 밖으로 나가지 않도록 월드 경계와 충돌 설정
      this.body.collideWorldBounds = true;
      // Y축 방향의 공기 저항(감속 효과)
      this.body.setDragY(0);
      // 물리 질량(기본값보다 무겁게 설정)
      this.body.mass = 10;
      // 충돌 박스 설정
      this.body.setSize(280, 400)
      this.body.setOffset(20, 77)
    }
    // 달리기 스프라이트 애니메이션 생성
    this.anims.create({
      key: Player.ANIM_RUN_KEY,
      frames: this.anims.generateFrameNumbers('run', {
        start: 0,
        end: 14
      }),
      frameRate: 24 ,
      repeat: -1,
    });
    // 점프 스프라이트 애니메이션 생성
    this.anims.create({
      key: Player.ANIM_JUMP_KEY,
      frames: this.anims.generateFrameNumbers('jump', {
        start: 0,
        end: 14
      }),
      frameRate: 18,
      repeat: -1,
    });
    // 달리기 스프라이트 애니메이션 생성
    this.anims.create({
      key: Player.ANIM_LAND_KEY,
      frames: this.anims.generateFrameNumbers('jump', {
        start: 10,
        end: 14
      }),
      frameRate: 18,
      repeat: 0,
    });
    // 죽음 스프라이트 애니메이션 생성
    this.anims.create({
      key: Player.ANIM_DEAD_KEY,
      frames: this.anims.generateFrameNumbers('dead', {
        start: 0,
        end: 14
      }),
      frameRate: 16,
      repeat: 0,
    });
    this.play(Player.ANIM_RUN_KEY, true);
  }

  public reduceStamina(amount: number) {
    this.stamina = Math.max(0, this.stamina - amount);
  }

  public isExhausted() {
    return this.stamina <= 0;
  }

  public run() {
    if (this.body?.blocked.down) {
      return;
    }
    this.jumping = false;
    this.rotation = 0;
    this.body?.setSize(280, 400);
    this.body?.setOffset(20, 77);
    if (this.anims.currentAnim?.key !== Player.ANIM_RUN_KEY) {
      this.play(Player.ANIM_RUN_KEY, true);
    }
  }

  public jump() {
    if (!this.body?.blocked.down) {
      return;
    }
    this.jumping = true;
    this.body.setVelocityY(-2_080);
    this.body.setSize(240, 340);
    this.body.setOffset(60, 80);
    this.audios.get('jump')?.play();
    if (this.anims.currentAnim?.key !== Player.ANIM_JUMP_KEY) {
      this.play('jump', true);
    }
  }

  public land() {
    if (!this.body) {
      return;
    }
    this.body.setVelocityY(this.body.velocity.y * 0.45);
    if (this.anims.currentAnim?.key !== Player.ANIM_LAND_KEY) {
      this.play(Player.ANIM_LAND_KEY, true);
    }
  }

  public die(callback?: () => void, type?: 'crash' | 'hunger') {
    this.died = true;
    this.setTint(0xff6b6b);
    this.anims.stop();
    this.body!.moves = false;
    if (type === "hunger") {
      this.audios.get('growling')?.play({ volume: 1.5 });
    } else {
      this.audios.get('dead')?.play();
    }
    this.scene.time.delayedCall(
      350,
      () => {
        this.body!.moves = true;
        this.body!.setDragY(3000);
        this.body!.setSize(529, 390)
        this.body!.setOffset(0, 0);
        this.x = this.x + 40;
        if (this.anims.currentAnim?.key !== Player.ANIM_DEAD_KEY) {
          this.anims.play(Player.ANIM_DEAD_KEY, true);
          if (callback) {
            this.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + Player.ANIM_DEAD_KEY, callback);
          }
        }
      },
    );
  }
}

export default Player;
