import { Item } from "../item.js";
import { Enemy } from "../enemy.js";

/**
 * Basis-Klasse für alle Waffen
 */
export class Weapon extends Item {
    constructor(icon, description, level, name, shooter, mapWidth, mapHeight, gridWidth ,dmg ,cooldown ,range ,piercing ,maxLevel, startlevel, isSpecial, projectile, projectileConfig){  // Für Testing: upgradebarprojectile,projectileConfig)

        super(icon, description, level, null);


        this.name = name;
        this.shooter = shooter;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.gridWidth = gridWidth;
        this.dmg = dmg;
        this.cooldown = cooldown;
        this.range = range;
        this.piercing = piercing;
        this.maxLevel = maxLevel;
        this.startlevel = startlevel;
        this.isSpecial = isSpecial;
        this.projectile = projectile;
        this.projectileConfig = projectileConfig;


        // Fallback: Wenn Name/Icon nicht übergeben wurden (Game-Mode), aus Config nehmen
        if (!this.name) this.name = name || this.name || "Weapon";
        if (!this.icon) this.icon = icon || this.icon;
        if (!this.description && this.description) this.description = this.description;

        // Hole Level-basierte Stats
        this._currentStatsLevel = -1;
        this.updateStats();

        // Speichern für Projektile
        this.projectiles = [];
        this.lastShotTime = 0;

        // Burst-System (für Equipment Barrage)
        this.burstRemaining = 0;
        this.burstTimer = 0;
        this.burstDelay = 50;

        // Initialisiere Grid falls Player-Waffe
        if (this.shooter) {
            this._initializeStorage(this.shooter);
        }
    }

    /**
     * Initialisiere Speicher-Struktur basierend auf Schütze
     */
    _initializeStorage(shooter) {
        if (!(shooter instanceof Enemy)) {
            // Player: nutze Grid
            for (let row = 0; row <= Math.floor(this.mapHeight / this.gridWidth); row++) {
                this.projectiles[row] = [];
                for (let column = 0; column <= Math.floor(this.mapWidth / this.gridWidth); column++) {
                    this.projectiles[row][column] = { within: [] };
                }
            }
        }
        // Enemy: nutze einfaches Array (wird später aufgebaut)
    }

    /**
     * SCHUSS-LOGIK
     * Template-Method: Subklassen können überschreiben
     */
    shoot(player, currentTime, enemies, tilelength, gridWidth, inputState = null, enemyItemDrops = []) {
        // Berechne effektiven Cooldown mit Equipment-Multiplier
        const isPlayer = !(this.shooter instanceof Enemy);
        const effectiveCooldown = isPlayer && player.cooldownMultiplier
            ? this.cooldown * player.cooldownMultiplier
            : this.cooldown;

        // Burst-System (Equipment Barrage)
        if (this.burstRemaining > 0) {
            if (currentTime - this.burstTimer >= this.burstDelay) {
                this.burstTimer = currentTime;
                this.burstRemaining--;
                this._fireProjectile(player, currentTime, enemies, tilelength, gridWidth);
            }
            return;
        }

        // Cooldown-Check
        if (currentTime - this.lastShotTime < effectiveCooldown) {
            return;
        }
        this.lastShotTime = currentTime;

        // Starte Burst wenn extraProjectiles > 0
        if (isPlayer && player.extraProjectiles && player.extraProjectiles > 0) {
            this.burstRemaining = player.extraProjectiles;
            this.burstTimer = currentTime;
        }

        // Feuere erstes Projektil
        this._fireProjectile(player, currentTime, enemies, tilelength, gridWidth);
    }

    /**
     * Interner Helper zum Feuern eines Projektils
     */
    _fireProjectile(player, currentTime, enemies, tilelength, gridWidth) {
        // Ziel-Bestimmung
        const target = this.determineTarget(player, enemies);
        if (!target) return;

        // Direction berechnen
        const direction = this.calculateDirection(target);

        // Projektile erstellen (Config-driven)
        this.createProjectiles(target, direction, currentTime, tilelength, gridWidth, player);
    }

    /**
     * Bestimme Ziel (nächster Gegner oder Spieler)
     */
    determineTarget(player, enemies) {
        const isEnemyShooter = this.shooter instanceof Enemy;

        if (isEnemyShooter) {
            // Enemy schießt auf Player
            if (!this.shooter.shouldShoot(player)) return null;
            return player;
        } else {
            // Wenn useFacingDirection aktiviert → kein Ziel nötig (schießt in Blickrichtung)
            if (this.useFacingDirection) {
                return 'facing'; // Spezieller Marker für Blickrichtung
            }
            // Player schießt auf nächsten Gegner
            return this.findClosestEnemy(enemies);
        }
    }

    /**
     * Finde nächsten Gegner im Grid
     */
    findClosestEnemy(enemies) {
        let closestEnemy = null;
        let closestDist = this.range;

        this.forEachEnemy(enemies, (enemy) => {
            const dx = enemy.globalEntityX - this.shooter.globalEntityX;
            const dy = enemy.globalEntityY - this.shooter.globalEntityY;
            const dist = Math.hypot(dx, dy);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        });

        return closestEnemy;
    }

