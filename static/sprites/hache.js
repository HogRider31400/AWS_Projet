export class Hache extends Phaser.GameObjects.Sprite {
    constructor (scene, x, y, id, tile) {
        super(scene, x, y)
        this.id = id;
        this.type = "hache"
        this.tile = tile;

        this.setPosition(x, y);
        scene.physics.world.enable(this);
        this.body.setImmovable(true);
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);
    }
}