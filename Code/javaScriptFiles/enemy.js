import {
    AttackBoostDrop,
    FreezeDrop,
    HealDrop,
    InstantLevelDrop,
    NukeDrop,
    XpDrop,
    XpMagnetDrop
} from "./dropSingleUse.js"
import {Weapon} from "./weapons/Weapon.js"
import {MovingEntity} from "./movingEntity.js"


export class Enemy extends MovingEntity {

   constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile, level) {
            super(globalEntityX, globalEntityY, hp, png, speed, hitbox)
            this.gridMapTile = gridMapTile
            this.oldMoveX=0
            this.oldMoveY=0
            this.blockedX = false
            this.blockedY = false
            this.level = level
            this.contactDamageCooldownMs = 400   
            this.nextAllowedContactDamageAt = 0

        }

    draw(ctx, player) {
        if (typeof this.png === 'string') {
            const src = this.png
            this.png = new Image()
            this.png.src = src
        }
        super.draw(ctx, player)
    }

    // Gegner bewegt sich in Richtung Player
    chasePlayer(map, playerX, playerY, enemyArray) {

        let distanceX = playerX - this.globalEntityX
        let distanceY = playerY - this.globalEntityY

        let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY) //Hypotenuse von Enemy zu Player berechnet distance
        if (distance <= 0) return //bleibt stehen bei distance = 0

        const stopDistance = 500 // Ranged-Enemy bleibt ab bestimmter Distanz stehen (z.B. 200px)
        if (this.ranged && distance <= stopDistance) {
            return
        }

        const visitedForX = new Set()
        const visitedForY = new Set()



        let oldX = this.globalEntityX
        let oldY = this.globalEntityY

        distanceX /= distance; // Teilt Entfernung durch sich selbst -> Gegner bewegt sich gleichmäßig
        distanceY /= distance;

        let moveStepX = distanceX * this.speed
        let moveStepY = distanceY * this.speed

        let resultX
        let resultY
        if (!this.blockedX && !this.blockedY){                                      // Bewegung wenn alles frei ist
            resultX = this.attemptMoveAxis(this, 'x', moveStepX, enemyArray, map, visitedForX).success
            resultY = this.attemptMoveAxis(this, 'y', moveStepY, enemyArray, map, visitedForY).success
            if (!resultX){
                this.blockedX = true
                this.oldMoveY = Math.sign(moveStepY) * this.speed
            }
            if (!resultY){
                this.blockedY = true
                this.oldMoveX = Math.sign(moveStepX) * this.speed
            }


        }else{                                                                         //Bewegung wenn mind eine Achse blockiert ist
            if (this.blockedX && this.blockedY){
                if(Math.random()<0.5) moveStepX*= -1
                else moveStepY*=-1
            }
            if (this.blockedX){                                                         //Bewegung wenn X Achse Blockiert ist
                resultX = this.attemptMoveAxis(this, 'x', moveStepX, enemyArray, map, visitedForX).success        //Versuchen zu Bewegen auf der X-Achse
                resultY = this.attemptMoveAxis(this, 'y', this.oldMoveY, enemyArray, map, visitedForY).success   // gesamte Bewegung auf der Y-Achse

                if (resultX){        //Falls auch X-Achse nun nicht mehr Blockiert ist
                    this.blockedX = false
                }
                if (!resultY){        //Falls Y-Achse nun auch blockiert
                    this.blockedY = true
                    this.oldMoveX = Math.sign(moveStepX) * this.speed
                }
            }

            visitedForX.clear()
            visitedForY.clear()

            if (this.blockedY){
                resultX = this.attemptMoveAxis(this, 'x', this.oldMoveX, enemyArray, map, visitedForX).success
                resultY = this.attemptMoveAxis(this, 'y', moveStepY, enemyArray, map, visitedForY).success
                if (resultY){
                    this.blockedY = false
                }
                if (!resultX){
                    this.blockedX = true
                    this.oldMoveY = Math.sign(moveStepY) * this.speed
                }
            }
        }
    }


    die(enemies, positionWithin, enemyItemDrops, dropSettings = {}) {
        const { dropItems = true } = dropSettings 
        //console.log("Enemy ist gestorben! XP gedroppt:", this.xpDrop);
        enemies[this.gridMapTile.row][this.gridMapTile.column].within.splice(positionWithin, 1)

        if (dropItems) {
        const dropChance = 0.05 // Chance auf Drop - auf 50% zur besseren Visualisierung
        if (Math.random() < dropChance) {

            let roll = Math.random()
            if (roll < 0.3) {
                enemyItemDrops.push(new HealDrop(this.globalEntityX, this.globalEntityY, {
                    width: 32,
                    height: 32
                }, "./Graphics/singleUsePng/3.png"))
            } else if (roll < 0.6) {
                enemyItemDrops.push(new AttackBoostDrop(this.globalEntityX, this.globalEntityY, {
                    width: 32,
                    height: 32
                }, "./Graphics/singleUsePng/2.png"))
            } else if (roll < 0.7) {
                enemyItemDrops.push(new XpMagnetDrop(this.globalEntityX, this.globalEntityY, { 
                    width: 16, 
                    height: 16 
                }, "./Graphics/singleUsePng/1.png"))
            } else if (roll < 0.72) { 
                enemyItemDrops.push(new InstantLevelDrop(this.globalEntityX, this.globalEntityY, {
                    width: 16,
                    height: 16
                }, "./Graphics/singleUsePng/6.png"))
            } else if (roll < 0.75) {
                enemyItemDrops.push(new NukeDrop(this.globalEntityX, this.globalEntityY, {
                    width: 32,
                    height: 32
                }, "./Graphics/singleUsePng/4.png"))
            } else if (roll < 0.95) {
                enemyItemDrops.push(new FreezeDrop(this.globalEntityX, this.globalEntityY, {
                    width: 32,
                    height: 32
                }, "./Graphics/singleUsePng/5.png"))
            } else if (roll < 1) {
                console.log("Instant Level Drop!!!");
                enemyItemDrops.push(new InstantLevelDrop(this.globalEntityX, this.globalEntityY, {
                    width: 32,
                    height: 32
                }, "./Graphics/singleUsePng/6.png"))
            }
        }

        if (this.constructor.name === "EnemySchatzgoblin") {
        enemyItemDrops.push(new InstantLevelDrop(this.globalEntityX, this.globalEntityY, {
            width: 32,
            height: 32
        }, "./Graphics/singleUsePng/6.png"))}
    }

        enemyItemDrops.push(new XpDrop(this.globalEntityX, this.globalEntityY, {
            width: 32,
            height: 32
        }, "./Graphics/singleUsePng/xp.png"))
    }

    shouldShoot(player) {
        // Distanzberechnung
        let distanceX = player.globalEntityX - this.globalEntityX;
        let distanceY = player.globalEntityY - this.globalEntityY;
        let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        // Nutze die Eigenschaft oder fallback auf den bisherigen Wert
        let stopDistance = 400;
        // Schieß-Reichweite - passend zur Waffen-Range
        let shootDistance = this.weapon?.range || 500;

        return distance <= shootDistance;
    }

    freeze(now, duration) {
        const current = this.frozenUntil || 0 // Speichert, bis wann dieser Enemy eingefroren ist
        this.frozenUntil = Math.max(current, now + duration) // wenn er schon gefreezt ist, wird die Dauer verlängert
    }

    render(ctx, MapOne, PlayerOne, enemies, projectiles, performanceNow, positionWithin, gridWidth, enemyItemDrops = []){
        const frozen = this.frozenUntil && performanceNow < this.frozenUntil
        if (!frozen) {
        let position=this.updateGridPlace(MapOne.tilelength, enemies, positionWithin, gridWidth)
        this.chasePlayer(MapOne, PlayerOne.globalEntityX, PlayerOne.globalEntityY, enemies)                   // Gegner läuft auf den Spieler zu
        if (this.weapon)  {
            // Shoot Logik - PlayerOne wird übergeben damit die Richtung korrekt berechnet wird
            this.weapon.shoot(PlayerOne, performanceNow, enemies, MapOne.tilelength, gridWidth, null, enemyItemDrops);
            // Render Projektile
            this.weapon.render(ctx, PlayerOne, performanceNow, enemies, MapOne, gridWidth, enemyItemDrops);
        }
    }
        // Zeichnen passiert IMMER, auch wenn gefreezt (damit Enemies nicht "verschwinden").
        // Bei Freeze ändern wir nur kurz den Canvas-Zustand: halbtransparent = sichtbarer Freeze-Effekt.
        // save/restore ist wichtig, damit danach nicht alles im Spiel halbtransparent wird.
         if (frozen) {
        ctx.save()
        ctx.globalAlpha = 0.8           // leicht transparent
        this.draw(ctx, PlayerOne)
        ctx.restore()
    } else {
        this.draw(ctx, PlayerOne) // Gegner im Sichtbereich zeichnen
    }
        if (this.checkCollisionWithEntity(PlayerOne)) { // Treffer?
        const now = performanceNow ?? performance.now()

        if (now >= this.nextAllowedContactDamageAt) {
        PlayerOne.takeDmg(15, enemies, positionWithin, [])
        this.nextAllowedContactDamageAt = now + this.contactDamageCooldownMs
    }
    }

    }
}