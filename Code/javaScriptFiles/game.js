import {DropSingleUse} from "./dropSingleUse.js"
import {Entity} from "./entity.js"
//import { Equipment } from "./equipment.js"
//import { Item } from "./item.js"
import {Map} from "./map.js"
//import { Obstacles } from "./obstacles.js"
import {Player} from "./player.js"
import {Enemy} from "./enemy.js"
import {Projectile} from "./projectile.js"
import {Weapon} from "./weapon.js";

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

    killCount = 0
    mapChoice = 0 // 0 = Map1, 1 = Map2 Jungle

    gameTimer = 0
    timerInterval = null

    enemySpawnInterval = null // Intervall für Gegner-Spawns
    renderInterval = null // Intervall für das Rendern

    gamePaused = false // Flag, ob das Spiel pausiert ist

    hudHealthProgress = document.getElementById("hudHealthProgress")
    hudXpProgress = document.getElementById("hudXpProgress")

    constructor() {
        this.MapOne = null
        this.PlayerOne = null
        this.enemies = [] // Array für alle aktiven Gegner
        this.projectiles = [] // Array für alle aktiven Projektile
        this.weapon = Weapon.create("basic")
    }

    loadMap(file) {
        return fetch(file)
            .then(response => response.json())
            .then(jsondata => {
                this.mapData.push(jsondata); // JSON als ein Element im Array speichern
            })
    }

    mapSelect(map) {
        switch (map) {
            case 0:
                this.mapChoice = './Code/Tiled/map2Jungle.json';
                this.start()
                break;
            case 1:
                this.mapChoice = './Code/Tiled/Map1.json';
                this.start()
                break;
            default:
                this.mapChoice = './Code/Tiled/map2Jungle.json';
                this.start()
        }
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

    settingsListener() {
        const form = document.getElementById("settingsForm");

        //check if form exists
        if (!form) return;

        //submit listener
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            //logic
            this.mapChoice = parseInt(document.getElementById("mapChoice").value);

            //go to Home Screen
            this.home();
        })
    }

    updateTimerDisplay() { // Aktualisiert die Anzeige des Timers im Format mm:ss
        const minutes = Math.floor(this.gameTimer / 60)
        const seconds = this.gameTimer % 60
        // Format mm:ss
        document.getElementById("hudTime").textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
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

    start() {
        this.timestamp = Date.now();
        document.addEventListener("keydown", this.keyDownHandler.bind(this));
        document.addEventListener("keyup", this.keyUpHandler.bind(this));
        Entity.FOVwidthMiddle = canvas.width / 2
        Entity.FOVheightMiddle = canvas.height / 2
        //Map Switch
        this.mapData = []
        this.loadMap(this.mapChoice).then(() => {  //andere Map: ./Code/Tiled/Map1.json      ./Code/Tiled/map2Jungle.json
            this.mapData = this.mapData[0];
            this.MapOne = new Map(this.mapData, canvas.width, canvas.height, ctx)
            this.PlayerOne = new Player(this.mapData.width * this.mapData.tilewidth / 2, this.mapData.height * this.mapData.tilewidth / 2, 100, 100, 0, null, 5, {
                width: 16,
                height: 16
            }, 0, 0, 1, ctx, this.end.bind(this), canvas.width / 2, canvas.height / 2) //game abonniert tod des players, indem es this.end übergibt (Observer pattern)
            this.DropSystem = new DropSingleUse(ctx, this.PlayerOne, this.MapOne, null)
            this.ProjectileSystem = new Projectile(0, 0, 0, 0, 0, 0, 0, 0, 0)
            this.hudHealthProgress.max = this.PlayerOne.maxHp
            this.hudHealthProgress.value = this.PlayerOne.hp
            this.hudXpProgress.max = this.PlayerOne.xpForNextLevel
            this.hudXpProgress.value = this.PlayerOne.xp

            this.renderInterval = setInterval(() => this.render(), 5);
            this.enemySpawnInterval = setInterval(() => Enemy.spawnEnemyAtEdge(this.enemies, this.mapData.width * this.mapData.tilewidth, this.mapData.height * this.mapData.tilewidth), 200); // CHANGE: Gegner werden alle 2 Sekunden gespawnt
            this.resetTimer()
            this.startGameTimer()

        });

        // Screen-Wechsel zu Game-Screen
        document.getElementById("defeatScreen").style.display = "none";
        document.getElementById("winScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("mapScreen").style.display = "none";
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

    lvlUPshow() {
        this.gamePaused = true;
        this.stopGameTimer()

        document.getElementById("lvlScreen").style.display = "flex";
    }

    lvlUPhide() {
        this.gamePaused = false;
        this.startGameTimer()

        document.getElementById("lvlScreen").style.display = "none";
    }

    chooseMap() {
        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("mapScreen").style.display = "flex";
    }

    settings() {
        this.settingsListener()

        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "flex";
    }

    home() {
        this.resetGame()

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

        document.getElementById("defeatKills").innerHTML = this.killCount

        this.resetGame()

        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("defeatScreen").style.display = "flex";
    }

    endWin() {
        this.stopGameTimer()
        this.resetTimer()

        document.getElementById("winKills").innerHTML = this.killCount

        this.resetGame()

        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("winScreen").style.display = "flex";
    }

    // Ende der Screen-Wechsel-Funktionen
    restart() {
        this.resetGame()
        this.start()
    }


    resetGame() {
        // Timer stoppen und zurücksetzen
        this.stopGameTimer()
        this.resetTimer()


        // Intervalle für Rendern und Gegner-Spawns stoppen
        if (this.renderInterval) {
            clearInterval(this.renderInterval)
            this.renderInterval = null
        }
        if (this.enemySpawnInterval) {
            clearInterval(this.enemySpawnInterval)
            this.enemySpawnInterval = null
        }

        // Gegner-Array leeren
        this.enemies = []
        this.MapOne = null
        this.PlayerOne = null
        this.mapData = null

        // Projektile-Array leeren
        this.projectiles = []
        // Eingabeflags zurücksetzen
        this.upPressed = false
        this.downPressed = false
        this.leftPressed = false
        this.rightPressed = false

        // Spiel-status zurücksetzen
        this.gamePaused = false

        // Canvas leeren
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        //Andere Variablen
        this.killCount = 0
    }

    render() {
        if (this.gamePaused) {
            return; // Spiel ist pausiert, keine Aktualisierung, prüft auf true
        }

        if (this.gameTimer === 600) { //Minuten überleben (in Sekunden)
            this.endWin()
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.MapOne.render(this.PlayerOne)
        this.PlayerOne.render(this.MapOne, {
            upPressed: this.upPressed,
            downPressed: this.downPressed,
            leftPressed: this.leftPressed,
            rightPressed: this.rightPressed
        })

        this.weapon.render(ctx, this.PlayerOne, this.projectiles, performance.now(), this.enemies, this.MapOne)

        //this.killCount += kills
        // Gegner bewegen, zeichnen und bei Collision entfernen

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i]
            enemy.render(ctx, this.MapOne, this.PlayerOne, this.enemies, i)
        }

        this.DropSystem.render(ctx, this.PlayerOne, this.MapOne)

        this.hudHealthProgress.max = this.PlayerOne.maxHp
        this.hudHealthProgress.value = this.PlayerOne.hp
    }
}

document.getElementById("startScreen").style.display = "flex"; // Startbildschirm anzeigen
window.Game = new game() // Ein globales Spielobjekt erstellen (für html)
