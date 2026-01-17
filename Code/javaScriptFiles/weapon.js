import {Projectile, ArrowProjectile, SpearProjectile, MolotovProjectile} from "./projectile.js";
import {Item} from "./item.js";
import {Enemy} from "./enemy.js";

export class Weapon extends Item {
    constructor(icon, description, picture, dmg, cooldown, piercing, splash, range, lvl, amount, shooter, mapWidth, mapHeight, gridWidth) {
        super(icon, description, picture);
        this.dmg = dmg;
        this.cooldown = cooldown; // Time between shots in milliseconds
        this.piercing = piercing; // Durchschlagende Projektile
        this.splash = splash;
        this.range = range;
        this.lvl = lvl;
        this.amount = amount;
        this.lastShotTime = 0; // Timestamp of the last shot
        this.shooter = shooter;
        this.projectiles = [];

        // Default properties (werden von Subklassen überschrieben wenn nötig)
        this.projectileSize = 8;
        this.projectileDuration = -1;

        // Grid initialization (can be overridden in subclasses)
        this._initializeGrid(shooter, mapWidth, mapHeight, gridWidth);
    }

    _initializeGrid(shooter, mapWidth, mapHeight, gridWidth) {
        if (!(shooter instanceof Enemy)) {
            for (let row = 0; row <= Math.floor(mapHeight / gridWidth); row++) {
                this.projectiles[row] = [];
                for (let column = 0; column <= Math.floor(mapWidth / gridWidth); column++) {
                    this.projectiles[row][column] = { within: [] };
                }
            }
        }
    }

    static create(type, shooter, mapWidth, mapHeight, gridWidth) {
        switch (type) {
            case "sword":
                return new SwordWeapon(shooter, mapWidth, mapHeight, gridWidth);

            case "basic":
                return new BowWeapon(shooter, mapWidth, mapHeight, gridWidth);

            case "basicEnemy":
                return new BasicEnemyWeapon(shooter, mapWidth, mapHeight, gridWidth);

            case "thunderstrike":
                return new ThunderstrikeWeapon(shooter, mapWidth, mapHeight, gridWidth);

            case "spear":
                return new SpeerWeapon(shooter, mapWidth, mapHeight, gridWidth);

            case "shuriken":
                return new ShurikanWeapon(shooter, mapWidth, mapHeight, gridWidth);

            case "aura":
                return new AuraWeapon(shooter, mapWidth, mapHeight, gridWidth);

            case "fireball":
                return new FireballWeapon(shooter, mapWidth, mapHeight, gridWidth);

            case "knife":
                return new Knife(shooter, mapWidth, mapHeight, gridWidth);

            case "axe":
                return new AxeWeapon(shooter, mapWidth, mapHeight, gridWidth);

            case "molotov":
                return new MolotovWeapon(shooter, mapWidth, mapHeight, gridWidth);

            default:
                return new BasicEnemyWeapon(shooter, mapWidth, mapHeight, gridWidth);
        }
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth, inputState = null) {
        // Check if the cooldown has passed
        if (currentTime - this.lastShotTime < this.cooldown) {
            return; // Still on cooldown
        }

        let isEnemyShooter = this.shooter instanceof Enemy
        let targetEntity
        if (isEnemyShooter)
            targetEntity = player
        if (this.shooter instanceof Enemy && !(this.shooter.shouldShoot(player))) {
            return
        }
        // Nur für den Spieler relevant: Wenn kein Ziel direkt vorgegeben ist,
        // dann abbrechen, falls es keine Gegner gibt.
        if (!targetEntity && enemies.length === 0) {
            return; // keine Gegner für Auto-Fokus
        }

        this.lastShotTime = currentTime;

        // Create projectiles
        for (let j = 0; j < this.amount; j++) {
            let dir
            if (targetEntity) {
                // Gegner schießt gezielt auf targetEntity (z. B. den Player)
                const dx = targetEntity.globalEntityX - this.shooter.globalEntityX;
                const dy = targetEntity.globalEntityY - this.shooter.globalEntityY;
                const angle = Math.atan2(dy, dx);
                dir = { x: Math.cos(angle), y: Math.sin(angle) };
            } else if (this.focus === 1) {
                // Spieler zielt wie bisher auf den nächsten Gegner
                let closestEnemy = {enemy: null, distance: 99999}
                for (let i = enemies.length - 1; i >= 0; i--) {
                    for (let n = enemies[i].length -1 ; n>= 0; n--){
                        for (let enemy of enemies[i][n].within){
                            let distanceX = this.shooter.globalEntityX - enemy.globalEntityX
                            let distanceY = this.shooter.globalEntityY - enemy.globalEntityY
                            let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
                            if (distance < closestEnemy.distance) {
                                closestEnemy = {enemy: enemy, distance: distance}
                            }
                        }
                    }
                }
                if (closestEnemy.enemy) {
                    let distanceX = (closestEnemy.enemy.globalEntityX - this.shooter.globalEntityX)
                    let distanceY = (closestEnemy.enemy.globalEntityY - this.shooter.globalEntityY)
                    let angle = Math.atan2(distanceY, distanceX);
                    dir = {x: Math.cos(angle), y: Math.sin(angle)};
                }
                else {
                    let angle = Math.random() * Math.PI * 2;
                    dir = {x: Math.cos(angle), y: Math.sin(angle)};
                }
            } else {
                // Zufällige Richtung
                const angle = Math.random() * Math.PI * 2;
                dir = { x: Math.cos(angle), y: Math.sin(angle) }
            }
            const p = new Projectile(this.shooter.globalEntityX,
                this.shooter.globalEntityY, 1,
                null,
                (isEnemyShooter ? 3 : 5),
                {width: this.projectileSize, height: this.projectileSize},
                this.piercing,
                this.projectileSize,
                dir,
                this.dmg,
                isEnemyShooter,
                {column : Math.floor(player.globalEntityX/ (gridWidth*tilelength)), row : Math.floor(player.globalEntityY / (gridWidth*tilelength))},
                currentTime, this.projectileDuration
            );
            if (this.shooter instanceof Enemy){
                this.projectiles.push(p)
            }else{
                this.projectiles[p.gridMapTile.row][p.gridMapTile.column].within.push(p)
            }
        }
    }

