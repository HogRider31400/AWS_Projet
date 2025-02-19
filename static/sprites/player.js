export class Player extends Phaser.GameObjects.Sprite {
    constructor (scene, x, y, active)
    {
        super(scene, x, y, 'player', 0);
        this.scene = scene;
        this.isActive = active;
        scene.physics.add.existing(this);
        //this.tint = 0x3d3d29
        
        this.body.setCollideWorldBounds(true)

        if (!scene.textures.exists('blueSquare')) {
            let graphics = scene.add.graphics();
            graphics.fillStyle(0x0000FF);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture('blueSquare', 32, 32);
            graphics.destroy();
        }

        //this.setTexture('blueSquare');
        this.setPosition(x, y);
        this.direction = {
            x : "n",
            y : "n"
        }

        if (!scene.textures.exists('greenSquare')) {
            let graphics = scene.add.graphics();
            graphics.fillStyle(0x00FF00); // Vert
            graphics.fillRect(0, 0, 16, 16);
            graphics.generateTexture('greenSquare', 16, 16);
            graphics.destroy();
        }

        this.interactionIndicator = scene.add.sprite(0, 0, 'pickUpIcon');
        this.interactionIndicator.visible = false;


        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.moveSpeed = 200;
        this.last_sent = 10000;
        this.last_pos = {
            x : -1,
            y : -1
        } 
        this.last_dir = {
            x : "n",
            y : "n"
        }
        this.was_moving = false;
        this.actions = {};

        scene.physics.world.enable(this);

        this.canInteract = false; //On met à false quand on peut pas, si on peut alors on a le nom de l'objet (?)

    }

    onAction(key, func) {
        //On prend une fonction de type unit -> unit
        this.actions[key] = func;
    }

    applyMovement(){
        const speed = 150;
        if(this.direction.x == "left") {
            this.body.setVelocityX(-speed);
            this.anims.play('left', true);
        }
        else if(this.direction.x == "right") {
            this.body.setVelocityX(speed);
            this.anims.play('right', true);
        }
        else {
            this.body.setVelocityX(0);
        }

        if(this.direction.y == "up") {
            this.body.setVelocityY(-speed);
            if(this.direction.x == "n")
                this.anims.play('up', true);
        }
        else if (this.direction.y == "down") {
            this.body.setVelocityY(speed);
            if(this.direction.x == "n")
                this.anims.play('down', true);
        }
        else{
            this.body.setVelocityY(0);
        }
    }

    preUpdate (time, delta)
    {
        
        super.preUpdate(time, delta);

        //Update de joueur non actif
        if(this.isActive == false){
            this.applyMovement();
            return;
        }

        //Update de vrai joueur
        this.body.setVelocity(0);

        let moving = false;

        if (this.cursors.left.isDown) {
            this.direction.x = "left"
            moving = true;
        } else if (this.cursors.right.isDown) {
            this.direction.x = "right"
            moving = true;
        }
        else{
            this.direction.x = "n"
        }

        if (this.cursors.up.isDown) {
            this.direction.y = "up"
            moving = true;
        } else if (this.cursors.down.isDown) {
            this.direction.y = "down"
            moving = true;
        } else {
            this.direction.y = "n"
        }

        if (!moving) {
            this.anims.stop();
            this.setFrame(1); // Frame statique par défaut (milieu de la rangée bas)
        }

        this.applyMovement();

        //Mise à jour réseau
        if((this.last_sent > 30 && ((this.last_pos.x != this.x || this.last_pos.y != this.y) || (moving != this.was_moving)))
            || (this.direction.x != this.last_dir.x || this.direction.y != this.last_dir.y)
            ) {
            this.scene.sendPlayerPosition(this.x,this.y);
            this.last_sent = 0;
            this.was_moving = moving;
        }
        else this.last_sent += delta;
        this.last_pos = {
            x : this.x,
            y : this.y
        }
        this.last_dir = this.direction

        if (this.canInteract) {
            const berryBush = this.scene.berryBush;
            const midX = berryBush.x //+ 50 //(this.x + berryBush.x) / 3;
            const midY = berryBush.y + 50 * (this.y+10 > berryBush.y ? -1 : 1) //this.y //this.y + (this.y + berryBush.y) / 2;
            
            this.interactionIndicator.setPosition(midX, midY);
            this.interactionIndicator.visible = true;
        } else {
            this.interactionIndicator.visible = false;
        }


        if (this.canInteract && Phaser.Input.Keyboard.JustDown(this.keyA)) {
            console.log('Action avec A réalisée !');
            if(this.actions.pickUpBerry) this.actions.pickUpBerry();
            //Je sais pas quoi faire ici, mais par exemple on pourrait utiliser la valeur de canInteract pour savoir quoi faire
        }
    }
}