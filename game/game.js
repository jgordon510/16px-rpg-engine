//  The Google WebFont Loader will look for this object, so create it before loading the script.
WebFontConfig = {
    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
        families: ['Inconsolata']
    }
};

var States = {}; //an object to hold the game states

//*****************************************************************************************
//FONT LOAD STATE
//This is a 1 second state used to load the google webfont script
//It then loads the menu state
States.LoadFonts = function() {};
States.LoadFonts.prototype = {
    preload: function() {
        //load the font script
        game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
        game.load.json('textures', '/editor/textures.json'); //this describes the 16px tile textures
        game.time.advancedTiming = true; //used to check the fps in the render function
    },
    create: function() {
        game.stage.backgroundColor = '#00000'; //black
        //wait a second before starting the game
        game.time.events.add(Phaser.Timer.SECOND, startGame, this)

        function startGame() {
            game.state.start('GameState');
        }
    }
};

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'gameDiv', States.LoadFonts);

// *****************************************************************************************
// Main Game State
// These preload, create, and update functions are run during the main part of the game

States.GameState = function() {};
States.GameState.prototype = {
    preload: function() {
        //the saveCPU plugin reduces the idle CPU usage
        //https://github.com/photonstorm/phaser-plugins/tree/master/SaveCPU
        this.game.plugins.add(Phaser.Plugin.SaveCPU);
        //Temporary:
        //load with a random player texture
        //There will be a general settings object that replaces many of these settings
        //This will be tied to the map key in a json file and will override defaults
        var sheetChoices = ['baby','boy','ghost','girl','skeleton','slime','spider'];
        var randomIndex = Math.floor(Math.random()*sheetChoices.length);
        game.playerSheet = sheetChoices[randomIndex];
        //this is a general style for the menus
        game.style = {
            font: 'Inconsolata',
            fill: '#002222',
            align: 'center',
            fontSize: 34
        };
        //the game's zoom factor
        game.zoom = 4;
        game.pxSize = 16; //don't change
        //the scroll offsets
        //we want to scroll back half each dimension in tiles
        game.offsets = {
            x: -Math.floor(game.width / (game.zoom * game.pxSize) / 2),
            y: -Math.floor(game.height / (game.zoom * game.pxSize) / 2)
        };
        game.playerDirection = {
            x: 0,
            y: 0
        };
        game.mapKey = 'maze50'; //the default json file to load

        game.moveTimeout = 300;
        game.load.json('map', '../editor/maps/' + game.mapKey + '.json');
        //this removes any dithering from scaling
        //this gives similar results to phaser's tilemap scaling
        Phaser.scaleModes.DEFAULT = 1;
        //Load all textures described in the textures.json file
        game.textures = game.cache.getJSON('textures');
        for (var key in game.textures) {
            if (game.textures.hasOwnProperty(key)) {
                game.textures[key].forEach(function(texture) {
                    if (texture.type === "image") {
                        //regular image
                        game.load.image(texture.key, '../assets/' + texture.key + '.png');
                    }
                    else if (texture.type === "sheet") {
                        //spritesheet
                        //each tile has a 1px border around it of transparency to avoid dithering
                        //these files are created with the sheetMaker bash script in the assets folder
                        //1px+16px+1px=18px
                        game.load.spritesheet(texture.key, '../assets/' + texture.key + '.png', 18, 18);
                    }

                });
            }
        }
        //this public function below creates a file dropper out of the gameDiv
        //this way you can drop your saved jsons on it to load them
        addFileDropper();
    },
    create: function() {
        //a set of cursor keys for navigation
        game.cursors = game.input.keyboard.createCursorKeys();
        //a group to hold the blank map tiles that parent everything
        //add a key for saving
        game.map = game.add.group();
        //a group for the actual structures
        game.structureGroup = game.add.group();
        //an object containing the default mapData
        game.mapData = game.cache.getJSON('map');
        //adjust the offsets by the start position
        game.offsets.x += game.mapData.start.x;
        game.offsets.y += game.mapData.start.y;

        //make the grid of blank parent tiles
        this.makeGrid();
        //add the blank gray squares and passable lines to the grid
        //todo probably don't want to render these
        // this.renderPassables();
        //add the structures to the grid
        this.renderStructures();

        //TODO add events to the grid
        // this.renderEvents();
        //TODO add NPCs to the grid
        // this.renderNPCS();
        this.renderPlayer();
        game.player.frame = 0;
    },
    rectangleTexture: function(w, h) {
        //this function recturns a bordered gray rectangle
        //for use in the selector menu.
        var graphics = game.add.graphics(0, 0);
        graphics.beginFill(0xAAAAAA);
        graphics.lineStyle(5, 0xDDDDDD, 1);
        graphics.drawRect(0, 0, w, h);
        var texture = graphics.generateTexture();
        graphics.destroy();
        return texture;
    },
    makeGrid: function() {
        //this function makes a group of blank tiles.
        //the blank tiles have no texture and are parents to everything else
        //this function is called by refresh

        game.map.removeAll(); //clear any previous grid
        game.map.scale.setTo(game.zoom, game.zoom);
        var tileSize = game.pxSize * game.zoom;
        //dimensions for the bank tile sprites
        var width = Math.floor(game.width / tileSize);
        var height = Math.floor(game.height / tileSize);

        //a grid of tile sprites
        for (var x = -1; x <= width + 1; x++) {
            for (var y = -1; y <= height + 1; y++) {

                var tile = game.add.sprite(x * game.pxSize, y * game.pxSize, 'blank');
                if (x === Math.floor(width / 2) && y === Math.floor(height / 2)) {
                    game.map.centerTile = tile;
                }
                //this property is used to calculate positions
                //the offset is used to scroll the position
                tile.gridLocation = {
                    x: x + game.offsets.x,
                    y: y + game.offsets.y
                };
                //hide tiles beyond the grid
                //left or above bounds
                if (tile.gridLocation.x < 0 || tile.gridLocation.y < 0) {
                    tile.visible = false;
                }
                //right or below
                if (tile.gridLocation.x >= game.mapData.size.x || tile.gridLocation.y >= game.mapData.size.y) {
                    tile.visible = false;
                }
                game.map.add(tile); //add to the group
            }
        }
    },
    renderPassables: function() { //todo delete?  change?
        //This function adds the passables sprite layer.  They are
        //children of the game.map blank tiles.
        //go through the blank tiles looking at their location on the passables grid
        game.map.forEach(function(tile) {
            //destroy any old passable sprite
            if (typeof tile.passableSprite !== 'undefined') {
                console.log("This thing is preventable probably by refreshing prior to this.");
                tile.passableSprite.destroy();
            }
            //each tile has the basic gray box
            tile.passableSprite = game.add.sprite(0, 0, 'passable');

            tile.addChild(tile.passableSprite); //add to the blank grid
            //add the red lines for unpassableDown and Right
            //TODO check these undefined checks:
            //they might have been needed just for legacy files
            if (typeof game.mapData.passables[tile.gridLocation.x] !== 'undefined') { //ugh!
                if (typeof game.mapData.passables[tile.gridLocation.x][tile.gridLocation.y] !== 'undefined') { //double-ugh!
                    if (game.mapData.passables[tile.gridLocation.x][tile.gridLocation.y][0]) {
                        var blockedRight = game.add.sprite(0, 0, 'unpassableRight');
                        tile.passableSprite.addChild(blockedRight);
                    }
                    if (game.mapData.passables[tile.gridLocation.x][tile.gridLocation.y][1]) {
                        var blockedDown = game.add.sprite(0, 0, 'unpassableDown');
                        tile.passableSprite.addChild(blockedDown);
                    }
                }

            }
        });
    },
    renderStructures: function() {
        //This function adds the structures sprite layer.  They are
        //children of the game.map blank tiles.
        //this array allows for manipulation of the structure
        //using a separate group would mess up scaling, etc.

        game.structureArray = [];
        //go through the existing blank tiles
        game.map.forEach(function(tile) {
            //delete all of the existing structure tiles
            if (typeof tile.structureSpriteArray !== 'undefined') {
                tile.structureSpriteArray.forEach(function(structure) {
                    structure.destroy();
                });
            }
            //create an array for the purposes of deleting, attached to the tile itself
            tile.structureSpriteArray = [];
            //go through all of the structures to find ones that match my location
            game.mapData.structures.forEach(function(structure) {
                if (structure.x == tile.gridLocation.x && structure.y == tile.gridLocation.y) {
                    //add the sprite as a child to the blank tile, reflecting the texture and frame
                    var structSprite = game.add.sprite(-1, -1, structure.key);
                    structSprite.frame = structure.frame;
                    tile.addChild(structSprite);
                    //two stacks:
                    //the game stack allows for public manipulation of all structures
                    game.structureArray.push(structSprite);
                    //the tile's stack, allows deleting of the tile on redraw
                    tile.structureSpriteArray.push(structSprite);
                }
            });
        });
    },
    renderPlayer: function() {
        if (typeof game.player !== 'undefined') {

            game.player.destroy();
        }
        else {
            game.oldPlayerFrame = 0;
        }
        game.player = game.add.sprite((game.map.centerTile.x - 1) * game.zoom, (game.map.centerTile.y - 1) * game.zoom, 'player_' + game.playerSheet);
        game.player.frame = game.oldPlayerFrame;
        game.player.scale.setTo(game.zoom);
    },
    renderEvents: function() {
        //todo
    },
    renderNPCS: function() {
        //todo
    },
    update: function() {
        //this scans the keyboard for cursor presses
        this.scrollView();
        this.turnPlayer();
    },
    turnPlayer: function() {
        if (!game.turning && game.moving) {
            game.turning = true;
            if (game.playerDirection.x === 1) {
                game.player.targetFrame = 3;
            }
            else if (game.playerDirection.x === -1) {
                game.player.targetFrame = 6;
            }
            else if (game.playerDirection.y === 1) {
                game.player.targetFrame = 9;
            }
            else if (game.playerDirection.y === -1) {
                game.player.targetFrame = 0;
            }

            game.player.frame = game.oldPlayerFrame;
            if (typeof game.player.frame === 'undefined') {
                game.player.frame = 0;
                game.playerFrameOffset = 0;
            }
            game.player.frame = game.player.targetFrame + game.playerFrameOffset % 3;
            game.playerFrameOffset++;
            game.player.frame = game.player.frame % 12;
            game.oldPlayerFrame = game.player.frame;
            setTimeout(function() {
                game.turning = false;
            }, game.moveTimeout / 3);

        }

    },
    refresh: function() {
        //this function refreshes the entire grid
        //it redraws everything
        this.makeGrid();
        //this.renderPassables()
        this.renderStructures();
        this.renderPlayer();
    },
    scrollView: function() {
        //this function is called by update and scrolls the view
        //calling the refresh function means the grid is redrawn 
        //with each keypress, after the tiles have been tweened 
        //and snapped back into place
        if (!game.moving) {
            //this is the distance to move in each direction
            var offSetY = 0;
            var offSetX = 0;
            //set the offset for each direction
            if (game.cursors.up.isDown) {
                offSetY = 1;
            }
            else if (game.cursors.down.isDown) {
                offSetY = -1;
            }
            else if (game.cursors.left.isDown) { //selection page turn
                offSetX = 1;
            }
            else if (game.cursors.right.isDown) {
                offSetX = -1;

            }
            //todo add character animation here

            if (offSetX !== 0 || offSetY !== 0) {
                var proposed = {
                    x: offSetX,
                    y: offSetY
                };

                //checkPath returns an object with new offsets
                //it will set the offset to 0 if it's blocked
                var checkedPath = this.checkPath(proposed);

                offSetX = checkedPath.x;
                offSetY = checkedPath.y;
                //offSet X/Y is now set to 0 if it's blocked
                if (offSetX !== 0 || offSetY !== 0) {
                    game.playerDirection = checkedPath;
                    game.moving = true;
                    //this tween slides everything in the right directions
                    var tweenMap = game.add.tween(game.map).to({
                        x: game.map.x + game.pxSize * game.zoom * offSetX,
                        y: game.map.y + game.pxSize * game.zoom * offSetY
                    }, game.moveTimeout, Phaser.Easing.Linear.Out, true);
                    //after it updates the data object,
                    //unsets the moving flag,
                    //and calls refresh()
                    tweenMap.onComplete.add(function() {
                        game.offsets.x -= offSetX;
                        game.offsets.y -= offSetY;
                        game.moving = false;
                        game.map.x = 0;
                        game.map.y = 0;
                        this.refresh();
                    }, this);

                    //this gives it a little bounce before the refresh
                    var tweenPlayer = game.add.tween(game.player).to({
                        x: game.player.x - game.pxSize * offSetX / 2,
                        y: game.player.y - game.pxSize * offSetY / 2
                    }, game.moveTimeout, Phaser.Easing.Linear.Out, true);
                }
            }
        }
    },
    checkPath: function(proposed) {
        var offSetX = proposed.x;
        var offSetY = proposed.y;
        //this function checks the proposed path and returns
        //an object containing the original offsets if it's clear
        //but sets the offset to 0 if it's blocked.
        //TODO deal with map edges also
        if (offSetX > 0) { //left
            //check index 0 of the one to the left
            if (game.mapData.passables[game.map.centerTile.gridLocation.x - 1][game.map.centerTile.gridLocation.y][0]) {
                offSetX = 0;
            }
        }
        else if (offSetX < 0) { //right
            //check index 0 of the current tile
            if (game.mapData.passables[game.map.centerTile.gridLocation.x][game.map.centerTile.gridLocation.y][0]) {
                offSetX = 0;
            }
        }
        else if (offSetY < 0) { //down
            //check index 1 of the current tile
            if (game.mapData.passables[game.map.centerTile.gridLocation.x][game.map.centerTile.gridLocation.y][1]) {
                offSetY = 0;
            }
        }
        else if (offSetY > 0) { //up
            //check index 1 of the one above
            if (game.mapData.passables[game.map.centerTile.gridLocation.x][game.map.centerTile.gridLocation.y - 1][1]) {
                offSetY = 0;
            }
        }
        return {
            x: offSetX,
            y: offSetY
        };
    },
    render: function() {
        //this shows the fps
        //game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
    }
};

game.state.add('GameState', States.GameState);


//this public function adds a file dropper so the user
//can drop saved json files onto the window and load them
function addFileDropper() {
    //http://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
    //the gameDiv itself is the dropZone
    var dropZone = document.getElementById('gameDiv');

    //dragover event
    dropZone.addEventListener('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    // Get file data on drop
    dropZone.addEventListener('drop', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var files = e.dataTransfer.files; // Array of all files
        for (var i = 0, file; file = files[i]; i++) {
            var reader = new FileReader();
            reader.onload = function(e2) {
                //e2.target.result is the raw data stream
                //load the json from it
                $.getJSON(e2.target.result, function(json) {
                    //set the mapData
                    game.mapData = json;
                    States.GameState.prototype.refresh();
                });
            };
            reader.readAsDataURL(file); // start reading the file data.
        }
    });
}