    render(ctx, PlayerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops, inputState){
        if (Game.testShoot === true) {
            this.shoot(
                PlayerOne,
                performanceNow,
                enemies,
                map.tilelength,
                gridWidth,
                inputState
            )
        }

        // Render normal projectiles (nicht orbiting)
        if (this.shooter instanceof Enemy){
            // Enemy-Waffen: einfaches Array
            for (let j = this.projectiles.length-1; j>= 0; j--){
                let projectile = this.projectiles[j]
                projectile.render(ctx, this.projectiles, j, enemies, PlayerOne, map, gridWidth, enemyItemDrops, performanceNow)
            }
        } else if (Array.isArray(this.projectiles) && this.projectiles.length > 0 && typeof this.projectiles[0] === 'object' && !Array.isArray(this.projectiles[0])) {
            // Player-Waffen mit einfachem Array (Fireball, Molotov)
            for (let j = this.projectiles.length - 1; j >= 0; j--) {
                let projectile = this.projectiles[j];
                projectile.render(ctx, this.projectiles, j, enemies, PlayerOne, map, gridWidth, enemyItemDrops, performanceNow);
            }
        } else {
            // Player-Waffen mit Grid-System (normale Projektile)
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                for (let n = this.projectiles[i].length - 1; n >= 0; n--){
                    for (let j = this.projectiles[i][n].within.length - 1; j >= 0 ;j--){
                        let projectile = this.projectiles[i][n].within[j]
                        projectile.render(ctx, this.projectiles, j, enemies, PlayerOne, map, gridWidth, enemyItemDrops, performanceNow)
                    }
                }
            }
        }
    }
}

// ===== WAFFEN-SUBKLASSEN =====

export class SwordWeapon extends Weapon {
    // SWORD-WAFFE: Spieler hält Schwert und schlägt von 12 bis 4 Uhr (90 Grad)
    // Klassischer Schwert-Schlag wie ein Uhrzeiger
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "Sword", null, 35, 600, 0, 0, 100, 1, 1, shooter, mapWidth, mapHeight, gridWidth);
        this.lastSlashAngle = Math.PI * 1.5; // Startwinkel: 12 Uhr (oben)
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth, inputState) {
        // Check cooldown
        if (currentTime - this.lastShotTime < this.cooldown) {
            return;
        }

        this.lastShotTime = currentTime;

        // Bestimme Startwinkel basierend auf nächstem Gegner
        let closestEnemy = { enemy: null, distance: 99999, angle: 0 };
        for (let i = enemies.length - 1; i >= 0; i--) {
            for (let n = enemies[i].length - 1; n >= 0; n--) {
                for (let enemy of enemies[i][n].within) {
                    let distanceX = enemy.globalEntityX - this.shooter.globalEntityX;
                    let distanceY = enemy.globalEntityY - this.shooter.globalEntityY;
                    let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                    if (distance < closestEnemy.distance && distance < 150) {
                        closestEnemy = {
                            enemy: enemy,
                            distance: distance,
                            angle: Math.atan2(distanceY, distanceX)
                        };
                    }
                }
            }
        }

        // Startwinkel (bevorzugt zur nächsten Gegner, sonst letzte Richtung)
        let startAngle = closestEnemy.enemy ? closestEnemy.angle : this.lastSlashAngle;
        this.lastSlashAngle = startAngle;

        // Erstelle Schwert-Schlag (Zeiger-Bewegung von 12 zu 4 Uhr = 90 Grad)
        const p = new Projectile(
            this.shooter.globalEntityX,
            this.shooter.globalEntityY,
            1,
            null,
            0, // Keine lineare Bewegung
            { width: 8, height: 100 }, // Schwert-Klinge
            false,
            100,
            { x: 0, y: 0 },
            this.dmg,
            false,
            { column: Math.floor(this.shooter.globalEntityX / (gridWidth * tilelength)), row: Math.floor(this.shooter.globalEntityY / (gridWidth * tilelength)) },
            currentTime,
            200, // Kurze Schlag-Dauer (200ms für schnellen Schlag)
            false, // Nicht orbitierend - nur einzelner Schlag
            null,
            null,
            {
                isSwing: true,
                shooter: this.shooter,
                startAngle: startAngle,
                endAngle: startAngle + (Math.PI * 0.5), // 90 Grad Schlag (12 bis 4 Uhr)
                radius: 200,
                minCutRadius: 80,
                startTime: currentTime,
                duration: 200,
                hitEnemies: new Set()
            }
        );

        // Speichere im Grid
        if (this.projectiles[p.gridMapTile.row] && this.projectiles[p.gridMapTile.row][p.gridMapTile.column]) {
            this.projectiles[p.gridMapTile.row][p.gridMapTile.column].within.push(p);
        }
    }
}

