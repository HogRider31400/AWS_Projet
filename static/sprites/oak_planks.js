export class OakPlanks extends Phaser.GameObjects.Sprite {
    constructor (scene, x, y, id, tile)
    {
        super(scene, x, y);
        this.id = id;
        this.type = "wood"
        this.tile = tile;
        if (!scene.textures.exists('woodSquare')) {
            let graphics = scene.add.graphics();
            graphics.fillStyle(0xDEB887); // Chêne
            graphics.fillRect(0, 0, 32, 32); // x, y, width, height
            graphics.generateTexture('woodSquare', 32, 32);
            graphics.destroy();
        }

        //this.setTexture('woodSquare');
        this.setPosition(x, y);
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
        
    }
}
