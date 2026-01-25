import { BasicProjectile } from '../projectiles/BasicProjectile.js';
import { FireballProjectile } from '../projectiles/FireballProjectile.js';
import { MolotovProjectile } from '../projectiles/MolotovProjectile.js';
import { OrbitingProjectile } from '../projectiles/OrbitingProjectile.js';
import { BoomerangProjectile } from '../projectiles/BoomerangProjectile.js';

/* WAFFEN-ÜBERSICHT:
 * =================
 * Simple Weapons (eigene Klasse, aber keine spezielle Logik):
 *   - BowWeapon, KnifeWeapon, FireballWeapon, MolotovWeapon
 *
 * Special Weapons (eigene Klasse MIT spezieller Logik):
 *   - ShurikenWeapon, ThunderstrikeWeapon, AuraWeapon, BoomerangWeapon
 */

import { Weapon } from "./Weapon.js";
// Simple Weapons
import { BowWeapon } from "./BowWeapon.js";
import { KnifeWeapon } from "./KnifeWeapon.js";
import { FireballWeapon } from "./FireballWeapon.js";
import { MolotovWeapon } from "./MolotovWeapon.js";
// Special Weapons
import { ShurikenWeapon } from "./ShurikenWeapon.js";
import { ThunderstrikeWeapon } from "./ThunderstrikeWeapon.js";
import { BoomerangWeapon } from "./BoomerangWeapon.js";
import { AuraWeapon } from "./AuraWeapon.js";

/**
 * WAFFEN-LEVEL-SYSTEM
 * Level 0 = Waffe noch nicht freigeschaltet
 * Level 1-20 = Aktive Waffe mit steigenden Stats
 *
 * Jede Waffe hat:
 * - baseStats: Grundwerte bei Level 1
 * - levelBonuses: Was pro Level dazukommt
 * - maxLevel: Maximales Level (Standard: 20)
 */

/**
 * Level-Bonus-Definitionen pro Waffe
 * Definiert wie sich Stats pro Level erhöhen
 */
