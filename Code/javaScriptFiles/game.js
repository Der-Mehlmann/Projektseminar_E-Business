//import { DropSingleUse } from "./dropSingleUse.js"
//import { Entity } from "./entity.js"
//import { Equipment } from "./equipment.js"
//import { Item } from "./item.js"
import {Map} from "./map.js"
//import { Obstacles } from "./obstacles.js"
import {Player} from "./player.js"
import { Enemy } from "./enemy.js"
import  {drawEnemyItem, drawEnemyXp} from "./enemy.js"
import { Projectile } from "./projectile.js"
//import { Weapon } from "./weapon.js";

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

export class game {

    difficulty = 1
    timestamp
    upPressed = false
    downPressed = false
    leftPressed = false
    rightPressed = false
    mapData

    gameTimer = 0
    timerInterval = null

    gamePaused = false // Flag, ob das Spiel pausiert ist

    constructor() {
        this.MapOne = null
        this.PlayerOne = null
        this.enemies = [] // Array für alle aktiven Gegner
        this.projectiles = [] // Array für alle aktiven Projektile
    }

    loadMap(file) {
        return fetch(file)
            .then(response => response.json())
            .then(jsondata => {
                this.mapData.push(jsondata); // JSON als ein Element im Array speichern
            })
    }

    keyDownHandler(e) { // liest Input der Tastatur aus
        if ((e.key === "ArrowUp") || (e.key === 'w')) {
            this.upPressed = true;
        }
        if ((e.key === "ArrowLeft") || (e.key === 'a')) {
            this.leftPressed = true;
        }
        if ((e.key === "ArrowRight") || (e.key === 'd')) {
            this.rightPressed = true;
        }
        if ((e.key === "ArrowDown") || (e.key === 's')) {
            this.downPressed = true;
        }
        // Escape zum Pausieren
        if (e.key === "Escape") {
            if (document.getElementById("gameScreen").style.display === "flex") {
                this.pauseGame() // Spiel nur pausieren, wenn Game läuft
            }

            return;
        }
    }

    keyUpHandler(e) { // liest Output der Tastatur aus
        if ((e.key === "ArrowUp") || (e.key === 'w')) {
            this.upPressed = false;
        }
        if ((e.key === "ArrowLeft") || (e.key === 'a')) {
            this.leftPressed = false;
        }
        if ((e.key === "ArrowRight") || (e.key === 'd')) {
            this.rightPressed = false;
        }
        if ((e.key === "ArrowDown") || (e.key === 's')) {
            this.downPressed = false;
        }
    }

