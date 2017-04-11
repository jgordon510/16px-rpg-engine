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
        game.stage.backgroundColor = '#333333'; //gray
        //wait a second before starting the game
        game.time.events.add(Phaser.Timer.SECOND, startGame, this)

        function startGame() {
            game.state.start('EditorState');
        }
    }
};

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'gameDiv', States.LoadFonts);

// *****************************************************************************************
// Main Game State
// These preload, create, and update functions are run during the main part of the game

States.EditorState = function() {};
States.EditorState.prototype = {
    preload: function() {
        //the saveCPU plugin reduces the idle CPU usage
        //https://github.com/photonstorm/phaser-plugins/tree/master/SaveCPU
        this.game.plugins.add(Phaser.Plugin.SaveCPU);
        //this is a general style for the menus
        game.style = {
            font: 'Inconsolata',
            fill: '#002222',
            align: 'center',
            fontSize: 34
        };
        //tracks whether we're drawing
        game.drawing = false;
        //tracks where we've started drawing the rectangle
        game.rectStart = null;
        //tracks where we've finished drawing the rectangle
        game.rectEnd = null;
        //the editor's zoom factor
        game.zoom = 2;
        //the scroll offsets
        game.offsets = {
            x: 0,
            y: 0
        };
        // this describes the current edit mode
        game.mode = 'P'; //default: passables
        game.currentTexture = 'passable'; //default: clear unpassables
        game.textureFrameNumber = 0; //used for spritesheets
        game.textureType = 'image'; //or 'sheet'
        game.mapKey = 'testmap'; //the default json file to load
        game.pxSize = 16; //don't change
        game.selectionPanelWidth = 300; //don't change
        game.textureColumn = 0;
        //load the default map file
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
        game.saveKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
        game.saveKey.onDown.add(this.saveMapJSON); //callback for saving
        game.copyKey = game.input.keyboard.addKey(Phaser.Keyboard.C);
        game.copyKey.onDown.add(this.copySelection); //callback for copy
        game.cutKey = game.input.keyboard.addKey(Phaser.Keyboard.X);
        game.cutKey.onDown.add(this.cutSelection); //callback for cut
        game.pasteKey = game.input.keyboard.addKey(Phaser.Keyboard.V);
        game.pasteKey.onDown.add(this.pasteSelection); //callback for paste
        game.clipboard = [];
        game.map = game.add.group();
        //a group for the drawing rectangle
        game.rectangleGroup = game.add.group();
        //a group for the actual structures
        game.structureGroup = game.add.group();
        //a group for the selector menu
        game.selector = game.add.group();
        //an object containing the default mapData
        game.mapData = game.cache.getJSON('map');
        //create the selector menu on the right of the screen
        this.makeSelector();
        //make the grid of blank parent tiles
        this.makeGrid();
        //add the blank gray squares and passable lines to the grid
        this.renderPassables();
        //add the structures to the grid
        this.renderStructures();
        //TODO add events to the grid
        this.renderEvents();
        //TODO add NPCs to the grid
        this.renderNPCS();
        //create the highlighted tile that follows the mouse cursor 
        this.makeHighlightedTile();
        //it shows the current texture setting
        this.setHighlightTexture('passable'); //default
        //scrolling the mouse changes the zoom factor and calls refresh
        game.input.mouse.mouseWheelCallback = this.zoomView;
    },
    makeHighlightedTile: function() {
        //this function creates the highlighted tile
        //this tile follows the mouse cursor, attaching itself to
        //blank gridtiles.  It reflects the texture setting also
        //through the setHighlightTexture.
        //this is blank white, and is reset to something specific
        game.highlightTile = game.add.sprite(0, 0, 'highlight');
        //so you can see what you're setting
        game.highlightTile.alpha = 0.75;
        //start hidden
        game.highlightTile.visible = false;
    },
    setHighlightTexture: function() {
        //set it to the current texture
        game.highlightTile.loadTexture(game.currentTexture);
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
    makeSelector: function() {
        //this function makes the selector menu
        //it only happens once and isn't called by refresh
        game.selector.fixedToCamera = true;
        //Back of Menu
        game.selector.selectionBack = game.add.sprite(game.width - game.selectionPanelWidth - 15, 0, this.rectangleTexture(game.selectionPanelWidth, game.height - 15));
        game.selector.add(game.selector.selectionBack);
        //Top Menu Back
        game.selector.topBack = game.add.sprite(game.width - game.selectionPanelWidth - 15 + 10, 10, this.rectangleTexture(game.selectionPanelWidth - 20, 100));
        game.selector.add(game.selector.topBack);
        //Indicator text
        //default:passables
        game.selector.indicator = game.add.text(game.selector.topBack.width / 2, 50, '- passables -', game.style);
        game.selector.indicator.anchor.setTo(0.5, 0)
        game.selector.topBack.addChild(game.selector.indicator);
        var buttonList = [{
            letter: 'P',
            key: 'passables',
            title: '- passables -'
        }, {
            letter: 'S',
            key: 'structures',
            title: '- structures -'
        }, {
            letter: 'N',
            key: 'npcs',
            title: '- NPCs -'
        }, {
            letter: 'E',
            key: 'events',
            title: '- extras -'
        }];
        //these are the selector buttons
        var spacing = game.selectionPanelWidth / buttonList.length;
        buttonList.forEach(function(button, index) {
            var buttonSprite = game.add.text(index * spacing + 20, 10, button.letter, game.style);
            buttonSprite.inputEnabled = true;
            buttonSprite.input.useHandCursor = true;
            buttonSprite.events.onInputDown.add(selectMode); //see click callback below
            game.selector.topBack.addChild(buttonSprite);

            if (index == 0) //default to passables on load
            {
                selectMode(); //this calls the newTextureGroup
            }

            function selectMode() {
                //this gets called when the buttons are pushed
                game.selector.indicator.setText(button.title);
                game.mode = button.letter;
                //newTextureGroup is a public function below
                newTextureGroup(button, 0); //create the texture buttons
                States.EditorState.prototype.refresh();
            }
        });
        game.turnPage = function() { //a default message you shouldn't see.
            console.log("You haven't selected a texture yet.");
        };
    },
    makeGrid: function() {
        //this function makes a group of blank tiles.
        //the blank tiles have no texture and are parents to everything else
        //this function is called by refresh

        game.map.removeAll(); //clear any previous grid
        game.map.scale.setTo(game.zoom, game.zoom);
        var tileSize = game.pxSize * game.zoom;
        //dimensions for the bank tile sprites
        var width = Math.floor((game.width - game.selector.width) / tileSize);
        var height = Math.floor(game.height / tileSize);

        //a grid of tile sprites
        for (var x = 0; x <= width; x++) {
            for (var y = 0; y <= height; y++) {
                var tile = game.add.sprite(x * game.pxSize, y * game.pxSize, 'blank');
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

                tile.inputEnabled = true;
                //these input functions control the drawing of texture rectangles
                tile.events.onInputOver.add(highlightTile);
                tile.events.onInputOut.add(unhighlighTile, tile);
                tile.events.onInputDown.add(startDraw, tile);
                tile.events.onInputUp.add(endDraw, this.renderPassables);
                game.map.add(tile); //add to the group
            }
        }

        function highlightTile(tile) {
            //called onInputOver
            game.highlightTile.visible = true;
            game.rectangleGroup.removeAll(); //clear previous rectangles
            //add the highlightTile to the blank tile sprite
            tile.addChild(game.highlightTile);
            game.highlightTile.gridLocation = tile.gridLocation

            if (game.drawing) {
                game.highlightTile.visible = false;

                game.endDraw = tile.gridLocation;
                var startXs = [game.startDraw.x, game.endDraw.x];
                var startYs = [game.startDraw.y, game.endDraw.y];
                //sort them, so we can loop left to right; top to bottom
                if (startXs[0] > startXs[1]) {
                    startXs = [startXs[1], startXs[0]]
                }
                if (startYs[0] > startYs[1]) {
                    startYs = [startYs[1], startYs[0]]
                }
                rectangleGroupTiles();

                function rectangleGroupTiles() {
                    //draw the actual tiles and add them to the group
                    for (var x = startXs[0]; x <= startXs[1]; x++) {
                        for (var y = startYs[0]; y <= startYs[1]; y++) {
                            //calculate the locations based on the scroll offset, pixel size and zoom
                            var xLoc = (x - game.offsets.x) * game.pxSize * game.map.scale.x;
                            var yLoc = (y - game.offsets.y) * game.pxSize * game.map.scale.y;
                            var rectTile = game.add.sprite(xLoc, yLoc, game.currentTexture);
                            rectTile.scale = game.map.scale; //they're not part of the map group
                            //account for the 1px border on spritesheets
                            if (game.textureType === 'sheet') {
                                //scoot them back and up 1px
                                rectTile.x -= 1 * game.map.scale.x;
                                rectTile.y -= 1 * game.map.scale.y;
                            }
                            //transparent
                            rectTile.alpha = 0.5;
                            //match the sheet frame
                            rectTile.frame = game.textureFrameNumber;
                            //used in the setTiles function
                            rectTile.gridLocation = {
                                x: x,
                                y: y
                            };
                            game.rectangleGroup.add(rectTile);
                        }
                    }
                }
            }
        }

        function unhighlighTile() {
            //called onInputOut
            game.highlightTile.visible = false;
        }

        function startDraw(tile) {
            //called onInputDown
            game.drawing = true;
            game.startDraw = tile.gridLocation;
            //game.endDraw is set constantly onInputOver in highlightTile
            //this ensures the rectangle is drawn on a single click
            highlightTile(tile);
            game.mapData.structures.forEach(function(structure) {
                structure.highlighted = false;
            });
        }

        function endDraw(sprite) {
            //called onInputUp
            game.drawing = false;
            //use the rectangle group to manage game.mapData
            game.rectangleGroup.forEach(function(tile) {
                setTiles(tile)
            });
            //reset and refresh()
            game.startDraw = null;
            game.endDraw = null;
            game.rectangleGroup.removeAll();
            //data is all ready, time to refresh
            States.EditorState.prototype.refresh();
        }
    },
    renderPassables: function() {
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
                    if (game.mapData.passables[tile.gridLocation.x][tile.gridLocation.y] !== null) {
                        if (game.mapData.passables[tile.gridLocation.x][tile.gridLocation.y][0]) {
                            var blockedRight = game.add.sprite(0, 0, 'unpassableRight');
                            tile.passableSprite.addChild(blockedRight);
                        }
                        if (game.mapData.passables[tile.gridLocation.x][tile.gridLocation.y][1]) {
                            var blockedDown = game.add.sprite(0, 0, 'unpassableDown');
                            tile.passableSprite.addChild(blockedDown);
                        }
                    }
                    else {
                        game.mapData.passables[tile.gridLocation.x][tile.gridLocation.y] = [0, 0]
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
                    if (structure.highlighted) {
                        structSprite.tint = 0xCCCCCC;
                        //structure.highlighted = false;
                    }
                    tile.addChild(structSprite);
                    //two stacks:
                    //the game stack allows for public manipulation of all structures
                    game.structureArray.push(structSprite);
                    //the tile's stack, allows deleting of the tile on redraw
                    tile.structureSpriteArray.push(structSprite);
                }
            });
        });
        if (game.mode == 'P') { //passables
            //make the structure group semi-transparent so I can
            //see the unpassable lines
            game.structureArray.forEach(function(structure) {
                structure.alpha = 0.25;
            });
        }
        else {
            game.structureArray.forEach(function(structure) {
                //make the structures opaque
                structure.alpha = 1;
            });
        }
    },
    renderEvents: function() {
        //todo
        game.prompedForEventKey = false;
        game.map.forEach(function(tile) {
            //destroy any old passable sprite
            if (typeof tile.eventSprite !== 'undefined') {
                console.log("This thing is preventable probably by refreshing prior to this.");
                tile.eventSprite.destroy();
            }
            //each tile has the basic gray box
            game.mapData.events.forEach(function(event) {
                if (event.x == tile.gridLocation.x && event.y == tile.gridLocation.y) {
                    tile.eventSprite = game.add.sprite(0, 0, 'event');
                    tile.addChild(tile.eventSprite); //add to the blank grid 
                    tile.eventSprite.alpha = 0.2
                }
            })


        });
    },
    renderNPCS: function() {
        //todo
    },
    update: function() {
        //this scans the keyboard for cursor presses
        this.scrollView();
    },
    refresh: function() {
        //this function refreshes the entire grid
        //it redraws everything
        this.makeGrid();
        this.renderPassables();
        this.renderStructures();
        this.renderEvents();
    },
    scrollView: function() {
        //this function is called by update and scrolls the view
        //calling the refresh function means the grid is redrawn 
        //with each keypress
        //it also turns the texture selection pages when ctrl is pressed
        if (game.cursors.up.isDown) {
            game.offsets.y -= 1;
            this.refresh()
        }
        else if (game.cursors.down.isDown) {
            game.offsets.y += 1;
            this.refresh()
        }
        if (game.cursors.left.isDown) { //selection page turn
            if (game.cursors.left.ctrlKey) {
                game.turnPage(-1);
            }
            else {
                game.offsets.x -= 1;
                this.refresh()
            }
        }
        else if (game.cursors.right.isDown) {
            if (game.cursors.right.ctrlKey) { //selection page turn
                game.turnPage(1);
            }
            else {
                game.offsets.x += 1;
                this.refresh();
            }
        }
    },
    zoomView: function() {
        //this function adjusts the tile zoom on mouse scroll
        if (!game.zooming) { //used to timeout the function
            game.zooming = true; //timeout
            //adjust the zoom
            game.zoom += game.input.mouse.wheelDelta / 2;

            if (game.zoom < 0.5) { //min
                game.zoom = 0.5;
            }
            else if (game.zoom > 4) { //max
                game.zoom = 4;
            }
            //call a refresh
            States.EditorState.prototype.refresh();
            setTimeout(function() {
                game.zooming = false; //reset timeout flag
            }, 500);
        }

    },
    saveMapJSON: function(key) {
        //called when 'S' key is pressed
        //still need to check to see if CTRL is pressed
        if (key.ctrlKey) {
            var str = JSON.stringify(game.mapData);
            var blob = new Blob([str], {
                type: "text/plain;charset=utf-8"
            });
            saveAs(blob, "newmap.json"); //FileSaver.js
        }
    },
    render: function() {
        //this shows the fps
        //game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
    },
    copySelection: function(key) {
        if (key.ctrlKey || key.cut) {
            game.clipboard = [];
            for (var i = game.mapData.structures.length - 1; i >= 0; i--) {
                var structure = game.mapData.structures[i];
                if (structure.highlighted) {
                    game.clipboard.push(structure);
                    structure.highlighted = false;
                    if (key.cut) {
                        game.mapData.structures.splice(i, 1);
                    }
                }

            }
            // Put the object into storage
            localStorage.setItem('clipboard', JSON.stringify(game.clipboard));
            States.EditorState.prototype.refresh();
        }
    },
    cutSelection: function(key) {
        if (key.ctrlKey) {
            States.EditorState.prototype.copySelection({
                cut: true
            });
        }
    },
    pasteSelection: function(key) {
        if (key.ctrlKey) {
            var top = 10000;
            var left = 10000;
            var right = 0;
            var bottom = 0;
            // Retrieve the object from storage
            // this allows the copying of structures between windows, but not art 
            game.clipboard = JSON.parse(localStorage.getItem('clipboard'));
            console.log(game.clipboard)
            game.clipboard.forEach(function(structure) {
                structure.highlighted = false;
                if (structure.x < left) {
                    left = structure.x;
                }
                if (structure.y < top) {
                    top = structure.y;
                }
                if (structure.x > right) {
                    right = structure.x;
                }
                if (structure.y > bottom) {
                    bottom = structure.y;
                }
            });
            game.clipboard.reverse().forEach(function(structure) {
                game.mapData.structures.push({
                    x: (structure.x - left) + game.highlightTile.gridLocation.x,
                    y: (structure.y - top) + game.highlightTile.gridLocation.y,
                    key: structure.key,
                    frame: structure.frame
                });
            });
            for (var x = -1; x <= right - left; x++) {
                for (var y = -1; y <= bottom - top; y++) {
                    if (left + x > 0 && top + y > 0) {
                        game.mapData.passables[x + game.highlightTile.gridLocation.x][y + game.highlightTile.gridLocation.y] = game.mapData.passables[left + x][top + y].slice();
                    }
                    else {
                        console.log("out of bounds!")
                    }
                }
            }
            game.clipboard.reverse();
            States.EditorState.prototype.refresh();
        }

    }
};

