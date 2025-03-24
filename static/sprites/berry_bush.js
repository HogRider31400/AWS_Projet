export class BerryBush extends Phaser.GameObjects.Sprite {
    constructor (scene, x, y, id, tile)
    {
        super(scene, x, y);
        this.id = id;
        this.type = "berry";
        this.tile = tile;

        if (!scene.textures.exists('redSquare')) {
            let graphics = scene.add.graphics();
            graphics.fillStyle(0xFF0000); // Rouge
            graphics.fillRect(0, 0, 32, 32); // x, y, width, height
            graphics.generateTexture('redSquare', 32, 32);
            graphics.destroy();
        }
        if (!scene.textures.exists('depletedRedSquare')) {
            let graphics = scene.add.graphics();
            graphics.fillStyle(0x8B0000); // Rouge
            graphics.fillRect(0, 0, 32, 32); // x, y, width, height
            graphics.generateTexture('depletedRedSquare', 32, 32);
            graphics.destroy();
        }

        //this.setTexture('redSquare');
        this.setPosition(x, y);
        this.depleted = false;
        scene.physics.world.enable(this);
        this.body.setImmovable(true); //Sinon, quand collision alors ça part dans la direction de la collision
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);
    }

    isNowDepleted()
    {
        //this.setTexture("depletedRedSquare")
        this.tile.tint = 0x7d7d48
        this.depleted = true;
        
    }
}