export class BowWeapon extends Weapon {
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "bow", null, 100, 1000, 0, 0, 1000, 1, 1, shooter, mapWidth, mapHeight, gridWidth);
        this.projectileSize = 8;
        this.projectileDuration = -1;
        this.tilelength = mapWidth / gridWidth;
        this.gridWidth = gridWidth;
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth, inputState = null) {
        // Check cooldown
        if (currentTime - this.lastShotTime < this.cooldown) {
            return;
        }

        this.lastShotTime = currentTime;

        // Bestimme Zielrichtung (auf nächsten Gegner)
        let closestEnemy = { enemy: null, distance: 99999 };
        for (let i = enemies.length - 1; i >= 0; i--) {
            for (let n = enemies[i].length - 1; n >= 0; n--) {
                for (let enemy of enemies[i][n].within) {
                    let distanceX = this.shooter.globalEntityX - enemy.globalEntityX;
                    let distanceY = this.shooter.globalEntityY - enemy.globalEntityY;
                    let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                    if (distance < closestEnemy.distance) {
                        closestEnemy = { enemy: enemy, distance: distance };
                    }
                }
            }
        }

        let dir = { x: 1, y: 0 };
        if (closestEnemy.enemy) {
            let distanceX = closestEnemy.enemy.globalEntityX - this.shooter.globalEntityX;
            let distanceY = closestEnemy.enemy.globalEntityY - this.shooter.globalEntityY;
            let angle = Math.atan2(distanceY, distanceX);
            dir = { x: Math.cos(angle), y: Math.sin(angle) };
        }

        // Berechne Grid-Position
        const gridMapTile = {
            column: Math.floor(this.shooter.globalEntityX / (gridWidth * tilelength)),
            row: Math.floor(this.shooter.globalEntityY / (gridWidth * tilelength))
        };

        // Erstelle Arrow-Projektil
        const p = new ArrowProjectile(this.shooter, dir, gridMapTile, currentTime, this.projectileDuration);

        // Speichere im Grid
        if (this.projectiles[p.gridMapTile.row] && this.projectiles[p.gridMapTile.row][p.gridMapTile.column]) {
            this.projectiles[p.gridMapTile.row][p.gridMapTile.column].within.push(p);
        }
    }
}

export class BasicEnemyWeapon extends Weapon {
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "Basic Gun", null, 10, 300, 1, 0, 1000, 1, 1, shooter, mapWidth, mapHeight, gridWidth);
    }
}