game.state.add('EditorState', States.EditorState);

//this public function manages the mapData object
//it doesn't add tiles to the map itself; refresh handles that
//it has a switch statement that deals with different game modes
function setTiles(tile) {
    switch (game.mode) {
        case 'P': //passables
            var passable = game.mapData.passables[tile.gridLocation.x][tile.gridLocation.y];
            if (game.currentTexture === 'passable') { //clear both flags
                passable[0] = 0;
                passable[1] = 0;
            }
            else if (game.currentTexture === 'unpassableRight') {
                passable[0] = 1; //flag right
            }
            else if (game.currentTexture === 'unpassableDown') {
                passable[1] = 1; //flag down
            }
            break;
        case 'S':
            //an object representing the current structure
            var structure = {
                key: game.currentTexture,
                frame: game.textureFrameNumber,
                x: tile.gridLocation.x,
                y: tile.gridLocation.y
            };
            //if I already have this structure, I don't need two
            game.mapData.structures.forEach(function(existingStructure, index) {
                //this function is below and compares two object for sameness
                if (isEquivalent(existingStructure, structure)) {
                    //delete the old one
                    game.mapData.structures.splice(index, 1);
                }
            });
            //set the data
            game.mapData.structures.push(structure);
            break;
        case 'E':
            //an object representing the current structure

            if (game.textureColumn == 0) //event
            {
                if (!game.prompedForEventKey) {
                    game.prompedForEventKey = true;
                    var key = prompt("Enter the event key: ");
                }

                var event = {
                    key: key,
                    x: tile.gridLocation.x,
                    y: tile.gridLocation.y
                };
                //if I already have an event here, I don't need two
                game.mapData.events.forEach(function(existingEvent, index) {
                    //this function is below and compares two object for sameness
                    if (existingEvent.x === tile.gridLocation.x && existingEvent.y === tile.gridLocation.y) {
                        game.mapData.event.splice(index, 1);
                    }
                });
                //set the data
                game.mapData.events.push(event);
            }
            else if (game.textureColumn == 1) {
                game.mapData.structures.forEach(function(existingStructure, index) {
                    //this function is below and compares two object for sameness
                    if (existingStructure.x === tile.gridLocation.x && existingStructure.y === tile.gridLocation.y) {
                        existingStructure.highlighted = true;
                    }
                });
            }
            else if (game.textureColumn == 2) {
                //if I already have an event here, I don't need two
                for (var i = game.mapData.structures.length - 1; i >= 0; i--) {
                    var existingStructure = game.mapData.structures[i];
                    if (existingStructure.x === tile.gridLocation.x && existingStructure.y === tile.gridLocation.y) {
                        game.mapData.structures.splice(i, 1);
                    }
                }
            }


            break;
        default:
            console.log("unspecified mode!");
    }

    //this function compares two object and returns true if they're identical
    //http://adripofjavascript.com/blog/drips/object-equality-in-javascript.html
    function isEquivalent(a, b) {
        // Create arrays of property names
        var aProps = Object.getOwnPropertyNames(a);
        var bProps = Object.getOwnPropertyNames(b);

        // If number of properties is different,
        // objects are not equivalent
        if (aProps.length != bProps.length) {
            return false;
        }

        for (var i = 0; i < aProps.length; i++) {
            var propName = aProps[i];

            // If values of same property are not equal,
            // objects are not equivalent
            if (a[propName] !== b[propName]) {
                return false;
            }
        }

        // If we made it this far, objects
        // are considered equivalent
        return true;
    }

}

