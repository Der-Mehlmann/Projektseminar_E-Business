import { Weapon } from "./Weapon.js";

/**
 * KnifeWeapon: Schnelle Nahkampf-Wurfwaffe
 *
 * KATEGORIE: Simple (keine spezielle Logik)
 * PROJEKTIL: BasicProjectile
 * ZIEL: Blickrichtung (useFacingDirection: true)
 *
 * Besonderheit: Schießt in die Richtung, in die der Spieler schaut,
 * anstatt auf den nächsten Feind zu zielen.
 *
 * Diese Klasse existiert für Übersichtlichkeit -
 * die useFacingDirection-Logik ist bereits in der Basis-Weapon implementiert.
 */
export class KnifeWeapon extends Weapon {
    constructor(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth, dmg, cooldown, range, piercing, maxLevel, startLevel, isSpecial, projectile, projectileConfig) {
        super(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startLevel ,isSpecial, projectile, projectileConfig);

    }

   updateStats() {
        if (this.level === this._currentStatsLevel) return;
        this.dmg += 8
        this.cooldown -= 50;           // +15 Schaden pro Level
        this.piercing += 0.5,     // +1 Piercing alle 2 Level
        this.range += 50,         // +50 Range pro Level
        this.projectileConfig.amount += 0;   // Keine Extra-Projektile

    }
}