export class ThunderstrikeWeapon extends Weapon {
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "Thunderstrike", null, 5, 400, 0, 0, 300, 1, 1, shooter, mapWidth, mapHeight, gridWidth, 16, 0);
        this.lightningLength = 300; // Length of lightning bolt
        this.lightningDuration = 150; // How long the visual effect stays (ms)
        this.lightningCount = 4; // Number of lightning bolts
        this.lastLightningTime = 0;
        this.lastLightningDirections = [];
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth, inputState = null) {
        // Check cooldown
        if (currentTime - this.lastShotTime < this.cooldown) {
            return;
        }

        let isEnemyShooter = this.shooter instanceof Enemy;
        let targetEntity = isEnemyShooter ? player : null;
        if (this.shooter instanceof Enemy && !(this.shooter.shouldShoot(player))) {
            return;
        }

        this.lastShotTime = currentTime;

        // Determine base direction
        let baseDir = { x: 1, y: 0 };

        if (targetEntity) {
            // Enemy shoots at player
            const dx = targetEntity.globalEntityX - this.shooter.globalEntityX;
            const dy = targetEntity.globalEntityY - this.shooter.globalEntityY;
            const angle = Math.atan2(dy, dx);
            baseDir = { x: Math.cos(angle), y: Math.sin(angle) };
        } else if (!isEnemyShooter) {
            // Player targets closest enemy
            let closestEnemy = { enemy: null, distance: 99999 };
            for (let i = enemies.length - 1; i >= 0; i--) {
                for (let n = enemies[i].length - 1; n >= 0; n--) {
                    for (let enemy of enemies[i][n].within) {
                        let distanceX = this.shooter.globalEntityX - enemy.globalEntityX;
                        let distanceY = this.shooter.globalEntityY - enemy.globalEntityY;
                        let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                        if (distance < closestEnemy.distance) {
                            closestEnemy = { enemy: enemy, distance: distance };
                        }
                    }
                }
            }

            if (closestEnemy.enemy) {
                let distanceX = closestEnemy.enemy.globalEntityX - this.shooter.globalEntityX;
                let distanceY = closestEnemy.enemy.globalEntityY - this.shooter.globalEntityY;
                let angle = Math.atan2(distanceY, distanceX);
                baseDir = { x: Math.cos(angle), y: Math.sin(angle) };
            } else {
                let angle = Math.random() * Math.PI * 2;
                baseDir = { x: Math.cos(angle), y: Math.sin(angle) };
            }
        }

        // Create multiple lightning bolts spread around the base direction
        this.lastLightningDirections = [];
        const spreadAngle = Math.PI / 6; // 30 degrees total spread (15 each side)

        for (let i = 0; i < this.lightningCount; i++) {
            // Calculate offset angle for this lightning bolt
            const offset = (i - (this.lightningCount - 1) / 2) * (spreadAngle / (this.lightningCount - 1));
            const baseAngle = Math.atan2(baseDir.y, baseDir.x);
            const lightningAngle = baseAngle + offset;

            const lightningDir = {
                x: Math.cos(lightningAngle),
                y: Math.sin(lightningAngle)
            };

            this.lastLightningDirections.push(lightningDir);

            // Damage all enemies hit by this lightning bolt
            for (let i = enemies.length - 1; i >= 0; i--) {
                for (let n = enemies[i].length - 1; n >= 0; n--) {
                    for (let j = enemies[i][n].within.length - 1; j >= 0; j--) {
                        let enemy = enemies[i][n].within[j];
                        const dx = enemy.globalEntityX - this.shooter.globalEntityX;
                        const dy = enemy.globalEntityY - this.shooter.globalEntityY;
                        const distToEnemy = Math.sqrt(dx * dx + dy * dy);

                        // Check if enemy is in line with lightning bolt
                        if (distToEnemy <= this.lightningLength) {
                            // Calculate angle to enemy
                            const angleToEnemy = Math.atan2(dy, dx);
                            const angleDiff = Math.abs(angleToEnemy - lightningAngle);

                            // If within ~15 degrees of the bolt direction, hit them
                            if (angleDiff < Math.PI / 12 || Math.abs(angleDiff - Math.PI * 2) < Math.PI / 12) {
                                enemy.takeDmg(this.dmg, enemies, j, this.shooter.enemyItemDrops || []);
                            }
                        }
                    }
                }
            }
        }

        // Store lightning effect for rendering
        this.lastLightningTime = currentTime;
    }

    render(ctx, PlayerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops, inputState) {
        // Handle shooting
        if (Game.testShoot === true) {
            this.shoot(
                PlayerOne,
                performanceNow,
                enemies,
                map.tilelength,
                gridWidth,
                inputState
            );
        }

        // Draw lightning effects if recently fired
        const timeSinceLightning = performanceNow - this.lastLightningTime;
        if (timeSinceLightning < this.lightningDuration && this.lastLightningDirections.length > 0) {
            for (let dir of this.lastLightningDirections) {
                this.drawLightning(ctx, PlayerOne, dir);
            }
        }
    }

    drawLightning(ctx, playerOne, direction) {
        const screenX = this.shooter.globalEntityX - playerOne.globalEntityX + playerOne.canvasWidthMiddle;
        const screenY = this.shooter.globalEntityY - playerOne.globalEntityY + playerOne.canvasWidthHeight;

        // Draw dark blue lightning bolt
        const endX = screenX + direction.x * this.lightningLength;
        const endY = screenY + direction.y * this.lightningLength;

        ctx.save();

        // Draw main bolt
        ctx.strokeStyle = '#0033FF'; // Dark blue
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw glowing effect with lighter blue
        ctx.strokeStyle = '#6699FF'; // Light blue glow
        ctx.lineWidth = 12;
        ctx.globalAlpha = 0.4;

        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.restore();
    }
}

