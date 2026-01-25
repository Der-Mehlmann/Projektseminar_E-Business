import { Weapon } from "./Weapon.js";

/**
 * FireballWeapon: Explosiver Fernkampf
 *
 * KATEGORIE: Simple (keine spezielle Logik)
 * PROJEKTIL: FireballProjectile
 * ZIEL: Nächster Feind
 *
 * Besonderheit: Das FireballProjectile hat eine Explosion bei Aufprall,
 * die AoE-Schaden verursacht. Die Explosionslogik ist im Projektil selbst.
 *
 * Diese Klasse existiert für Übersichtlichkeit -
 * sie nutzt die generische Weapon-Logik ohne Änderungen.
 */
export class FireballWeapon extends Weapon {
    constructor(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth, dmg, cooldown, range, piercing, maxLevel, startLevel, isSpecial, projectile, projectileConfig, explosionRadius, explosionColor) {
        super(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startLevel, isSpecial, projectile, projectileConfig);
        this.explosionRadius = explosionRadius;
        this.explosionColor = explosionColor;

    }
    updateStats() {
        if (this.level === this._currentStatsLevel) return;
        this.dmg += 20
        this.cooldown -= 100;           // +15 Schaden pro Level
        this.piercing += 0,     // +1 Piercing alle 2 Level
        this.range += 50,         // +50 Range pro Level
        this.projectileConfig.amount += 0;   // Keine Extra-Projektile
        this.explosionRadius += 15

    }
}