export class WeaponConfig {

WEAPON_LEVEL_BONUSES = {
    xBow: {
        dmg: 15,           // +15 Schaden pro Level
        cooldown: -50,     // -50ms Cooldown pro Level
        piercing: 0.5,     // +1 Piercing alle 2 Level
        range: 50,         // +50 Range pro Level
        projectileAmount: 0 // Keine Extra-Projektile
    },
    xKnife: {
        dmg: 8,
        cooldown: -30,
        piercing: 0.25,    // +1 Piercing alle 4 Level
        range: 30,
        projectileAmount: 0.5  // +1 Messer alle 2 Level
    },
    xFireball: {
        dmg: 20,
        cooldown: -100,
        piercing: 0,
        range: 100,
        projectileAmount: 0,
        explosionRadius: 15  // +15 Explosionsradius pro Level
    },
    xMolotov: {
        dmg: 5,
        cooldown: -80,
        piercing: 0,
        range: 50,
        projectileAmount: 0.33,  // +1 Molotov alle 3 Level
        dotRadius: 10,
        dotDmg: 5
    },
    xBoomerang: {
        dmg: 25,
        cooldown: -100,
        piercing: 0,       // Schon unendlich
        range: 50,
        projectileAmount: 0.5,  // +1 Axt alle 2 Level
        maxRange: 50       // +50 Flugweite pro Level
    },
    xShuriken: {
        dmg: 5,
        cooldown: -10,
        piercing: 0,       // Schon unendlich
        range: 50,
        projectileAmount: 0.5,  // +1 Shuriken alle 2 Level
        orbitRadius: 15,
        orbitSpeed: 0.2
    },
    xThunderstrike: {
        dmg: 3,
        cooldown: -30,
        piercing: 0,
        range: 30,
        projectileAmount: 0,
        lightningLength: 30,
        lightningCount: 0.5  // +1 Blitz alle 2 Level
    },
    xAura: {
        dmg: 3,
        cooldown: 0,
        piercing: 0,
        range: 20,
        projectileAmount: 0,
        auraRadius: 20,
        auraDmgInterval: -30  // Schnellerer Tick
    }
};

/**
 * Struktur: {
 *   name: "Bow",
 *   dmg: 100,                          // Schaden pro Treffer (Base)
 *   cooldown: 1000,                    // ms zwischen Schüssen (Base)
 *   range: 1000,                       // Zielweite (Base)
 *   piercing: 0,                       // 0 = stop on hit, 1+ = pierce (Base)
 *   projectile: ProjectileClass,       // Welche Projectile-Klasse
 *   projectileConfig: { ... }          // Projectile-spezifische Daten
 *   maxLevel: 20                       // Max erreichbares Level
 * }
 */
WEAPONS = {
    //basic weapon player
    basic: {
        name: "Basic Gun",
        dmg: 10,
        cooldown: 500,
        range: 800,
        piercing: 0,
        maxLevel: 20,  // Für Testing: upgradebar
        startLevel: 1,
        isSpecial: false,
        projectile: BasicProjectile,
        projectileConfig: {
            speed: 5,
            size: 6,
            duration: 3000
        }
    },

    //  range weapons
    bow: {
        name: "Bow",
        icon: "./Graphics/equipmentIcons/PNG/2.png",
        description: "Fast piercing arrows",
        dmg: 100,
        cooldown: 1000,
        range: 1000,
        piercing: 0,
        maxLevel: 20,
        startLevel: 1,  // Spieler startet mit Bow Level 1
        isSpecial: false,
        projectile: BasicProjectile,
        projectileConfig: {
            speed: 6,
            size: 6,
            duration: 3000,
            amount: 1  // Basis-Anzahl Projektile
        }
    },

    knife: {
        name: "Knife",
        icon: "./Graphics/equipmentIcons/PNG/10.png",
        description: "Quick throwing knives",
        dmg: 40,
        cooldown: 400,
        range: 600,
        piercing: 0,
        maxLevel: 20,
        startLevel: 1,
        useFacingDirection: true,
        projectile: BasicProjectile,
        projectileConfig: {
            speed: 8,
            size: 5,
            duration: 2000,
            amount: 1
        }
    },

    fireball: {
        name: "Fireball",
        icon: "./Graphics/equipmentIcons/PNG/8.png",
        description: "Explosive fire attack",
        dmg: 100,
        cooldown: 1500,
        range: 1500,
        piercing: 0,
        maxLevel: 20,
        startLevel: 1,
        isSpecial: false,
        projectile: FireballProjectile,
        projectileConfig: {
            speed: 5,
            size: 8,
            duration: 3000,
            explosionRadius: 100,
            explosionColor: 'rgba(255, 50, 0, 0.9)',
            amount: 1
        }
    },

    molotov: {
        name: "Molotov",
        icon: "./Graphics/equipmentIcons/PNG/5.png",
        description: "Burning area damage",
        dmg: 25,
        cooldown: 1200,
        range: 1500,
        piercing: 0,
        maxLevel: 20,
        startLevel: 1,
        isSpecial: false,
        projectile: MolotovProjectile,
        projectileConfig: {
            speed: 200,
            size: 8,
            flightDuration: 1000,
            dotRadius: 100,
            dotDmg: 25,
            dotInterval: 500,
            amount: 1
        }
    },

    boomerang: {
        name: "Boomerang",
        icon: "./Graphics/equipmentIcons/PNG/11.png",
        description: "Returning boomerang",
        dmg: 150,
        cooldown: 1500,
        range: 600,
        piercing: 999,
        maxLevel: 20,
        startLevel: 1,
        isSpecial: true,
        projectile: BoomerangProjectile,
        projectileConfig: {
            speed: 8,
            size: 10,
            maxRange: 400,
            piercing: 999,
            amount: 1,
            shooter: null
        }
    },

    // SPECIAL WEAPONS (mit Custom-Logik)

    shuriken: {
        name: "Shuriken",
        icon: "./Graphics/equipmentIcons/PNG/3.png",
        description: "Orbiting blade stars",
        dmg: 25,
        cooldown: 150,
        range: 700,
        piercing: 999,
        maxLevel: 20,
        startLevel: 1,
        isSpecial: true,
        projectile: OrbitingProjectile,
        projectileConfig: {
            amount: 2,  // Basis: 3 Shuriken
            orbitRadius: 100,
            orbitSpeed: 2,
            size: 6,
            piercing: 999
        }
    },

    thunderstrike: {
        name: "Thunderstrike",
        icon: "./Graphics/equipmentIcons/PNG/9.png",
        description: "Lightning bolt strike",
        dmg: 5,
        cooldown: 400,
        range: 300,
        piercing: 0,
        maxLevel: 20,
        startLevel: 1,
        isSpecial: true,
        projectileConfig: {
            lightningLength: 300,
            lightningDuration: 150,
            lightningCount: 2
        }
    },

    aura: {
        name: "Aura",
        icon: "./Graphics/equipmentIcons/PNG/7.png",
        description: "Damaging aura field",
        dmg: 15,
        cooldown: 0.5,
        range: 150,
        piercing: 0,
        maxLevel: 20,
        startLevel: 1,
        isSpecial: true,
        projectileConfig: {
            auraRadius: 150,
            auraDmgInterval: 500,
            auraColor: 'rgba(255, 255, 100, 0.3)'
        }
    },

    // ENEMY WEAPON (nicht upgradebar) - Schwächer als Player-Bogen
    basicEnemy: {
        name: "Enemy Arrow",
        dmg: 15,
        cooldown: 1500,      // Langsamer als Player
        range: 600,          // Kürzere Reichweite
        piercing: 0,
        maxLevel: 1,
        startLevel: 1,
        isSpecial: false,
        projectile: BasicProjectile,
        projectileConfig: {
            speed: 4,        // Langsamer als Player-Projektile
            size: 5,
            duration: 2000,
            isEnemy: true
        }
    },
};


getWeaponStatsForLevel(name, level) {
    const baseConfig = WEAPONS[name];
    if (!baseConfig) return null;

    // Level 0 = Waffe nicht freigeschaltet
    if (level <= 0) return null;

    const bonuses = WEAPON_LEVEL_BONUSES[name] || {};
    const levelMultiplier = level - 1;  // Level 1 = keine Boni

    // Berechne Haupt-Stats
    const stats = {
        ...baseConfig,
        dmg: Math.floor(baseConfig.dmg + (bonuses.dmg || 0) * levelMultiplier),
        cooldown: Math.max(100, baseConfig.cooldown + (bonuses.cooldown || 0) * levelMultiplier),
        range: baseConfig.range + (bonuses.range || 0) * levelMultiplier,
        piercing: Math.floor(baseConfig.piercing + (bonuses.piercing || 0) * levelMultiplier),
        level: level
    };

    // Berechne Projectile-Config mit Level-Boni
    stats.projectileConfig = { ...baseConfig.projectileConfig };

    // Projektil-Anzahl berechnen
    const baseAmount = baseConfig.projectileConfig.amount || 1;
    const bonusAmount = Math.floor((bonuses.projectileAmount || 0) * levelMultiplier);
    stats.projectileConfig.amount = baseAmount + bonusAmount;

    // Spezielle Boni für bestimmte Waffen
    if (bonuses.explosionRadius && stats.projectileConfig.explosionRadius) {
        stats.projectileConfig.explosionRadius += bonuses.explosionRadius * levelMultiplier;
    }
    if (bonuses.dotRadius && stats.projectileConfig.dotRadius) {
        stats.projectileConfig.dotRadius += bonuses.dotRadius * levelMultiplier;
    }
    if (bonuses.dotDmg && stats.projectileConfig.dotDmg) {
        stats.projectileConfig.dotDmg += bonuses.dotDmg * levelMultiplier;
    }
    if (bonuses.maxRange && stats.projectileConfig.maxRange) {
        stats.projectileConfig.maxRange += bonuses.maxRange * levelMultiplier;
    }
    if (bonuses.orbitRadius && stats.projectileConfig.orbitRadius) {
        stats.projectileConfig.orbitRadius += bonuses.orbitRadius * levelMultiplier;
    }
    if (bonuses.orbitSpeed && stats.projectileConfig.orbitSpeed) {
        stats.projectileConfig.orbitSpeed += bonuses.orbitSpeed * levelMultiplier;
    }
    if (bonuses.lightningLength && stats.projectileConfig.lightningLength) {
        stats.projectileConfig.lightningLength += bonuses.lightningLength * levelMultiplier;
    }
    if (bonuses.lightningCount && stats.projectileConfig.lightningCount) {
        stats.projectileConfig.lightningCount += Math.floor(bonuses.lightningCount * levelMultiplier);
    }
    if (bonuses.auraRadius && stats.projectileConfig.auraRadius) {
        stats.projectileConfig.auraRadius += bonuses.auraRadius * levelMultiplier;
    }
    if (bonuses.auraDmgInterval && stats.projectileConfig.auraDmgInterval) {
        stats.projectileConfig.auraDmgInterval = Math.max(100,
            stats.projectileConfig.auraDmgInterval + bonuses.auraDmgInterval * levelMultiplier);
    }

    // Piercing auch in projectileConfig
    stats.projectileConfig.piercing = stats.piercing;

    return stats;
}


static createWeapon(name, shooter, mapWidth, mapHeight, gridWidth, level = 1) {


    // Sicherheitscheck
    if (!name) {
        console.error(`Waffen-Config für "${name}" nicht gefunden!`);
        return null;
    }

    // Level 0 = Waffe nicht freigeschaltet
    if (level <= 0) {
        return null;
    }
/**
 * Struktur: {
 *   name: "Bow",
 *   dmg: 100,                          // Schaden pro Treffer (Base)
 *   cooldown: 1000,                    // ms zwischen Schüssen (Base)
 *   range: 1000,                       // Zielweite (Base)
 *   piercing: 0,                       // 0 = stop on hit, 1+ = pierce (Base)
 *   projectile: ProjectileClass,       // Welche Projectile-Klasse
 *   projectileConfig: { ... }          // Projectile-spezifische Daten
 *   maxLevel: 20                       // Max erreichbares Level
 * }
 */
    // Erstelle Waffe basierend auf Typ
    // Wir übergeben null für icon/desc/name, damit die Klasse sie aus der Config holt
    switch (name) {
        // Simple Weapons (keine spezielle Logik, aber eigene Klasse für Übersichtlichkeit)
        case "Bow":          return new BowWeapon("./Graphics/equipmentIcons/PNG/2.png", "Fast piercing arrows", level, "Bow", shooter, mapWidth, mapHeight, gridWidth,
        45,
        1000,
        1000,
        0,
        20,
        1,  // Spieler startet mit Bow Level 1
        false,
        BasicProjectile,
       {
            speed: 6,
            size: 6,
            duration: 3000,
            amount: 1  // Basis-Anzahl Projektile
        });
        case "Knife":        return new KnifeWeapon("./Graphics/equipmentIcons/PNG/10.png", "Quick throwing knives", level, "Knife", shooter, mapWidth, mapHeight, gridWidth,
        20,
        400,
        600,
        0,
        20,
        1,
        true,
        BasicProjectile,
        {
            speed: 9,
            size: 5,
            duration: 2000,
            amount: 1
        });
        case "Fireball":     return new FireballWeapon("./Graphics/equipmentIcons/PNG/8.png", "Explosive fire attack", level, "Fireball", shooter, mapWidth, mapHeight, gridWidth,
        80,
        2000,
        1500,
        0,
        20,
        1,
        false,
        FireballProjectile,
         {
            speed: 5,
            size: 8,
            duration: 3000,
            explosionRadius: 100,
            explosionColor: 'rgba(255, 50, 0, 0.9)',
            amount: 1});
        case "Molotov":      return new MolotovWeapon("./Graphics/equipmentIcons/PNG/5.png", "Burning area damage", level, "Molotov", shooter, mapWidth, mapHeight, gridWidth,
        25,
        1800,
        1500,
        0,
        20,
        1,
        false,
        MolotovProjectile,
        {
            speed: 200,
            size: 8,
            flightDuration: 1000,
            dotRadius: 100,
            dotDmg: 25,
            dotInterval: 500,
            amount: 1
        });

        // Special Weapons (mit spezieller Logik)
        case "Shuriken":     return new ShurikenWeapon("./Graphics/equipmentIcons/PNG/3.png", "Orbiting blade stars", level, "Shuriken", shooter, mapWidth, mapHeight, gridWidth,
        25,
        150,
        700,
        999,
        20,
        1,
        true,
        OrbitingProjectile,
         {
            amount: 1,  // Basis: 2 Shuriken
            orbitRadius: 100,
            orbitSpeed: 1.5,
            size: 15,
            piercing: 10000,
            shooter : shooter
            });
        case "Thunderstrike": return new ThunderstrikeWeapon( "./Graphics/equipmentIcons/PNG/9.png", "Lightning bolt strike", level, "Thunderstrike", shooter, mapWidth, mapHeight, gridWidth,
         50,
         1500,
         300,
         0,
        20,
        1,
        true,
        null, // Kein Projektil
         {
            lightningLength: 300,
            lightningDuration: 150,
            lightningCount: 2});
        case "Aura":         return new AuraWeapon("./Graphics/equipmentIcons/PNG/7.png", "Damaging aura field", level, "Aura", shooter, mapWidth, mapHeight, gridWidth,
         15,
         0.5,
         150,
         0,
         20,
         1,
         true,
         null, // Kein Projektil
         {
            auraRadius: 150,
            auraDmgInterval: 500,
            auraColor: 'rgba(255, 255, 100, 0.3)'});
        case "Boomerang":          return new BoomerangWeapon("./Graphics/equipmentIcons/PNG/11.png", "Returning boomerang", level, "Boomerang", shooter, mapWidth, mapHeight, gridWidth,
        50,
        1500,
        600,
        999,
        20,
        1,
        true,
        BoomerangProjectile,
         {
            speed: 8,
            size: 300,
            maxRange: 500,
            piercing: 999,
            shooter: shooter,
            });

        case "BasicEnemy":
            return new Weapon(
                null, "Enemy Arrow", level, "EnemyArrow", shooter, mapWidth, mapHeight, gridWidth,
                15,
                1500,
                600,
                0,
                1,
                1,
                false,
                BasicProjectile,
                { speed: 3 , size: 15, duration: 2000, isEnemy: true }
            );

        // Fallback: Generische Weapon-Klasse (für basic, basicEnemy, etc.)
        default:
            return new Weapon("./Graphics/equipmentIcons/PNG/2.png", "Fast piercing arrows", level, "Bow", shooter, mapWidth, mapHeight, gridWidth,
        10,
        1000,
        1000,
        0,
        20,
        1,  // Spieler startet mit Bow Level 1
        false,
        BasicProjectile,
       {
            speed: 6,
            size: 6,
            duration: 3000,
            amount: 1  // Basis-Anzahl Projektile
            });
        }
    }
}