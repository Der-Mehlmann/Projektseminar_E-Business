import {MovingEntity} from "./movingEntity.js";

export class Projectile extends MovingEntity {
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, piercing, size, direction, dmg) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox);
        this.piercing = piercing;
        this.size = size;
        this.direction = direction;
        this.dmg = dmg;
    }

    handleProjectiles(ctx, projectiles, projectileIndex, enemies, player, map) {
        // Loop through projectiles for movement, drawing, and collision
        let killCount=0
            // 1. Move projectile
            this.move(map, projectiles, projectileIndex);
            // 2. Draw projectile relative to the camera/player
            this.draw(ctx, player, "lightblue");
            // 3. Check collision with enemies
            for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
                let enemy = enemies[enemyIndex];

                if (this.checkCollision(enemy, 0, 0)) {
                    // On hit, remove both
                    enemies.splice(enemyIndex, 1);
                    projectiles.splice(projectileIndex, 1);

                    killCount++; // Notify game that an enemy was killed

                    enemy.die(); // Drop XP, etc.

                    // Since the projectile is gone, break the inner loop and continue to the next projectile
                    break;
                }
            }
        const canvas  = ctx.canvas;
        const screenX = this.globalEntityX - player.globalEntityX + (canvas.width / 2);
        const screenY = this.globalEntityY - player.globalEntityY + (canvas.height / 2);

        if (
            screenX + this.size < 0 ||
            screenX - this.size > canvas.width ||
            screenY + this.size < 0 ||
            screenY - this.size > canvas.height
        ) {
            projectiles.splice(projectileIndex, 1);
        }
    }

    move(map, projectiles, projectileIndex) {
        // direction is a vector like {x: 0.5, y: -0.2}
        let oldGlobalEntityX = this.globalEntityX
        let oldGlobalEntityY = this.globalEntityY
        if (this.direction.x > 0) {
            this.globalEntityX = map.rightFree(this.globalEntityX, this.globalEntityY, (this.direction.x * this.speed), this.hitbox)
        } else {
            this.globalEntityX = map.leftFree(this.globalEntityX, this.globalEntityY, (this.direction.x * this.speed) * -1, this.hitbox)
        }

        if (this.direction.y < 0) {
            this.globalEntityY = map.topFree(this.globalEntityX, this.globalEntityY, (this.direction.y * this.speed) * -1, this.hitbox)
        } else {
            this.globalEntityY = map.downFree(this.globalEntityX, this.globalEntityY, (this.direction.y * this.speed), this.hitbox)
        }
        if ((oldGlobalEntityX === this.globalEntityX && this.direction.x !== 0) || (oldGlobalEntityY === this.globalEntityY && this.direction.y !== 0)) { // Kollision mit Wand
            projectiles.splice(projectileIndex, 1);
        }
    }

    render(ctx, projectiles, projectileIndex, enemies, PlayerOne, MapOne){
        this.handleProjectiles(ctx, projectiles, projectileIndex, enemies, PlayerOne, MapOne)
    }
}