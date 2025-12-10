import { Projectile } from "./projectile.js";
import { Item } from "./item.js";

export class Weapon extends Item {
    constructor(icon, description, picture, dmg, cooldown, focus, splash, range, lvl, amount) {
        super(icon, description, picture);
        this.dmg = dmg;
        this.cooldown = cooldown; // Time between shots in milliseconds
        this.focus = focus;
        this.splash = splash;
        this.range = range;
        this.lvl = lvl;
        this.amount = amount;
        this.lastShotTime = 0; // Timestamp of the last shot
    }



    shoot(player, projectiles, currentTime) {
        // Check if the cooldown has passed
        if (currentTime - this.lastShotTime < this.cooldown) {
            return; // Still on cooldown
        }

        this.lastShotTime = currentTime;

        // Create a projectile
        for (let i = 0; i < this.amount; i++) {
            const angle = Math.random() * Math.PI * 2; // Fires in a random direction
            const dir = { x: Math.cos(angle), y: Math.sin(angle) };

            const p = new Projectile(
                player.globalEntityX, // Use the player's current position
                player.globalEntityY,
                1, // hp
                null, // png
                5, // speed
                { width: 8, height: 8 }, // hitbox
                false, // piercing
                8, // size
                dir, // direction
                this.dmg // damage
            );

            projectiles.push(p); // Add the projectile to the game's array
        }
    }
 static create(type) {
        switch (type) {
            case "basic":
                return new Weapon(null, "Basic Gun", null, 10, 300, 0, 0, 1000, 1, 1);

            case "shotgun":
                return new Weapon(null, "Shotgun", null, 6, 800, 0, 0, 500, 1, 6);

            case "sniper":
                return new Weapon(null, "Sniper", null, 30, 1200, 0, 0, 2000, 1, 1);

            default:
                return new Weapon(null, "Default", null, 5, 500, 0, 0, 800, 1, 1);
        }
    }
}