export class SpeerWeapon extends Weapon {
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "Spear", null, 300, 1200, 1, 0, 2000, 1, 1, shooter, mapWidth, mapHeight, gridWidth);
        this.projectileSize = 12;
        this.projectileDuration = -1;
        this.tilelength = mapWidth / gridWidth;
        this.gridWidth = gridWidth;
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth, inputState = null) {
        // Check cooldown
        if (currentTime - this.lastShotTime < this.cooldown) {
            return;
        }

        this.lastShotTime = currentTime;

        // Bestimme Zielrichtung (auf nächsten Gegner oder zufällig)
        let closestEnemy = { enemy: null, distance: 99999 };
        for (let i = enemies.length - 1; i >= 0; i--) {
            for (let n = enemies[i].length - 1; n >= 0; n--) {
                for (let enemy of enemies[i][n].within) {
                    let distanceX = this.shooter.globalEntityX - enemy.globalEntityX;
                    let distanceY = this.shooter.globalEntityY - enemy.globalEntityY;
                    let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                    if (distance < closestEnemy.distance) {
                        closestEnemy = { enemy: enemy, distance: distance };
                    }
                }
            }
        }

        let dir = { x: 1, y: 0 };
        if (closestEnemy.enemy) {
            let distanceX = closestEnemy.enemy.globalEntityX - this.shooter.globalEntityX;
            let distanceY = closestEnemy.enemy.globalEntityY - this.shooter.globalEntityY;
            let angle = Math.atan2(distanceY, distanceX);
            dir = { x: Math.cos(angle), y: Math.sin(angle) };
        }

        // Erstelle Speer-Projektil
        const p = new SpearProjectile(this.shooter, dir, tilelength, gridWidth, currentTime);

        // Speichere im Grid
        if (this.projectiles[p.gridMapTile.row] && this.projectiles[p.gridMapTile.row][p.gridMapTile.column]) {
            this.projectiles[p.gridMapTile.row][p.gridMapTile.column].within.push(p);
        }
    }
}

export class ShurikanWeapon extends Weapon {
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "Shurikan", null, 25, 150, 1, 0, 700, 1, 3, shooter, mapWidth, mapHeight, gridWidth);
        this.projectileSize = 6;
        this.projectileDuration = 1000;
        this.orbiting = true;
        this.orbitProperties = { radius: 100, speed: 2 };
        this.projectiles = [];
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth) {
        // Shurikan: Orbiting projectiles
        if (this.projectiles.length < this.amount) {
            for (let i = 0; i < this.amount; i++) {
                const angle = (2 * Math.PI / this.amount) * i;
                const p = new Projectile(
                    this.shooter.globalEntityX,
                    this.shooter.globalEntityY,
                    1, null, 0,
                    {width: this.projectileSize, height: this.projectileSize},
                    true, this.projectileSize, {}, this.dmg, false, {},
                    currentTime, -1, true,
                    {
                        radius: this.orbitProperties.radius,
                        speed: this.orbitProperties.speed,
                        shooter: this.shooter,
                        angle: angle
                    }
                );
                this.projectiles.push(p);
            }
        }
    }

    render(ctx, PlayerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops){
        // Shurikan ist eine orbiting weapon - schießt orbiting Projektile
        if (Game.testShoot === true) {
            this.shoot(
                PlayerOne,
                performanceNow,
                enemies,
                map.tilelength,
                gridWidth
            )
        }

        // Render orbiting projectiles
        for (let j = this.projectiles.length-1; j>= 0; j--){
            let projectile = this.projectiles[j]
            projectile.render(ctx, this.projectiles, j, enemies, PlayerOne, map, gridWidth, enemyItemDrops, performanceNow)
        }
    }
}

