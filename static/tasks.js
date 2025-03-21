import { BerryBush } from "./sprites/berry_bush.js"
import { OakPlanks } from "./sprites/oak_planks.js"
import { Sceau } from "./sprites/sceau.js"
import { Hache } from "./sprites/hache.js"
import { Couteau } from "./sprites/couteau.js"

export function getPlayerTasks() {
    return {
        pickUpBerry,
        pickUpWood,
        dropItem,
        openChest,
        fillBucket

    };
}

export function getImpostorTasks() {
    return {
        pickUpBerry,
        pickUpWood,
        dropItem,
        openChest,
        fillBucket,
        throwItem,
        knife
    };
}

export function pickUpBerry(player, berryBush) {
    if(!berryBush) return;

    if (player.inventory.length + 5 > 8) {
        console.log("L'inventaire est déjà plein !");
        return;
    }

    console.log("pickup Item : ", berryBush);
    const capacity = berryBush.tile.properties.capacity;
    for (let i = 0; i < capacity; i++) {
        player.inventory.push("berryBush");  // Ajoute une baie dans l'inventaire
    }
    console.log("Inventaire :", player.inventory);

    berryBush.destroy();
    player.scene.elements = player.scene.elements.filter(element => element !== berryBush);
    const elementsLayer = player.scene.map.getLayer('elements').tilemapLayer;
    elementsLayer.removeTileAt(berryBush.tile.x, berryBush.tile.y);

    player.updateInventory();
    //return player.inventory;
}

export function pickUpWood(player, woodPile) {
    if(!woodPile) return;

    if (player.inventory.length + 4 > 8) {
        console.log("L'inventaire est déjà plein !");
        return;
    }

    console.log("pickup Item : ", woodPile);
    const capacity = woodPile.tile.properties.capacity;
    for (let i = 0; i < capacity; i++) {
        player.inventory.push("woodPile");  // Ajoute du baie dans l'inventaire
    }
    console.log("Inventaire :", player.inventory);

    woodPile.destroy();
    player.scene.elements = player.scene.elements.filter(element => element !== woodPile);
    const elementsLayer = player.scene.map.getLayer('elements').tilemapLayer;
    elementsLayer.removeTileAt(woodPile.tile.x, woodPile.tile.y);

    player.updateInventory();
    //return player.inventory;
}


export function dropItem(player) {

        if (player.inventory.length > 0) {
            const slots = document.querySelectorAll('.inventory-slot');

            slots.forEach((slot, index) => {
                slot.addEventListener('click', () => {
                    // Retire la sélection des autres cases
                    slots.forEach(s => s.classList.remove('selected'));
                    // Ajoute la sélection à la case cliquée
                    slot.classList.add('selected');

                    // Action logique (par exemple retirer l'objet du tableau)
                    if (player.inventory[index]) {
                        console.log(`Objet sélectionné : ${player.inventory[index]}`);

                    // On récupère l'objet à déposer
                    const itemToDrop = player.inventory[index]; // On enlève l'objet de l'inventaire
                    //player.inventory[index] = null;

                    const dropTileX = Math.floor((player.x + 50) / 32); // Conversion en coordonnées de tile
                    const dropTileY = Math.floor(player.y / 32);

                    //////////PARTIE CREER L'OBJET SUR LA CARTE//////////
                    //On doit refaire une tile sur le calque élément
                    const layer = player.scene.map.getLayer('elements').tilemapLayer;

                    let item; //PENSER QUE LES ID SONT DECALEES SI ON A PLS TILESET !!!
                    if (itemToDrop == "berryBush") {
                        const tile = layer.putTileAt(453, dropTileX, dropTileY);
                        tile.properties = {
                            name: "berryBush",
                            capacity: 5
                        };
                        item = new BerryBush(player.scene, dropTileX * 32 + 16, dropTileY * 32 + 16, dropTileY + "/" + dropTileX, layer.getTileAt(dropTileX, dropTileY));
                    } else if (itemToDrop == "woodPile") {
                        const tile = layer.putTileAt(493, dropTileX, dropTileY);
                        tile.properties = {
                            name: "woodPile",
                            capacity: 4
                        };
                        item = new OakPlanks(player.scene, dropTileX * 32 + 16, dropTileY * 32 + 16, dropTileY + "/" + dropTileX, layer.getTileAt(dropTileX, dropTileY));
                    }

                    if (item) {
                        player.scene.elements.push(item);
                        player.scene.physics.add.collider(player, item, function() {
                            console.log('Collision !');
                        });
                        player.scene.add.existing(item);
                    }
                    ////////////////////////////////////////
            
                    /////On enlève dans l'inventaire le bon nombre d'objet en fonction de sa capacity
                    let count = 0;
                    player.inventory = player.inventory.filter(itemInventory => {
                        if (itemInventory === itemToDrop && count < item.tile.properties.capacity) {
                            count++;
                            return false;
                        }
                    return true;
                    });
                    player.updateInventory();
    
                    console.log("Inventaire après dépôt :", player.inventory);
                    return item
                    }
                });
            });
        } else {
            console.log("L'inventaire est vide, impossible de déposer un objet.");
        }
}

export function openChest(player, chest) {
    const layer = player.scene.map.getLayer('elements').tilemapLayer;

    const x = layer.worldToTileX(chest.x);
    const y = layer.worldToTileX(chest.y);
    
    const chestOpenedTopLeft = 461;
    const chestOpenedTopRight = 462;
    const chestOpenedBottomLeft = 469;
    const chestOpenedBottomRight = 470;

    // Placer chaque tuile à la bonne position
    layer.putTileAt(chestOpenedTopLeft, x - 1, y - 1);
    layer.putTileAt(chestOpenedTopRight, x, y - 1);
    layer.putTileAt(chestOpenedBottomLeft, x - 1, y);
    layer.putTileAt(chestOpenedBottomRight, x, y);
}

export function fillBucket(player) {
    console.log("Vous avez rempli le sceau");
    player.fillBucket = true;

    const bucketIndex = player.inventory.indexOf("sceau");
    if (bucketIndex !== -1) {
        const slots = document.querySelectorAll('.inventory-slot');
        slots[bucketIndex].style.backgroundColor = 'rgb(64, 192, 218)';
    }
}

////ACTIONS DE L'IMPOSTEUR///
export function throwItem(player) {
    console.log("throwItem")
    if (player.inventory.length === 0) {
        console.log(`Le joueur n'a rien à déposer.`);
        return;
    }
    if (player.inventory.length > 0) {
        console.log(`L'imposteur jette un objet'.`, player.inventory);
        const itemToDrop = player.inventory.pop();
    }
}

export function knife(player) {

}