import {Equipment} from "../equipment.js";

export class EquipmentInvincibility extends Equipment {
    constructor(icon, description, level, name, playerStatKey, valuePerLevel) {
        super(icon, description, level, name, playerStatKey, valuePerLevel);
        this.level = 1;
        this.baseDuration = 4000; // 4 Sekunden Basiszeit (in Millisekunden)
        this.durationPerLevel = 2000; // +2 Sekunden pro Level
        this.activeTimeout = null;
        this.activationInterval = 60000; // 60 Sekunden
        this.lastActivatedTime = 0;      // Merkt sich den letzten Start
    }

    update(player, map, inputState) {
        const currentTime = Date.now();

        let targetLevel = this.level;
        if (this.currentAppliedLevel !== targetLevel) {
            this.currentAppliedLevel = targetLevel;
            this.apply(player, targetLevel);
            return; // Verhindert Doppel-Trigger im selben Frame
        }

        // prüfen, ob die Zeit seit der letzten Aktivierung größer als 60s ist
        if (currentTime - this.lastActivatedTime >= this.activationInterval) {
            this.apply(player, this.level);
        }
    }

    apply(player, newLevel) {
        // Falls ein alter Timer läuft, stoppen (verhindert Bugs bei schnellen Level-Ups)
        if (this.activeTimeout) {
            clearTimeout(this.activeTimeout);
        }

        // Zeitstempel für den nächsten Intervall-Check setzen
        this.lastActivatedTime = Date.now();

        // Effekt aktivieren
        player.isInvincible = true;
        const currentDuration = this.baseDuration + (newLevel - 1) * this.durationPerLevel;

        console.log(`[Holy Aura] Aktiviert für ${currentDuration / 1000}s. Nächster Check in 60s.`);

        // Effekt nach Ablauf der Dauer wieder ausschalten
        this.activeTimeout = setTimeout(() => {
            player.isInvincible = false;
            this.activeTimeout = null;
            console.log(`[Holy Aura] Abgelaufen.`);
        }, currentDuration);
    }
}