export class AuraWeapon extends Weapon {
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "Aura", null, 15, 0, 0, 0, 0, 1, 1, shooter, mapWidth, mapHeight, gridWidth);
        this.isAura = true;
        this.auraRadius = 150;
        this.auraDmgInterval = 500;
        this.lastAuraDmgTime = 0;
        this.auraColor = 'rgba(255, 255, 100, 0.3)';
    }

    render(ctx, PlayerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops){
        // Aura schießt keine Projektile - zeichnen und Schaden zufügen
        this.draw(ctx, PlayerOne);
        this.damageEnemies(enemies, performanceNow, enemyItemDrops);
    }

    draw(ctx, playerOne) {
        const screenX = this.shooter.globalEntityX - playerOne.globalEntityX + playerOne.canvasWidthMiddle;
        const screenY = this.shooter.globalEntityY - playerOne.globalEntityY + playerOne.canvasWidthHeight;

        // Zeichne den Aura-Kreis
        ctx.fillStyle = this.auraColor;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // Optionaler Border
        ctx.strokeStyle = 'rgba(255, 255, 100, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    damageEnemies(enemies, currentTime, enemyItemDrops) {
        // Sammle alle Gegner, die Schaden nehmen sollen
        const enemiesToDamage = [];

        // Durchsuche alle Gegner
        for (let row = 0; row < enemies.length; row++) {
            for (let column = 0; column < enemies[row].length; column++) {
                for (let i = 0; i < enemies[row][column].within.length; i++) {
                    const enemy = enemies[row][column].within[i];
                    const distX = enemy.globalEntityX - this.shooter.globalEntityX;
                    const distY = enemy.globalEntityY - this.shooter.globalEntityY;
                    const distance = Math.sqrt(distX * distX + distY * distY);

                    // Wenn Gegner im Radius, zur Liste hinzufügen
                    if (distance <= this.auraRadius) {
                        // Initialisiere Cooldown für diesen Gegner, falls nicht vorhanden
                        if (!enemy.lastAuraDmgTime) {
                            enemy.lastAuraDmgTime = 0;
                        }

                        // Überprüfe individuelle Cooldown für diesen Gegner
                        if (currentTime - enemy.lastAuraDmgTime >= this.auraDmgInterval) {
                            enemy.lastAuraDmgTime = currentTime;
                            enemiesToDamage.push({ enemy, row, column, index: i });
                        }
                    }
                }
            }
        }

        // Verteile Schaden und wende takeDmg() an (mit Drop-Handling)
        for (let dmgInfo of enemiesToDamage) {
            const enemy = dmgInfo.enemy;
            // Verwende takeDmg() statt HP-Direktmanipulation - das triggert Drops und XP!
            enemy.takeDmg(this.dmg, enemies, dmgInfo.index, enemyItemDrops);
        }
    }
}

export class FireballWeapon extends Weapon {
    // EXPLOSIONS-WAFFE: Rote Feuerball-Projektile
    // Nutzt Standard shoot() Methode, aber speichert Projektile in einfachem Array
    // Spezial: Explosion wenn Gegner getroffen ODER Lebenszeit endet
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "Fireball", null, 40, 2000, 0, 0, 800, 1, 1, shooter, mapWidth, mapHeight, gridWidth);
        this.projectileSize = 10;
        this.projectileDuration = 1250;
        this.explosionRadius = 100; // AoE-Radius für Explosionsschaden
        this.projectiles = []; // Einfaches Array für Projektile
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth) {
        // Nutzt Standard-Logik, aber speichert Projektil im einfachen Array
        if (currentTime - this.lastShotTime < this.cooldown) return;
        let isEnemyShooter = this.shooter instanceof Enemy;
        let targetEntity = isEnemyShooter ? player : null;
        if (this.shooter instanceof Enemy && !(this.shooter.shouldShoot(player))) return;
        // Nur für Player: Wenn kein spezielles Ziel und keine Gegner -> abbrechen
        if (!targetEntity && enemies.length === 0) return;
        this.lastShotTime = currentTime;
        for (let j = 0; j < this.amount; j++) {
            let dir;
            if (targetEntity) {
                const dx = targetEntity.globalEntityX - this.shooter.globalEntityX;
                const dy = targetEntity.globalEntityY - this.shooter.globalEntityY;
                const angle = Math.atan2(dy, dx);
                dir = { x: Math.cos(angle), y: Math.sin(angle) };
            } else if (this.focus === 1) {
                let closestEnemy = {enemy: null, distance: 99999};
                for (let i = enemies.length - 1; i >= 0; i--) {
                    for (let n = enemies[i].length -1 ; n>= 0; n--){
                        for (let enemy of enemies[i][n].within){
                            let distanceX = this.shooter.globalEntityX - enemy.globalEntityX;
                            let distanceY = this.shooter.globalEntityY - enemy.globalEntityY;
                            let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                            if (distance < closestEnemy.distance) {
                                closestEnemy = {enemy: enemy, distance: distance};
                            }
                        }
                    }
                }
                if (closestEnemy.enemy) {
                    let distanceX = (closestEnemy.enemy.globalEntityX - this.shooter.globalEntityX);
                    let distanceY = (closestEnemy.enemy.globalEntityY - this.shooter.globalEntityY);
                    let angle = Math.atan2(distanceY, distanceX);
                    dir = {x: Math.cos(angle), y: Math.sin(angle)};
                } else {
                    let angle = Math.random() * Math.PI * 2;
                    dir = {x: Math.cos(angle), y: Math.sin(angle)};
                }
            } else {
                const angle = Math.random() * Math.PI * 2;
                dir = { x: Math.cos(angle), y: Math.sin(angle) };
            }
            const p = new Projectile(this.shooter.globalEntityX,
                this.shooter.globalEntityY, 1,
                null,
                (isEnemyShooter ? 3 : 5),
                {width: this.projectileSize, height: this.projectileSize},
                false,
                this.projectileSize,
                dir,
                this.dmg,
                false, // Fireball ist IMMER ein Player-Projektil (nicht isEnemyShooter!)
                {}, // KEIN gridMapTile nötig
                currentTime, this.projectileDuration
            );
            p.isFireball = true;
            p.fireballColor = 'rgba(255, 80, 0, 0.9)';
            this.projectiles.push(p);
        }
    }

    render(ctx, PlayerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops) {
        if (Game.testShoot === true) {
            this.shoot(PlayerOne, performanceNow, enemies, map.tilelength, gridWidth);
        }
        for (let j = this.projectiles.length - 1; j >= 0; j--) {
            let projectile = this.projectiles[j];

            if (!projectile.exploded) {
                // Normale Projektil-Bewegung, Zeichnen und Hit Detection via Projectile
                projectile.render(ctx, this.projectiles, j, enemies, PlayerOne, map, gridWidth, enemyItemDrops, performanceNow);
            } else {
                // Explosion Animation (jetzt in Projectile.render())
                const explosionElapsed = performanceNow - projectile.explodedTime;
                if (explosionElapsed < 300) {
                    projectile.render(ctx, this.projectiles, j, enemies, PlayerOne, map, gridWidth, enemyItemDrops, performanceNow);
                } else {
                    // Schaden austeilen, wenn noch nicht geschehen
                    if (!projectile.explosionDamageDealt) {
                        projectile.explosionDamageDealt = true;
                        this.damageEnemiesInRadius(enemies, projectile.globalEntityX, projectile.globalEntityY, enemyItemDrops);
                    }
                    this.projectiles.splice(j, 1);
                }
            }
        }
    }

    damageEnemiesInRadius(enemies, centerX, centerY, enemyItemDrops) {
        for (let row = 0; row < enemies.length; row++) {
            for (let column = 0; column < enemies[row].length; column++) {
                for (let i = 0; i < enemies[row][column].within.length; i++) {
                    const enemy = enemies[row][column].within[i];
                    const distX = enemy.globalEntityX - centerX;
                    const distY = enemy.globalEntityY - centerY;
                    const distance = Math.sqrt(distX * distX + distY * distY);
                    if (distance <= this.explosionRadius) {
                        enemy.takeDmg(this.dmg, enemies, i, enemyItemDrops);
                    }
                }
            }
        }
    }
}

