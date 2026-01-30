import {Entity} from "./entity.js"
//import { Item } from "./item.js"
import {Map} from "./map.js"
//import { Obstacles } from "./obstacles.js"
import {Player} from "./player.js"
// Equipment-Imports
import {EnemyFactory} from "./EnemyFactory.js"

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = false;    // soll Flackern verhindern
let zoomFactor = 0.90;
let BasicWidth = 2560;
let BasicHeight = 1440;
canvas.width = BasicWidth * zoomFactor;
canvas.height = BasicHeight * zoomFactor;

function resizeCanvas() {              // Canvas Skalierung je nach Fenstergröße --> soll flackern der Grafik verhindern

    let windowWidth = window.innerWidth;   // von dem Browserfenster
    let windowHeight = window.innerHeight;// von dem Browserfenster
    let targetRatio = BasicWidth / BasicHeight; // Verhältnis von internem Canvas
    let windowRatio = windowWidth / windowHeight;// Verhältnis von internem Canvas
    let newWidth, newHeight;

    if (windowRatio > targetRatio) {    //targetRatio = 16:9, zum verändern Base_WIDTH / BASE_HEIGHT anpassen
        newHeight = windowHeight;// Bildschirm breiter --> volle Höhe nutzen, Breite anpassen
        newWidth = newHeight * targetRatio;
    } else {
        newWidth = windowWidth;// Bildschirm schmaler --> volle Breite nutzen, Höhe anpassen
        newHeight = newWidth / targetRatio;
    }
    canvas.style.width = newWidth + "px";  // Not sure ob das besser geht mit CSS Skalierung
    canvas.style.height = newHeight + "px";
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas);
window.addEventListener("keydown", function (e) {

    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {// Blockiere Strg  +, Strg  -, Strg 0  und Stgr = (Zoom / Zoomreset)
        e.preventDefault(); // wenn man unbedingt zoomen will, dann über das Stgr Shift und dann auf die Taste mit (~+*) / (_-)
    }
});
window.addEventListener("wheel", function (e) {// Mausrad-Zoom blockieren
    if (e.ctrlKey) {
        e.preventDefault();
    }
}, {passive: false});


export class game {

    difficulty = 1
    timestamp
    upPressed = false
    downPressed = false
    leftPressed = false
    rightPressed = false
    spacePressed = false;
    mapData
    gridWidth = 8
    killCount = 0
    mapChoice = 0 // 0 = Map1, 1 = Map2 Jungle

    gameTimer = 0
    totalGameTimer = 0
    timerInterval = null

    enemySpawnInterval = null // Intervall für Gegner-Spawns
    renderInterval = null // Intervall für das Rendern

    gamePaused = false // Flag, ob das Spiel pausiert ist

    playerSelect = 1
    playerPngPath = './players/P/1.png'

    hudHealthProgress = document.getElementById("hudHealthProgress")
    hudXpProgress = document.getElementById("hudXpProgress")
    totalXP = 0

    GP = false

    soundEffects = true
    music = true
    soundEffectsVol = parseFloat(localStorage.getItem("soundEffectsVol") || "1.0");
    musicVol = parseFloat(localStorage.getItem("musicVol") || "1.0");

    //Tests
    testShoot = true
    testDie = false
    Health = 100
    maxHealth = 100
    XP = 0

