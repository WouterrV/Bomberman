



function spawnExamplePlayer(lvlStage, x, y, zIndex = 0, speed = 0.1) {
    return new ExamplePlayer(lvlStage, x, y, zIndex, speed)
}

function spawnExampleGame(app, lvlString) {
    return new ExampleGame(app, lvlString)
}


class ExamplePlayer {

    constructor(lvlStage, x, y, zIndex = 0, speed = 1) {
        this.x = x
        this.y = y
        if(!isNumber(this.x)) {
            logError("ExamplePlayer: x is not a number:")
            logError(this.x)
        }
        if(!isNumber(this.y)) {
            logError("ExamplePlayer: y is not a number:")
            logError(this.y)
        }

        // TODO: make configurable dependent
        this.keyLeft   = 'left'
        this.keyRight  = 'right'
        this.keyUp     = 'up'
        this.keyDown   = 'down'

        this.speed = speed
        

        this.lvlStage = lvlStage

        this.setupSprite(zIndex)
    }

    setupSprite(zIndex) {
        // hardcoded tile sheet info
        const allTilesTexture = PIXI.Texture.from('isometricTiles')
        var sheetWidth = 11
        var sheetHeight = 10

        const texture = new PIXI.Texture(allTilesTexture, getAnimationFrameRectangle(        allTilesTexture, 
                    sheetWidth, 
                    sheetHeight, 
                    //tile column
                    2,
                    //tile row
                    2
                    )
            )
        // TODO: move sprite code to game as well
        this.sprite = new PIXI.Sprite(texture)
        this.sprite.anchor._x = 0.5
        this.sprite.anchor._y = 0.5
        // this.sprite.scale.set(3,3)
        this.sprite.scale.set(1,1)
        this.sprite.zIndex = zIndex
    }

    setX(x) {
        this.x = x
    }
    setY(y) {
        this.y = y
    }

    moveX(x) {
        this.x += x
    }
    moveY(y) {
        this.y += y
    }



    updateIsometricPos() {
        this.sprite.x = this.lvlStage.getIsometricX(this.x, this.y)
        this.sprite.y = this.lvlStage.getIsometricY(this.x, this.y)
    }

    updateMovementDirection() {
        this.moving = ""
        if(keyPressed(this.keyLeft)) {
            this.moving = "left"
        } else if(keyPressed(this.keyRight)) {
            this.moving += "right"
        }
        if(keyPressed(this.keyUp)) {
            this.moving += "up"
        } else if(keyPressed(this.keyDown)) {
            this.moving += "down"
        }
    }

    clunckyMovement() {
        if(keyPressed('left')) {
            this.x -= this.speed
        }
        if(keyPressed('right')) {
            this.x += this.speed
        }
        if(keyPressed('up')) {
            this.y += this.speed
        }
        if(keyPressed('down')) {
            this.y -= this.speed
        }
    }
}
let leftUpCorner    = {x:-0.5, y: 0.5 }
let leftDownCorner  = {x:-0.5, y:-0.5 }
let rightUpCorner   = {x: 0.5, y: 0.5 }
let rightDownCorner = {x: 0.5, y:-0.5 }
let leftSide        = {x:-0.5, y: 0   }
let rightSide       = {x: 0.5, y: 0   }
let downSide        = {x:   0, y:-0.5 }
let upSide          = {x:   0, y: 0.5 }
let center          = 0.5
let centerCoord     = { x: 0.5, y: 0.5}

// let standardPlayerSpeed = 0.05 
let standardPlayerSpeed = 0.1
class ExampleGame {

    constructor(app, levelString) {
        this.tileColumns = levelString.length
        this.tileRows = levelString[0].length

        console.log(this.tileColumns, this.tileRows)

        this.level = new ExampleLevel(levelString)
        app.stage.addChild(this.level.container)
        this.player = new ExamplePlayer(this.level.isoStage, this.tileColumns/2, this.tileRows/2, 100, standardPlayerSpeed)
        console.log('player', this.player.sprite)
        console.log('level', this.level.container)
        this.level.addChild(this.player.sprite)

        this.setupCollisionMap(levelString)

        this.initializeVars()
    }

    initializeVars () {
        this.unaccountedDeltaTime = 0
    }