export class Knife extends Weapon {
    // KNIFE-WAFFE: Schnelle Projektile in Bewegungsrichtung
    // Schießt in die aktuelle Bewegungsrichtung, falls keine Bewegung: letzte Richtung
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "Knife", null, 12, 300, 0, 0, 800, 1, 1, shooter, mapWidth, mapHeight, gridWidth);
        this.projectileSize = 6;
        this.projectileDuration = -1;
        this.lastDirection = { x: 1, y: 0 }; // Standard: nach rechts
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth, inputState) {
        // Check cooldown
        if (currentTime - this.lastShotTime < this.cooldown) {
            return;
        }

        let isEnemyShooter = this.shooter instanceof Enemy;
        let targetEntity = isEnemyShooter ? player : null;
        if (this.shooter instanceof Enemy && !(this.shooter.shouldShoot(player))) {
            return;
        }

        this.lastShotTime = currentTime;

        // Bestimme Richtung basierend auf inputState (nur für Player)
        let dir = { x: 0, y: 0 };

        if (!isEnemyShooter && inputState) {
            // Spieler-Input: Bewegungsrichtung bestimmen
            if (inputState.rightPressed) dir.x += 1;
            if (inputState.leftPressed) dir.x -= 1;
            if (inputState.downPressed) dir.y += 1;
            if (inputState.upPressed) dir.y -= 1;

            // Falls Bewegung, normalisiere Vektor
            if (dir.x !== 0 || dir.y !== 0) {
                const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
                dir.x /= length;
                dir.y /= length;
                this.lastDirection = { x: dir.x, y: dir.y };
            } else {
                // Keine aktuelle Bewegung: Verwende letzte Richtung
                dir = { x: this.lastDirection.x, y: this.lastDirection.y };
            }
        } else if (isEnemyShooter) {
            // Enemy schießt auf Player
            const dx = targetEntity.globalEntityX - this.shooter.globalEntityX;
            const dy = targetEntity.globalEntityY - this.shooter.globalEntityY;
            const angle = Math.atan2(dy, dx);
            dir = { x: Math.cos(angle), y: Math.sin(angle) };
        } else {
            // Fallback: letzte Richtung verwenden
            dir = { x: this.lastDirection.x, y: this.lastDirection.y };
        }

        // Erstelle Projektil
        const p = new Projectile(
            this.shooter.globalEntityX,
            this.shooter.globalEntityY,
            1,
            null,
            (isEnemyShooter ? 3 : 7),
            { width: this.projectileSize, height: this.projectileSize },
            false,
            this.projectileSize,
            dir,
            this.dmg,
            isEnemyShooter,
            {column : Math.floor(this.shooter.globalEntityX / (gridWidth * tilelength)), row : Math.floor(this.shooter.globalEntityY / (gridWidth * tilelength))},
            currentTime,
            this.projectileDuration
        );

        // Speichere im Grid (normal player projectiles)
        if (!isEnemyShooter) {
            if (this.projectiles[p.gridMapTile.row] && this.projectiles[p.gridMapTile.row][p.gridMapTile.column]) {
                this.projectiles[p.gridMapTile.row][p.gridMapTile.column].within.push(p);
            }
        } else {
            // Enemy: einfaches Array
            this.projectiles.push(p);
        }
    }
}

