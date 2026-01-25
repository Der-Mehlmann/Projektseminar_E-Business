import { Weapon } from "./Weapon.js";

/**
 * BowWeapon: Standard-Fernkampfwaffe
 *
 * KATEGORIE: Simple (keine spezielle Logik)
 * PROJEKTIL: BasicProjectile
 * ZIEL: Nächster Feind
 *
 * Besonderheit: Spieler startet mit dieser Waffe (startLevel: 1)
 *
 * Diese Klasse existiert für Übersichtlichkeit -
 * sie nutzt die generische Weapon-Logik ohne Änderungen.
 */
export class BowWeapon extends Weapon {
    constructor(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startLevel, isSpecial, projectile, projectileConfig) {
        super(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startLevel, isSpecial, projectile, projectileConfig);
    }
     updateStats() {
        if (this.level === this._currentStatsLevel) return;
        this.dmg += 15
        this.cooldown -= 50;           // +15 Schaden pro Level
        this.piercing += 0.5;     // +1 Piercing alle 2 Level
        this.range += 50;         // +50 Range pro Level
        this.projectileConfig.amount += 0;   // Keine Extra-Projektile
        this._currentStatsLevel = this.level;
    } // Keine Extra-Projektile
    }
