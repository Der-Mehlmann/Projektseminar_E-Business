import { Weapon } from "./Weapon.js";


/**
 * AuraWeapon: Passive defensive Aura
 * WARUM SPECIAL: Keine Projektile, nur Damage-Loop
 */
export class AuraWeapon extends Weapon {
    constructor(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startLevel, isSpecial, projectile, projectileConfig) {
        super(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startLevel, isSpecial, projectile, projectileConfig);
        this.lastAuraDmgTime = 0;
        this.projectiles = [];
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth, inputState = null, enemyItemDrops = []) {
        // Aura hat keine Cooldown, tickt immer
        this.damageEnemies(enemies, currentTime, enemyItemDrops);
    }

    createProjectiles() {
        // Aura erstellt keine Projektile
    }

    damageEnemies(enemies, currentTime, enemyItemDrops) {
        // Fix: Cooldown Multiplier auf Intervall anwenden (schnellerer Tick)
        let auraDmgInterval = this.projectileConfig.auraDmgInterval;
        if (this.shooter.cooldownMultiplier) {
            auraDmgInterval *= this.shooter.cooldownMultiplier;
        }

        if (currentTime - this.lastAuraDmgTime < auraDmgInterval) return;
        this.lastAuraDmgTime = currentTime;

        const auraRadius = this.projectileConfig.auraRadius;

        // Fix: Damage Multiplier anwenden
        const effectiveDamage = this.dmg * (this.shooter.damageMultiplier || 1);

        this.forEachEnemy(enemies, (enemy, enemies, j) => {
            const dx = enemy.globalEntityX - this.shooter.globalEntityX;
            const dy = enemy.globalEntityY - this.shooter.globalEntityY;
            if (Math.hypot(dx, dy) < auraRadius) {
                enemy.takeDmg(effectiveDamage, enemies, j, enemyItemDrops);
            }
        });
    }
    updateStats() {
        if (this.level === this._currentStatsLevel) return;
        this.dmg += 3;
        this.cooldown -= 0;
        this.piercing += 0;
        this.range += 20;
        // this.projectileConfig.amount += 0;
        this.projectileConfig.auraRadius += 20;
        this.projectileConfig.auraDmgInterval -= 30;
        this._currentStatsLevel = this.level;
    }

    renderEffects(ctx, playerOne, performanceNow) {
        const screenX = (this.shooter.globalEntityX + this.shooter.hitbox.width / 2) - (playerOne.globalEntityX + playerOne.hitbox.width / 2) + playerOne.canvasWidthMiddle;
        const screenY = (this.shooter.globalEntityY + this.shooter.hitbox.height / 2) - (playerOne.globalEntityY + playerOne.hitbox.height / 2) + playerOne.canvasWidthHeight;
        const auraRadius = this.projectileConfig.auraRadius;
        const auraColor = this.projectileConfig.auraColor;

        ctx.save();
        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(screenX, screenY, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
