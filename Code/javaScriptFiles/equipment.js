import {Item} from "./item.js";

export class Equipment extends Item {
    constructor(icon, description, level, name, playerStatKey, valuePerLevel) {
        super(icon, description, level, playerStatKey);
        this.name = name;
        this.icon = icon;
        this.level = level;

        // für die Automatisierung der Update/Apply Methoden:
        this.playerStatKey = playerStatKey;   // z.B. "speed" oder "armor"
        this.valuePerLevel = valuePerLevel;   // Bonuswert pro Level
        this.currentAppliedValue = 0;         // Aktuell angewendeter Bonus
    }

    update(player, map, inputState) {
        if (!this.playerStatKey) return; // wrid zb bei dash nicht genutzt

        let targetValue = this.level * this.valuePerLevel;

        // Nur aktualisieren, wenn sich das Level oder der Wert geändert hat (wie vorher auch in den spezifischen Equipment-Klassen)
        if (this.currentAppliedValue !== targetValue) {
            this.apply(player, targetValue);
        }
    }

    apply(player, targetValue) { //wie vorher, nur jetzt allgemein
        if (this.playerStatKey && player[this.playerStatKey] !== undefined) {
            // Alten Bonus entfernen
            player[this.playerStatKey] -= this.currentAppliedValue;

            // Neuen Bonus hinzufügen
            player[this.playerStatKey] += targetValue;

            // Wert speichern
            this.currentAppliedValue = targetValue;

            console.log(`[${this.name}] ${this.playerStatKey} aktualisiert: ${player[this.playerStatKey]}`);
        }
    }
}