export class AxeWeapon extends Weapon {
    // AXE-WAFFE: Bumerang-Effekt mit Piercing und doppeltem Schaden
    // Fliegt zum Ziel und kehrt zum Spieler zurück
    // Macht Schaden auf Hinweg und Rückweg
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "Axe", null, 40, 1200, 1, 0, 1000, 1, 1, shooter, mapWidth, mapHeight, gridWidth);
        this.projectileSize = 16;
        this.projectileDuration = -1;
        this.boomerangRange = 300; // Maximale Distanz vor Rückweg
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth) {
        // Check cooldown
        if (currentTime - this.lastShotTime < this.cooldown) {
            return;
        }

        this.lastShotTime = currentTime;

        // Bestimme Zielrichtung (auf nächsten Gegner oder zufällig)
        let closestEnemy = { enemy: null, distance: 99999 };
        for (let i = enemies.length - 1; i >= 0; i--) {
            for (let n = enemies[i].length - 1; n >= 0; n--) {
                for (let enemy of enemies[i][n].within) {
                    let distanceX = this.shooter.globalEntityX - enemy.globalEntityX;
                    let distanceY = this.shooter.globalEntityY - enemy.globalEntityY;
                    let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                    if (distance < closestEnemy.distance) {
                        closestEnemy = { enemy: enemy, distance: distance };
                    }
                }
            }
        }

        let dir = { x: 1, y: 0 };
        if (closestEnemy.enemy) {
            let distanceX = closestEnemy.enemy.globalEntityX - this.shooter.globalEntityX;
            let distanceY = closestEnemy.enemy.globalEntityY - this.shooter.globalEntityY;
            let angle = Math.atan2(distanceY, distanceX);
            dir = { x: Math.cos(angle), y: Math.sin(angle) };
        }

        // Erstelle Bumerang-Projektil
        const p = new Projectile(
            this.shooter.globalEntityX,
            this.shooter.globalEntityY,
            1,
            null,
            6,
            { width: this.projectileSize, height: this.projectileSize },
            true, // Piercing
            this.projectileSize,
            dir,
            this.dmg,
            false,
            { column: Math.floor(this.shooter.globalEntityX / (gridWidth * tilelength)), row: Math.floor(this.shooter.globalEntityY / (gridWidth * tilelength)) },
            currentTime,
            -1, // Unbegrenztes Leben (bis zurückgekehrt)
            false,
            null,
            { shooter: this.shooter, maxRange: this.boomerangRange, startX: this.shooter.globalEntityX, startY: this.shooter.globalEntityY, returning: false, hitEnemies: new Set() }
        );

        // Speichere im Grid
        if (this.projectiles[p.gridMapTile.row] && this.projectiles[p.gridMapTile.row][p.gridMapTile.column]) {
            this.projectiles[p.gridMapTile.row][p.gridMapTile.column].within.push(p);
        }
    }
}

export class MolotovWeapon extends Weapon {
    constructor(shooter, mapWidth, mapHeight, gridWidth) {
        super(null, "Molotov", null, 0, 1000, 0, 0, 1000, 1, 1, shooter, mapWidth, mapHeight, gridWidth);
        this.projectileSize = 8;
        this.projectileDuration = 1000;
        this.projectiles = []; // Einfaches Array
    }

    render(ctx, PlayerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops, inputState) {
        super.render(ctx, PlayerOne, performanceNow, enemies, map, gridWidth, enemyItemDrops, inputState);
    }

    shoot(player, currentTime, enemies, tilelength, gridWidth) {
        if (currentTime - this.lastShotTime < this.cooldown) {
            return;
        }

        this.lastShotTime = currentTime;

        // Zufällige Richtung
        const randomAngle = Math.random() * Math.PI * 2;
        const dir = { x: Math.cos(randomAngle), y: Math.sin(randomAngle) };

        // Erstelle Molotov-Projektil
        const p = new MolotovProjectile(this.shooter, dir, currentTime);

        this.projectiles.push(p);
    }
}


