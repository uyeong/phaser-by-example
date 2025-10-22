import Phaser from 'phaser';
import Game from './scenes/game';
import Opening from './scenes/opening.ts';
import GameOver from './scenes/gameover';

import type { Types as PhaserTypes } from 'phaser';

const config: PhaserTypes.Core.GameConfig = {
  // 게임의 가로 크기(픽셀 단위)
  width: 1_920,
  // 게임의 세로 크기(픽셀 단위)
  height: 960,
  // 화면의 크기 및 배율 관련 설정
  scale: {
    /**
     * 화면 크기를 어떻게 맞출지 지정
     * - Phaser.Scale.NONE: 기본값, 크기 조정 안함
     * - Phaser.Scale.FIT: 참 크기에 맞게 전체가 보이도록 비율 유지하면서 맞춤
     * - Phaser.Scale.ENVELOP: 창을 꽉 채우되 비율이 깨질 수도 있음
     * - Phaser.Scale.RESIZE: 브라우저 크기에 맞춰 캔버스 크기 자체를 바꿈
     */
    mode: Phaser.Scale.FIT,
    /**
     * 게임 화면을 브라우저 창 안에서 어디에 정렬할지 지정
     * - Phaser.Scale.CENTER_BOTH: 가로/세로 모두 중앙 정렬
     * - Phaser.Scale.CENTER_HORIZONTALLY: 가로만 중앙
     * - Phaser.Scale.CENTER_VERTICALLY: 세로만 중앙
     * - Phaser.Scale.NO_CENTER: 정렬 안 함
     */
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // 필셀 좌표 계산 시 반올림을 자동으로 적용하지 않음
  // (false로 두면 더 정밀한 좌표 계산이 가능)
  autoRound: false,
  // HTML 내에서 Phaser 게임을 넣을 DOM 요소의 id
  // 즉, <div id="game-container"></div> 안에 게임이 렌더링됨
  parent: 'game-container',
  // 물리 엔진 설정(Phaser는 여러 물리 엔진을 지원함)
  physics: {
    // 사용할 물리 엔진의 기본값(arcade, matter, impact 중 하나)
    default: 'arcade',
    // arcade 물리 엔진 전용 설정
    arcade: {
      // 중력 설정(y축으로 4,800 힘이 아래로 작용)
      gravity: {
        x: 0,
        y: 4_800
      },
      // 디버그 모드 활성화(true로 하면 충돌 박스, 물리선 등이 보임)
      debug: false
    }
  },
  /**
   * 게임에 표함될 "장면(scene)"의 목록
   * - 각 Scene은 Phaser.Scene 클래스를 상속받은 클래스여야 함
   * - 장면은 순서대로 실행됨 (첫 번째 Scene이 초기 진입 Scene)
   */
  scene: [Game, Opening, GameOver]
};

// const game = new Phaser.Game(config);
new Phaser.Game(config);
