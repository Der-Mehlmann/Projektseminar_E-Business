import {EnemySlime} from "./EnemySlime.js"
import {EnemyReiter} from "./EnemyReiter.js"
import {EnemySensenmann} from "./EnemySensenmann.js"
import {EnemyHexe} from "./EnemyHexe.js"
import {EnemySchatzgoblin} from "./EnemySchatzgoblin.js"
import {EnemyGepanzerterRitter} from "./EnemyGepanzerterRitter.js"
import {EnemySkellet} from "./EnemySkellet.js" 
import {Enemy} from "./enemy.js"
import {Weapon} from "./weapon.js"
import {MovingEntity} from "./movingEntity.js"
export class EnemyFactory{
    static spawnEnemyOutsideView(enemiesArray, player, canvas, tilewidth, gridWidth, mapWidth, mapHeight, MapOne, CountOfEnemies) {
        
        const offset = 80
        

        const left = player.globalEntityX - canvas.width / 2
        const right = player.globalEntityX + canvas.width / 2
        const top = player.globalEntityY - canvas.height / 2
        const bottom = player.globalEntityY + canvas.height / 2

        let x, y
        for (let i = 0; i < 4; i++){
            const side = Math.floor(Math.random() * 4)
            for (let i = 0; i < CountOfEnemies / 4; i++){
                switch (side) {
                    case 0: // oben
                        x = left + Math.random() * (right - left)
                        if (x < 0) x = player.globalEntityX + (canvas.width / 2) + offset
                        y = top - offset
                        if (y < 0) y = player.globalEntityY + (canvas.height / 2) + offset
                        break

                    case 1: // rechts
                        x = right + offset
                        if (x > mapWidth * tilewidth) x = player.globalEntityX - (canvas.width / 2) - offset
                        y = top + Math.random() * (bottom - top)
                        if (y < 0) y = player.globalEntityY + (canvas.height / 2) + offset
                        break

                    case 2: // unten
                        x = left + Math.random() * (right - left)
                        if (x < 0) x = player.globalEntityX + (canvas.width / 2) + offset
                        y = bottom + offset
                        if (y > mapHeight * tilewidth) y = player.globalEntityY - (canvas.height / 2) - offset
                        break

                    case 3: // links
                        x = left - offset
                        if (x < 0) x = player.globalEntityX + (canvas.width / 2) + offset
                        y = top + Math.random() * (bottom - top)
                        if (y < 0) y = player.globalEntityY + (canvas.height / 2) + offset
                        break
                }
                
                x = Math.max(1, Math.min(x, mapWidth * tilewidth - 1))
                y = Math.max(1, Math.min(y, mapHeight * tilewidth - 1)) 
                           
                
                let gridMapTile = {column : Math.floor(x / (gridWidth*tilewidth)), row : Math.floor(y / (gridWidth*tilewidth))}
                if(MovingEntity.spawnCheck(MapOne, x, y, tilewidth, tilewidth)){
                    enemiesArray[gridMapTile.row][gridMapTile.column].within.push(EnemyFactory.createRandomEnemy(x, y, gridMapTile, mapWidth, mapHeight, gridWidth));
                }
            }
        }
    }   
    static createRandomEnemy(globalEntityX, globalEntityY, gridMapTile, mapWidth, mapHeight, gridWidth) {  // muss statisch sein, da sie vor der Instanziierung eines Enemys aufgerufen wird
        const enemyTypes = [
            {cls: EnemySlime, weight: 70 , weapon: "dolch"},
            {cls: EnemyReiter, weight: 5, weapon: "dolch"},
            {cls: EnemySensenmann, weight: 5, weapon: "dolch"},
            {cls: EnemyHexe, weight: 3, weapon: "Feuerball"},
            {cls: EnemySchatzgoblin, weight: 1, weapon: "dolch"},
            {cls: EnemyGepanzerterRitter, weight: 1, weapon: "Schwert"},
            {cls: EnemySkellet, weight: 15, weapon: "Bogen"}
        ];

        let totalWeight = enemyTypes.reduce((sum, enemy) => sum + enemy.weight, 0)
        let random = Math.random() * totalWeight
        let weapon = "dolch"
        for (let enemy of enemyTypes) {
            random -= enemy.weight
            if (random < 0) {
                return new enemy.cls(globalEntityX, globalEntityY, null, null, null, null, gridMapTile, 0, 0, false, false, Weapon.create(enemy.weapon, Enemy,mapWidth, mapHeight, gridWidth))
            }
        }
    }
}