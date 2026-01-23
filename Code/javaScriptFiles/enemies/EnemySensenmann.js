import {Enemy} from "../enemy.js"

export class EnemySensenmann extends Enemy {
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile, oldMoveX, oldMoveY, blockedX, blockedY, weapon) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile)
        this.hp = 75
        this.speed = 1
        this.png = "./Graphics/enemiesPNG/Sense/1.png"
        this.hitbox = {width: 634/9, height: 603/9}

        const img = new Image();
        img.src = this.png;

        this.level = 1
        this.xpDrop = 4
        this.baseDamage = 20
        this.oldMoveX = oldMoveX
        this.oldMoveY = oldMoveY
        this.blockedX = blockedX
        this.blockedY = blockedY
        this.ranged = false
        this.weapon = null  // wenn Waffen implementiert sind, durch weapon ersetzen
    }

    getColor() {
        return "silver"
    }
}