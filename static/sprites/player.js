import { BerryBush } from "./berry_bush.js";
import { getImpostorTasks, getPlayerTasks } from "../tasks.js";

export class Player extends Phaser.GameObjects.Sprite {
    constructor (scene, x, y, active, role = "player")
    {
        super(scene, x, y, 'player', 0);
        this.scene = scene;
        this.isActive = active;
        this.role = role;
        this.inventory = [];
        if (role == "player") {
            this.tasks = getPlayerTasks();
        } else if (role == "impostor") {
            this.tasks = getImpostorTasks();
            this.tint = 0xFF0000; // Rouge pour différencier l'imposteur
        }
        scene.physics.add.existing(this);
        
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

        this.interactionIndicator = {};
        this.interactionIndicator.visible = false;
        this.curPlaying = null;

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
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

        this.sounds = {
            grass_sound : scene.sound.add('grass_sound'),
            dirt_sound : scene.sound.add('dirt_sound'),
            sand_sound : scene.sound.add('sand_sound'),
        }
        console.log(this.sounds);
        this.sounds.grass_sound.loop = true;
        this.sounds.grass_sound.rate = 5
        this.sounds.dirt_sound.loop = true;
        this.sounds.dirt_sound.rate = 5
        this.sounds.sand_sound.loop = true;
        this.sounds.sand_sound.rate = 5


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

    initIndicator() {
        this.interactionIndicator = this.scene.add.sprite(0, 0, 'pickUpIcon');
        this.interactionIndicator.visible = false;
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
            this.setFrame(1); //Frame statique par défaut (milieu de la rangée bas)
            if(this.curPlaying){
                this.sounds[this.curPlaying].stop();
            }
            this.curPlaying = null;
            
        }

        this.applyMovement();

        let tileX = Math.floor(this.y / 32)
        let tileY = Math.floor(this.x / 32)
        //console.log(this.scene.layerEau)
        if(moving && this.scene.layerEau.layer.data[tileX])
            if(this.scene.layerEau.layer.data[tileX][tileY]) {
                let cur = this.scene.layerEau.layer.data[tileX][tileY]
                console.log(cur)
                if(cur.properties.to_play) {
                    console.log("On devrait jouer", cur.properties.to_play)
                    if(this.curPlaying != cur.properties.to_play){
                        if(this.curPlaying){
                            this.sounds[this.curPlaying].stop();
                        }
                        this.curPlaying = cur.properties.to_play;
                        
                        if(this.sounds[this.curPlaying]){
                            this.sounds[this.curPlaying].play();
                        }
                    }
                }
            }
        this.square.x = this.scene.layerEau.layer.data[tileX][tileY].x * 32
        this.square.y = this.scene.layerEau.layer.data[tileX][tileY].y * 32
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
            const cur = this.canInteract
            const midX = cur.x //+ 50 //(this.x + berryBush.x) / 3;
            const midY = cur.y + 50 * (this.y+10 > cur.y ? -1 : 1) //this.y //this.y + (this.y + berryBush.y) / 2;
            this.interactionIndicator.setPosition(midX, midY);
            this.interactionIndicator.z = 1;
            this.interactionIndicator.visible = true;
            //console.log(this.interactionIndicator)
        } else {
            this.interactionIndicator.visible = false;
        }


        if (this.canInteract && Phaser.Input.Keyboard.JustDown(this.keyA)) {
            console.log('Action avec A réalisée !');
            if (this.canInteract.type == "berry"){
                if(this.actions.pickUpBerry){
                    this.actions.pickUpBerry(this.canInteract.id);
                    this.tasks.pickUpBerry(this, this.canInteract);
                }
            }
            if (this.canInteract.type == "wood"){
                if(this.actions.pickUpWood) {
                    this.actions.pickUpWood(this.canInteract.id);
                    this.tasks.pickUpWood(this, this.canInteract)
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
                console.log('Action avec D réalisée !', this.inventory);
                //this.actions.dropItem(this.canInteract.id);
                this.tasks.dropItem(this); // Appeler la méthode dropItem() pour déposer un objet
            }
            
            //Je sais pas quoi faire ici, mais par exemple on pourrait utiliser la valeur de canInteract pour savoir quoi faire
        }
    }

    onWaterCollision() {
        console.log("L'imposteur essaie de jeter un objet dans l'eau !", this.inventory);
        if (Phaser.Input.Keyboard.JustDown(this.keyT)) {
            getImpostorTasks().throwItem(this);
        }
    }
}