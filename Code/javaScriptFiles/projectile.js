import { MovingEntity } from "./movingEntity.js";

export class Projectile extends MovingEntity {
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, piercing, size, direction, dmg) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox);
        this.piercing = piercing;
        this.size = size;
        this.direction = direction;
        this.dmg = dmg;
    }

<<<<<<< Updated upstream
  move() {
    // direction ist ein Vektor wie {x: 0.5, y: -0.2}
    this.globalEntityX += this.direction.x * this.speed;
    this.globalEntityY += this.direction.y * this.speed;
}
=======
    move() {
        // direction is a vector like {x: 0.5, y: -0.2}
        this.globalEntityX += this.direction.x * this.speed;
        this.globalEntityY += this.direction.y * this.speed;
    }

    static handleProjectiles(ctx, projectiles, enemies, player, map, onEnemyKill) {
        // Loop through projectiles for movement, drawing, and collision
        for (let projectileIndex = projectiles.length - 1; projectileIndex >= 0; projectileIndex--) {
            let projectile = projectiles[projectileIndex];

            // 1. Move projectile
            projectile.move();

            // 2. Draw projectile relative to the camera/player
            let leftBorder = player.globalEntityX - map.FOVwidth / 2;
            let topBorder = player.globalEntityY - map.FOVheight / 2;

            projectile.draw(
                ctx,
                projectile.globalEntityX - leftBorder,
                projectile.globalEntityY - topBorder,
                projectile.hitbox.width,
                projectile.hitbox.height,
                "lightblue"
            );

            // Projetile entfernen, wenn es außerhalb der Kartenbegrenzungen ist
            if (
                projectile.globalEntityX < 0 || projectile.globalEntityX > map.mapWidth ||
                projectile.globalEntityY < 0 || projectile.globalEntityY > map.mapHeight
            ) {
                projectiles.splice(projectileIndex, 1);
                continue; // Continue to next projectile
            }

            // 3. Check collision with enemies
            for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
                let enemy = enemies[enemyIndex];

                if (projectile.checkCollision(enemy, 0, 0)) {
                    // On hit, remove both
                    enemies.splice(enemyIndex, 1);
                    projectiles.splice(projectileIndex, 1);

                    onEnemyKill(); // Notify game that an enemy was killed

                    enemy.die(); // Drop XP, etc.

                    // Since projectile is gone, break inner loop and continue to next projectile
                    break;
                }
            }
        }
    }
>>>>>>> Stashed changes
}