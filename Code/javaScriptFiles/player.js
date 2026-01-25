import {MovingEntity} from "./movingEntity.js"
import {Weapon} from "./weapons/Weapon.js";
import {EquipmentDash} from "./equipments/equipmentDash.js";
import {LvlUpFactory} from "./lvlUpFactory.js"
import {Equipment} from "./equipment.js";
import {WeaponConfig} from "./weapons/weaponConfig.js";
export class Player extends MovingEntity {
    ctx
    xpForNextLevel;

    constructor(globalEntityX, globalEntityY, hp, maxHp, xp, png, speed, hitbox, equipmentSlots = [null, null, null, null], weapons = [], regeneration = 0, ctx, onDeath, canvasWidthMiddle, canvasHeightMiddle, mapWidth, mapHeight, gridWidth) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox)
        this.globalEntityX = globalEntityX
        this.globalEntityY = globalEntityY
        this.hp = hp;
        this.maxHp = maxHp;
        this.xp = xp;
        this.level = 1;
        this.baseSpeed = speed;
        this.damageMultiplier = 1.0; // für equipment valor. Standardmäßig 100% Schaden
        this.cooldownMultiplier = 1.0; // für equipment rapid fire. Standardmäßig 100% Feuerrate
        this.isInvincible = false; // für equipment holy aura
        this.armor = 0; // für equipment armor
        this.extraProjectiles = 0; // für equipment barrage
        this.pickupRadius = 50; // für equipment radius: Basis-Sammelradius in Pixeln
        this.hitbox = hitbox;
        this.equipmentSlots = [null, null, null, null]; // 4 leere Slots für Equipment
        this.weaponSlots = [null, null, null, null]; // 4 leere Slots für Equipment
        this.regeneration = regeneration;
        this.ctx = ctx;
        this.onDeath = onDeath;

        // Equipment-Multiplier (für Equipment-System)
        this.damageMultiplier = 1.0;      // Equipment Valor
        this.cooldownMultiplier = 1.0;    // Equipment Rapid Fire
        this.isInvincible = false;        // Equipment Holy Aura
        this.armor = 0;                   // Equipment Armor
        this.extraProjectiles = 0;        // Equipment Barrage
        this.equipmentSlots = [null, null, null]; // Drei Equipment-Slots

        this.canvasWidthMiddle = canvasWidthMiddle
        this.canvasWidthHeight = canvasHeightMiddle

        this.xpForNextLevel = this.level * 10;

        // Initialisiere Waffen-Slots mit Bogen (da Level 1)
        this.weaponSlots[0] = WeaponConfig.createWeapon("Bow", this, mapWidth, mapHeight, gridWidth, 1);

        this.enemyItemDrops = []

        // All weapons mode
        this.allWeaponsActive = false;
        this.allWeapons = [];

        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.gridWidth = gridWidth;

        const img = new Image()
        img.onload = () => {
            this.hitbox = {
                width: (img.naturalWidth / 8), height: (img.naturalHeight / 8),
            }
        }
        img.src = png
        // Blickrichtung (wird durch Bewegung aktualisiert)
        this.facingDirection = { x: 1, y: 0 }; // Standard: rechts

        this.LvlUpFactory = new LvlUpFactory(this);
    }

    draw(ctx, player) {
        ctx.save();

    // ✅ AttackBoost: rotes Leuchten (solange aktiv)
    const attackBoostIsActive = (this.attackBoostActiveUntil || 0) > performance.now()
    if (attackBoostIsActive) {
    ctx.shadowBlur = 25
    ctx.shadowColor = "red"
    ctx.globalAlpha = 1.0
    }

        // Wenn die Aura aktiv ist, wird Zeichnen angepasst
        if (this.isInvincible) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "cyan"; // Ein heiliges, blaues Leuchten
            ctx.globalAlpha = 0.7 + Math.sin(performance.now() / 150) * 0.3; // Blink-Effekt
        }

        // draw-Methode der Basisklasse (Entity)
        super.draw(ctx, player);

        ctx.restore();
    }

    handleInput(map, inputState) {
        let speed = this.speed
        if ((inputState.rightPressed || inputState.leftPressed)         //Diagonalbewegung smoother
            && (inputState.upPressed || inputState.downPressed)) {
            speed /= 1.8
        }

        // Blickrichtung aktualisieren basierend auf Bewegung
        let dirX = 0, dirY = 0;
        if (inputState.rightPressed) {
            this.globalEntityX = map.rightFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
            dirX = 1;
        }
        if (inputState.upPressed) {
            this.globalEntityY = map.topFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
            dirY = -1;
        }
        if (inputState.leftPressed) {
            this.globalEntityX = map.leftFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
            dirX = -1;
        }
        if (inputState.downPressed) {
            this.globalEntityY = map.downFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
            dirY = 1;
        }

        // Nur aktualisieren wenn tatsächlich Bewegung stattfindet
        if (dirX !== 0 || dirY !== 0) {
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            this.facingDirection = { x: dirX / length, y: dirY / length };
        }
    }

    lvlUp() {
        this.LvlUpFactory.lvlUpRoll(this.equipmentSlots, this.weaponSlots)
        Game.lvlUPshow()
        this.level++;
        this.xpForNextLevel = this.level * 10; //warum hier? muss das nicht in lvlup funktion (achtet bitte auf eure leerzeichen)
        document.getElementById("hudXpProgress").style.max = this.xpForNextLevel;
    }

    die() {
        //console.log("Player ist gestorben!"); //zum testen, da noch keine end funktion in game
        this.onDeath();
    }

    collectPickup(item) { //wird von game aufgerufen wenn collision mit item, übergibt logik an itemklasse
        if (!item) return;
        item.apply(this);
    }

    collectXp(xpAmount) {
        this.xp += xpAmount;

        this.xp = Math.floor(this.xp)

        if (this.xp >= this.xpForNextLevel) {
            this.xp -= this.xpForNextLevel; // Überschüssige XP behalten
            this.lvlUp();
        }
        Game.hudXpProgress.value = this.xp;
    }


    acquireEquipment(newEquipment) {
        if (newEquipment instanceof Equipment) {        // ist ein Equipment
            for (let i = 0; i < this.equipmentSlots.length; i++) {
                if (this.equipmentSlots[i] === null) {

                    this.equipmentSlots[i] = newEquipment;
                    console.log(newEquipment.name + " ausgerüstet in Slot " + i);
                    return true;
                } else if (newEquipment.constructor === this.equipmentSlots[i].constructor) {
                    newEquipment.lvlUp();
                    console.log(newEquipment.name + " auf Level " + this.equipmentSlots[i].level + " erhöht.");
                    return true
                }
            }
            console.log("EquipmentInventar voll!");
            return false;
        } else if (newEquipment instanceof Weapon) {
            // Waffen Logik (via LvlUpFactory Card)

            // 1. Prüfen ob Waffe schon existiert -> Upgrade
            for (let i = 0; i < this.weaponSlots.length; i++) {
                if (this.weaponSlots[i] && this.weaponSlots[i].name === newEquipment.name) {
                    if (this.weaponSlots[i].level < 20) {
                        this.weaponSlots[i].lvlUp();
                        console.log(this.weaponSlots[i].name + " auf Level " + this.weaponSlots[i].level + " erhöht.");
                        return true;
                    } else {
                        console.log("Waffe ist bereits auf Max Level!");
                        return false;
                    }
                }
            }

            // 2. Wenn nicht existiert -> Neuer Slot
            for (let i = 0; i < this.weaponSlots.length; i++) {
                if (this.weaponSlots[i] === null) {
                    this.weaponSlots[i] = newEquipment;
                    console.log(newEquipment.name + " ausgerüstet in Slot " + i);
                    return true;
                }
            }

            console.log("WeaponInventar voll!");
            return false;
        }
    }


    render(map, inputState, performanceNow, enemies, gridWidth) {
        this.drawDashTrails();
        this.handleInput(map, inputState)
        this.draw(this.ctx, this)

        // Equipment-Updates
        this.equipmentSlots.forEach(item => { // Jedes ausgerüstete Equipment updaten
            if (item) {
                item.update(this, map, inputState);
            }
        });

        // Shoot & Render active weapons
        this.weaponSlots.forEach(weapon => {
            if (weapon) {

                weapon.render(this.ctx, this, performanceNow, enemies, map, gridWidth, this.enemyItemDrops, inputState);
            }
        });

        for (let i = this.enemyItemDrops.length - 1; i >= 0; i--) {
            let item = this.enemyItemDrops[i]
            item.render(this.ctx, this, this.enemyItemDrops, i)
        }
    }

    getColor() {
        return 'blue'
    }
    /**
     * Entfernt alle Equipment-Effekte (für Reset)
     */
    resetEquipmentEffects() {
        this.damageMultiplier = 1.0;
        this.cooldownMultiplier = 1.0;
        this.isInvincible = false;
        this.armor = 0;
        this.extraProjectiles = 0;
    }

    drawDashTrails() {
        if (EquipmentDash.dashTrails && EquipmentDash.dashTrails.length > 0) {
            this.ctx.save();

            // Grenzen berechnen für die relative Positionierung (Kamera)
            let leftBorder = this.globalEntityX + (this.hitbox.width / 2) - (this.ctx.canvas.width / 2);
            let topBorder = this.globalEntityY + (this.hitbox.height / 2) - (this.ctx.canvas.height / 2);

            for (let i = EquipmentDash.dashTrails.length - 1; i >= 0; i--) {
                let trail = EquipmentDash.dashTrails[i];

                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(0, 255, 255, ${trail.alpha})`;
                this.ctx.lineWidth = 20;
                this.ctx.lineCap = "round";

                this.ctx.moveTo(trail.startX - leftBorder, trail.startY - topBorder);
                this.ctx.lineTo(trail.endX - leftBorder, trail.endY - topBorder);
                this.ctx.stroke();

                // Alpha-Wert verringern (Ausfaden)
                trail.alpha -= 0.03;
                if (trail.alpha <= 0) {
                    EquipmentDash.dashTrails.splice(i, 1);
                }
            }
            this.ctx.restore();
        }
    }

    getColor() {
        return 'blue'
    }
}
