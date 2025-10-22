function delay(scene: Phaser.Scene, ms: number) {
  return new Promise<void>((resolve) => (
    scene.time.delayedCall(ms, resolve, undefined, scene)
  ));
}

export default delay;
