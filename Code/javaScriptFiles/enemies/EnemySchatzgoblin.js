import {Enemy} from "../enemy.js"

export class EnemySchatzgoblin extends Enemy {
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile, oldMoveX, oldMoveY, blockedX, blockedY, weapon, level) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile)
        this.level = level
        this.currentHPHP = this.hp = 500
        this.speed = 5
        this.png = "./Graphics/enemiesPNG/Goblin/1.png"
        this.hitbox = {width: 530/8, height: 577/8}


        const img = new Image();
        img.src = this.png;

        this.level = 1
        this.xpDrop = 30
        this.baseDamage = 0
        this.oldMoveX = oldMoveX
        this.oldMoveY = oldMoveY
        this.blockedX = blockedX
        this.blockedY = blockedY
        this.ranged = false
        this.weapon = null  // wenn Waffen implementiert sind, durch weapon ersetzen
        this.elite = true
        this.radius = 64;
        this.centerX = globalEntityX;
        this.centerY = globalEntityY;
        // Startwinkel zufällig
        this.angle = Math.random() * Math.PI * 2;
        this.angularSpeed = 1.0 / 60.0; // Eine Umdrehung alle 6 Sekunden
        this.scared = false
        this.ticker = 0
    }

    move(PlayerOne, MapOne, enemies) {
        if (!this.scared) {
            this.angle += this.angularSpeed;
            this.attemptMoveAxis(this, "x", Math.cos(this.angle) * 1, enemies, MapOne);
            this.attemptMoveAxis(this, "y", Math.sin(this.angle) * 1, enemies, MapOne);

        } else {                                                                                    // Wenn verängstigt, dann weg vom Spieler bewegen
            this.chasePlayer(MapOne, this.globalEntityX * 2 - PlayerOne.globalEntityX, this.globalEntityY * 2 - PlayerOne.globalEntityY, enemies)
            this.ticker++
            if (this.ticker > 300) {          // Nach 5 Sekunden ist der Schatzgoblin nicht mehr verängstigt
                this.scared = false
                this.ticker = 0
                this.currentHP = this.hp
                this.centerX = this.globalEntityX;
                this.centerY = this.globalEntityY;
            }
        }
    }

    render(ctx, MapOne, PlayerOne, enemies, projectiles, performanceNow, positionWithin, gridWidth, enemyItemDrops = []) {
        let position = this.updateGridPlace(MapOne.tilelength, enemies, positionWithin, gridWidth)
        this.draw(ctx, PlayerOne)
        this.move(PlayerOne, MapOne, enemies)
        if (this.hp != this.currentHP) {
            this.scared = true
        }
    }

    getColor() {
        return "DarkGreen"
    }
           updateStats() {
        if (this.level === this._currentStatsLevel) return;
        this.dmg += 8
        this.hp += 15
        this.speed += 0.05
    }
}