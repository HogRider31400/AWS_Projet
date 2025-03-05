import { BerryBush } from "./berry_bush.js"

export function getPlayerTasks() {
    return {
        pickUpBerry,
        dropItem
    };
}

export function getImpostorTasks() {
    return {
        pickUpBerry,
        dropItem,
        throwItem,
        burnWood, //il faut trouver du feu premièrerment
        gun
    };
}

export function getTasks(){
    pickUpBerry,
    pickUpWood,
    dropItem,
    throwItem,
    burnWood, //il faut trouver du feu premièrerment
    gun
}

export function pickUpBerry(player, berryBush) {
    if(!berryBush) return;

    player.inventory.push("berryBush");  // Ajoute une baie dans l'inventaire
    console.log("Inventaire :", player.inventory);
    //return player.inventory;
}

export function pickUpWood(player, woodPile) {
    if(!woodPile) return;

    player.inventory.push("woodPile");  // Ajoute une baie dans l'inventaire
    console.log("Inventaire :", player.inventory);
    //return player.inventory;
}


export function dropItem(player) {
        if (player.inventory.length === 0) {
            console.log(`Le joueur n'a rien à déposer.`);
            return;
        }
        if (player.inventory.length > 0) {
            // On récupère l'objet à déposer
            const itemToDrop = player.inventory.pop(); // On enlève l'objet de l'inventaire
            
            const dropX = player.x + 50; // Par exemple, à 50 pixels devant lui sur l'axe X
            const dropY = player.y; // La position Y reste la même (vous pouvez ajuster en fonction de la direction si nécessaire)
    
            const dropBerryBush = new BerryBush(player.scene, dropX, dropY);
            player.scene.add.existing(dropBerryBush);
            player.scene.physics.add.collider(player, dropBerryBush, function() {
                console.log('Collision avec berry bush !');
            });
            player.scene.objects.push(dropBerryBush);
    
            console.log("Inventaire après dépôt :", player.inventory);
        } else {
            console.log("L'inventaire est vide, impossible de déposer un objet.");
        }
}

////ACTIONS DE L'IMPOSTEUR///
export function throwItem(player) {
    if (player.inventory.length === 0) {
        console.log(`Le joueur n'a rien à déposer.`);
        return;
    }
    if (player.inventory.length > 0) {
        console.log(`L'imposteur jette un objet'.`, player.inventory);
        const itemToDrop = player.inventory.pop();
    }
}

export function burnWood(player) {

}

export function gun(player) {

}