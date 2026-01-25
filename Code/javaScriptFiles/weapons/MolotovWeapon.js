import { Weapon } from "./Weapon.js";


/**
 * MolotovWeapon: Flächenschaden über Zeit (DoT)
 *
 * KATEGORIE: Simple (keine spezielle Logik)
 * PROJEKTIL: MolotovProjectile
 * ZIEL: Nächster Feind
 *
 * Besonderheit: Das MolotovProjectile hinterlässt eine DoT-Zone am Aufprallort,
 * die kontinuierlichen Schaden verursacht. Die DoT-Logik ist im Projektil selbst.
 *
 * Diese Klasse existiert für Übersichtlichkeit -
 * sie nutzt die generische Weapon-Logik ohne Änderungen.
 */
export class MolotovWeapon extends Weapon {
    constructor(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startLevel, isSpecial, projectile, projectileConfig) {
        super(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startLevel, isSpecial, projectile, projectileConfig);
    }

    updateStats() {
        this.dmg += 5 // warscheinlich reduntant, da DoT Schaden im Projektil geregelt wird
        this.cooldown -= 80;           // +15 Schaden pro Level
        this.piercing += 0,     // +1 Piercing alle 2 Level
        this.range += 50,         // +50 Range pro Level
        this.projectileConfig.amount += 0.334;   // Keine Extra-Projektile
        this.projectileConfig.dotRadius += 10;
        this.projectileConfig.dotDmg += 5;
    }
}