    constructor() {
        // Sicherheitscheck: Falls im LocalStorage "NaN" steht oder etwas Ungültiges
        if (isNaN(this.soundEffectsVol) || typeof this.soundEffectsVol !== 'number') {
            this.soundEffectsVol = 1.0;
        }
        if (isNaN(this.musicVol) || typeof this.musicVol !== 'number') {
            this.musicVol = 1.0;
        }

        this.MapOne = null
        this.PlayerOne = null
        this.enemies = [] // Array für alle aktiven Gegner
        this.projectiles = [] // Array für alle aktiven Projektile
        this.LevelUpFactory = null
        this.Sounds();

        this.dashTrails = [] // Array für Dash-Effekte

        // Listener initialisieren (nur einmal!)
        this.settingsListener()
        this.settingsListenerInGameSettings()

        window.addEventListener("keydown", (e) => {
            if (document.getElementById("settingsScreen").style.display === "flex") {
                if (e.key === 't' || e.key === 'T') {
                    const s1 = document.getElementById("testCaseSettings1");
                    const s2 = document.getElementById("testCaseSettings2");
                    if (s1 && s2) {
                        if (s1.style.display === "none") {
                            s1.style.display = "flex";
                            s2.style.display = "flex";
                        } else {
                            s1.style.display = "none";
                            s2.style.display = "none";
                        }
                    }
                }
            }
        });
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
                this.mapChoice = './Code/Tiled/Dungeon.json';
                this.mapChoicePng = './Code/Tiled/Dungeon.png';
                this.start()
                break;
            default:
                this.mapChoice = './Code/Tiled/map2Jungle.json';
                this.mapChoicePng = './Code/Tiled/map2Jungle.png';
                this.start()
        }
    }

    keyDownHandler(e) { // liest Input der Tastatur aus
        if ((e.key === "ArrowUp") || (e.key === 'w') || (e.key === 'W')) {
            this.upPressed = true;
        }
        if ((e.key === "ArrowLeft") || (e.key === 'a') || (e.key === 'A')) {
            this.leftPressed = true;
        }
        if ((e.key === "ArrowRight") || (e.key === 'd') || (e.key === 'D')) {
            this.rightPressed = true;
        }
        if ((e.key === "ArrowDown") || (e.key === 's') || (e.key === 'S')) {
            this.downPressed = true;
        }
        if (e.code === "Space") {
            this.spacePressed = true;
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
        if ((e.key === "ArrowUp") || (e.key === 'w') || (e.key === 'W')) {
            this.upPressed = false;
        }
        if ((e.key === "ArrowLeft") || (e.key === 'a') || (e.key === 'A')) {
            this.leftPressed = false;
        }
        if ((e.key === "ArrowRight") || (e.key === 'd') || (e.key === 'D')) {
            this.rightPressed = false;
        }
        if ((e.key === "ArrowDown") || (e.key === 's') || (e.key === 'S')) {
            this.downPressed = false;
        }
        if (e.code === "Space") {
            this.spacePressed = false;
        }
    }

    settingsListener() {
        document.getElementById("settingsForm").addEventListener("submit", (e) => {
            e.preventDefault();
            // Save logic here
            this.soundEffectsVol = parseFloat(document.getElementById("soundEffectsVol").value)
            this.musicVol = parseFloat(document.getElementById("musicVol").value)

            localStorage.setItem("soundEffectsVol", this.soundEffectsVol.toString())
            localStorage.setItem("musicVol", this.musicVol.toString())

            this.testShoot = document.getElementById("testShoot").checked
            this.testDie = document.getElementById("testDie").checked
            this.dashActiveSetting = document.getElementById("activateDash").checked
            this.Health = parseInt(document.getElementById("testHealth").value)
            this.maxHealth = parseInt(document.getElementById("testMaxHealth").value)
            this.XP = parseInt(document.getElementById("testXP").value)
            //localStorage.setItem("soundVol", toString(this.soundEffectsVol))
            //this.soundEffectsVol = parseInt(localStorage.getItem("soundVol") || 1.0);

            this.Sounds()
            this.home()
        });
    }

    settingsListenerInGameSettings() {
        document.getElementById("inGameSettingsForm").addEventListener("submit", (e) => {
            e.preventDefault();

            this.soundEffectsVol = parseFloat(document.getElementById("soundEffectsVolInGame").value) // ID muss im HTML angepasst werden (siehe unten) oder eindeutig sein
            this.musicVol = parseFloat(document.getElementById("musicVolInGame").value) // ID muss im HTML angepasst werden

            localStorage.setItem("soundEffectsVol", this.soundEffectsVol.toString())
            localStorage.setItem("musicVol", this.musicVol.toString())

            this.Sounds()

            this.pauseGame()
        });
    }

    updateTimerDisplay() { // Aktualisiert die Anzeige des Timers im Format mm:ss
        const minutes = Math.floor(this.gameTimer / 60)
        const seconds = this.gameTimer % 60
        // Format mm:ss
        document.getElementById("hudTime").textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    updateGameTime() {
        const totalMinutes = Math.floor((parseInt(localStorage.getItem("totalGameTime"))) / 60)
        const totalSeconds = (parseInt(localStorage.getItem("totalGameTime"))) % 60
        // Format mm:ss
        localStorage.setItem("gameTime", `${totalMinutes.toString().padStart(2, "0")}:${totalSeconds.toString().padStart(2, "0")}`)
        //console.log(localStorage.getItem("gameTime"))
    }

    startGameTimer() { // Startet den Spieltimer
        this.stopGameTimer()
        this.updateTimerDisplay()
        this.timerInterval = setInterval(() => {
            this.gameTimer++
            localStorage.setItem("totalGameTime", (parseInt(localStorage.getItem("totalGameTime") || "0") + 1).toString());
            this.updateTimerDisplay()
            this.updateGameTime()
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

        window.addEventListener('keydown', this.keyDownBound)
        window.addEventListener('keyup', this.keyUpBound);

        Entity.FOVwidthMiddle = canvas.width / 2
        Entity.FOVheightMiddle = canvas.height / 2

        //Map Switch
        this.mapData = []
        this.loadMap(this.mapChoice).then(() => {  //andere Map: ./Code/Tiled/Map1.json      ./Code/Tiled/map2Jungle.json
            this.mapData = this.mapData[0];
            this.MapOne = new Map(this.mapData, this.mapChoicePng, canvas.width, canvas.height, ctx)

            this.PlayerOne = new Player(this.mapData.width * this.mapData.tilewidth / 2, this.mapData.height * this.mapData.tilewidth / 2, this.Health, this.maxHealth, this.XP, this.playerPngPath, 5, {
                width: 48, height: 48
            }, 0, 0, 1, ctx, this.end.bind(this), canvas.width / 2, canvas.height / 2, this.mapData.width, this.mapData.height, this.gridWidth) //game abonniert tod des players, indem es this.end übergibt (Observer pattern)
            //this.LevelUpFactory = new LvlUpFactory(this.PlayerOne)
            // 3 slots mit ausrüstung belegen, nur zum testen während der entwicklung:

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
            if (!this.gamePaused) {

                EnemyFactory.spawnEnemyOutsideView(this.enemies, this.PlayerOne, canvas, this.mapData.tilewidth, this.gridWidth, this.mapData.width, this.mapData.height, this.MapOne, 8/*Anzahl der Gegner pro Spawn*/, this.getEnemyLvl())
            }
            this.enemySpawnInterval = setTimeout(spawn, this.getCurrentSpawnInterval())       // quasi rekursiver Aufruf, nur mit variablem Rekursionsschritt (getCurrentSpawnInterval)  mit sich veränderbaren Intervall
        };

        spawn();
    }

    getEnemyLvl() {
        const t = this.gameTimer;
        if (t < 60) {       //Zeitstempel in Sekunden
            return 1;       //lvl
        } else if (t < 120) {
            return 2;
        } else if (t < 180) {
            return 3;
        } else if (t < 240) {
            return 4;
        } else if (t < 300) {
            return 5;
        } else if (t < 360) {
            return 6;
        } else if (t < 420) {
            return 7;
        } else if (t < 480) {
            return 9;
        } else if (t < 540) {
            return 10;
        } else if (t < 600) {
            return 20;
        } else if (t < 660) {
            return 11;
        } else if (t < 720) {
            return 12;
        } else if (t < 780) {
            return 13;
        } else if (t < 840) {
            return 14;
        } else if (t < 900) {
            return 15;
        } else if (t < 960) {
            return 16;
        } else if (t < 1020) {
            return 17;
        } else if (t < 1080) {
            return 18;
        } else if (t < 1140) {
            return 19;
        } else if (t < 1200) {
            return 20;
        }
    }

    getCurrentSpawnInterval() {
        // Basisspawnintervall in ms (je kleiner, desto härter)
        return 2000 / this.getSpawnIntensity(this.gameTimer);
    }

    getSpawnIntensity(t) {
        // 0:00–1:00 (0–60s) -> ruhig reinstarten
        if (t < 60) {
            return 0.15 + 0.35 * (t / 60);          // 0.20 → 0.60
        }

        // 1:00–2:30 (60–150s) -> mehr Druck
        else if (t < 150) {
            return 0.55 + 0.40 * ((t - 60) / 90);   // 0.60 → 1.05
        }

        // 2:30–3:30 (150–210s) -> weiterhin steigern
        else if (t < 210) {
            return 1.05 + 0.15 * ((t - 150) / 60);  // 1.05 → 1.20
        }

        // 3:30–5:00 (210–300s) -> hier wird’s deutlich schneller (damit ab 5:00 schwer)
        else if (t < 300) {
            return 1.20 + 0.90 * ((t - 210) / 90);  // 1.20 → 2.10
        }

        // 5:00–10:00 (300–600s) -> Wellen werden immer härter, bis 10 Minuten
        else if (t < 600) {
            return 2.10 + 0.90 * ((t - 300) / 300); // 2.10 → 3.00
        }

        // ab 10:00 -> konstant brutal (oder hier noch weiter ansteigen lassen)
        else {
            return 3.00;
        }
    }

    /*
    updateEnemyStats(t)  {
         if (!this.gamePaused) {
            if (t % 60 === 0) { // alle 60 Sekunden
                this.enemies.forEach(enemy){
                    enemy.updateStats();
                }
            }
        }
                }
    */

    // Beginn der Screen-Wechsel-Funktionen
    pauseGame() {
        if (this.gamePaused === false) {
            this.gamePaused = true; //flag boolean for render function
            this.stopGameTimer()  // Verhindert mehrfaches Pausieren
        }

        document.getElementById("pauseScreen").style.display = "flex";
        document.getElementById("inGameSettingsScreen").style.display = "none";
        this.gamePaused = true; //flag boolean for render function
        this.stopGameTimer()

        document.getElementById("pauseScreen").style.display = "flex";

        Sounds.musikSound.pause()
    }

    playerStats() {
        document.getElementById("playerStatsScreen").style.display = "flex";
        document.getElementById("playerStatsImg").src = this.playerPngPath;

        //Equipments
        if (this.PlayerOne.equipmentSlots[0]) document.getElementById("appliedEquipment1").innerHTML = this.PlayerOne.equipmentSlots[0].name
        if (this.PlayerOne.equipmentSlots[0]) document.getElementById("applied1").innerHTML = "– Level: " + this.PlayerOne.equipmentSlots[0].level

        if (this.PlayerOne.equipmentSlots[1]) document.getElementById("appliedEquipment2").innerHTML = this.PlayerOne.equipmentSlots[1].name
        if (this.PlayerOne.equipmentSlots[1]) document.getElementById("applied2").innerHTML = "– Level: " + this.PlayerOne.equipmentSlots[1].level

        if (this.PlayerOne.equipmentSlots[2]) document.getElementById("appliedEquipment3").innerHTML = this.PlayerOne.equipmentSlots[2].name
        if (this.PlayerOne.equipmentSlots[2]) document.getElementById("applied3").innerHTML = "– Level: " + this.PlayerOne.equipmentSlots[2].level

        if (this.PlayerOne.equipmentSlots[3]) document.getElementById("appliedEquipment4").innerHTML = this.PlayerOne.equipmentSlots[3].name
        if (this.PlayerOne.equipmentSlots[3]) document.getElementById("applied4").innerHTML = "– Level: " + this.PlayerOne.equipmentSlots[3].level

        //Weapons
        if (this.PlayerOne.weaponSlots[0]) document.getElementById("PsWeapon1").src = this.PlayerOne.weaponSlots[0].icon;
        if (this.PlayerOne.weaponSlots[0]) document.getElementById("PsWeapon1N").innerHTML = this.PlayerOne.weaponSlots[0].name;
        if (this.PlayerOne.weaponSlots[0]) document.getElementById("PsWeapon1L").innerHTML = "Level: " + this.PlayerOne.weaponSlots[0].level;

        if (this.PlayerOne.weaponSlots[1]) document.getElementById("PsWeapon2").src = this.PlayerOne.weaponSlots[1].icon;
        if (this.PlayerOne.weaponSlots[1]) document.getElementById("PsWeapon2N").innerHTML = this.PlayerOne.weaponSlots[1].name;
        if (this.PlayerOne.weaponSlots[1]) document.getElementById("PsWeapon2L").innerHTML = "Level: " + this.PlayerOne.weaponSlots[1].level;

        if (this.PlayerOne.weaponSlots[2]) document.getElementById("PsWeapon3").src = this.PlayerOne.weaponSlots[2].icon;
        if (this.PlayerOne.weaponSlots[2]) document.getElementById("PsWeapon3N").innerHTML = this.PlayerOne.weaponSlots[2].name;
        if (this.PlayerOne.weaponSlots[2]) document.getElementById("PsWeapon3L").innerHTML = "Level: " + this.PlayerOne.weaponSlots[3].level;

        if (this.PlayerOne.weaponSlots[3]) document.getElementById("PsWeapon4").src = this.PlayerOne.weaponSlots[3].icon;
        if (this.PlayerOne.weaponSlots[3]) document.getElementById("PsWeapon4N").innerHTML = this.PlayerOne.weaponSlots[3].name;
        if (this.PlayerOne.weaponSlots[3]) document.getElementById("PsWeapon4L").innerHTML = "Level: " + this.PlayerOne.weaponSlots[3].level;
    }

    statsScreenHide() {
        document.getElementById("playerStatsScreen").style.display = "none";
    }

    resumeGame() {
        this.gamePaused = false; //flag boolean for render function

        this.startGameTimer()


        document.getElementById("pauseScreen").style.display = "none";

        if (this.music) {
            Sounds.musikSound.play()
        }
    }

    statsShow() {
        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("statsScreen").style.display = "flex";

        document.getElementById("gameTime").innerHTML = localStorage.getItem("gameTime");
        document.getElementById("gameXP").innerHTML = localStorage.getItem("gameXP");
        document.getElementById("gameKills").innerHTML = localStorage.getItem("gameKills");
        document.getElementById("gameWins").innerHTML = localStorage.getItem("gameWins");
        document.getElementById("gameDefeats").innerHTML = localStorage.getItem("gameDefeats");
    }

    statsReset() {
        localStorage.clear()
        this.home()
        this.statsShow()
    }

    lvlUPshow() {
        this.gamePaused = true;
        this.stopGameTimer()

        document.getElementById("lvlScreen").style.display = "flex";

        Sounds.musikSound.pause()
        if (this.soundEffects) {
            Sounds.lvlUpSound.play()
        }
    }

    lvlUPhide() {
        this.gamePaused = false;
        this.startGameTimer()

        document.getElementById("lvlScreen").style.display = "none";

        if (this.music) {
            Sounds.musikSound.play()
        }
    }

    chooseMap() {
        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("mapScreen").style.display = "flex";
    }

    settings() {
        this.settingsListener()

        document.getElementById("soundEffectsVol").value = parseFloat(localStorage.getItem("soundEffectsVol") || "1.0");

        document.getElementById("musicVol").value = parseFloat(localStorage.getItem("musicVol") || "1.0");

        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "flex";
    }

    inGameSettings() {
        this.settingsListenerInGameSettings()

        document.getElementById("soundEffectsVolInGame").value = parseFloat(localStorage.getItem("soundEffectsVol") || "1.0");

        document.getElementById("musicVolInGame").value = parseFloat(localStorage.getItem("musicVol") || "1.0");

        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("inGameSettingsScreen").style.display = "flex";
    }

    selectPlayerScreen() {
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("playerSelectScreen").style.display = "flex";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("player" + this.playerSelect).style.display = "flex";
    }

    selectPlayer(src) {
        if (this.playerSelect === 6 && this.GP === false) {
            // Optional: Hier könnte man einen "Locked"-Sound abspielen
            return;
        }

        this.playerPngPath = src
        this.home()
    }

    nextPlayer() {
        document.getElementById("player" + this.playerSelect).style.display = "none"
        this.playerSelect++
        if (this.playerSelect > 6) {
            this.playerSelect = 1
        } else if (this.playerSelect < 1) {
            this.playerSelect = 6
        }

        this.checkGP()

        if (this.playerSelect === 6 && this.GP === false) {
            document.getElementById("hide").style.display = "flex"
        } else {
            document.getElementById("hide").style.display = "none"
        }

        document.getElementById("player" + this.playerSelect).style.display = "flex"
    }

    prevPlayer() {
        document.getElementById("player" + this.playerSelect).style.display = "none"
        this.playerSelect--
        if (this.playerSelect > 6) {
            this.playerSelect = 1
        } else if (this.playerSelect < 1) {
            this.playerSelect = 6
        }

        this.checkGP()

        if (this.playerSelect === 6 && this.GP === false) {
            document.getElementById("hide").style.display = "flex"
        } else {
            document.getElementById("hide").style.display = "none"
        }
        document.getElementById("player" + this.playerSelect).style.display = "flex"
    }

    checkGP() {
        const wins = parseInt(localStorage.getItem("gameWins")) || 0;

        if (wins >= 1) {
            this.GP = true;
        } else {
            // Wichtig, falls der Spieler zwischendurch "Reset Stats" drückt
            this.GP = false;
        }
    }

    home() {
        this.resetGame()

        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("testCaseSettings1").style.display = "none";
        document.getElementById("testCaseSettings2").style.display = "none";
        document.getElementById("defeatScreen").style.display = "none";
        document.getElementById("winScreen").style.display = "none";
        document.getElementById("lvlScreen").style.display = "none";
        document.getElementById("playerSelectScreen").style.display = "none";
        document.getElementById("statsScreen").style.display = "none";
        document.getElementById("mapScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "flex";
    }

    end() {
        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("defeatTime").innerHTML = document.getElementById("hudTime").innerHTML
        document.getElementById("defeatXP").innerHTML = this.totalXP
        document.getElementById("defeatKills").innerHTML = this.killCount
        document.getElementById("defeatScreen").style.display = "flex";

        localStorage.setItem("gameDefeats", (parseInt(localStorage.getItem("gameDefeats") || "0") + 1).toString());

        this.stopGameTimer()
        this.resetTimer()

        this.resetGame()
        if (this.soundEffects) {
            Sounds.loseSound.play()
        }
        this.BackgroundMusicStop()
    }

    endWin() {
        document.getElementById("gameScreen").style.display = "none";
        document.getElementById("pauseScreen").style.display = "none";
        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("winTime").innerHTML = document.getElementById("hudTime").innerHTML
        document.getElementById("winXP").innerHTML = this.totalXP
        document.getElementById("winKills").innerHTML = this.killCount
        document.getElementById("winScreen").style.display = "flex";

        localStorage.setItem("gameWins", (parseInt(localStorage.getItem("gameWins") || "0") + 1).toString());

        this.stopGameTimer()
        this.resetTimer()

        this.resetGame()

        if (this.soundEffects) {
            Sounds.WinSound.play()
        }
        this.BackgroundMusicStop()

    }

    Sounds() {

        this.buttonSound = new Audio('./Sound/click.mp3');
        this.buttonSound.volume = this.soundEffectsVol;

        this.winSound = new Audio('./Sound/Win.mp3');
        this.winSound.volume = this.soundEffectsVol;

        this.loseSound = new Audio('./Sound/lose.mp3');
        this.loseSound.volume = this.soundEffectsVol;

        this.equipSound = new Audio('./Sound/item-equip.mp3');
        this.equipSound.volume = this.soundEffectsVol;

        this.lvlUpSound = new Audio('./Sound/level-up.mp3');
        this.lvlUpSound.volume = this.soundEffectsVol;

        this.hpUpSound = new Audio('./Sound/hp-up.mp3');
        this.hpUpSound.volume = this.soundEffectsVol;

        this.damageSound = new Audio('./Sound/damage.mp3');
        this.damageSound.volume = this.soundEffectsVol;

        this.nukeSound = new Audio('./Sound/nuke-sound.mp3');
        this.nukeSound.volume = this.soundEffectsVol;

        this.xpMagnetSound = new Audio('./Sound/xp-magnet-sound.mp3');
        this.xpMagnetSound.volume = this.soundEffectsVol;

        this.freezeSound = new Audio('./Sound/freeze-sound.mp3');
        this.freezeSound.volume = this.soundEffectsVol;

        this.dashSound = new Audio('./Sound/dash.mp3');
        this.dashSound.volume = this.soundEffectsVol;

        this.musikSound = new Audio('./Sound/musik.mp3');
        this.musikSound.volume = this.musicVol;

        window.Sounds = {
            buttonSound: this.buttonSound, //backgroundMusic: backgroundMusic,
            WinSound: this.winSound,
            loseSound: this.loseSound,
            equipSound: this.equipSound,
            lvlUpSound: this.lvlUpSound,
            hpUpSound: this.hpUpSound,
            shotSound: this.damageSound,
            nukeSound: this.nukeSound,
            xpMagnetSound: this.xpMagnetSound,
            freezeSound: this.freezeSound,
            dashSound: this.dashSound,
            musikSound: this.musikSound
        };
    }

    playButtonSound() {
        if (!this.soundEffects) return;
        if (!window.Sounds || !window.Sounds.buttonSound) return;

        Sounds.buttonSound.play();

    }

    BackgroundMusicPlay() {
        if (!this.music) return;
        if (!window.Sounds || !window.Sounds.musikSound) return;

        Sounds.musikSound.loop = true;
        Sounds.musikSound.play()
    }

    BackgroundMusicStop() {
        if (!window.Sounds || !window.Sounds.musikSound) return;
        Sounds.musikSound.pause();
        // Auf 0 zurücksetzen, damit beim nächsten Abspielen von vorn begonnen wird
        Sounds.musikSound.currentTime = 0;
    }

    winLoseSoundStop() {
        if (window.Sounds && window.Sounds.WinSound) {
            window.Sounds.WinSound.pause();
            window.Sounds.WinSound.currentTime = 0;
        }

        if (window.Sounds && window.Sounds.loseSound) {
            window.Sounds.loseSound.pause();
            window.Sounds.loseSound.currentTime = 0;
        }
    }

    equipSoundPlay() {
        if (!this.soundEffects) return;
        if (!window.Sounds || !window.Sounds.equipSound) return;

        Sounds.equipSound.play();
    }

    restart() {
        this.resetGame()
        this.start()

        if (this.music) {
            Sounds.musikSound.play()
        }
    }

    resetGame() {
        this.winLoseSoundStop()

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

        // Event-Listener entfernen
        if (this.keyDownBound) {
            window.removeEventListener("keydown", this.keyDownBound);
            this.keyDownBound = null;
        }
        if (this.keyUpBound) {
            window.removeEventListener("keyup", this.keyUpBound);
            this.keyUpBound = null;
        }

        // Arrays und Objekte leeren
        this.enemies.length = 0
        this.projectiles.length = 0
        this.dashTrails = []
        this.MapOne = null
        this.PlayerOne = null
        this.mapData = null

        this.DropSystem = null
        this.weapon = null
        // this.Game = null // (Optional entfernen: this.Game existiert in der Klasse normalerweise nicht, window.Game ist die Instanz)

        // Eingabeflags zurücksetzen
        this.upPressed = false
        this.downPressed = false
        this.leftPressed = false
        this.rightPressed = false
        this.spacePressed = false // Neu: Space-Input zurücksetzen

        // Spiel-Status zurücksetzen
        this.gamePaused = false

        // Canvas leeren
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Spielstatistiken für den Run zurücksetzen
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

        // Gegner bewegen, zeichnen und bei Collision entfernen
        for (let row = 0; row <= Math.floor(this.mapData.height / (this.gridWidth)); row++) {
            for (let column = 0; column <= Math.floor(this.mapData.width / (this.gridWidth)); column++) {
                for (let i = 0; i < this.enemies[row][column].within.length; i++) {
                    if (this.enemies[row][column].within[i] === undefined) {
                        //console.log(this.enemies[row][column].within.length)
                        //console.log(i)
                    }
                    this.enemies[row][column].within[i].render(ctx, this.MapOne, this.PlayerOne, this.enemies, this.projectiles, performance.now(), i, this.gridWidth, this.PlayerOne.enemyItemDrops)
                }
            }
        }

        this.PlayerOne.render(this.MapOne, {
            upPressed: this.upPressed,
            downPressed: this.downPressed,
            leftPressed: this.leftPressed,
            rightPressed: this.rightPressed,
            spacePressed: this.spacePressed
        }, performance.now(), this.enemies, this.gridWidth)

        this.MapOne.drawMiniMap(this.PlayerOne)

        // Render global projectiles (Enemy Projectiles)
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (projectile && projectile.handleProjectile) {
                projectile.handleProjectile(ctx, this.projectiles, i, this.enemies, this.PlayerOne, this.MapOne, this.gridWidth, this.PlayerOne.enemyItemDrops, performance.now());
            }
        }

        this.hudHealthProgress.max = this.PlayerOne.maxHp
        this.hudHealthProgress.value = this.PlayerOne.hp
        this.hudXpProgress.max = this.PlayerOne.xpForNextLevel
        document.getElementById("hudXP").innerHTML = this.PlayerOne.xp
    }
}

try {
    document.getElementById("startScreen").style.display = "flex"; // Startbildschirm anzeigen
    window.Game = new game() // Ein globales Spielobjekt erstellen (für html)
} catch (e) {
    console.error("Failed to initialize Game:", e);
    alert("Game initialization failed. Check console for details.\n" + e.message);
}
