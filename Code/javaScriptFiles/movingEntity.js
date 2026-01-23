import {Entity} from "./entity.js";

export class MovingEntity extends Entity {

    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox) {
        super(globalEntityX, globalEntityY, hitbox, png);
        this.globalEntityX = globalEntityX;
        this.globalEntityY = globalEntityY;
        this.hp = hp;
        this.maxHp = hp; // MaxHP entspricht Startwert
        this.speed = speed;
        this.hitbox = hitbox;
    }

    // Prüft, ob zwei Entities kollidieren (AABB-Kollision)

    spawnCheck(map, hitboxWidth, hitboxHeight) {
        return (map.findTile(this.globalEntityX, this.globalEntityY).walkable && map.findTile(this.globalEntityX, this.globalEntityY + hitboxHeight-1).walkable && map.findTile(this.globalEntityX + hitboxWidth-1, this.globalEntityY).walkable && map.findTile(this.globalEntityX + hitboxWidth-1, this.globalEntityY + hitboxHeight -1).walkable)
    }

    checkSpawnCollision(enemiesArray, gridMapTile) {
        for (let row = gridMapTile.row - 1; row <= gridMapTile.row + 1; row++) {
            for (let column = gridMapTile.column - 1; column <= gridMapTile.column + 1; column++) {
                for (const other of enemiesArray[row][column].within){
                    if (other === this) continue
                    if (this.checkCollision(other, 0, 0)){
                    return true
                    }
                }
            }
        }
        return false
    }

    checkCollision(other, proposedMoveX, proposedMoveY) {
        return (this.checkCollisionHorizontal(other, proposedMoveX) && this.checkCollisionVertical(other, proposedMoveY))
    }

    checkCollisionHorizontal(other, proposedMoveX) {
        const aLeft = this.globalEntityX + proposedMoveX        // mir geplanter bewegung
        const aRight = aLeft + this.hitbox.width
        const bLeft = other.globalEntityX
        const bRight = bLeft + other.hitbox.width

        const aTop = this.globalEntityY                         // ohne geplante bewegung
        const aBottom = aTop + this.hitbox.height
        const bTop = other.globalEntityY
        const bBottom = bTop + other.hitbox.height

        if (!((aBottom > bTop) && (aTop < bBottom))) {
            return false
        } // keine vertikale Überschneidung --> keine horizontale Kollision
        if (aRight <= bLeft) {
            return false
        }                          // Prüfe ob horizontale Überschneidung
        if (aLeft >= bRight) {
            return false
        }                           // Prüfe ob horizontale Überschneidung
        return true // Überschneidung
    }

    checkCollisionVertical(other, proposedMoveY) {
        const aTop = this.globalEntityY + proposedMoveY        // mir geplanter bewegung
        const aBottom = aTop + this.hitbox.height
        const bTop = other.globalEntityY
        const bBottom = bTop + other.hitbox.height

        const aLeft = this.globalEntityX                         // ohne geplante bewegung
        const aRight = aLeft + this.hitbox.width
        const bLeft = other.globalEntityX
        const bRight = bLeft + other.hitbox.width

        if (!((aRight > bLeft) && (aLeft < bRight))) {
            return false
        } // keine horizontale Überschneidung --> keine vertikale Kollision
        if (aBottom <= bTop) {
            return false
        }                        // Prüfe ob vertikale Überschneidung
        if (aTop >= bBottom) {
            return false
        }                           // Prüfe ob vertikale Überschneidung
        return true // Überschneidung
    }

    attemptMoveAxis(self, axis, move, enemyArray, map, visited = new Set) {
        if (visited.has(self)) {     //Verhindert das selbe Objekt mehrfach besucht wird
            return {success: false}
        }
        visited.add(self)

        if (move === 0) return {success: true}
        const colliding = [] //Array mit Entitys die gepusht werden müssten damit true
        for (let row = self.gridMapTile.row - 1; row <= self.gridMapTile.row + 1; row++) {
            if (!enemyArray[row]) continue // abfangen von out of Border
            for (let column = self.gridMapTile.column - 1; column <= self.gridMapTile.column + 1; column++) {
                if (!enemyArray[row][column]) continue // abfangen von out of Border
                for (const other of enemyArray[row][column].within) {
                    if (other === self) continue
                    if (axis === 'x') {
                        if (self.checkCollisionHorizontal(other, move)) {    //Horizontale überlappung mit einem gegener--> somit einfügen in das Array colliding
                            colliding.push(other)
                        }
                    } else { // Y-Achse
                        if (self.checkCollisionVertical(other, move)) {    //Vertikale überlappung mit einem gegener--> somit einfügen in das Array colliding
                            colliding.push(other)
                        }
                    }
                }
            }
        }// alle Enemys die Kollidieren mit diesen einem Enemy eingetragen

        for (const other of colliding) { // jedes Objekt welches bisher kollidierte
            const result = this.attemptMoveAxis(other, axis, move, enemyArray, map, visited) // REKURSIVER Aufruf(dadurch wird die Kettenreaktion angeschaut)
            if (!(result.success)) {
                return {success: false} // wenn irgendein Objekt (Entity/Enemy) nicht verschoben werden konnte
            }
        }
        if (axis === 'x') {
            let newX
            if (move > 0) newX = map.rightFree(self.globalEntityX, self.globalEntityY, move, self.hitbox) //rechts
            else newX = map.leftFree(self.globalEntityX, self.globalEntityY, -move, self.hitbox)          //links
            const actualMove = Math.abs(newX - self.globalEntityX)
            if (actualMove !== 0) {
                self.globalEntityX = newX
                return {success: true}
            } else {
                return {success: false}
            }
        } else { // Y-Achse
            let newY
            if (move > 0) newY = map.downFree(self.globalEntityX, self.globalEntityY, move, self.hitbox)    //runter
            else newY = map.topFree(self.globalEntityX, self.globalEntityY, -move, self.hitbox)             //hoch
            const actualMove = Math.abs(newY - self.globalEntityY)
            if (actualMove != 0) {
                self.globalEntityY = newY
                return {success: true}
            } else {
                return {success: false}
            }
        }
    }

    // Schadensfunktion: reduziert HP und gibt Status + aktuelle HP zurück
    takeDmg(amount, enemies, positionWithin, enemyItemDrops) {

        if (this.isInvincible) { // bei aktiver holy aura kein schaden
            return;
        }

        let reducedAmount = amount - (this.armor || 0); // Rüstungswert abziehen und 0 zur Sicherheit und wenn es sich um gegner handelt, der keine armor hat.

        if (reducedAmount < 0) reducedAmount = 0; // Schaden kann nicht negativ sein
        this.hp -= reducedAmount; // schaden abziehen
        document.getElementById("hudHealthProgress").style.value = this.hp

        const isPlayer = (typeof Game !== 'undefined') && Game.PlayerOne === this;
        const testDieEnabled = (typeof Game !== 'undefined') && Game.testDie;
        if (this.hp <= 0) {
            this.hp = 0;
            if (!isPlayer || testDieEnabled) {
                this.die(enemies, positionWithin, enemyItemDrops);
            }
        }
    }

    die() {
    }

    updateGridPlace(tilelength, objectArray, positionWithin, gridWidth) {
        let newGridMapTile = {
            column: Math.floor(this.globalEntityX / (gridWidth * tilelength)),
            row: Math.floor(this.globalEntityY / (gridWidth * tilelength))
        }   //8 kann später noch maybe noch variabel gemacht werden
        if (this.gridMapTile == null || this.gridMapTile.row !== newGridMapTile.row || this.gridMapTile.column !== newGridMapTile.column) {


            if (this.gridMapTile != null) {
                objectArray[this.gridMapTile.row][this.gridMapTile.column].within.splice(positionWithin, 1)
            }
            objectArray[newGridMapTile.row][newGridMapTile.column].within.push(this)
            this.gridMapTile = newGridMapTile


            positionWithin = objectArray[this.gridMapTile.row][this.gridMapTile.column].within.length - 1
        }
        return {gridMapTile: this.gridMapTile, positionWithin: positionWithin}
    }

}