export class BerryBush extends Phaser.GameObjects.Sprite {
    constructor (scene, x, y)
    {
        super(scene, x, y);
        
        if (!scene.textures.exists('redSquare')) {
            let graphics = scene.add.graphics();
            graphics.fillStyle(0xFF0000); // Rouge
            graphics.fillRect(0, 0, 32, 32); // x, y, width, height
            graphics.generateTexture('redSquare', 32, 32);
            graphics.destroy();
        }

        this.setTexture('redSquare');
        this.setPosition(x, y);
        scene.physics.world.enable(this);
        this.body.setImmovable(true); //Sinon, quand collision alors ça part dans la direction de la collision
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);
    }
}