    setupCollisionMap(levelString) {
        this.collisionMap = new ExampleCollisionMap(this.tileColumns, this.tileRows)
        for(var x = 0; x < levelString.length; x++) {
            for(var y = 0; y < levelString[x].length; y++) {
                switch(levelString[x][y]) {

                    case '.':
                        this.collisionMap.setValue(x, y, 0)
                    break;

                    case 'c':
                        this.collisionMap.setValue(x, y, 1)
                    break;

                    case 'C':
                        this.collisionMap.setValue(x, y, 2)
                    break;

                    case 'w':
                        this.collisionMap.setValue(x, y, 5)
                    break;

                }
            }
        }
    }

    runMechanics(newDelta) {
        this.player.updateMovementDirection()

        let currentDelta = this.unaccountedDeltaTime+newDelta

        for(var i = 0; i < currentDelta; i++)
            this.checkPlayerCollision(this.player)

        this.unaccountedDeltaTime = getFraction(currentDelta)
            
        this.readyForRender()
    }

    readyForRender() {
        this.player.updateIsometricPos()
    }

    collides(cornerPlusSpeedOffset) {
        var tileValue = this.collisionMap.checkValue(cornerPlusSpeedOffset.x, cornerPlusSpeedOffset.y)
        if (tileValue > 0)
            return true

        return false
    }

    handleSide(coord1, coordMid, coord2) {
        let collide1   = this.collides(coord1)
        let collideMid = this.collides(coordMid)
        let collide2   = this.collides(coord2)

        if (collide1 && collide2) {
            if(collideMid) {
                return "allPointsCollide"
            } else 
                return "collide1And2"
        } else if (collide1) {
            if(collideMid)
                return "collideMidAnd1"
            else
                return "collide1"
        } else if (collide2) {
            if(collideMid)
                return "collideMidAnd2"
            else
                return "collide2"
        } else if (collideMid) {
            return "collideMid"
        } else {
            return "noCollision"
        }
    }

    checkPlayerCollision(player) {
        let isometricMovement = convertToIsometricDirectionName(player.moving)

        if (isometricMovement == "left") {
            this.handleLeftMovement(player)
        } else if (isometricMovement == "right") {
            this.handleRightMovement(player)
        } else if (isometricMovement == "down") {
            this.handleDownMovement(player)
        } else if (isometricMovement == "up") {
            this.handleUpMovement(player)
        } else if (isometricMovement == "leftup") {
            this.handleLeftUpMovement(player)
        } else if (isometricMovement == "rightup") {
            this.handleRightUpMovement(player)
        } else if (isometricMovement == "leftdown") {
            this.handleLeftDownMovement(player)
        } else if (isometricMovement == "rightdown") {
            this.handleRightDownMovement(player)
        }


        this.keepPlayerInLevel(player)
    }

    handleLeftUpMovement(player) {
        let dPos = {x: player.x - player.speed, y: player.y + player.speed}
        let coord1          = addCoord(leftSide, dPos)
        let coordMid        = addCoord(leftUpCorner, dPos)
        let coord2          = addCoord(upSide, dPos)
        switch(this.handleSide(coord1, coordMid, coord2)) {
            case "collideMid":
                importantLog("leftup: collideMid")
                if(closerToCenter(coord1, coord2)) {
                    player.moveX(-player.speed)
                } else 
                    player.moveY(player.speed)
            break;
            case "collide1And2":
                console.log("leftup: collide1And2")
                player.moveX(-player.speed*Math.SQRT1_2)
                player.moveY(player.speed*Math.SQRT1_2)
            break;

            case "collideMidAnd1":
                console.log("leftup: collideMidAnd1")
                player.moveY(player.speed)
            break;
            case "collideMidAnd2":
                console.log("leftup: collideMidAnd2")
                player.moveX(-player.speed)
            break;
            case "collide1":
                console.log("leftup: collide1")
                centerFromUpOrContinue()
            break;
            case "collide2":
                console.log("leftup: collide2")
                centerFromLeftOrContinue()
            break;
            case "allPointsCollide":
                let corner1Col = this.collides(addCoord(leftDownCorner, dPos))
                let corner2Col = this.collides(addCoord(rightUpCorner, dPos))
                if (corner1Col && corner2Col) {
                    // move nothing
                } else if (corner1Col) {
                    centerFromUpOrContinue()
                } else if (corner2Col) {
                    centerFromLeftOrContinue()
                }
            break;
            case "noCollision":
                player.moveX(-player.speed*Math.SQRT1_2)
                player.moveY(player.speed*Math.SQRT1_2)
            break;
        }

        function centerFromUpOrContinue () {
            if(isCenteredFromUp(player.y, player.speed)) {
                player.moveX(-player.speed*Math.SQRT1_2)
                player.moveY(player.speed*Math.SQRT1_2)
            } else {
                // left Up coll, so move down
                player.moveY(player.speed)
            }
        }

        function centerFromLeftOrContinue () {
            if(isCenteredFromLeft(player.y, player.speed)) {
                player.moveX(-player.speed*Math.SQRT1_2)
                player.moveY(player.speed*Math.SQRT1_2)
            } else {
                // right Down coll, so move left
                player.moveX(-player.speed)
            }
        }
    }

