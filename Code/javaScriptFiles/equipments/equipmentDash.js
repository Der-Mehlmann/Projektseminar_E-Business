import {Equipment} from "../equipment.js";

export class EquipmentDash extends Equipment {

    static dashTrails = [];

    constructor(icon, description, level, name, playerStatKey, valuePerLevel) {
        super(icon, description, level, name, playerStatKey, valuePerLevel);
        this.cooldown = 0;
        this.dashDuration = 10; // Wie viele Frames der Dash dauert
        this.isDashing = false;
        this.baseCooldown = 1700; // Basis-Cooldown in Frames, sind ca 10 sek.
        this.cooldownReductionPerLevel = 170; // Reduziert den Cooldown um ca 1 Sekunde pro Level
    }

    update(player, map, inputState) {
        // Cooldown verringern
        if (this.cooldown > 0) this.cooldown--;

        // Dash auslösen (nur wenn Leertaste gedrückt, kein Cooldown und nicht bereits im Dash
        if (inputState.spacePressed && this.cooldown <= 0) {
            let calculatedCooldown = this.baseCooldown - (this.level - 1) * this.cooldownReductionPerLevel;
            this.cooldown = Math.max(60, calculatedCooldown);
            this.isDashing = true;

            // Startposition merken
            const startX = player.globalEntityX;
            const startY = player.globalEntityY;

            this.performDash(player, map, inputState);

            // Endposition nach dem Dash
            const endX = player.globalEntityX;
            const endY = player.globalEntityY;

            // Trail-Daten in die STATISCHE Liste pushen
            if (startX !== endX || startY !== endY) {
                EquipmentDash.dashTrails.push({
                    startX, startY, endX, endY, alpha: 0.6
                });
            }
        }

        if (this.isDashing) {
            this.performDash(player, map, inputState);
        }
    }

    performDash(player, map, inputState) {
        let dashDistance = 160; // Geschwindigkeit während des Dashes

        // Dash in die Richtung, die gedrückt wird
        if (inputState.rightPressed) {
            player.globalEntityX = map.rightFree(player.globalEntityX, player.globalEntityY, dashDistance, player.hitbox);
        }
        if (inputState.upPressed) {
            player.globalEntityY = map.topFree(player.globalEntityX, player.globalEntityY, dashDistance, player.hitbox);
        }
        if (inputState.leftPressed) {
            player.globalEntityX = map.leftFree(player.globalEntityX, player.globalEntityY, dashDistance, player.hitbox);
        }
        if (inputState.downPressed) {
            player.globalEntityY = map.downFree(player.globalEntityX, player.globalEntityY, dashDistance, player.hitbox);
        }

        // Nach einer kurzen Zeit den Dash-Status beenden
        // (Einfachheitshalber hier sofort nach der Bewegung,
        // für längere Dashes müsste man einen Counter einbauen)
        this.isDashing = false;
    }
}