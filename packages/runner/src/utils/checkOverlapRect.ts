function checkOverlapRect(
  { body: bodyA }: Phaser.GameObjects.GameObject,
  { body: bodyB }: Phaser.GameObjects.GameObject
) {
  if (
    !bodyA ||
    !bodyB ||
    !(bodyA instanceof  Phaser.Physics.Arcade.Body) ||
    !(bodyB instanceof  Phaser.Physics.Arcade.Body)) {
    return false;
  }
  const rectA = new Phaser.Geom.Rectangle(bodyA.x, bodyA.y, bodyA.width, bodyA.height);
  const rectB = new Phaser.Geom.Rectangle(bodyB.x, bodyB.y, bodyB.width, bodyB.height);
  return Phaser.Geom.Intersects.RectangleToRectangle(rectA, rectB);
}

export default checkOverlapRect;
