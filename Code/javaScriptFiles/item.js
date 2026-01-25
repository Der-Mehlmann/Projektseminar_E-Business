import {StaticEntity} from "./staticEntity.js"

export class Item extends StaticEntity {

    constructor(globalEntityX, globalEntityY, hitbox, png, icon, description) {
        super(globalEntityX, globalEntityY, hitbox, png)
        this.globalEntityX = globalEntityX
        this.globalEntityY = globalEntityY
        this.hitbox = hitbox
        this.icon = icon
        this.description = description
        this.level = 1
        //this.playerStatKey = playerStatKey
    }

    lvlUp() {
        this.level++;
        if (typeof this.updateStats === 'function') {
            this.updateStats()
        }
    }
}