    handleRightUpMovement(player) {
        let dPos = {x: player.x + player.speed, y: player.y + player.speed}
        let coord1          = addCoord(upSide, dPos)
        let coordMid        = addCoord(rightUpCorner, dPos)
        let coord2          = addCoord(rightSide, dPos)
        switch(this.handleSide(coord1, coordMid, coord2)) {
            case "collideMid":
                importantLog("rightup: collideMid")
                if(closerToCenter(coord1, coord2)) {
                    player.moveY(player.speed)
                } else 
                    player.moveX(player.speed)
            break;
            case "collide1And2":
                console.log("rightup: collide1And2")
                player.moveX(player.speed*Math.SQRT1_2)
                player.moveY(player.speed*Math.SQRT1_2)
            break;
            case "collideMidAnd1":
                console.log("rightup: collideMidAnd1")
                player.moveX(player.speed)
            break;
            case "collideMidAnd2":
                console.log("rightup: collideMidAnd2")
                player.moveY(player.speed)
            break;
            case "collide1":
                console.log("rightup: collide1")
                centerFromRightOrContinue() 
            break;
            case "collide2":
                console.log("rightup: collide2")
                centerFromUpOrContinue()
            break;
            case "allPointsCollide":
                let corner1Col = this.collides(addCoord(leftUpCorner, dPos))
                let corner2Col = this.collides(addCoord(rightDownCorner, dPos))
                if (corner1Col && corner2Col) {
                    // move nothing
                } else if (corner1Col) {
                    centerFromRightOrContinue()
                } else if (corner2Col) {
                    centerFromUpOrContinue()
                }
            break;
            case "noCollision":
                player.moveX(player.speed*Math.SQRT1_2)
                player.moveY(player.speed*Math.SQRT1_2)
            break;
        }

        function centerFromRightOrContinue() {
            if(isCenteredFromRight(player.y, player.speed)) {
                player.moveX(player.speed*Math.SQRT1_2)
                player.moveY(player.speed*Math.SQRT1_2)
            } else {
                // left Up coll, so move right
                player.moveX(player.speed)
            }
        }

        function centerFromUpOrContinue() {
            if(isCenteredFromUp(player.y, player.speed)) {
                player.moveX(player.speed*Math.SQRT1_2)
                player.moveY(player.speed*Math.SQRT1_2)
            } else {
                // right Down coll, so move up
                player.moveY(player.speed)
            }
        }
    }

    handleLeftDownMovement(player) {
        let dPos = {x: player.x - player.speed, y: player.y - player.speed}
        let coord1          = addCoord(downSide, dPos)
        let coordMid        = addCoord(leftDownCorner, dPos)
        let coord2          = addCoord(leftSide, dPos)
        switch(this.handleSide(coord1, coordMid, coord2)) {
            case "collideMid":
                if(closerToCenter(coord1, coord2)) {
                    player.moveY(-player.speed)
                } else 
                    player.moveX(-player.speed)
            break;
            case "collide1And2":
                player.moveX(-player.speed*Math.SQRT1_2)
                player.moveY(-player.speed*Math.SQRT1_2)
            break;
            
            case "collide1":
                centerFromDownOrContinue()
            break;
            case "collide2":
                centerFromLeftOrContinue()
            break;
            case "collideMidAnd1":
                player.moveX(-player.speed)
            break;
            case "collideMidAnd2":
                player.moveY(-player.speed)
            break;
            case "allPointsCollide":
                let corner1Col = this.collides(addCoord(rightDownCorner, dPos))
                let corner2Col = this.collides(addCoord(leftUpCorner, dPos))
                if (corner1Col && corner2Col) {
                    // move nothing
                } else if (corner1Col) {
                    centerFromDownOrContinue()
                } else if (corner2Col) {
                    centerFromLeftOrContinue()
                }
            break;
            case "noCollision":
                player.moveX(-player.speed*Math.SQRT1_2)
                player.moveY(-player.speed*Math.SQRT1_2)
            break;
        }

        function centerFromDownOrContinue() {
            if(isCenteredFromDown(player.y, player.speed)) {
                player.moveX(-player.speed*Math.SQRT1_2)
                player.moveY(-player.speed*Math.SQRT1_2)
            } else {
                // right Down coll, so move left
                player.moveX(-player.speed)
            }
        }

        function centerFromLeftOrContinue() {
            if(isCenteredFromLeft(player.y, player.speed)) {
                player.moveX(-player.speed*Math.SQRT1_2)
                player.moveY(-player.speed*Math.SQRT1_2)
            } else {
                // left Up coll, so move down
                player.moveY(-player.speed)
            }
        }
    }

