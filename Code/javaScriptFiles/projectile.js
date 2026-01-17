import {MovingEntity} from "./movingEntity.js";

// ============ BASIS PROJEKTIL-KLASSE ============

export class Projectile extends MovingEntity {
    /**
     * Projektil-Klasse mit Unterstützung für drei Typen:
     * 1. NORMALE PLAYER-PROJEKTILE: Gespeichert in 3D-Grid [row][col][within], nutzen updateGridPlace()
     * 2. ENEMY-PROJEKTILE: Gespeichert in einfachem Array, für schnelle Bewegung ohne Grid-Tracking
     * 3. FIREBALL-PROJEKTILE: Einfaches Array, spezielles Explosion-Handling (Hit oder Timeout)
     */
    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, piercing, size, direction, dmg, isEnemy = false, gridMapTile, creationTime, duration, orbiting = false, orbitProperties = null, boomerangProperties = null, slashProperties = null) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox);
        this.piercing = piercing;
        this.size = size;
        this.direction = direction;
        this.dmg = dmg;
        this.isEnemy = isEnemy; // true = Enemy-Projektil (einfaches Array), false = Player-Projektil (Grid)
        this.gridMapTile = gridMapTile // {row, col} oder {} für Fireballs/Enemy-Projektile
        this.creationTime = creationTime;
        this.duration = duration; // Lebenszeit in ms, nach der Explosion (nur Fireball relevant)
        this.orbiting = orbiting; // true für Shuriken und ähnliche orbitale Waffen
        this.orbitProperties = orbitProperties; // {radius, speed, shooter, angle}
        this.boomerangProperties = boomerangProperties; // {shooter, maxRange, startX, startY, returning, hitEnemies}
        this.slashProperties = slashProperties; // {slashAngle, sweepRange, hitEnemies}

        // Fireball-spezifische Eigenschaften
        this.exploded = false; // Flag für Explosions-Status
        this.explodedTime = 0; // Timestamp wenn Explosion ausgelöst wurde
        this.explosionDamageDealt = false; // Verhindert mehrfachen AoE-Schaden

        // Molotov-spezifische Eigenschaften
        this.molotovLandTime = null; // Wird gesetzt wenn gelandet
        this.molotovDisappeared = false; // Flag wenn Kreis nach 4 Sekunden verschwunden ist
    }

    handleProjectiles(ctx, projectiles, projectileIndex, enemies, player, map, gridWidth, enemyItemDrops, currentTime) {
        // Loop through projectiles for movement, drawing, and collision

        if (this.isFireball) {
            const elapsedTime = currentTime - this.creationTime;
            const durationExpired = this.duration > 0 && elapsedTime > this.duration;
            if (durationExpired && !this.exploded) {
                this.exploded = true; // Triggert Explosion-Animation in render()
                this.explodedTime = currentTime;
            }
        }

        // Nur wenn nicht explodiert/verschwunden: normale Bewegung und Collision-Detection
        if (!this.exploded && !this.molotovDisappeared) {
            // 1. Move projectile
            this.move(map, projectiles, projectileIndex, gridWidth, player, currentTime);
            // 2. Draw projectile relative to the camera/player
            this.draw(ctx, player);
            // 3. Check collision with Player (nur für Enemy-Projektile)
            if (this.isEnemy) {
                // Feindliches Projektil trifft den Spieler
                if (this.checkCollision(player, 0, 0)) {
                    player.takeDmg(this.dmg);
                    // Feindliche Projektile sind i. d. R. nicht piercing:
                    projectiles.splice(projectileIndex, 1);
                }
            } else {
                // PLAYER-PROJEKTILE: Collision mit Gegnern

                // Molotov: KEIN Collision-Handling
                if (this.isMolotov) {
                    // Molotov hat spezielles Timeout-Handling weiter unten
                } else {

                // SCHWERT-SCHLAG SPEZIAL: Zeiger-Bewegung von 12 bis 4 Uhr (90 Grad)
                if (this.slashProperties && this.slashProperties.isSwing) {
                    const { shooter, radius, minCutRadius, currentAngle, hitEnemies } = this.slashProperties;

                    // currentAngle wird in der move()-Methode bereits berechnet und gespeichert!

                    for (let i = enemies.length - 1; i >= 0; i--) {
                        for (let n = enemies[i].length - 1; n >= 0; n--) {
                            for (let j = enemies[i][n].within.length - 1; j >= 0; j--) {
                                let enemy = enemies[i][n].within[j];
                                const dx = enemy.globalEntityX - shooter.globalEntityX;
                                const dy = enemy.globalEntityY - shooter.globalEntityY;
                                const distToEnemy = Math.sqrt(dx * dx + dy * dy);

                                // Nur im äußeren Bereich der Klinge
                                const minDist = minCutRadius || 40;
                                if (distToEnemy >= minDist && distToEnemy < radius + 50) {
                                    const angleToEnemy = Math.atan2(dy, dx);
                                    let angleDiff = angleToEnemy - currentAngle;

                                    // Normalisiere Winkelunterschied
                                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                                    angleDiff = Math.abs(angleDiff);

                                    // Trifft wenn Schwert-Zeiger über Gegner schlägt (~30 Grad Breite)
                                    if (angleDiff < Math.PI / 6 && !hitEnemies.has(j)) {
                                        enemy.takeDmg(this.dmg, enemies, j, enemyItemDrops);
                                        hitEnemies.add(j); // Nur 1x Schaden pro Schlag
                                    }
                                }
                            }
                        }
                    }

                // MOLOTOV SPEZIAL: AOE-Schaden nach Explosion
                } else if (this.isMolotov && this.molotovExploded) {
                    const explosionElapsed = currentTime - this.molotovExplosionStart;

                // ROTIERENDE SENSE SPEZIAL: Trifft nur am äußeren Ende während Rotation
                } else if (this.orbiting && this.orbitProperties && this.orbitProperties.isSlash) {
                    const { shooter, radius, minCutRadius } = this.orbitProperties;
                    const currentAngle = Math.atan2(this.globalEntityY - shooter.globalEntityY, this.globalEntityX - shooter.globalEntityX);

                    // Initialisiere hitEnemies Set wenn nicht vorhanden
                    if (!this.hitEnemiesThisSwing) {
                        this.hitEnemiesThisSwing = new Set();
                    }

                    for (let i = enemies.length - 1; i >= 0; i--) {
                        for (let n = enemies[i].length - 1; n >= 0; n--) {
                            for (let j = enemies[i][n].within.length - 1; j >= 0; j--) {
                                let enemy = enemies[i][n].within[j];
                                const dx = enemy.globalEntityX - shooter.globalEntityX;
                                const dy = enemy.globalEntityY - shooter.globalEntityY;
                                const distToEnemy = Math.sqrt(dx * dx + dy * dy);

                                // Prüfe ob Gegner in Schneid-Bereich (nur äußeres Ende der Sense)
                                const minDist = minCutRadius || 50; // Nur ab 50px Entfernung schneiden
                                if (distToEnemy >= minDist && distToEnemy < radius + 50) {
                                    const angleToEnemy = Math.atan2(dy, dx);
                                    let angleDiff = Math.abs(angleToEnemy - currentAngle);
                                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                                    // Trifft wenn Sense-Klinge über Gegner rotiert (30 Grad Breite)
                                    if (angleDiff < Math.PI / 6 && !this.hitEnemiesThisSwing.has(j)) {
                                        enemy.takeDmg(this.dmg, enemies, j, enemyItemDrops);
                                        this.hitEnemiesThisSwing.add(j); // Nur 1x Schaden pro Rotation
                                    }
                                }
                            }
                        }
                    }

                // SLASH SPEZIAL: Alle Gegner im Sweep-Bereich treffen
                } else if (this.slashProperties && !this.slashProperties.isSwing) {
                    const { slashAngle, sweepRange, hitEnemies } = this.slashProperties;
                    for (let i = enemies.length - 1; i >= 0; i--) {
                        for (let n = enemies[i].length - 1; n >= 0; n--) {
                            for (let j = enemies[i][n].within.length - 1; j >= 0; j--) {
                                let enemy = enemies[i][n].within[j];
                                // Prüfe ob im Sweep-Bereich (100px Range)
                                const dx = enemy.globalEntityX - this.globalEntityX;
                                const dy = enemy.globalEntityY - this.globalEntityY;
                                const distToEnemy = Math.sqrt(dx * dx + dy * dy);

                                if (distToEnemy < 100 && !hitEnemies.has(j)) { // 100px Range
                                    const angleToEnemy = Math.atan2(dy, dx);
                                    const angleDiff = Math.abs(angleToEnemy - slashAngle);

                                    // Prüfe ob im Sweep-Bereich (90 Grad = PI/2)
                                    if (angleDiff < sweepRange || Math.abs(angleDiff - Math.PI * 2) < sweepRange) {
                                        enemy.takeDmg(this.dmg, enemies, j, enemyItemDrops);
                                        hitEnemies.add(j); // Nur 1x Schaden pro Slash
                                    }
                                }
                            }
                        }
                    }
                    // Slash-Projektile löschen nach Duration
                    if (currentTime - this.creationTime > this.duration) {
                        projectiles[this.gridMapTile.row][this.gridMapTile.column].within.splice(projectileIndex, 1);
                    }
                } else {
                    // NORMALE PROJEKTILE: Einzelne Gegner treffen
                    for (let i = enemies.length - 1; i >= 0; i--) {
                        for (let n = enemies[i].length - 1; n >= 0; n--) {
                            for (let j = enemies[i][n].within.length - 1; j >= 0 ;j--) {
                                let enemy = enemies[i][n].within[j]
                                if (this.checkCollision(enemy, 0, 0)) {
                                    // NORMALE PROJEKTILE: Direkter Schaden
                                    if (!this.isFireball) {
                                        enemy.takeDmg(this.dmg, enemies, j, enemyItemDrops);
                                    }

                                    // NORMALE PROJEKTILE: Aus Grid löschen (wenn nicht piercing)
                                    if (!this.piercing && !this.isFireball) {
                                        projectiles[this.gridMapTile.row][this.gridMapTile.column].within.splice(projectileIndex, 1);
                                        break; // Nicht-piercing Projektile stoppen nach Treffer
                                    } else if (this.isFireball) {
                                        // FIREBALL SPEZIAL: Explosion triggern statt direkten Schaden
                                        this.exploded = true;
                                        this.explodedTime = currentTime;
                                        break; // Fireball stoppt nach Treffer
                                        // Schaden wird von FireballWeapon.damageEnemiesInRadius() angewendet
                                    } else {
                                    }
                                    // Piercing-Projektile: NICHT breaken, weitermachen!
                                }
                            }
                        }
                    }
                }
                }
            }
        }

        // MOLOTOV SPEZIAL: Nur Bewegung und Zeichnung, Timeout steuert Sichtbarkeit
        if (this.isMolotov) {
            // Prüfe ob 4 Sekunden nach Landung vorbei sind
            if (this.molotovLanded && this.molotovLandTime && !this.molotovDisappeared) {
                const circleAge = currentTime - this.molotovLandTime;
                if (circleAge >= 4000) {
                    this.molotovDisappeared = true; // Trigger Disappear (kein render mehr)
                }

                // MOLOTOV DAMAGE: Alle 0.5 Sekunden Schaden in 100px Radius
                if (currentTime - this.molotovLastDmgTime >= 500) {
                    this.molotovLastDmgTime = currentTime;

                    // Treffe alle Gegner im Radius
                    for (let i = enemies.length - 1; i >= 0; i--) {
                        for (let n = enemies[i].length - 1; n >= 0; n--) {
                            for (let j = enemies[i][n].within.length - 1; j >= 0; j--) {
                                let enemy = enemies[i][n].within[j];
                                const dx = enemy.globalEntityX - this.globalEntityX;
                                const dy = enemy.globalEntityY - this.globalEntityY;
                                const distToEnemy = Math.sqrt(dx * dx + dy * dy);

                                // Wenn in Radius von 100px, nimm Schaden
                                if (distToEnemy < this.molotovRadius) {
                                    enemy.takeDmg(this.molotovDmg, enemies, j, enemyItemDrops);
                                }
                            }
                        }
                    }
                }
            }

            // Move projectile nur wenn noch nicht verschwunden
            if (!this.molotovDisappeared) {
                this.move(map, projectiles, projectileIndex, gridWidth, player, currentTime);
                // Draw projectile (green)
                this.draw(ctx, player);
            }

            return;
        }

        // Timeout-Handling für normale Projektile (NICHT für Fireballs und Schwert-Schläge!)
        // Fireballs handhaben Timeout über exploded-Flag
        // Schwert-Schläge handhaben Timeout in move()
        // Molotov hat spezielles Timeout-Handling oben
        if (this.duration > 0 && currentTime - this.creationTime > this.duration && !(this.slashProperties && this.slashProperties.isSwing)) {
            if (this.isEnemy) projectiles.splice(projectileIndex);
            else if (!this.isFireball && !this.isMolotov) projectiles[this.gridMapTile.row][this.gridMapTile.column].within.splice(projectileIndex, 1);
        }
    }


    move(map, projectiles, projectileIndex, gridWidth, player, currentTime) {
        // MOLOTOV SPEZIAL: Bogen-Bewegung - fliegt in zufällige Richtung weg
        if (this.isMolotov) {
            const elapsedTime = currentTime - this.molotovCreationTime;
            const progress = Math.min(elapsedTime / this.duration, 1); // 0 bis 1 über 1 Sekunde

            if (progress < 1) {
                // PHASE 1: Bogen-Flug in beliebige Richtung - ECHTE Parabel
                const arcHeight = 150 * progress * (1 - progress) * 4; // Echte Parabel: peak bei progress=0.5

                // Bewegung in BEIDE Richtungen (x UND y) + vertikale Parabel
                const newX = this.molotovStart.x + this.direction.x * this.speed * elapsedTime / 1000;
                const newY = this.molotovStart.y + this.direction.y * this.speed * elapsedTime / 1000 - arcHeight;

                this.globalEntityX = newX;
                this.globalEntityY = newY;
            } else {
                // PHASE 2: Liegt auf dem Boden - Position eingefroren
                if (!this.molotovLanded) {
                    this.molotovLanded = true; // Flag setzen dass es gelandet ist
                    this.molotovLandTime = currentTime; // Speichere Landezeitpunkt
                }
            }

            return; // Molotov hat spezielles Handling
        }

        // SCHWERT-SCHLAG SPEZIAL: Griff am Spieler, Spitze rotiert
        if (this.slashProperties && this.slashProperties.isSwing) {
            const { shooter, startAngle, endAngle, startTime, duration, radius } = this.slashProperties;

            // Berechne aktuelle Schlag-Position (0 bis 1)
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const currentAngle = startAngle + (endAngle - startAngle) * progress;

            // Griff des Schwertes bleibt beim Spieler
            this.globalEntityX = shooter.globalEntityX;
            this.globalEntityY = shooter.globalEntityY;

            // Speichere die aktuelle Schlag-Richtung für die Render/Zeichnung
            this.slashProperties.currentAngle = currentAngle;

            // Löschen nach Schlag-Dauer
            if (elapsedTime > duration) {
                if (!this.isEnemy && !this.isFireball) {
                    let position = this.updateGridPlace(map.tilelength, projectiles, projectileIndex, gridWidth);
                    projectiles[position.gridMapTile.row][position.gridMapTile.column].within.splice(position.positionWithin, 1);
                } else {
                    projectiles.splice(projectileIndex, 1);
                }
            }
            return;
        }

        // Orbitale Projektile (Shuriken): Bewegen sich im Kreis um Shooter
        if (this.orbiting) {
            const { radius, speed, shooter } = this.orbitProperties;
            const time = (currentTime - this.creationTime) / 1000; // in seconds
            this.globalEntityX = shooter.globalEntityX + radius * Math.cos(time * speed + this.orbitProperties.angle);
            this.globalEntityY = shooter.globalEntityY + radius * Math.sin(time * speed + this.orbitProperties.angle);
            return;
        }

        // Bumerang-Logik (Axt)
        if (this.boomerangProperties) {
            const { shooter, maxRange, startX, startY, returning } = this.boomerangProperties;
            const distFromStart = Math.sqrt(
                (this.globalEntityX - startX) ** 2 +
                (this.globalEntityY - startY) ** 2
            );

            if (!this.boomerangProperties.returning && distFromStart >= maxRange) {
                // Starten zu kehren
                this.boomerangProperties.returning = true;
            }

            if (this.boomerangProperties.returning) {
                // Fliegt zurück zum Spieler
                const dx = shooter.globalEntityX - this.globalEntityX;
                const dy = shooter.globalEntityY - this.globalEntityY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.speed * 2) {
                    // Axt ist beim Spieler angekommen - löschen
                    if (!this.isEnemy && !this.isFireball) {
                        let position = this.updateGridPlace(map.tilelength, projectiles, projectileIndex, gridWidth);
                        projectiles[position.gridMapTile.row][position.gridMapTile.column].within.splice(position.positionWithin, 1);
                    } else {
                        projectiles.splice(projectileIndex, 1);
                    }
                    return;
                }

                // Normalisiere und bewege in Richtung Spieler
                this.direction.x = dx / dist;
                this.direction.y = dy / dist;
            }
        }

        // Grid-Tracking nur für normale Player-Projektile
        let position
        if (!(this.isEnemy) && !this.isFireball) {
            position = this.updateGridPlace(map.tilelength, projectiles, projectileIndex, gridWidth)
        }

        // Standard-Bewegungslogik für alle Projektil-Typen
        let oldGlobalEntityX = this.globalEntityX
        let oldGlobalEntityY = this.globalEntityY

        if (this.direction.x > 0) {
            this.globalEntityX = map.rightFree(this.globalEntityX, this.globalEntityY, (this.direction.x * this.speed), this.hitbox)
        } else if (this.direction.x < 0) {
            this.globalEntityX = map.leftFree(this.globalEntityX, this.globalEntityY, (this.direction.x * this.speed) * -1, this.hitbox)
        }

        if (this.direction.y < 0) {
            this.globalEntityY = map.topFree(this.globalEntityX, this.globalEntityY, (this.direction.y * this.speed) * -1, this.hitbox)
        } else if (this.direction.y > 0) {
            this.globalEntityY = map.downFree(this.globalEntityX, this.globalEntityY, (this.direction.y * this.speed), this.hitbox)
        }

        // Wandkollisions-Handling: Unterschiedlich je nach Speichertyp
        if ((oldGlobalEntityX === this.globalEntityX && this.direction.x !== 0) || (oldGlobalEntityY === this.globalEntityY && this.direction.y !== 0)) {
            // Enemy und Fireball-Projektile (einfaches Array): direkt löschen
            if (this.isEnemy || this.isFireball) {
                projectiles.splice(projectileIndex)
            } else {
                // Normale Player-Projektile (Grid): aus Grid entfernen
                projectiles[position.gridMapTile.row][position.gridMapTile.column].within.splice(position.positionWithin, 1);
            }
        }
    }

    draw(ctx, player) {
        // Berechne die Screen-Position relativ zum Spieler
        const screenX = this.globalEntityX - player.globalEntityX + player.canvasWidthMiddle;
        const screenY = this.globalEntityY - player.globalEntityY + player.canvasWidthHeight;

        // Speichere Canvas-State um ihn später zu restaurieren
        ctx.save();

        // MOLOTOV SPEZIAL: Einfaches grünes Quadrat während Flug, grüner Kreis nach Landung
        if (this.isMolotov) {
            if (this.molotovLanded && !this.molotovDisappeared) {
                // Grüner durchsichtiger Kreis am Landepunkt (Größe wie Fireball = radius 100)
                ctx.fillStyle = 'rgba(0, 255, 0, 0.4)'; // Grün, 40% transparent
                ctx.beginPath();
                ctx.arc(screenX, screenY, 100, 0, Math.PI * 2);
                ctx.fill();

                // Optional: Outline
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (!this.molotovLanded && !this.molotovDisappeared) {
                // Grünes Quadrat während Flug
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(screenX - 6, screenY - 6, 12, 12);
            }
        } else if (this.slashProperties && this.slashProperties.isSwing) {
            const { currentAngle, radius, height } = this.slashProperties;

            // Startpunkt: Spieler-Position (Griff)
            const startX = screenX;
            const startY = screenY;

            // Endpunkt: In Richtung currentAngle, Distanz = Klingen-Länge (100px)
            const endX = startX + Math.cos(currentAngle) * radius;
            const endY = startY + Math.sin(currentAngle) * radius;

            // Zeichne die Klinge als Linie
            ctx.strokeStyle = '#FFD700'; // Gold-Farbe für das Schwert
            ctx.lineWidth = 8; // Dicke der Klinge
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Zeichne den Griff als Kreis
            ctx.fillStyle = '#8B4513'; // Braun für den Griff
            ctx.beginPath();
            ctx.arc(startX, startY, 6, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.orbiting && this.orbitProperties && this.orbitProperties.isSlash) {
            // ROTIERENDE SENSE: Zeichne als Rechteck
            const color = '#00FF00'; // Grün für Sense
            ctx.fillStyle = color;
            ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size);

        } else {
            // NORMALE PROJEKTILE: Zeichne als Rechteck
            const color = this.getColor();
            ctx.fillStyle = color;
            ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size);
        }

        // Stelle Canvas-State wieder her
        ctx.restore();
    }

    render(ctx, projectiles, projectileIndex, enemies, PlayerOne, MapOne, gridWidth, enemyItemDrops, currentTime){
        this.handleProjectiles(ctx, projectiles, projectileIndex, enemies, PlayerOne, MapOne, gridWidth, enemyItemDrops, currentTime);

        // Fireball-Explosion Animation (nach Collision oder Timeout)
        if (this.isFireball && this.exploded) {
            const explosionElapsed = currentTime - this.explodedTime;
            if (explosionElapsed < 300) {
                this.drawExplosionCircle(ctx, PlayerOne, explosionElapsed);
            }
        }
    }

    drawExplosionCircle(ctx, PlayerOne, elapsed) {
        const screenX = this.globalEntityX - PlayerOne.globalEntityX + PlayerOne.canvasWidthMiddle;
        const screenY = this.globalEntityY - PlayerOne.globalEntityY + PlayerOne.canvasWidthHeight;
        const opacity = 1 - (elapsed / 300);
        const explosionRadius = 100; // Fireball explosion radius
        ctx.fillStyle = `rgba(255, 50, 0, ${0.7 * opacity})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, explosionRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    getColor() {
        if (this.isFireball) {
            return this.fireballColor || 'rgba(255, 50, 0, 0.9)'; // Fireball ist rot-orange
        }
        return this.isEnemy ? 'orange' :'cyan'
    }
}

// ============ SPEZIALISIERTE PROJEKTIL-KLASSEN ============

export class ArrowProjectile extends Projectile {
    constructor(shooter, direction, gridMapTile, currentTime, duration = -1) {
        super(
            shooter.globalEntityX,
            shooter.globalEntityY,
            1,
            null,
            5, // Speed
            { width: 8, height: 8 },
            0, // Kein Piercing
            8,
            direction,
            100, // Damage
            false,
            gridMapTile,
            currentTime,
            duration // Duration (default: -1 = unbegrenzt)
        );
        this.isArrow = true;
    }
}

export class SpearProjectile extends Projectile {
    constructor(shooter, direction, tilelength, gridWidth, currentTime) {
        const gridMapTile = {
            column: Math.floor(shooter.globalEntityX / (gridWidth * tilelength)),
            row: Math.floor(shooter.globalEntityY / (gridWidth * tilelength))
        };
        super(
            shooter.globalEntityX,
            shooter.globalEntityY,
            1,
            null,
            7, // Speed
            { width: 12, height: 12 },
            1, // Piercing aktiviert
            12,
            direction,
            300, // Damage
            false,
            gridMapTile,
            currentTime,
            5000 // Duration
        );
        this.isSpear = true;
    }
}

export class MolotovProjectile extends Projectile {
    constructor(shooter, direction, currentTime) {
        super(
            shooter.globalEntityX,
            shooter.globalEntityY,
            1,
            null,
            200, // Speed
            { width: 8, height: 8 },
            0,
            8,
            direction,
            0, // Kein Damage während Flug
            false,
            {},
            currentTime,
            1000 // Flight duration
        );
        this.isMolotov = true;
        this.molotovStart = { x: shooter.globalEntityX, y: shooter.globalEntityY };
        this.molotovCreationTime = currentTime;
        this.molotovLanded = false;
        this.molotovLandTime = null; // Wird gesetzt wenn gelandet
        this.molotovDisappeared = false;
        this.molotovLastDmgTime = 0; // Für Damage-Interval (0.5 Sekunden)
        this.molotovRadius = 100; // Radius der Explosion
        this.molotovDmg = 25; // Damage alle 0.5 Sekunden
    }
}