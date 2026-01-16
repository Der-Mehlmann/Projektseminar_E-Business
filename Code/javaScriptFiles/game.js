import {Entity} from "./entity.js"
//import { Equipment } from "./equipment.js"
//import { Item } from "./item.js"
import {Map} from "./map.js"
//import { Obstacles } from "./obstacles.js"
import {Player} from "./player.js"
import {Projectile} from "./projectile.js"
import {EnemyFactory} from "./EnemyFactory.js"

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
    gridWidth = 8
    killCount = 0
    mapChoice = 0 // 0 = Map1, 1 = Map2 Jungle

    gameTimer = 0
    timerInterval = null

    enemySpawnInterval = null // Intervall für Gegner-Spawns
    renderInterval = null // Intervall für das Rendern
    
    gamePaused = false // Flag, ob das Spiel pausiert ist

    hudHealthProgress = document.getElementById("hudHealthProgress")
    hudXpProgress = document.getElementById("hudXpProgress")

    //Tests
    testShoot = true
    testDie = true
    Health = 100
    maxHealth = 100
    XP = 0

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

    mapSelect(map) {
        switch (map) {
            case 0:
                this.mapChoice = './Code/Tiled/map2Jungle.json';
                this.mapChoicePng = './Code/Tiled/map2Jungle.png';
                this.start()
                break;
            case 1:
                this.mapChoice = './Code/Tiled/Map1.json';
                this.mapChoicePng = './Code/Tiled/Map1.png';
                this.start()
                break;
            default:
                this.mapChoice = './Code/Tiled/map2Jungle.json';
                this.mapChoicePng = './Code/Tiled/map2Jungle.png';
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
            if (document.getElementById("gameScreen").style.display === "flex" && this.gamePaused === false) {
                this.pauseGame() // Spiel nur pausieren, wenn Game läuft
            } else if (document.getElementById("pauseScreen").style.display === "flex" && (this.gamePaused === true)) {
                this.resumeGame()
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
        document.getElementById("settingsForm").addEventListener("submit", (e) => {
            e.preventDefault();
            // Save logic here

            this.testShoot = document.getElementById("testShoot").checked
            this.testDie = document.getElementById("testDie").checked
            this.Health = parseInt(document.getElementById("testHealth").value)
            this.maxHealth = parseInt(document.getElementById("testMaxHealth").value)
            this.XP = parseInt(document.getElementById("testXP").value)

            this.home()
        });
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

        this.keyDownBound = this.keyDownHandler.bind(this);
        this.keyUpBound = this.keyUpHandler.bind(this);
        document.addEventListener("keydown", this.keyDownBound);
        document.addEventListener("keyup", this.keyUpBound);

        Entity.FOVwidthMiddle = canvas.width / 2
        Entity.FOVheightMiddle = canvas.height / 2

        //Map Switch
        this.mapData = []
        this.loadMap(this.mapChoice).then(() => {  //andere Map: ./Code/Tiled/Map1.json      ./Code/Tiled/map2Jungle.json
            this.mapData = this.mapData[0];
            this.MapOne = new Map(this.mapData, this.mapChoicePng, canvas.width, canvas.height, ctx)
            this.PlayerOne = new Player(this.mapData.width * this.mapData.tilewidth / 2, this.mapData.height * this.mapData.tilewidth / 2, this.Health, this.maxHealth, this.XP, null, 5, {
                width: 16, height: 16
            }, 0, 0, 1, ctx, this.end.bind(this), canvas.width / 2, canvas.height / 2, this.mapData.width, this.mapData.height, this.gridWidth) //game abonniert tod des players, indem es this.end übergibt (Observer pattern)
            this.ProjectileSystem = new Projectile(0, 0, 0, 0, 0, 0, 0, 0, 0)
            this.hudHealthProgress.max = this.PlayerOne.maxHp
            this.hudHealthProgress.value = this.PlayerOne.hp
            this.hudXpProgress.max = this.PlayerOne.xpForNextLevel
            this.hudXpProgress.value = this.PlayerOne.xp
            // Erstellen des GridArrays für Enemie und Projectile

            for (let row = 0; row <= Math.floor(this.mapData.height / (this.gridWidth)); row++) {
                this.enemies[row] = []
                for (let column = 0; column <= Math.floor(this.mapData.width / (this.gridWidth)); column++) {
                    this.enemies[row][column] = {within: []}
                }
            }
            this.renderInterval = setInterval(() => this.render(), 5);
            this.startEnemySpawning();
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

    startEnemySpawning() {
        const spawn = () => {
            if (this.gamePaused) return;

            EnemyFactory.spawnEnemyOutsideView(this.enemies, this.PlayerOne, canvas, this.mapData.tilewidth, this.gridWidth, this.mapData.width, this.mapData.height, this.MapOne, 8 /*Anzahl der Gegner pro Spawn*/)
            this.enemySpawnInterval = setTimeout(spawn, this.getCurrentSpawnInterval())       // quasi rekursiver Aufruf, nur mit variablem Rekursionsschritt (getCurrentSpawnInterval)  mit sich veränderbaren Intervall
        };
    
    spawn();
    }
    getCurrentSpawnInterval() {
        return 500 / this.getSpawnIntensity(this.gameTimer); // 5000  is das Startintervall
}

    getSpawnIntensity(t) {
        console.log("Timer: " + t)
        if (t < 60) {
            return 0.2 + 0.4 * (t / 60);
        } else if (t < 150) {
            return 0.6 + 0.4 * ((t - 60) / 90);
        } else if (t < 180) {
            return 0.5;
        } else if (t < 300) {
            return 0.5 + 0.4 * ((t - 180) / 120);
        } else if (t < 330) {
            return 0.4;
        } else if (t < 510) {
            return 0.4 + 0.6 * ((t - 330) / 180);
        } else {
            return 1.0;
        }    
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
        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("defeatTime").innerHTML = document.getElementById("hudTime").innerHTML
        document.getElementById("defeatXP").innerHTML = this.PlayerOne.xp
        document.getElementById("defeatKills").innerHTML = this.killCount
        document.getElementById("defeatScreen").style.display = "flex";

        this.stopGameTimer()
        this.resetTimer()

        this.resetGame()
    }

    endWin() {
        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("winTime").innerHTML = document.getElementById("hudTime").innerHTML
        document.getElementById("winXP").innerHTML = this.PlayerOne.xp
        document.getElementById("winKills").innerHTML = this.killCount
        document.getElementById("winScreen").style.display = "flex";

        this.stopGameTimer()
        this.resetTimer()

        this.resetGame()
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

        if (this.keyDownBound) {
            document.removeEventListener("keydown", this.keyDownBound);
            this.keyDownBound = null;
        }
        if (this.keyUpBound) {
            document.removeEventListener("keyup", this.keyUpBound);
            this.keyUpBound = null;
        }
        // Gegner-Array leeren

        this.enemies.length = 0
        this.projectiles.length = 0
        this.MapOne = null
        this.PlayerOne = null
        this.mapData = null

        this.ProjectileSystem = null
        this.weapon = null
        this.Game = null

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
        }, performance.now(), this.enemies, this.gridWidth)


        //this.killCount += kills
        // Gegner bewegen, zeichnen und bei Collision entfernen
        for (let row = 0; row <= Math.floor(this.mapData.height / (this.gridWidth)); row++) {
            for (let column = 0; column <= Math.floor(this.mapData.width / (this.gridWidth)); column++) {
                for (let i = this.enemies[row][column].within.length - 1; i >= 0; i--) {
                    this.enemies[row][column].within[i].render(ctx, this.MapOne, this.PlayerOne, this.enemies, this.projectiles, performance.now(), i, this.gridWidth)
                }
            }
        }

        this.hudHealthProgress.max = this.PlayerOne.maxHp
        this.hudHealthProgress.value = this.PlayerOne.hp
        document.getElementById("hudXP").innerHTML = this.PlayerOne.xp
    }
}

document.getElementById("startScreen").style.display = "flex"; // Startbildschirm anzeigen
window.Game = new game() // Ein globales Spielobjekt erstellen (für html)