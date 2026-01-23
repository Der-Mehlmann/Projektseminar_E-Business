import {Enemy} from "../enemy.js"

export class EnemyReiter extends Enemy {
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile, oldMoveX, oldMoveY, blockedX, blockedY, weapon) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile)
        this.hp = 80
        this.speed = 2.5
        this.png = "./Graphics/enemiesPNG/Reiter/1.png"
        this.hitbox = {width: 663/9, height: 693/9}

        const img = new Image();
        img.src = this.png;

        this.level = 1
        this.xpDrop = 2
        this.baseDamage = 15
        this.oldMoveX = oldMoveX
        this.oldMoveY = oldMoveY
        this.blockedX = blockedX
        this.blockedY = blockedY
        this.ranged = false
        this.weapon = null  // wenn Waffen implementiert sind, durch weapon ersetzen
    }

    getColor() {
        return "grey"
    }
}