import {Enemy} from "../enemy.js"

export class EnemyHexe extends Enemy {
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile, oldMoveX, oldMoveY, blockedX, blockedY,weapon, level) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile)
        this.hp = 75+level*5
        this.speed = 0.8
        this.png = "./Graphics/enemiesPNG/Hexe/1.png"
        this.hitbox = {width: 583/7, height: 703/7}

        const img = new Image();
        img.src = this.png;

        this.level = level
        this.level = 1
        this.xpDrop = 6
        this.baseDamage = 20+level*5
        this.oldMoveX = oldMoveX
        this.oldMoveY = oldMoveY
        this.blockedX = blockedX
        this.blockedY = blockedY
        this.ranged = true
    }

    getColor() {
        return "purple"
    }
           updateStats() {
        if (this.level === this._currentStatsLevel) return;
        this.dmg += 8
        this.hp += 15
        this.speed += 0.05
    }
}