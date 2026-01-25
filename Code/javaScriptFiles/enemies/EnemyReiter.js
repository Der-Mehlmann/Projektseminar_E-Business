import {Enemy} from "../enemy.js"

export class EnemyReiter extends Enemy {
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile, oldMoveX, oldMoveY, blockedX, blockedY, weapon, level) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile)
        this.level = level
        this.hp = 80+level*5
        this.speed = 2.5
        this.png = "./Graphics/enemiesPNG/Reiter/1.png"
        this.hitbox = {width: 663/9, height: 693/9}

        const img = new Image();
        img.src = this.png;

        this.level = 1
        this.xpDrop = 15
        this.baseDamage = 15+level*7
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
           updateStats() {
        if (this.level === this._currentStatsLevel) return;
        this.dmg += 8
        this.hp += 15
        this.speed += 0.05
    }
}