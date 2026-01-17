import {MovingEntity} from "./movingEntity.js"
import {Weapon} from "./weapon.js";

export class Player extends MovingEntity {
    ctx
    xpForNextLevel;

    constructor(globalEntityX, globalEntityY, hp, maxHp, xp, png, speed, hitbox, ausrüstung = [], weapons = [], regeneration = 0, ctx, onDeath, canvasWidthMiddle, canvasHeightMiddle, mapWidth, mapHeight, gridWidth) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox)
        this.globalEntityX = globalEntityX
        this.globalEntityY = globalEntityY
        this.hp = hp;
        this.maxHp = maxHp;
        this.xp = xp;
        this.level = 1;
        this.png = png;
        this.baseSpeed = speed;
        this.hitbox = hitbox;
        this.ausrüstung = ausrüstung;
        this.weapons = weapons;
        this.regeneration = regeneration;
        this.ctx = ctx;
        this.onDeath = onDeath;

        this.canvasWidthMiddle = canvasWidthMiddle
        this.canvasWidthHeight = canvasHeightMiddle

        this.xpForNextLevel = this.level * 10;
        this.weapon = Weapon.create("basic", this, mapWidth, mapHeight, gridWidth)
        this.enemyItemDrops = []

        // All weapons mode
        this.allWeaponsActive = false;
        this.allWeapons = [];

        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.gridWidth = gridWidth;
    }

    handleInput(map, inputState) {
        let speed = this.speed
        if ((inputState.rightPressed || inputState.leftPressed)         //Diagonalbewegung smoother
            && (inputState.upPressed || inputState.downPressed)) {
            speed /= 1.8
        }
        if (inputState.rightPressed) {
            this.globalEntityX = map.rightFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
        }
        if (inputState.upPressed) {
            this.globalEntityY = map.topFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
        }
        if (inputState.leftPressed) {
            this.globalEntityX = map.leftFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
        }
        if (inputState.downPressed) {
            this.globalEntityY = map.downFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
        }
    }

    switchWeapon(weaponNumber) {
        // Alte Projektile clearen
        if (this.weapon && this.weapon.projectiles) {
            if (Array.isArray(this.weapon.projectiles) && this.weapon.projectiles.length > 0 && typeof this.weapon.projectiles[0] === 'object' && !Array.isArray(this.weapon.projectiles[0])) {
                // Orbiting weapon (simple array)
                this.weapon.projectiles = [];
            } else {
                // Grid-based weapon (3D array)
                for (let row = 0; row < this.weapon.projectiles.length; row++) {
                    for (let column = 0; column < this.weapon.projectiles[row].length; column++) {
                        this.weapon.projectiles[row][column].within = [];
                    }
                }
            }
        }

        switch (weaponNumber) {
            case 0:
                this.weapon = Weapon.create("sword", this, this.mapWidth, this.mapHeight, this.gridWidth);
                break;
            case 1:
                this.weapon = Weapon.create("bow", this, this.mapWidth, this.mapHeight, this.gridWidth);
                break;
            case 2:
                this.weapon = Weapon.create("thunderstrike", this, this.mapWidth, this.mapHeight, this.gridWidth);
                break;
            case 3:
                this.weapon = Weapon.create("spear", this, this.mapWidth, this.mapHeight, this.gridWidth);
                break;
            case 4:
                this.weapon = Weapon.create("molotov", this, this.mapWidth, this.mapHeight, this.gridWidth);
                break;
            case 5:
                this.weapon = Weapon.create("shuriken", this, this.mapWidth, this.mapHeight, this.gridWidth);
                break;
            case 6:
                this.weapon = Weapon.create("aura", this, this.mapWidth, this.mapHeight, this.gridWidth);
                break;
            case 7:
                this.weapon = Weapon.create("fireball", this, this.mapWidth, this.mapHeight, this.gridWidth);
                break;
            case 8:
                this.weapon = Weapon.create("knife", this, this.mapWidth, this.mapHeight, this.gridWidth);
                break;
            case 9:
                this.weapon = Weapon.create("axe", this, this.mapWidth, this.mapHeight, this.gridWidth);
                break;
        }
    }
    shootAllWeapons(enemies, map) {
        // Toggle all weapons mode on/off
        this.allWeaponsActive = !this.allWeaponsActive;

        if (this.allWeaponsActive) {
            // Create all weapon instances
            const weaponTypes = ["sword", "bow", "thunderstrike", "spear", "shuriken", "aura", "fireball", "knife", "axe", "molotov"];
            this.allWeapons = [];

            for (const weaponType of weaponTypes) {
                const weapon = Weapon.create(weaponType, this, this.mapWidth, this.mapHeight, this.gridWidth);
                this.allWeapons.push(weapon);
            }
        } else {
            // Clear all weapons
            this.allWeapons = [];
        }
    }

    lvlUp() {
        Game.lvlUPshow()
        this.level++;
        this.xpForNextLevel = this.level * 10; //warum hier? muss das nicht in lvlup funktion (achtet bitte auf eure leerzeichen)
        document.getElementById("hudXpProgress").style.max = this.xpForNextLevel;
    }

    die() {
        //console.log("Player ist gestorben!"); //zum testen, da noch keine end funktion in game
        this.onDeath();
    }

    collectXp(xpAmount) {
        this.xp += xpAmount;

        if (this.xp >= this.xpForNextLevel) {
            this.xp -= this.xpForNextLevel; // Überschüssige XP behalten
            this.lvlUp();
        }
        Game.hudXpProgress.value = this.xp;
    }



    render(map, inputState, performanceNow, enemies, gridWidth) {
        this.handleInput(map, inputState)
        this.draw(this.ctx, this)

        // Render current weapon
        this.weapon.render(this.ctx, this, performanceNow, enemies, map, gridWidth, this.enemyItemDrops, inputState)

        // Render all active weapons if in all weapons mode
        if (this.allWeaponsActive) {
            for (let weapon of this.allWeapons) {
                weapon.render(this.ctx, this, performanceNow, enemies, map, gridWidth, this.enemyItemDrops, inputState);
            }
        }

        for (let i = this.enemyItemDrops.length - 1; i >= 0; i--){
            let item = this.enemyItemDrops[i]
            item.render(this.ctx, this, this.enemyItemDrops, i)
        }
    }
       getColor() {
        return 'blue'
       }
}
