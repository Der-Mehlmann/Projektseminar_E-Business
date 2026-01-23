import {Enemy} from "../enemy.js"

export class EnemySlime extends Enemy {
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile, oldMoveX, oldMoveY, blockedX, blockedY, weapon) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile)
        this.hp = 20
        this.speed = 1
        this.png = "./Graphics/enemiesPNG/Schleim/1.png"
        this.hitbox = {width: 1706 / 22, height: 964 / 22}

        const img = new Image();

        img.src = this.png;

        this.level = 1
        this.xpDrop = 1
        this.baseDamage = 5
        this.oldMoveX = oldMoveX
        this.oldMoveY = oldMoveY
        this.blockedX = blockedX
        this.blockedY = blockedY
        this.ranged = false
        this.weapon = null  // wenn Waffen implementiert sind, durch weapon ersetzen
    }

    getColor() {
        return "green"
    }
}