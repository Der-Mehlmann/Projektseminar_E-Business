# Klassendiagramm - Browser Game

Dieses Klassendiagramm zeigt die Struktur des Browser-Spiels mit allen Klassen, ihren Eigenschaften, Methoden und Beziehungen.

## Mermaid Diagramm

```mermaid
classDiagram
    %% Basis-Klassen
    class Entity {
        +Number globalEntityX
        +Number globalEntityY
        +Object hitbox
        +Image png
        +constructor(globalEntityX, globalEntityY, hitbox, png)
        +draw(ctx, x, y, width, height, color) void
    }

    %% Statische Entities
    class StaticEntity {
        +Number globalEntityX
        +Number globalEntityY
        +Object hitbox
        +Image png
        +constructor(globalEntityX, globalEntityY, hitbox, png)
    }

    %% Bewegliche Entities
    class MovingEntity {
        +Number globalEntityX
        +Number globalEntityY
        +Number hp
        +Number maxHp
        +Image png
        +Number speed
        +Object hitbox
        +constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox)
        +checkCollision(other, proposedMoveX, proposedMoveY) Boolean
        +checkCollisionHorizontal(other, proposedMoveX) Boolean
        +checkCollisionVertical(other, proposedMoveY) Boolean
        +attemptMoveAxis(self, axis, move, enemyArray, map, visited) Object
        +takeDmg(amount) void
        +die() void
    }

    %% Player Klasse
    class Player {
        +CanvasRenderingContext2D ctx
        +Number xp
        +Number level
        +Number xpForNextLevel
        +Number baseSpeed
        +Array ausrüstung
        +Array weapons
        +Number regeneration
        +Function onDeath
        +constructor(globalEntityX, globalEntityY, hp, maxHp, xp, png, speed, hitbox, ausrüstung, weapons, regeneration, ctx, onDeath)
        +handleInput(map, inputState) void
        +lvlUp() void
        +die() void
        +collectPickup(item) void
        +collectXp(xpAmount) void
    }

    %% Enemy Klasse
    class Enemy {
        +Number level
        +Number xpDrop
        +Boolean elite
        +Boolean ranged
        +constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, level, xpDrop, elite, ranged)
        +spawnEnemyAtEdge(enemiesArray, mapWidth, mapHeight)$ void
        +chasePlayer(map, player, enemyArray) void
        +die() void
    }

    %% Projectile Klasse
    class Projectile {
        +Boolean piercing
        +Number size
        +Object direction
        +Number dmg
        +constructor(globalEntityX, globalEntityY, hp, png, speed, hitbox, piercing, size, direction, dmg)
        +handleProjectiles(ctx, projectiles, enemies, player, map, onEnemyKill)$ void
        +move(map, projectiles, projectileIndex) void
    }

    %% Item Klasse
    class Item {
        +Image icon
        +String description
        +constructor(globalEntityX, globalEntityY, hitbox, png, icon, description)
    }

    %% Equipment Klasse
    class Equipment {
        +Number attackBonus
        +Number defenseBonus
        +Number xpBonus
        +Number projectileSize
        +constructor(icon, description, picture, attackBonus, defenseBonus, xpBonus, projectileSize)
        +apply() void
    }

    %% Weapon Klasse
    class Weapon {
        +Number dmg
        +Number cooldown
        +Number focus
        +Number splash
        +Number range
        +Number lvl
        +Number amount
        +Number lastShotTime
        +constructor(icon, description, picture, dmg, cooldown, focus, splash, range, lvl, amount)
        +create(type)$ Weapon
        +shoot(player, projectiles, currentTime, enemies) void
    }

    %% Obstacle Klasse
    class Obstacle {
        +constructor(globalEntityX, globalEntityY, hitbox, png)
    }

    %% DropSingleUse Klasse
    class DropSingleUse {
        +constructor(globalEntityX, globalEntityY)
        +apply(player) void
    }

    %% SpeedBoostDrop Klasse
    class SpeedBoostDrop {
        +Number duration
        +Number speedMultiplier
        +constructor(globalEntityX, globalEntityY)
        +apply(player) void
    }

    %% HealDrop Klasse
    class HealDrop {
        +Number healAmount
        +constructor(globalEntityX, globalEntityY)
        +use(player) void
    }

    %% Map Klasse
    class Map {
        +Number mapWidthTile
        +Number mapHeightTile
        +Number tilelength
        +Number FOVwidth
        +Number FOVheight
        +CanvasRenderingContext2D ctx
        +Array mapDataTiles
        +Image mapImage
        +Boolean map1Loaded
        +Image tilesetImage
        +Boolean tilesLoaded
        +Image tilesetDesignImage
        +Boolean tilesDesignLoaded
        +Array tileData
        +Number tilesPerRow
        +Number tilesPerRowDesign
        +constructor(mapData, FOVwidth, FOVheight, ctx)
        +maxAbs(x, y) Number
        +findTile(x, y) Object
        +checkIfFree(entityX, entityY, moveLengthHoriz, moveLengthVert, mapLengthOrWidth, directionX, directionY, hitboxWidth, hitboxHeight) Number
        +rightFree(entityX, entityY, moveLength, hitbox) Number
        +topFree(entityX, entityY, moveLength, hitbox) Number
        +leftFree(entityX, entityY, moveLength, hitbox) Number
        +downFree(entityX, entityY, moveLength, hitbox) Number
        +loadTileData() void
        +isTileOutOfBorder(tileRowWalker, tileColumnWalker) Boolean
        +getTileNr(row, column) Number
        +offsetToBorder(offset) Number
        +drawTile(tileRowWalker, tileColumnWalker, leftBorder, topBorder, i, j) void
        +draw(player) void
        +drawMiniMap(player) void
        +drawMiniEnemy(enemy) void
        +drawSqr(x, y, width, height, color) void
    }

    %% Game Klasse
    class Game {
        +Number difficulty
        +Number timestamp
        +Boolean upPressed
        +Boolean downPressed
        +Boolean leftPressed
        +Boolean rightPressed
        +Object mapData
        +Number killCount
        +Number mapChoice
        +Number gameTimer
        +Interval timerInterval
        +Interval enemySpawnInterval
        +Interval renderInterval
        +Boolean gamePaused
        +HTMLElement hudHealthProgress
        +HTMLElement hudXpProgress
        +Map MapOne
        +Player PlayerOne
        +Array enemies
        +Array projectiles
        +Weapon weapon
        +constructor()
        +loadMap(file) Promise
        +mapSelect(map) void
        +keyDownHandler(e) void
        +keyUpHandler(e) void
        +pauseGame() void
        +resumeGame() void
        +start() void
        +update() void
        +render() void
    }

    %% Vererbungsbeziehungen (Inheritance)
    Entity <|-- StaticEntity : extends
    Entity <|-- MovingEntity : extends
    MovingEntity <|-- Player : extends
    MovingEntity <|-- Enemy : extends
    MovingEntity <|-- Projectile : extends
    StaticEntity <|-- Item : extends
    StaticEntity <|-- Obstacle : extends
    StaticEntity <|-- DropSingleUse : extends
    Item <|-- Equipment : extends
    Item <|-- Weapon : extends
    DropSingleUse <|-- SpeedBoostDrop : extends
    DropSingleUse <|-- HealDrop : extends

    %% Kompositions- und Assoziationsbeziehungen
    Game o-- Map : hat eine
    Game o-- Player : hat einen
    Game o-- "0..*" Enemy : hat mehrere
    Game o-- "0..*" Projectile : hat mehrere
    Game o-- Weapon : hat eine
    Player --> Map : nutzt
    Player --> Item : sammelt
    Player --> Weapon : nutzt
    Enemy --> Player : verfolgt
    Enemy --> Map : nutzt
    Enemy --> DropSingleUse : droppt
    Projectile --> Enemy : trifft
    Projectile --> Map : nutzt
    Weapon --> Projectile : erzeugt
    Map --> Player : rendert
```

