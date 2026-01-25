import {Enemy} from "../enemy.js"

export class EnemySlime extends Enemy {
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile, oldMoveX, oldMoveY, blockedX, blockedY, weapon, level) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile, level)
        this.hp = 20 + level*5
        this.speed = 1
        this.png = "./Graphics/enemiesPNG/Schleim/1.png"
        this.hitbox = {width: 1706/ 22, height: 964 / 22}

        const img = new Image();

        img.src = this.png;

        this.level = level
        this.level = 1
        this.xpDrop = 1
        this.baseDamage = 4 + level*3
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
           updateStats() {
        if (this.level === this._currentStatsLevel) return;
        this.dmg += 8
        this.hp += 15
        this.speed += 0.05
    }
}