    handleRightDownMovement(player) {
        let dPos = {x: player.x + player.speed, y: player.y - player.speed}
        let coord1          = addCoord(rightSide, dPos)
        let coordMid        = addCoord(rightDownCorner, dPos)
        let coord2          = addCoord(downSide, dPos)
        switch(this.handleSide(coord1, coordMid, coord2)) {
            case "collideMid":
                if(closerToCenter(coord1, coord2)) {
                    player.moveX(player.speed)
                } else 
                    player.moveY(-player.speed)
            break;
            case "collide1And2":
                player.moveX(player.speed*Math.SQRT1_2)
                player.moveY(-player.speed*Math.SQRT1_2)
            break;
            case "collideMidAnd1":
                player.moveY(-player.speed)
            break;
            case "collideMidAnd2":
                player.moveX(player.speed)
            break;
            case "collide1":
                centerFromRightOrContinue()
            break;
            case "collide2":
                centerFromDownOrContinue()
            break;
            case "allPointsCollide":
                let corner1Col = this.collides(addCoord(rightUpCorner, dPos))
                let corner2Col = this.collides(addCoord(leftDownCorner, dPos))
                if (corner1Col && corner2Col) {
                    // move nothing
                } else if (corner1Col) {
                    centerFromRightOrContinue()
                } else if (corner2Col) {
                    centerFromDownOrContinue()
                }
            break;
            case "noCollision":
                console.log("rightdown: noCollision")
                player.moveX(player.speed*Math.SQRT1_2)
                player.moveY(-player.speed*Math.SQRT1_2)
            break;
        }

        function centerFromRightOrContinue() {
            if(isCenteredFromRight(player.y, player.speed)) {
                player.moveX(player.speed*Math.SQRT1_2)
                player.moveY(-player.speed*Math.SQRT1_2)
            } else {
                // right coll, so move down
                player.moveY(-player.speed)
            }
        }
        function centerFromDownOrContinue() {
            if(isCenteredFromDown(player.y, player.speed)) {
                player.moveX(player.speed*Math.SQRT1_2)
                player.moveY(-player.speed*Math.SQRT1_2)
            } else {
                // down coll, so move right
                player.moveX(player.speed)
            }
        }
    }
    
    // ===============================================================
    // ================== single direction ===========================
    // ===============================================================
    handleLeftMovement(player) {
        let dPos = {x: player.x - player.speed, y: player.y}
        let coord1          = addCoord(leftDownCorner, dPos)
        let coordMid        = addCoord(leftSide, dPos)
        let coord2          = addCoord(leftUpCorner, dPos)
        switch(this.handleSide(coord1, coordMid, coord2)) {
            case "collideMid":
                importantLog("left: collideMid")
            break;
            case "collide1And2":
                player.moveX(-player.speed)
            break;
            case "allPointsCollide":
                // move nothing
            break;
            case "collide1":
                if(isCenteredFromDown(player.y, player.speed)) {
                    player.moveX(-player.speed)
                } else {
                    // left Down coll, so move up
                    player.moveY(player.speed)
                }
            break;
            case "collide2":
                if(isCenteredFromUp(player.y, player.speed)) {
                    player.moveX(-player.speed)
                } else {
                    // left Up coll, so move down
                    player.moveY(-player.speed)
                }
            break;
            case "collideMidAnd1":
                // move nothing
            break;
            case "collideMidAnd2":
                // move nothing
            break;
            case "noCollision":
                player.moveX(-player.speed)
            break;

        }
    }

    
    handleRightMovement(player) {
        let dPos = {x: player.x + player.speed, y: player.y}
        let coord1          = addCoord(rightUpCorner, dPos)
        let coordMid        = addCoord(rightSide, dPos)
        let coord2          = addCoord(rightDownCorner, dPos)
        switch(this.handleSide(coord1, coordMid, coord2)) {
            case "collideMid":
                importantLog("right: collideMid")
            break;
            case "collide1And2":
                player.moveX(player.speed)
            break;
            case "allPointsCollide":
                // move nothing
            break;
            case "collide1":
                if(isCenteredFromUp(player.y, player.speed)) {
                    player.moveX(player.speed)
                } else {
                    // right Up coll, so move down
                    player.moveY(-player.speed)
                }
            break;
            case "collide2":
                if(isCenteredFromDown(player.y, player.speed)) {
                    player.moveX(player.speed)
                } else {
                    // right Down coll, so move up
                    player.moveY(player.speed)
                }
            break;
            case "collideMidAnd1":
                // move nothing
            break;
            case "collideMidAnd2":
                // move nothing
            break;
            case "noCollision":
                player.moveX(player.speed)
            break;
        }
    }


