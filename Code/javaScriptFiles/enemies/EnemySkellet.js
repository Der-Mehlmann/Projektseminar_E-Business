import {Enemy} from "../enemy.js"
import {Weapon} from "../weapons/Weapon.js"

export class EnemySkellet extends Enemy {
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile, oldMoveX, oldMoveY, blockedX, blockedY, weapon) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile)
        this.hp = 35
        this.speed = 1
        this.png = "./Graphics/enemiesPNG/Skellet/2.png"
        this.hitbox = {width: 447/13, height: 683/13}

        const img = new Image();
        img.src = this.png;

        this.level = 1
        this.xpDrop = 2
        this.baseDamage = 10
        this.oldMoveX = oldMoveX
        this.oldMoveY = oldMoveY
        this.blockedX = blockedX
        this.blockedY = blockedY
        this.weapon = Weapon.create("basicEnemy", this, 420, 420, 8)    // wenn Waffen implemtiert sind, durch weapon ersetzen
        this.ranged = true
    }

    getColor() {
        return "white"
    }
}