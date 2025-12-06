import { DropSingleUse, SpeedBoostDrop, HealDrop } from "./dropSingleUse.js" 
import { MovingEntity } from "./movingEntity.js"
export class Enemy extends MovingEntity {
    
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, level, xpDrop, elite, ranged = false){ 
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox)
        this.level = level
        this.xpDrop = xpDrop
        this.elite = elite
        this.globalEntityX = globalEntityX   // eigene Positionsvariable für Enemy
        this.globalEntityY = globalEntityY   // eigene Positionsvariable für Enemy
        this.ranged = ranged   
        this.hp = hp
        this.png = png
        this.hitbox = hitbox
        this.speed = speed
    }

    // Gegner zufällig am Kartenrand spawnen
    static spawnEnemyAtEdge(enemiesArray, mapWidth, mapHeight) {

        const side = Math.floor(Math.random() * 4); 
        let x, y;

        switch (side) {
            case 0: // oben
                x = Math.random() * mapWidth - 1 ;   // spawnt Enemy an random Stelle am oberen Rand
                y = 1;
                break;

            case 1: // rechts
                x = mapWidth-1;
                y = Math.random() * mapHeight - 1;
                break;

            case 2: // unten
                x = Math.random() * mapWidth - 1;
                y = mapHeight-1;
                break;

            case 3: // links
                x = 1;
                y = Math.random() * mapHeight - 1;
                break;
        }

        // temporäre Werte, ohne lvl System bisher
        const hp = 10;
        const png = null;                 //KEIN enemyImg, damit kein Fehler
        const speed = 1.0;            
        const hitbox = { width: 32, height: 32 };  
        const level = 1;
        const xpDrop = 2;
        const elite = false;

        const ranged = Math.random() < 0.3; // 30% Chance, dass dieser Enemy ein Ranged-Enemy ist

        enemiesArray.push(new Enemy(x, y, hp, png, speed, hitbox, level, xpDrop, elite, ranged));  
    }

    // Gegner bewegt sich in Richtung Player
    chasePlayer(map, player, enemyArray = null) {
        
        let distanceX = player.globalEntityX - this.globalEntityX
        let distanceY = player.globalEntityY - this.globalEntityY

        let distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY) //Hypotenuse von Enemy zu Player berechnet distance
        if (distance <= 0) return //bleibt stehen bei distance = 0

        const stopDistance = 200 // Ranged-Enemy bleibt ab bestimmter Distanz stehen (z.B. 200px)
        if (this.ranged && distance <= stopDistance) {
            return
        }

        distanceX /= distance; // Teilt Entfernung durch sich selbst -> Gegner bewegt sich gleichmäßig
        distanceY /= distance;
        // NEU: Bewegungsschritt berechnen
        const moveStepX = distanceX * this.speed
        const moveStepY = distanceY * this.speed

        let moveXPossible = true
        let moveYPossible = true
        
        for (const other of enemyArray) {
            if (other === this) continue // sich selbst überspringen
            
            if (this.checkCollisionHorizontal(other, moveStepX) ){
                moveXPossible = false
            }
            if (this.checkCollisionVertical(other, moveStepY)){
                moveYPossible = false
            }
        }            
        if (moveXPossible){
            if (distanceX>0)
                this.globalEntityX = map.rightFree(this.globalEntityX, this.globalEntityY, distanceX * this.speed)
            if (distanceX<0)
                this.globalEntityX = map.leftFree(this.globalEntityX, this.globalEntityY, -distanceX * this.speed)
        }
        if (moveYPossible){
            if (distanceY<0)
                this.globalEntityY = map.topFree(this.globalEntityX, this.globalEntityY, -distanceY * this.speed)
            if (distanceY>0)
                this.globalEntityY = map.downFree(this.globalEntityX, this.globalEntityY, distanceY * this.speed)
        }
    }

    die() {
        console.log("Enemy ist gestorben! XP gedroppt:", this.xpDrop);
        
        const dropChance = 0.5 // Chance auf Drop - auf 50% zur besseren Visualisierung
        if (Math.random() < dropChance) {
            
            const roll = Math.random()

        if (roll < 0.33) {
            enemyItemDrop.push(new SpeedBoostDrop(this.globalEntityX, this.globalEntityY))
        } else if (roll < 0.66) {
            enemyItemDrop.push(new HealDrop(this.globalEntityX, this.globalEntityY))
        } else {
            enemyItemDrop.push(new DropSingleUse(this.globalEntityX, this.globalEntityY))
        }
    }
        
        enemyXpDrop.push(new DropSingleUse(this.globalEntityX, this.globalEntityY))
    }
}

export const enemyItemDrop = []
export const enemyXpDrop = []

export function drawEnemyItem(ctx, player, map) {
    const leftBorder = player.globalEntityX - map.FOV / 2
    const topBorder  = player.globalEntityY - map.FOV / 2

    for (const drop of enemyItemDrop) {
        const screenX = drop.globalEntityX - leftBorder;
        const screenY = drop.globalEntityY - topBorder;

         let color = "pink"

        if (drop instanceof SpeedBoostDrop) {
            color = "orange"
            } else if (drop instanceof HealDrop) {
            color = "green"
        }

        drop.draw(ctx, screenX, screenY, 13, 13, color)
    }
}

export function drawEnemyXp(ctx, player, map) {
    const leftBorder = player.globalEntityX - map.FOV / 2
    const topBorder  = player.globalEntityY - map.FOV / 2

    for (const drop of enemyXpDrop) {
        const screenX = drop.globalEntityX - leftBorder;
        const screenY = drop.globalEntityY - topBorder;
        drop.draw(ctx, screenX, screenY, 8, 8, "brown")
    }
}    