    updateTimerDisplay() { // Aktualisiert die Anzeige des Timers im Format mm:ss
        const minutes = Math.floor(this.gameTimer / 60)
        const seconds = this.gameTimer % 60
        // Format mm:ss
        document.getElementById("time-value").textContent =
            `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    startGameTimer() { // Startet den Spieltimer
        this.stopGameTimer()
        this.updateTimerDisplay()
        this.timerInterval = setInterval(() => {
            this.gameTimer++
            this.updateTimerDisplay()
        }, 1000)
    }

    resetTimer() { // Setzt den Spieltimer zurück
        this.gameTimer = 0
        this.updateTimerDisplay()
    }

    stopGameTimer() { // Stoppt den Spieltimer
        if (this.timerInterval) {
            clearInterval(this.timerInterval)
            this.timerInterval = null
        }
    }
    spawnRandomProjectile() {
    let angle = Math.random() * Math.PI * 2;
    let dir = { x: Math.cos(angle), y: Math.sin(angle) };

    let p = new Projectile(
        this.PlayerOne.globalEntityX,
        this.PlayerOne.globalEntityY,
        1,
        null,
        5,
        { width: 8, height: 8 },
        false,
        8,
        dir,
        5
    );

    this.projectiles.push(p);
}

    start() {
        const timestamp = Date.now();
        document.addEventListener("keydown", this.keyDownHandler.bind(this));
        document.addEventListener("keyup", this.keyUpHandler.bind(this));

        this.mapData = []
        this.loadMap("./Code/Tiled/Map1.json").then(() => {
            this.mapData = this.mapData[0];
            //console.log(this.mapData.layers[0].data)
            //this.mapDataTiles = this.mapData.layers[0].data

            this.MapOne = new Map(this.mapData, canvas.width, ctx)
            this.PlayerOne = new Player(this.mapData.width * this.mapData.tilewidth / 2, this.mapData.height * this.mapData.tilewidth / 2, 100, null, 1.5, { width: 32, height: 32 }, 0, 0, 1, ctx)
            setInterval(() => this.render(), 5);
        });

        //setInterval(spawnEnemy, 100
        setInterval(() => Enemy.spawnEnemyAtEdge(this.enemies, this.mapData.width * this.mapData.tilewidth, this.mapData.height * this.mapData.tilewidth), 2000); // CHANGE: Gegner werden alle 2 Sekunden gespawnt
        // Alle 0.5 Sekunden zufälliges Projektil erzeugen
        setInterval(() => {
            this.spawnRandomProjectile()
            }, 500);
        this.resetTimer()
        this.startGameTimer()

        // Screen-Wechsel zu Game-Screen
        document.getElementById("defeatScreen").style.display = "none";
        document.getElementById("winScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("gameScreen").style.display = "flex";
    }

// Beginn der Screen-Wechsel-Funktionen
    pauseGame() {
        this.gamePaused = true; //flag boolean for render function

        this.stopGameTimer()

        document.getElementById("pauseScreen").style.display = "flex";
    }

    resumeGame() {
        this.gamePaused = false; //flag boolean for render function

        this.startGameTimer()

        document.getElementById("pauseScreen").style.display = "none";
    }

    settings() {
        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "flex";
    }

    home() {
        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("defeatScreen").style.display = "none";
        document.getElementById("winScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "flex";
    }

    end() {
        this.stopGameTimer()
        this.resetTimer()

        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("defeatScreen").style.display = "flex";
    }

    endWin() {
        this.stopGameTimer()
        this.resetTimer()

        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("winScreen").style.display = "flex";
    }
// Ende der Screen-Wechsel-Funktionen

    render() {
        if (this.gamePaused) {
            return; // Spiel ist pausiert, keine Aktualisierung, prüft auf true
        }

        if (this.gameTimer === 600) { //Minuten überleben (in Sekunden)
            this.endWin()
        }

        this.PlayerOne.handleInput(this.MapOne, {
            upPressed: this.upPressed,
            downPressed: this.downPressed,
            leftPressed: this.leftPressed,
            rightPressed: this.rightPressed
        })

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.MapOne.draw(this.PlayerOne)
        this.PlayerOne.draw(ctx, canvas.width / 2, canvas.height / 2, this.PlayerOne.hitbox.width, this.PlayerOne.hitbox.height, 'blue')

        // Gegner bewegen, zeichnen und bei Collision entfernen
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i]

            enemy.chasePlayer(this.MapOne, this.PlayerOne, this.enemies)                   // Gegner läuft auf den Spieler zu
            this.MapOne.drawMiniEnemy(enemy)
            if (this.PlayerOne.checkCollision(enemy,0,0)) {        // Treffer?
                enemy.die()
                this.enemies.splice(i, 1)                       // aus dem Array entfernen → "Monster verschwinden"
            } else {
                let leftBorder = this.PlayerOne.globalEntityX - this.MapOne.FOV / 2
                let topBorder = this.PlayerOne.globalEntityY - this.MapOne.FOV / 2
                enemy.draw(ctx, enemy.globalEntityX - leftBorder, enemy.globalEntityY - topBorder, enemy.hitbox.width, enemy.hitbox.height, enemy.ranged ? 'yellow' : 'red') // Gegner im Sichtbereich zeichnen
            }
        }
// Projektile bewegen & zeichnen
for (let projectileIndex = this.projectiles.length - 1; projectileIndex >= 0; projectileIndex--) {
    let projectile = this.projectiles[projectileIndex];

    // Projektil bewegen
    projectile.move();

    // Projektil relativ zur Kamera / Spieler zeichnen
    let leftBorder = this.PlayerOne.globalEntityX - this.MapOne.FOV / 2;
    let topBorder = this.PlayerOne.globalEntityY - this.MapOne.FOV / 2;

    projectile.draw(
        ctx,
        projectile.globalEntityX - leftBorder,
        projectile.globalEntityY - topBorder,
        projectile.hitbox.width,
        projectile.hitbox.height,
        "lightblue"
    );

    // Entfernen, wenn Projektil außerhalb der Karte
    if (
        projectile.globalEntityX < 0 || projectile.globalEntityX > this.MapOne.mapWidth ||
        projectile.globalEntityY < 0 || projectile.globalEntityY > this.MapOne.mapHeight
    ) {
        this.projectiles.splice(projectileIndex, 1);
    }
}
// Kollision prüfen: Projektil trifft Gegner

for (let projectileIndex = this.projectiles.length - 1; projectileIndex >= 0; projectileIndex--) {
    let projectile = this.projectiles[projectileIndex];

    for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
        let enemy = this.enemies[enemyIndex];

        // Prüfen, ob Projektil den Gegner trifft
        if (projectile.checkCollision(enemy, 0, 0)) {
            // Treffer → beides entfernen
            this.enemies.splice(enemyIndex, 1);       // Gegner entfernen
            this.projectiles.splice(projectileIndex, 1); // Projektil entfernen

            enemy.die(); // optional: Drop + XP

            break; // Projektil existiert nicht mehr → Schleife verlassen
        }
    }
}


        drawEnemyItem(ctx, this.PlayerOne, this.MapOne)
        drawEnemyXp(ctx, this.PlayerOne, this.MapOne)
    }
}

document.getElementById("startScreen").style.display = "flex"; // Startbildschirm anzeigen
window.Game = new game() // Ein globales Spielobjekt erstellen (für html)