import {Equipment} from "../equipment.js";

export class EquipmentRadius extends Equipment {
    constructor(icon, description, level, name, playerStatKey, valuePerLevel) {
        // Erhöht pickupRadius um z.B. 30 Pixel pro Level
        super(icon, description, level, name, playerStatKey, valuePerLevel);
    }
}