    handleDownMovement(player) {
        let dPos = { x: player.x, y: player.y - player.speed }
        let coordLeftDown    = addCoord(leftDownCorner, dPos)
        let coordDown        = addCoord(downSide, dPos)
        let coordRightDown   = addCoord(rightDownCorner, dPos)
        switch(this.handleSide(coordLeftDown, coordDown, coordRightDown)) {
            case "collideMid":
                importantLog("down: collideMid")
            break;
            case "collide1And2":
                player.moveY(-player.speed)
            break;
            case "allPointsCollide":
                // move nothing
                // player.center()
            break;
            case "collide1":
                if (isCenteredFromRight(player.x, player.speed)) {
                    player.moveY(-player.speed)
                } else {
                    // left down coll, so move right
                    player.moveX(player.speed)
                }
            break;
            case "collide2":
                if (isCenteredFromLeft(player.x, player.speed)) {
                    player.moveY(-player.speed)
                } else {
                    // right down coll, so move left
                    player.moveX(-player.speed)
                }
            break;
            case "collideMidAnd1":
            break;
            case "collideMidAnd2":
            break;
            case "noCollision":
                player.moveY(-player.speed)
            break;

        }
    }

    handleUpMovement(player) {
        let dPos = {x: player.x, y: player.y + player.speed}
        let coord1          = addCoord(leftUpCorner, dPos)
        let coordMid        = addCoord(upSide, dPos)
        let coord2          = addCoord(rightUpCorner, dPos)
        switch(this.handleSide(coord1, coordMid, coord2)) {
            case "collideMid":
                importantLog("up: collideMid")
            break;
            case "collide1And2":
                player.moveY(player.speed)
            break;
            case "allPointsCollide":
                // move nothing
            break;
            case "collide1":
                if(isCenteredFromLeft(player.x, player.speed)) {
                    player.moveY(player.speed)
                } else {
                    // up Down coll, so move up
                    player.moveX(player.speed)
                }
            break;
            case "collide2":
                if(isCenteredFromRight(player.x, player.speed)) {
                    player.moveY(player.speed)
                } else {
                    // up Up coll, so move down
                    player.moveX(-player.speed)
                }
            break;
            case "collideMidAnd1":
                // move nothing
            break;
            case "collideMidAnd2":
                // move nothing
            break;
            case "noCollision":
                player.moveY(player.speed)
            break;

        }
    }

    keepPlayerInLevel(player) {
        var tileMarge = 1
        if(player.x + tileMarge >= this.tileColumns)
            player.x = this.tileColumns - tileMarge
        if(player.x - tileMarge <= 0)
            player.x = 0 + tileMarge

        if(player.y + tileMarge >= this.tileRows)
            player.y = this.tileRows - tileMarge
        if(player.y - tileMarge <= 0)
            player.y = 0 + tileMarge
    }
}


class ExampleLevel {
    constructor(lvlString) {
        
        this.setupTiles(lvlString)

    }

    addChild(child) {
        this.container.addChild(child)
    }

