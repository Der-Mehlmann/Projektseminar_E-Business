import { Weapon } from "./Weapon.js";


/**
 * BoomerangWeapon: Boomerang-Axt
 * WARUM SPECIAL: Boomerangs brauchen Array-Speicherung (nicht Grid) wegen Rückkehr-Logik
 */
export class BoomerangWeapon extends Weapon {
    constructor(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startLevel, isSpecial, projectile, projectileConfig) {
        super(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startLevel, isSpecial, projectile, projectileConfig);

        // Eigenes Array für Boomerangs (nicht Grid!)
        this.boomerangProjectiles = [];
    }

    createProjectiles(target, direction, currentTime, tilelength, gridWidth, player) {

        // Fix: Damage Multiplier anwenden
        const effectiveDamage = this.dmg * (this.shooter.damageMultiplier || 1);

        const ProjectileClass = this.projectile;
        const projectile = new ProjectileClass(
            this.shooter.globalEntityX,
            this.shooter.globalEntityY,
            direction,
            effectiveDamage,
            this.projectileConfig,
            {},  // Kein Grid
            currentTime,
            false  // isEnemy
        );

        this.boomerangProjectiles.push(projectile);
    }
       updateStats() {
        if (this.level === this._currentStatsLevel) return;
        this.dmg += 25
        this.cooldown -= 100;           // +15 Schaden pro Level
        this.piercing += 0,     // +1 Piercing alle 2 Level
        this.range += 50,         // +50 Range pro Level
        this.projectileConfig.projectileAmount += 0.5   // Keine Extra-Projektile
        this.projectileConfig.maxRange += 50;    // +50 maxRange pro Level
    }


    renderProjectiles(ctx, playerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops) {
        // Boomerangs verwenden eigenes Array, nicht Grid
        this._renderArray(this.boomerangProjectiles, ctx, playerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops);
    }
}
