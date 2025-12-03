import { MovingEntity } from "./movingEntity.js"
export class Projectile extends MovingEntity {

    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, piercing, size, direction, dmg) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox)
        this.piercing = piercing
        this.speed = speed
        this.size = size
        this.globalEntityX = globalEntityX
        this.globalEntityY = globalEntityY
        this.direction = direction
        this.dmg  = dmg
        this.hp = hp
        this.png = png
        this.hitbox = hitbox
    }

  move() {
    // direction ist ein Vektor wie {x: 0.5, y: -0.2}
    this.globalEntityX += this.direction.x * this.speed;
    this.globalEntityY += this.direction.y * this.speed;
}
}