    setupTiles(lvlString) {
        this.container = new PIXI.Container()
        this.container.x = viewPortWidth/2
        this.container.y = viewPortHeight/2
        this.tiles = []
        this.currentZIndex = 0

        // hardcoded tile sheet info
        const allTilesTexture = PIXI.Texture.from('isometricTiles')
        var sheetWidth = 11
        var sheetHeight = 10

        var scale = 3
        var tileWidth  = Math.floor((allTilesTexture.width /sheetWidth) *scale/2)
        var tileHeight = Math.floor((allTilesTexture.height/sheetHeight)*scale/2)
        this.isoStage = new IsoStage(this.container, tileWidth, tileWidth, scale)


        let tileColumns = levelString.length
        let tileRows = levelString[0].length
        let texture;
        for(var x = 0; x < levelString.length; x++) {
            this.tiles[x] = []
            for(var y = 0; y < levelString[x].length; y++) {
                // const tileType = Math.random()>0.15 ? {x: 1, y: 1 } : {x: 1, y: 0}
                switch(levelString[x][y]) {

                    case '.':
                        texture = new PIXI.Texture(
                            allTilesTexture, 
                            getAnimationFrameRectangle(allTilesTexture, 
                                    sheetWidth, 
                                    sheetHeight, 
                                    //tile column
                                    1,
                                    //tile row
                                    1
                                    )
                            )
                    break;
                    case 'c':
                        texture = new PIXI.Texture(
                            allTilesTexture, 
                            getAnimationFrameRectangle(allTilesTexture, 
                                    sheetWidth, 
                                    sheetHeight, 
                                    //tile column
                                    1,
                                    //tile row
                                    0
                                    )
                            )
                    break;

                    case 'C':
                        texture = new PIXI.Texture(
                            allTilesTexture, 
                            getAnimationFrameRectangle(allTilesTexture, 
                                    sheetWidth, 
                                    sheetHeight,
                                    //tile column
                                    0,
                                    //tile row
                                    2
                                    )
                            )
                    break;

                    case 'w':
                        texture = new PIXI.Texture(
                            allTilesTexture, 
                            getAnimationFrameRectangle(allTilesTexture, 
                                    sheetWidth, 
                                    sheetHeight, 
                                    //tile column
                                    0,
                                    //tile row
                                    2
                                    )
                            )
                    break;

                }
                this.newTile(texture, x, y, this.currentZIndex--, scale)
            }
        }

    }

    newTile(texture, x, y, zIndex, scale) {
        
        const tile = new PIXI.Sprite(texture)
        tile.scale.set(scale, scale);
        tile.x = this.isoStage.getIsometricX(x, y)
        tile.y = this.isoStage.getIsometricY(x, y)
        
        tile.anchor._x = 0.5 
        tile.anchor._y = 0.5
        tile.zIndex = zIndex
        this.addChild(tile)
        this.tiles[x][y] = tile
    }
}

function closerToCenter(coord1, coord2) {
    let fraction1 = { x:getFraction(coord1.x), y: getFraction(coord1.y) }
    let fraction2 = { x:getFraction(coord2.x), y: getFraction(coord2.y) }
    return magnitude(subtractCoord(centerCoord, fraction1)) < magnitude(subtractCoord(centerCoord, fraction2))
}

function isCenteredFromRight(x, speed) {
    let fractional = getFraction(x)
    return center - fractional <= speed
}

function isCenteredFromLeft(x, speed) {
    let fractional = getFraction(x)
    return fractional - center <= speed
}

function isCenteredFromUp(y, speed) {
    let fractional = getFraction(y)
    return center - fractional <= speed
}

function isCenteredFromDown(y, speed) {
    let fractional = getFraction(y)
    return fractional - center <= speed
}

class ExampleCollisionMap {

    constructor(width, height) {
        this.width = width
        this.height = height
        this.initMap()

    }

    initMap () {
        this.collisionMap = []
        for(var x = 0; x < this.width; x++) {
            this.collisionMap[x] = [] 
            for(var y = 0; y < this.height; y++) {
                this.collisionMap[x][y] = 0
            }
        }
    }

    setCoord(coord, value) {
        this.collisionMap[Math.floor(coord.x)][Math.floor(coord.y)] = value
    }

    setValue(x, y, value) {
        this.collisionMap[Math.floor(x)][Math.floor(y)] = value
    }

    checkValue(x, y) {
        return this.collisionMap[Math.floor(x)][Math.floor(y)]
    }
    setCoord(coord) {
        return this.collisionMap[Math.floor(coord.x)][Math.floor(coord.y)]
    }
}