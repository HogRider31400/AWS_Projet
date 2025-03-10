export class Chest extends Phaser.GameObjects.Sprite {
    constructor (scene, x, y, id, tile) {
        super(scene, x, y)
        this.id = id;
        this.type = "chest"
        this.tile = tile;

        this.setPosition(x, y);
        scene.physics.world.enable(this);
        //this.body.setSize(64, 64); //colision 32x32 sufisante
        this.body.setImmovable(true);
    }

    chestTypeOpened() {
        this.type = "chestOpened";
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);
    }
}