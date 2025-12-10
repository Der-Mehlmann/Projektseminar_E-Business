import {MovingEntity} from "./movingEntity.js"
import {game} from "./game.js"

export class Player extends MovingEntity {
    ctx

    constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, ausrüstung = [], weapons = [], regeneration = 0, ctx, onDeath) {
        super(globalEntityX, globalEntityY, hp, png, speed, hitbox)
        this.globalEntityX = globalEntityX
        this.globalEntityY = globalEntityY

        this.xp = 0;
        this.level = 1;
        this.ausrüstung = ausrüstung;
        this.weapons = weapons;
        this.regeneration = regeneration;
        this.ctx = ctx;
        this.hp = hp;
        this.maxHp = hp;
        this.png = png;
        this.hitbox = hitbox;
        this.onDeath = onDeath;
    }


    handleInput(map, inputState) {
        let speed = this.speed
        if ((inputState.rightPressed || inputState.leftPressed)         //Diagonalbewegung smoother
            && (inputState.upPressed || inputState.downPressed))
            speed /= 1.8
        if (inputState.rightPressed)
            this.globalEntityX = map.rightFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
        if (inputState.upPressed)
            this.globalEntityY = map.topFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
        if (inputState.leftPressed)
            this.globalEntityX = map.leftFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
        if (inputState.downPressed)
            this.globalEntityY = map.downFree(this.globalEntityX, this.globalEntityY, speed, this.hitbox);
    }


    lvlUp() {
        this.level++;
        this.hp = this.maxHp; // volle Heilung bei Level-Up
        this.speed += 0.2; // das sind nur beispiele, können wir dann ändern
        this.regeneration += 0.1;
        console.log(`Level Up! Neues Level: ${this.level}`);
        alert("Level Up! Neues Level: " + this.level);
        alert("xp bis zum nächsten Level: " + (this.level * 10 - this.xp));
    }

    die() {
        console.log("Player ist gestorben!"); //zum testen, da noch keine end funktion in game
        this.onDeath(); 
    }


    collectPickup(item) { //wird von game aufgerufen wenn collision mit item, übergibt logik an itemklasse
        if (!item) return;
        item.apply(this);
    }

    collectXp(xpAmount) {
        this.xp += xpAmount;
        const xpForNextLevel = this.level * 10; // Beispiel: 10 XP pro Level
        if (this.xp >= xpForNextLevel) {
            this.xp -= xpForNextLevel; // Überschüssige XP behalten
            this.lvlUp();
        }
    }
}