## Erklärung der Beziehungen

### Vererbungshierarchie

1. **Entity** (Basis-Klasse)
   - **StaticEntity** - Für nicht-bewegliche Objekte
     - **Item** - Sammelbare Gegenstände
       - **Equipment** - Ausrüstungsgegenstände
       - **Weapon** - Waffen
     - **Obstacle** - Hindernisse auf der Karte
     - **DropSingleUse** - Einmalig verwendbare Drops
       - **SpeedBoostDrop** - Geschwindigkeits-Boost
       - **HealDrop** - Heilungs-Drop
   
   - **MovingEntity** - Für bewegliche Objekte
     - **Player** - Der Spieler
     - **Enemy** - Gegner
     - **Projectile** - Geschosse

### Hauptkomponenten

1. **Game** - Zentrale Spielsteuerung
   - Verwaltet alle Spielobjekte
   - Steuert Spielablauf und Rendering
   - Behandelt Eingaben

2. **Map** - Kartenverwaltung
   - Lädt und rendert die Spielwelt
   - Prüft Kollisionen mit Terrain
   - Verwaltet Tiles und Hindernisse

3. **Player** - Spielercharakter
   - Bewegung durch Eingaben
   - Level-System und XP
   - Inventar und Ausrüstung

4. **Enemy** - Gegner
   - KI-Bewegung zum Spieler
   - Verschiedene Typen (ranged/melee)
   - Spawning am Kartenrand

5. **Weapon & Projectile** - Kampfsystem
   - Verschiedene Waffentypen
   - Automatisches Schießen
   - Kollisionserkennung

## Verwendung

Um dieses Diagramm anzuzeigen, können Sie:

1. **GitHub** - Das Diagramm wird automatisch auf GitHub gerendert
2. **Mermaid Live Editor** - Kopieren Sie den Code in https://mermaid.live/
3. **VS Code** - Nutzen Sie die Mermaid Preview Extension
4. **Andere Tools** - Jedes Tool, das Mermaid unterstützt
