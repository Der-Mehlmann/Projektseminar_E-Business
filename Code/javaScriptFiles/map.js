export class Map {

    constructor(mapData, png, FOVwidth, FOVheight, ctx) {
        this.mapWidthTile = mapData.width
        this.mapHeightTile = mapData.height
        this.tilelength = mapData.tilewidth
        this.miniMapWidth = 200
        this.miniMapHeight = 150 
        this.miniMapX = 10           
        this.miniMapY = 60 
        this.mapImage = new Image()
        this.miniMapLoaded = false
        this.mapImage.onload = () => {
            this.miniMapTilePixelSizeX = this.mapImage.width / this.mapWidthTile
            this.miniMapTilePixelSizeY = this.mapImage.height / this.mapHeightTile
            this.mapCutHeight = this.miniMapTileView * this.miniMapTilePixelSizeY
            this.mapCutWidth = this.miniMapTileView * this.miniMapTilePixelSizeX 
            this.miniMapLoaded = true
        }
        this.mapDataTilesets = mapData.tilesets.length
        this.miniMapTileView = 75 
        this.FOVwidth = FOVwidth
        this.FOVheight = FOVheight
        this.ctx = ctx
        this.mapDataTiles = mapData.layers
        this.mapDataTilesetsData = mapData.tilesets
        this.tilesetImage = []
        this.tilesSetsLoaded = []
        this.tileDataLoaded = false
        this.tileData = []
        this.tilesPerRow = []
        for  (let i = 0; i < this.mapDataTilesets; i++) {
            this.tilesetImage[i] = new Image()
        }
          for  (let i = 0; i < this.mapDataTilesets; i++) {
            this.tilesetImage[i].onload = () => {
            this.tilesSetsLoaded[i] = true;            
            this.tilesPerRow[i] = Math.round(this.tilesetImage[i].width / this.tilelength)            
            }

            this.tilesetImage[i].src = mapData.tilesets[i].image
            }
        
        this.loadTileData(mapData)
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

        if (!this.tileData[row] || !this.tileData[row][column]) {
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

    loadTileData(mapData, tilesetImage) {
        let hoehe0 = null
        let hoehe1 = null
        let hoehe2 = null
        let wall = null
        let design = null
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
                    break;
            }
        }
        for (let i = 0; i < this.mapHeightTile; i++) {
            this.tileData[i] = []
            for (let j = 0; j < this.mapWidthTile; j++) {
                let tileHeight = 0
                let walkable = true
                let designBoolean = false
                let linkToTileSet = null
                let linkToTileSetDesign = null
                let tilesPerRow = null
                let tilesPerRowDesign = null
                let linkToTileSetDesignIndex = null
                let tileSetNr = null
                if (design != null) {
                    tileSetNrDesign = design[this.getTileNr(i, j)] -1}
                if (hoehe0 != null && hoehe0[this.getTileNr(i, j)] > 0) {
                    linkToTileSet = this.getTilesetPathByNr(hoehe0[this.getTileNr(i, j)])
                    tilesPerRow = Math.round(linkToTileSet.data.imagewidth / this.tilelength)
                    tileSetNr = hoehe0[this.getTileNr(i, j)] - linkToTileSet.data.firstgid
                }       
                if (wall != null && wall[this.getTileNr(i, j)] > 0) {
                    walkable = false
                    linkToTileSet = this.getTilesetPathByNr(wall[this.getTileNr(i, j)])
                    tilesPerRow = Math.round(linkToTileSet.data.imagewidth / this.tilelength)
                    //tileSetNr = wall[this.getTileNr(i, j)] - linkToTileSet.data.firstgid
                } else if (hoehe1 != null && hoehe1[this.getTileNr(i, j)] > 0) {
                    tileHeight = 1
                    linkToTileSet = this.getTilesetPathByNr(hoehe1[this.getTileNr(i, j)])
                    tilesPerRow = Math.round(linkToTileSet.data.imagewidth / this.tilelength)
                    //tileSetNr = hoehe1[this.getTileNr(i, j)] - linkToTileSet.data.firstgid
                } else if (hoehe2 != null && hoehe2[this.getTileNr(i, j)] > 0) {
                    tileHeight = 2
                    linkToTileSet = this.getTilesetPathByNr(hoehe2[this.getTileNr(i, j)])
                    tilesPerRow = Math.round(linkToTileSet.data.imagewidth / this.tilelength)
                    //tileSetNr = hoehe2[this.getTileNr(i, j)] - linkToTileSet.data.firstgid
                }
                if (design != undefined && design[this.getTileNr(i, j)] > 0) {
                    designBoolean = true
                    linkToTileSetDesign = this.getTilesetPathByNr(design[this.getTileNr(i, j)])
                    tilesPerRowDesign = Math.round(linkToTileSetDesign.data.imagewidth / this.tilelength)
                    linkToTileSetDesignIndex = linkToTileSetDesign.index
                    tileSetNrDesign = design[this.getTileNr(i, j)] - linkToTileSetDesign.data.firstgid
                }
                //console.log(linkToTileSetDesign)
                //console.log(tilesPerRow[1])
                
                this.tileData[i][j] = {
                    walkable: walkable,
                    height: tileHeight,
                    tileSetX: (tileSetNr % tilesPerRow) * this.tilelength,
                    tileSetY: (Math.floor(tileSetNr / tilesPerRow) * this.tilelength),
                    tileMapX: j * this.tilelength,
                    tileMapY: i * this.tilelength,
                    linkToTileSet: linkToTileSet,
                    design: {
                        linkToTileSetDesign: linkToTileSetDesign,
                        designBoolean: designBoolean,
                        tileSetX: (tileSetNrDesign % tilesPerRowDesign) * this.tilelength,
                        tileSetY: (Math.floor(tileSetNrDesign / tilesPerRowDesign) * this.tilelength),

                    }
                }
            }
        }
        this.tileDataLoaded = true
    }

    
    getTilesetPathByNr(tileNr) {
        if (tileNr <= 0) return null;
        for (let i = 0; i < this.mapDataTilesets-1 ; i++) {
            if (tileNr < this.mapDataTilesetsData[i+1].firstgid) {
                return {data :this.mapDataTilesetsData[i] , index : i};
            }
        }
        return {data :this.mapDataTilesetsData[this.mapDataTilesets-1] , index : this.mapDataTilesets-1};
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
            this.ctx.drawImage(this.tilesetImage[tile.linkToTileSet.index],                                      //Datei aus der das Tile stammt
                tile.tileSetX + leftOffset,                                               //X Koordinate im TileSet
                tile.tileSetY + topOffset,                                               //Y Koordinate im TileSet
                this.offsetToBorder(leftBorder),                        //Breite des Ausgeschnittenen Tiles
                this.offsetToBorder(topBorder),                         //Höhe des Ausgeschnittenen Tiles
                i,                                                      //X Position im Canvas
                j,                                                      //Y Position im Canvas
                this.offsetToBorder(leftBorder),                        //Breite im Canvas
                this.offsetToBorder(topBorder))                         //Höhe im Canvas
            if (tile.design.designBoolean) {
                this.ctx.drawImage(this.tilesetImage[tile.design.linkToTileSetDesign.index],                          //Datei aus der das Tile stammt
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
        if (this.miniMapLoaded && this.tilesSetsLoaded.every(v => v === true) && this.tileDataLoaded) {
            let leftBorder = Math.floor(player.globalEntityX - this.FOVwidth / 2)//Math.floor verhindern subPixelRendering --> flackern
            let topBorder = Math.floor(player.globalEntityY - this.FOVheight / 2)
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
        startTileX = Math.floor(startTileX)
        startTileY = Math.floor(startTileY)
       
        this.ctx.drawImage( // MiniMap-Ausschnitt zeichnen
            this.mapImage,      //Bild
            startTileX * this.miniMapTilePixelSizeX, startTileY * this.miniMapTilePixelSizeY,     // startkoords im Bild
            this.mapCutWidth, this.mapCutHeight,    //Ausschnitt größe
            this.miniMapX, this.miniMapY,   //Startpunkt auf dem Canvas
            this.miniMapWidth, this.miniMapHeight   //größe auf dem Canvas
        )

        this.ctx.fillStyle = 'red'
        this.ctx.fillRect(
            Math.floor(this.miniMapX + (player.globalEntityX - startTileX * this.tilelength) * (this.miniMapWidth / (this.miniMapTileView * this.tilelength)) - 2),  //startkoordinateX
            Math.floor(this.miniMapY + (player.globalEntityY - startTileY * this.tilelength) * (this.miniMapHeight / (this.miniMapTileView * this.tilelength)) - 2), //startkoordinateY
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