//https://gist.github.com/mattcolman/493c216211edc87bc8e9
$(document).bind("keydown", function(e) {
    if (e.keyCode == 8) { // backspace
        e.preventDefault()
            // do whatever the backspace should do
        localStorage.setItem('clipboard', JSON.stringify([]));
        game.clipboard = [];
        for (var i = game.mapData.structures.length - 1; i >= 0; i--) {
            var structure = game.mapData.structures[i];
            if (structure.highlighted) {
                //game.clipboard.push(structure);

                game.mapData.structures.splice(i, 1);

            }

        }
        States.EditorState.prototype.refresh();
    }
});

//this public function makes the group containing the 
//texture setting buttons
function newTextureGroup(button, page) {
    //this function turns the page left and right
    game.turnPage = function(direction) {
        if (!game.turningPage) {
            game.turningPage = true; //flag for timeout
            newTextureGroup(button, page + direction); //recursive
            setTimeout(function() {
                game.turningPage = false; //reset
            }, 100);
        }
    };

    //get rid of the old page
    if (typeof game.textureGroup !== 'undefined') {
        game.textureGroup.destroy();
    }
    game.textureGroup = game.add.group();
    //a child of the panel, a little offset
    game.textureGroup.x = game.selectionPanelWidth * .1 - 10;
    game.selector.addChild(game.textureGroup);
    var frameCount = 0; //counter for the texture frame
    var frames = []; //array to hold the frames
    //a list of the startIndices of the various textures
    var textureStartIndices = [];
    //create the list of startIndices, so we know when to start
    //each texture in the stack
    //Also, append the frames to the frameArray
    game.textures[button.key].forEach(function(texture, i) {
        textureStartIndices.push({
            key: texture.key,
            type: texture.type,
            index: frames.length
        });
        var frameArray = game.cache.getFrameData(texture.key).getFrames();
        frames = frames.concat(frameArray);
    });

    //loop negatives to the end
    if (page < 0) page = Math.floor(frames.length / 21);
    //1/4:small enough to fit 3
    var boxWidth = game.selectionPanelWidth * .25;
    //3x7 for long stacks
    //3x1 for the passables
    for (var column = 0; column < 3; column++) {
        for (var row = 0; row < (game.mode === 'S' ? 7 : 1); row++) {

            //box and button
            var texture = null;
            //based on how far we are in the frames stack, I set the texture
            textureStartIndices.forEach(function(checkTexture) {
                if (checkTexture.index <= (frameCount + page * 21) % frames.length) {
                    texture = checkTexture; //last to qualify one is correct
                }
            });
            //calculate the x/y Locs 
            var xLoc = game.selector.selectionBack.x + 10 + (frameCount % 3 * (boxWidth * 1.1));
            var yLoc = Math.floor(frameCount / 3) * (boxWidth * 1.1) + 160;
            //use the rectangleTexture function to get a box
            var textureBox = game.add.sprite(xLoc, yLoc, States.EditorState.prototype.rectangleTexture(boxWidth, boxWidth));
            //button stuff
            textureBox.inputEnabled = true;
            textureBox.input.useHandCursor = true;
            textureBox.events.onInputDown.add(setTexture); //below
            //properties used by setTexture()
            textureBox.frameNumber = (frameCount + page * 21) % frames.length - texture.index;
            textureBox.column = column;
            textureBox.textureData = texture;

            //a picture of the texture added as a child
            var textureSample = game.add.sprite(textureBox.width / 2, textureBox.height / 2, texture.key, textureBox.frameNumber);
            textureSample.height = textureBox.height * .7;
            textureSample.width = textureBox.height * .7;
            textureSample.anchor.setTo(0.5, 0.5);
            textureBox.addChild(textureSample);
            //add to the group
            game.textureGroup.add(textureBox);
            frameCount++;
            if (column == 0 & row == 0) {
                game.currentTexture = texture.key;
                setTexture(textureBox)
            }
            //called when the texture is clicked
            function setTexture(sprite, pointer) {
                var frameNumber = sprite.frameNumber
                game.textureColumn = sprite.column;
                var texture = sprite.textureData
                if (typeof game.oldSelected !== 'undefined') {
                    game.oldSelected.tint = 0xffffff;
                }
                game.oldSelected = sprite;
                sprite.tint = 0xffcc00;
                //public properties
                game.currentTexture = texture.key;
                game.textureFrameNumber = frameNumber;
                game.textureType = texture.type;
                if (typeof game.highlightTile !== 'undefined') {
                    //change the highlightTile
                    game.highlightTile.loadTexture(game.currentTexture);
                    game.highlightTile.frame = frameNumber;
                    //account for the 1px transparent border on spritesheets
                    if (texture.type === 'sheet') {
                        game.highlightTile.x = -1;
                        game.highlightTile.y = -1;
                    }
                    else { //don't account for it
                        game.highlightTile.x = 0;
                        game.highlightTile.y = 0;
                    }
                }

            }
        }
    }
}

//this is a public function for creating a blank map
function blankMap() {
    //get the width/height
    var width = parseInt(prompt("Enter width: "));
    var height = parseInt(prompt("Enter height: "));
    //a blank passables array
    var passables = [];
    for (var y = 0; y < height; y++) {
        var row = [];
        for (var x = 0; x < width; x++) {
            row.push([0, 0]);
        }
        passables.push(row);
    }
    game.mapData.passables = passables;
    //size properties
    game.mapData.start = game.offsets;
    game.mapData.size = {
        x: width,
        y: height
    };
    //a blank structures array
    game.mapData.structures = [];

    //load it up
    States.EditorState.prototype.makeGrid();
    States.EditorState.prototype.renderPassables();
    States.EditorState.prototype.renderStructures();
}

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
                    States.EditorState.prototype.refresh();
                });
            }
            reader.readAsDataURL(file); // start reading the file data.
        }
    });
}
