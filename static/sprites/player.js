export class Player extends Phaser.GameObjects.Sprite {
    constructor (scene, x, y)
    {
        super(scene, x, y);
        
        if (!scene.textures.exists('blueSquare')) {
            let graphics = scene.add.graphics();
            graphics.fillStyle(0x0000FF);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture('blueSquare', 32, 32);
            graphics.destroy();
        }

        this.setTexture('blueSquare');
        this.setPosition(x, y);


        if (!scene.textures.exists('greenSquare')) {
            let graphics = scene.add.graphics();
            graphics.fillStyle(0x00FF00); // Vert
            graphics.fillRect(0, 0, 16, 16);
            graphics.generateTexture('greenSquare', 16, 16);
            graphics.destroy();
        }

        this.interactionIndicator = scene.add.sprite(0, 0, 'greenSquare');
        this.interactionIndicator.visible = false;


        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.moveSpeed = 200;

        scene.physics.world.enable(this);

        this.canInteract = false; //On met à false quand on peut pas, si on peut alors on a le nom de l'objet (?)

    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);
        this.body.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.body.setVelocityX(-this.moveSpeed);
        } else if (this.cursors.right.isDown) {
            this.body.setVelocityX(this.moveSpeed);
        }

        if (this.cursors.up.isDown) {
            this.body.setVelocityY(-this.moveSpeed);
        } else if (this.cursors.down.isDown) {
            this.body.setVelocityY(this.moveSpeed);
        }

        if (this.canInteract) {
            const berryBush = this.scene.berryBush;
            const midX = (this.x + berryBush.x) / 2;
            const midY = (this.y + berryBush.y) / 2;
            
            this.interactionIndicator.setPosition(midX, midY);
            this.interactionIndicator.visible = true;
        } else {
            this.interactionIndicator.visible = false;
        }


        if (this.canInteract && Phaser.Input.Keyboard.JustDown(this.keyA)) {
            console.log('Action avec A réalisée !');
            //Je sais pas quoi faire ici, mais par exemple on pourrait utiliser la valeur de canInteract pour savoir quoi faire
        }
    }
}