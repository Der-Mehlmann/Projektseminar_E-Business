import {HealDrop, SpeedBoostDrop, XpDrop, XpMagnetDrop, NukeDrop, FreezeDrop} from "./dropSingleUse.js"
import {MovingEntity} from "./movingEntity.js"

export class Enemy extends MovingEntity {

   constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, gridMapTile) {
            super(globalEntityX, globalEntityY, hp, png, speed, hitbox)
            this.gridMapTile = gridMapTile
            this.oldMoveX=0
            this.oldMoveY=0
            this.blockedX = false
            this.blockedY = false
        }

    // Gegner bewegt sich in Richtung Player
    chasePlayer(map, playerX, playerY, enemyArray) {

        let distanceX = playerX - this.globalEntityX
        let distanceY = playerY - this.globalEntityY

        let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY) //Hypotenuse von Enemy zu Player berechnet distance
        if (distance <= 0) return //bleibt stehen bei distance = 0

        const stopDistance = 200 // Ranged-Enemy bleibt ab bestimmter Distanz stehen (z.B. 200px)
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


    die(enemies, positionWithin, enemyItemDrops) {
        //console.log("Enemy ist gestorben! XP gedroppt:", this.xpDrop);
        enemies[this.gridMapTile.row][this.gridMapTile.column].within.splice(positionWithin, 1)
        const dropChance = 0.5 // Chance auf Drop - auf 50% zur besseren Visualisierung
        if (Math.random() < dropChance) {

            let roll = Math.random()
            if (roll < 0.1) {
                enemyItemDrops.push(new SpeedBoostDrop(this.globalEntityX, this.globalEntityY, {
                    width: 16,
                    height: 16
                }, null))
            } else if (roll < 0.2) {
                enemyItemDrops.push(new HealDrop(this.globalEntityX, this.globalEntityY, {
                    width: 16,
                    height: 16
                }, null))
            }   else if (roll < 0.4) {
                enemyItemDrops.push(new XpMagnetDrop(this.globalEntityX, this.globalEntityY, {
                    width: 16,
                    height: 16
                }, null))
            }  else if (roll < 0.75) {
                enemyItemDrops.push(new FreezeDrop(this.globalEntityX, this.globalEntityY, {
                    width: 16,
                    height: 16
                }, null))
            }  else if (roll < 0.80) {
                enemyItemDrops.push(new NukeDrop(this.globalEntityX, this.globalEntityY, {
                    width: 16,
                    height: 16
                    }, null))
                }


            //Game.killCount++
        }
            enemyItemDrops.push(new XpDrop(this.globalEntityX, this.globalEntityY, {
            width: 8,
            height: 8
            }, null))


    }

    shouldShoot(player) {
        // Nur Ranged-Gegner mit Waffe können schießen


        // Distanzberechnung mit deinen Bezeichnern
        let distanceX = player.globalEntityX - this.globalEntityX;
        let distanceY = player.globalEntityY - this.globalEntityY;
        let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        // Nutze die Eigenschaft oder fallback auf den bisherigen Wert
        let stopDistance = 200;

        return distance <= stopDistance;
    }

    freeze(now, duration) {
        const current = this.frozenUntil || 0 // Speichert, bis wann dieser Enemy eingefroren ist
        this.frozenUntil = Math.max(current, now + duration) // wenn er schon gefreezt ist, wird die Dauer verlängert
    }

    render(ctx, MapOne, PlayerOne, enemies, projectiles, performanceNow, positionWithin, gridWidth){
        const frozen = this.frozenUntil && performanceNow < this.frozenUntil
        if (!frozen) {
        let position=this.updateGridPlace(MapOne.tilelength, enemies, positionWithin, gridWidth)
        this.chasePlayer(MapOne, PlayerOne.globalEntityX, PlayerOne.globalEntityY, enemies)                   // Gegner läuft auf den Spieler zu
        if (this.weapon)  {
            this.weapon.render(ctx, PlayerOne, performanceNow, enemies, MapOne, gridWidth)
        }
    }
        // Zeichnen passiert IMMER, auch wenn gefreezt (damit Enemies nicht "verschwinden").
        // Bei Freeze ändern wir nur kurz den Canvas-Zustand: halbtransparent = sichtbarer Freeze-Effekt.
        // save/restore ist wichtig, damit danach nicht alles im Spiel halbtransparent wird.
         if (frozen) {
        ctx.save()
        ctx.globalAlpha = 0.5           // leicht transparent
        this.draw(ctx, PlayerOne)
        ctx.restore()
    } else {
        this.draw(ctx, PlayerOne) // Gegner im Sichtbereich zeichnen
    }
        if (PlayerOne.checkCollision(this, 0, 0)) {        // Treffer?
            PlayerOne.takeDmg(15, enemies, positionWithin)
            this.killCount++
        }
    }
}