    /**
     * Berechne Direction zum Ziel
     */
    calculateDirection(target) {
        // Spezialfall: Blickrichtung des Spielers verwenden
        if (target === 'facing' && this.shooter.facingDirection) {
            return { ...this.shooter.facingDirection };
        }

        if (!target || target === 'facing') {
            return { x: 1, y: 0 }; // Fallback: rechts
        }

        const dx = target.globalEntityX - this.shooter.globalEntityX + (target.hitbox.width / 2);
        const dy = target.globalEntityY - this.shooter.globalEntityY + (target.hitbox.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return { x: 1, y: 0 };

        return {
            x: dx / dist,
            y: dy / dist
        };
    }

    /**
     * PROJEKTIL-ERSTELLUNG (Config-driven)
     * Das meiste ist jetzt Config → keine Subklassen-Überladung nötig
     */
    createProjectiles(target, direction, currentTime, tilelength, gridWidth, player) {
        const ProjectileClass = this.projectile;

        // Grid-Position für Player-Projektile
        const isPlayer = !(this.shooter instanceof Enemy);
        const cellSize = gridWidth * tilelength;
        const gridMapTile = isPlayer ? {
            column: Math.max(0, Math.floor(this.shooter.globalEntityX / cellSize)),
            row: Math.max(0, Math.floor(this.shooter.globalEntityY / cellSize))
        } : {};

        // Erstelle Projectile(s)
        const projectiles = this._instantiateProjectiles(
            ProjectileClass,
            direction,
            gridMapTile,
            currentTime,
            isPlayer
        );

        // Füge zu Speicher hinzu (Projectile entscheidet!)
        for (let projectile of projectiles) {
            projectile.addTo(this.projectiles);
        }
    }

    /**
     * Instanziiere Projectile basierend auf Typ
     * Kann in Subklassen erweitert werden für mehrere Projektile
     */
    _instantiateProjectiles(ProjectileClass, direction, gridMapTile, currentTime, isPlayer) {
        // Erweiterte Config mit shooter für Boomerang etc.
        const extendedConfig = {
            ...this.projectileConfig,
            shooter: this.shooter
        };

        // Berechne effektiven Schaden mit Equipment-Multiplier
        const effectiveDamage = isPlayer && this.shooter.damageMultiplier
            ? this.dmg * this.shooter.damageMultiplier
            : this.dmg;

        const projectile = new ProjectileClass(
            this.shooter.globalEntityX,
            this.shooter.globalEntityY,
            direction,
            effectiveDamage,
            extendedConfig,
            gridMapTile,
            currentTime,
            !isPlayer  // isEnemy Flag
        );

        return [projectile];
    }



    /**
     * Update Waffen-State (z.B. Cooldown)
     */
    update() {
        // Stats nur bei LevelUp aktualisieren, nicht jeden Frame!
    }

    updateStats() {
        // Basis-Implementierung
    }

    renderProjectiles(ctx, playerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops) {
        // Unterscheide nur: Grid vs Array (bestimmt durch Shooter)
        if (this.shooter instanceof Enemy) {
            // Enemy: einfaches Array
            this._renderArray(this.projectiles, ctx, playerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops);
        } else {
            // Player: Grid oder Array (Projectile entscheidet)
            this._renderGrid(this.projectiles, ctx, playerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops);
        }
    }

    /**
     * Rendere einfaches Array
     */
    _renderArray(projectiles, ctx, playerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops) {
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const projectile = projectiles[j];
            if (projectile && projectile.handleProjectile) {
                projectile.handleProjectile(ctx, projectiles, j, enemies, playerOne, map, gridWidth, enemyItemDrops, performanceNow);
            }
        }
    }

    /**
     * Rendere Grid
     */
    _renderGrid(projectiles, ctx, playerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            for (let n = projectiles[i].length - 1; n >= 0; n--) {
                for (let j = projectiles[i][n].within.length - 1; j >= 0; j--) {
                    const projectile = projectiles[i][n].within[j];
                    if (projectile && projectile.handleProjectile) {
                        projectile.handleProjectile(ctx, projectiles[i][n].within, j, enemies, playerOne, map, gridWidth, enemyItemDrops, performanceNow);
                    }
                }
            }
        }
    }

    /**
     * Optional: Render spezielle Effekte (überschreiben in Subklassen)
     */
    renderEffects(ctx, playerOne, performanceNow) {
        // Wird von Special-Waffen überschrieben
    }
        /**
     * Erhöht das Waffenlevel und aktualisiert die Stats
     */
    lvlUp() {
        super.lvlUp();
    }

    /**
     * Helper: Iteriere über alle Enemies im Grid
     */
    forEachEnemy(enemies, callback) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            for (let n = enemies[i].length - 1; n >= 0; n--) {
                for (let j = enemies[i][n].within.length - 1; j >= 0; j--) {
                    if (callback(enemies[i][n].within[j], enemies, j) === false) return;
                }
            }
        }
    }

    /**
     * TEMPLATE METHOD: Render-Logik für diese Waffe
     * Wird von Player aufgerufen in render()
     */
    render(ctx, playerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops, inputState = null) {
        // Update Waffe (Cooldown, etc.)
        this.update(performanceNow);
        this.shoot(playerOne, performanceNow, enemies, map.tilelength, gridWidth, inputState, enemyItemDrops);
        // Render Projektile
        this.renderProjectiles(ctx, playerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops);

        // Render spezielle Effekte (überschreiben in Subklassen)
        this.renderEffects(ctx, playerOne, performanceNow);
    }
}
