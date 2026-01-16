export class Map {

    constructor(mapData, png, FOVwidth, FOVheight, ctx) {
        this.mapWidthTile = mapData.width
        this.mapHeightTile = mapData.height
        this.tilelength = mapData.tilewidth
        this.miniMapWidth = 200
        this.miniMapHeight = 150 
        this.miniMapX = 10           
        this.miniMapY = 10 
        this.mapImage = new Image()
        this.miniMapLoaded = false
        this.mapImage.onload = () => {
            this.miniMapTilePixelSizeX = this.mapImage.width / this.mapWidthTile
            this.miniMapTilePixelSizeY = this.mapImage.height / this.mapHeightTile
            this.mapCutHeight = this.miniMapTileView * this.miniMapTilePixelSizeY
            this.mapCutWidth = this.miniMapTileView * this.miniMapTilePixelSizeX
            this.miniMapLoaded = true
        }
        this.miniMapTileView = 75 
        this.FOVwidth = FOVwidth
        this.FOVheight = FOVheight
        this.ctx = ctx
        this.mapDataTiles = mapData.layers
        this.tilesetImage = new Image()
        this.tilesLoaded = false
        if (mapData.tilesets.length > 1) {
            this.tilesetDesignImage = new Image()
            this.tilesDesignLoaded = false
        } else this.tilesDesignLoaded = true
        this.tileData = []
        this.tilesetImage.onload = () => {
            this.tilesLoaded = true;
            this.tilesPerRow = Math.round(this.tilesetImage.width / this.tilelength)
            if (mapData.tilesets.length > 1) {
                this.tilesetDesignImage.onload = () => {
                    this.tilesDesignLoaded = true
                }
                this.tilesetDesignImage.src = mapData.tilesets[1].image
            }
            this.loadTileData()
        }
        this.tilesetImage.src = mapData.tilesets[0].image
        this.mapImage.src = png
    }

    maxAbs(x, y) {
        return Math.abs(x) >= Math.abs(y) ? x : y;
    }

    findTile(x, y) {
        let column = Math.floor(x / this.tilelength)
        let row = Math.floor(y / this.tilelength)
        if (row < 0 || row >= this.mapHeightTile || column < 0 || column >= this.mapWidthTile) return {
            walkable: false, height: 0
        };

        if (!this.tileData[row]) {
            return {walkable: false, height: 0};
        }

        return (this.tileData[row][column])
    }

    checkIfFree(entityX, entityY, moveLengthHoriz, moveLengthVert, mapLengthOrWidth, directionX, directionY, hitboxWidth, hitboxHeight) {
        let mapLong = mapLengthOrWidth * this.tilelength
        let mainEntityKoordInt                                                                  // Welche Koordinate bewegt werden soll
        let moveLength = this.maxAbs(moveLengthHoriz, moveLengthVert)
        if (moveLengthVert == 0) {     // x bewegung
            mainEntityKoordInt = entityX
        } else mainEntityKoordInt = entityY

        if (mainEntityKoordInt + moveLength > mapLong) return mapLong                             // MapBorder collision abfrage
        if (mainEntityKoordInt + moveLength < 0) return 0

        let mapTileNOorSW = this.findTile(entityX + hitboxWidth, entityY + hitboxHeight)                     // top rigth down left RICHTIG
        let mapTileSOorNW = this.findTile(entityX + directionX, entityY + directionY)                        // top rigth down left RICHTIG


        let newMapTileNOorSW = this.findTile(entityX + moveLengthHoriz + hitboxWidth, entityY + moveLengthVert + hitboxHeight) // Feld auf das sich der Spieler bewegen würde
        let newMapTileSOorNW = this.findTile(entityX + moveLengthHoriz + directionX, entityY + moveLengthVert + directionY) // Feld auf das sich der Spieler bewegen würde

        if ((mapTileNOorSW === newMapTileNOorSW && mapTileSOorNW === newMapTileSOorNW) || //Felder sind gleichgeblieben
            ((newMapTileSOorNW.walkable && newMapTileNOorSW.walkable) && // keine Wand
                (Math.abs(mapTileNOorSW.height - newMapTileNOorSW.height) <= 1 && Math.abs(mapTileSOorNW.height - newMapTileSOorNW.height) <= 1))) {  //richtige Höhe
            return mainEntityKoordInt + moveLength
        } else {

            return mainEntityKoordInt  //Falls man mit der Bewegung in die Wand gehen würde oder die auf der falschen Höhe wäre
        }
    }

    rightFree(entityX, entityY, moveLength, hitbox) {
        return (this.checkIfFree(entityX, entityY, moveLength, 0, this.mapWidthTile, hitbox.width, hitbox.height, hitbox.width, 0))
    }

    topFree(entityX, entityY, moveLength, hitbox) {
        return (this.checkIfFree(entityX, entityY, 0, -moveLength, this.mapHeightTile, 0, 0, hitbox.width, 0))
    }

    leftFree(entityX, entityY, moveLength, hitbox) {
        return (this.checkIfFree(entityX, entityY, -moveLength, 0, this.mapWidthTile, 0, 0, 0, hitbox.height))
    }

    downFree(entityX, entityY, moveLength, hitbox) {
        return (this.checkIfFree(entityX, entityY, 0, moveLength, this.mapHeightTile, hitbox.width, hitbox.height, 0, hitbox.height))
    }

    loadTileData() {

        let hoehe0
        let hoehe1
        let hoehe2
        let wall
        let design
        let tileSetNrDesign

        for (let i = 0; i < this.mapDataTiles.length; i++) {
            switch (this.mapDataTiles[i].name) {
                case "Hoehe0":
                    hoehe0 = this.mapDataTiles[i].data
                    break;
                case "Hoehe1":
                    hoehe1 = this.mapDataTiles[i].data
                    break;
                case "Hoehe2":
                    hoehe2 = this.mapDataTiles[i].data
                    break;
                case "Wall":
                    wall = this.mapDataTiles[i].data
                    break;
                case "Design":
                    design = this.mapDataTiles[i].data
                    this.tilesPerRowDesign = Math.round(this.tilesetDesignImage.width / this.tilelength)
                    break;
            }
        }

        for (let i = 0; i < this.mapHeightTile; i++) {
            this.tileData[i] = []
            for (let j = 0; j < this.mapWidthTile; j++) {
                let tileSetNr = hoehe0[this.getTileNr(i, j)] - 1
                if (design != undefined) tileSetNrDesign = design[this.getTileNr(i, j)] - 129
                let tileHeight = 0
                let walkable = true
                let designBoolean = false
                let linkToTileSet = null

                if (wall[this.getTileNr(i, j)] > 0) {
                    walkable = false
                } else if (hoehe1[this.getTileNr(i, j)] > 0) {
                    tileHeight = 1
                } else if (hoehe2[this.getTileNr(i, j)] > 0) {
                    tileHeight = 2
                }
                if (design != undefined && design[this.getTileNr(i, j)] > 0) {
                    designBoolean = true
                    linkToTileSet = this.tilesetDesignImage

                }
                this.tileData[i][j] = {
                    walkable: walkable,
                    height: tileHeight,
                    tileSetX: (tileSetNr % this.tilesPerRow) * this.tilelength,
                    tileSetY: (Math.floor(tileSetNr / this.tilesPerRow) * this.tilelength),
                    tileMapX: j * this.tilelength,
                    tileMapY: i * this.tilelength,
                    design: {
                        designBoolean: designBoolean,
                        linkToTileSet: linkToTileSet,
                        tileSetX: (tileSetNrDesign % this.tilesPerRowDesign) * this.tilelength,
                        tileSetY: (Math.floor(tileSetNrDesign / this.tilesPerRowDesign) * this.tilelength),

                    }
                }
            }
        }
    }

    isTileOutOfBorder(tileRowWalker, tileColumnWalker,) {
        return (tileColumnWalker < 0 || tileColumnWalker >= this.mapWidthTile || tileRowWalker < 0 || tileRowWalker >= this.mapHeightTile);
    }

    getTileNr(row, column) {

        return row * this.mapWidthTile + column /* jedes Tile/Kachel hat eine eigene Nr  nach dem Prinzip   1  2   3   4
                                                                                                            5  6   7   8
                                                                                                            9  10  11  12  */

    }

    offsetToBorder(offset) {
        let holder = (offset % this.tilelength)
        if (holder < 0) return holder * -1;      //holder wird negativ, wenn die Border erreicht wird, da die Koords ins negative gehen. Daher die Lösung mit return holder

        return this.tilelength - holder;
    }

    drawTile(tileRowWalker, tileColumnWalker, leftBorder, topBorder, i, j) {
        
        i = Math.floor(i);      //subPixelRendering, ohne das gibt es weiße Linien auf dem Canvas
        j = Math.floor(j);
        if (!(this.isTileOutOfBorder(tileRowWalker, tileColumnWalker))) {
            let leftOffset = this.tilelength - this.offsetToBorder(leftBorder)
            let topOffset = this.tilelength - this.offsetToBorder(topBorder)                                //Wie viel von dem TileSetTile gezeichnet werden muss, falls oben am Bildrand nur die hälft z.B. gezeichnet wurde
            let tile = this.tileData[tileRowWalker][tileColumnWalker]
            this.ctx.drawImage(this.tilesetImage,                                      //Datei aus der das Tile stammt
                tile.tileSetX + leftOffset,                                               //X Koordinate im TileSet
                tile.tileSetY + topOffset,                                               //Y Koordinate im TileSet
                this.offsetToBorder(leftBorder),                        //Breite des Ausgeschnittenen Tiles
                this.offsetToBorder(topBorder),                         //Höhe des Ausgeschnittenen Tiles
                i,                                                      //X Position im Canvas
                j,                                                      //Y Position im Canvas
                this.offsetToBorder(leftBorder),                        //Breite im Canvas
                this.offsetToBorder(topBorder))                         //Höhe im Canvas
            if (tile.design.designBoolean) {
                this.ctx.drawImage(tile.design.linkToTileSet,                          //Datei aus der das Tile stammt
                    tile.design.tileSetX + leftOffset,                             //X Koordinate im TileSet
                    tile.design.tileSetY + topOffset,                              //Y Koordinate im TileSet
                    this.offsetToBorder(leftBorder),                        //Breite des Ausgeschnittenen Tiles
                    this.offsetToBorder(topBorder),                         //Höhe des Ausgeschnittenen Tiles
                    i,                                                      //X Position im Canvas
                    j,                                                      //Y Position im Canvas
                    this.offsetToBorder(leftBorder),                        //Breite im Canvas
                    this.offsetToBorder(topBorder))                         //Höhe im Canvas
            }
        }
    }

    draw(player) {
        if (this.miniMapLoaded && this.tilesLoaded && this.tilesDesignLoaded) {
            let leftBorder = player.globalEntityX - this.FOVwidth / 2
            let topBorder = player.globalEntityY - this.FOVheight / 2
            let tileRow = Math.floor(topBorder / this.tilelength)
            let tileRowWalker = tileRow
            let tileColumn = Math.floor(leftBorder / this.tilelength)
            let tileColumnWalker = tileColumn


            this.drawTile(tileRowWalker, tileColumnWalker, leftBorder, topBorder, 0, 0)                //Zeichnen des obersten Tiles

            for (let i = this.offsetToBorder(leftBorder); i < this.FOVwidth; i += this.tilelength) {
                tileColumnWalker++
                this.drawTile(tileRowWalker, tileColumnWalker, 0, topBorder, i, 0)                      //Zeichnen der obersten Reihe
            }

            for (let j = this.offsetToBorder(topBorder); j < this.FOVheight; j += this.tilelength) {
                tileRowWalker++
                tileColumnWalker = tileColumn
                this.drawTile(tileRowWalker, tileColumnWalker, leftBorder, 0, 0, j)                     //Zeichnen der linken Reihe

                for (let i = this.offsetToBorder(leftBorder); i < this.FOVwidth; i += this.tilelength) {
                    tileColumnWalker++
                    this.drawTile(tileRowWalker, tileColumnWalker, 0, 0, i, j)                          //Zeichnen der inneren Tiles
                }
            }
            
        }
    }

    drawMiniMap(player) {
        if (!this.miniMapLoaded) return 

   
        this.ctx.fillStyle = 'black'     // rahmen hintergrund
        this.ctx.fillRect(this.miniMapX-4, this.miniMapY-4, this.miniMapWidth+8, this.miniMapHeight+8)
        this.ctx.strokeStyle = 'white'       //Rahmen
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(this.miniMapX-4, this.miniMapY-4, this.miniMapWidth+8, this.miniMapHeight+8)

        let startTileX = player.globalEntityX / this.tilelength - this.miniMapTileView / 2      // Ausschnitt berechnen, dass Spieler in der Mitte ist
        let startTileY = player.globalEntityY / this.tilelength - this.miniMapTileView / 2
        startTileX = Math.max(0, Math.min(startTileX, this.mapWidthTile - this.miniMapTileView)) //damit die Map am Maprand stehen bleibt und nicht wie der Bildauschnitt sich bewegt
        startTileY = Math.max(0, Math.min(startTileY, this.mapHeightTile - this.miniMapTileView))

       
        this.ctx.drawImage( // MiniMap-Ausschnitt zeichnen
            this.mapImage,      //Bild
            startTileX * this.miniMapTilePixelSizeX, startTileY * this.miniMapTilePixelSizeY,     // startkoords im Bild
            this.mapCutWidth, this.mapCutHeight,    //Ausschnitt größe
            this.miniMapX, this.miniMapY,   //Startpunkt auf dem Canvas
            this.miniMapWidth, this.miniMapHeight   //größe auf dem Canvas
        )

        this.ctx.fillStyle = 'red'
        this.ctx.fillRect(
            this.miniMapX + (player.globalEntityX - startTileX * this.tilelength) * (this.miniMapWidth / (this.miniMapTileView * this.tilelength)) - 2,  //startkoordinateX
            this.miniMapY + (player.globalEntityY - startTileY * this.tilelength) * (this.miniMapHeight / (this.miniMapTileView * this.tilelength)) - 2, //startkoordinateY
            4, 4)                                       //Player größe
    }

    drawSqr(x, y, width, height, color) {
        let multiplier = 1
        this.ctx.beginPath()
        this.ctx.rect(x / this.tilelength * multiplier, y / this.tilelength * multiplier, width * multiplier, height * multiplier)
        this.ctx.fillStyle = color
        this.ctx.fill()
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    render(player){
        this.draw(player)
        this.drawMiniMap(player)
    }
}
