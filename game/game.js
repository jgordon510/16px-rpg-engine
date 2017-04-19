//  The Google WebFont Loader will look for this object, so create it before loading the script.
WebFontConfig = {
    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
        families: ['Inconsolata', 'Press+Start+2P::latin']
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
        game.load.json('textures', '../data/textures.json'); //this describes the 16px tile textures
        game.load.json('mapList', '../data/mapList.json');
        game.load.json('dialogList', '../data/dialogList.json');
        game.load.json('itemList', '../data/items.json');
        game.load.json('enemyList', '../data/enemies.json');
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
        //temporary playerData object
        game.playerData = {
            gold: 100,
            inventory:["Rusty Sword"],
            flags:{},
            stats:{
                hp:{current:50,
                    max: 100
                },
                mp:{current:5,
                    max: 10
                },
                offense:5
            }
        };
        game.input.gamepad.start();
        game.pad = game.input.gamepad.pad1;
        //the saveCPU plugin reduces the idle CPU usage
        //https://github.com/photonstorm/phaser-plugins/tree/master/SaveCPU
        this.game.plugins.add(Phaser.Plugin.SaveCPU);
        //Temporary:
        //load with a random player texture
        //There will be a general settings object that replaces many of these settings
        //This will be tied to the map key in a json file and will override defaults
        var sheetChoices = ['baby', 'boy', 'ghost', 'girl', 'skeleton', 'slime', 'spider', 'gator'];
        var randomIndex = Math.floor(Math.random() * sheetChoices.length);
        game.playerSheet = sheetChoices[randomIndex];

        //this is a general style for the menus
        game.style = {
            font: 'Inconsolata',
            fill: '#002222',
            align: 'center',
            fontSize: 34
        };
        //the game's zoom factor
        game.zoom = 3;
        game.pxSize = 16; //don't change
        //the scroll offsets
        //we want to scroll back half each dimension in tiles
        game.offsets = {
            x: -Math.floor(game.width / (game.zoom * game.pxSize) / 2),
            y: -Math.floor(game.height / (game.zoom * game.pxSize) / 2)
        };
        //this described the movement for the player in both axes
        game.playerDirection = {
            x: 0,
            y: 0
        };
        game.mapKey = 'introStart'; //the default json file to load
        game.mapStart = null; //used to override the default map start loc
        game.moveTimeout = 300;

        //load the maps
        game.mapList = game.cache.getJSON('mapList');
        game.mapList.forEach(function(key) {
            game.load.json(key, '../data/maps/' + key + '.json');
        });
        //load the dialogs
        game.dialog = {};
        game.dialogList = game.cache.getJSON('dialogList');
        game.dialogList.forEach(function(key) {
            game.dialog[key] = game.load.json('dialog-' + key, '../data/dialog/' + key + '.json');
        });
        
        game.items = game.cache.getJSON('itemList');
        game.enemies = game.cache.getJSON('enemyList');

        //this removes any dithering from scaling
        //this gives similar results to phaser's tilemap scaling
        Phaser.scaleModes.DEFAULT = 1;
        //Load all textures described in the textures.json file

        //load the textures
        //TODO split this into folders
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
    reload: function() {
        game.map.destroy();
        game.structureGroup.destroy();
        //close all the menus
        game.infoPanel.close(true);
        game.dialogPanel.close(true);
        game.selectionPanel.close(true);
        game.optionsPanel.close(true);
        game.walkPanel.close(true);
        //reset the offsets
        game.offsets = {
            x: -Math.floor(game.width / (game.zoom * game.pxSize) / 2),
            y: -Math.floor(game.height / (game.zoom * game.pxSize) / 2)
        };
        //rerun the create function
        this.create();
    },
    create: function() {
        game.stage.backgroundColor = '#111111'
        //load the dialog
        game.dialogList.forEach(function(character) {
            game.dialog[character] = game.cache.getJSON('dialog-' + character);
        });

        //a set keys for navigation
        game.cursors = game.input.keyboard.createCursorKeys();
        game.spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);


        //a group to hold the blank map tiles that parent everything
        //add a key for saving
        game.map = game.add.group();
        //a group for the actual structures
        game.structureGroup = game.add.group();
        //an object containing the default mapData

        game.mapData = game.cache.getJSON(game.mapKey);
        //adjust the offsets by the start position
        if (game.mapStart === null) {
            game.offsets.x += game.mapData.start.x;
            game.offsets.y += game.mapData.start.y;
        }
        else {
            game.offsets.x += game.mapStart.x;
            game.offsets.y += game.mapStart.y;
            game.mapStart = null;
        }


        //make the grid of blank parent tiles
        this.makeGrid();
        //add the blank gray squares and passable lines to the grid
        Render.all();
        //make all the menus
        game.infoPanel = Menu.create();
        
        game.itemPanel = Menu.create();
        game.dialogPanel = Menu.create();
        game.selectionPanel = Menu.create();
        game.optionsPanel = Menu.create();
        game.walkPanel = Menu.create();
        //Temporary intro welcome alert
        if (!game.displayedWelcome) {
            game.displayedWelcome = true;
            game.infoPanel.new({
                w: 400,
                h: 200,
                x: game.width / 2 - 200,
                y: 50,
                type: 'infoPanel',
                text: ["Welcome to the intro!", 'You\'re a ' + game.playerSheet.toUpperCase() + '!']
            });
        }
        //player's texture frame number
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
    update: function() {
        //this scans the keyboard for cursor presses
        this.scrollView();
        Animate.player();
    },
    refresh: function() {
        //this function refreshes the entire grid
        //it redraws everything
        console.log("refreshing")

        this.makeGrid();
        Render.all();
        Check.events();
    },
    scrollView: function() {
        //this function is called by update and scrolls the view
        //calling the refresh function means the grid is redrawn 
        //with each keypress, after the tiles have been tweened 
        //and snapped back into place
        if (!game.moveBlock && !game.menuOpen) {
            //this is the distance to move in each direction
            var offSetY = 0;
            var offSetX = 0;
            //set the offset for each direction
            if (typeof game.pad._rawPad !== 'undefined') {
                //prevent diagonals
                if (Math.abs(game.pad._rawPad.axes[6]) > 0) {
                    offSetX -= game.pad._rawPad.axes[6];
                }
                else {
                    offSetY -= game.pad._rawPad.axes[7];
                }
            }
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
            else if (game.spaceBar.isDown || (typeof game.pad._rawPad !== 'undefined' && game.pad._rawPad.buttons[0].pressed)) { //a button
                Menu.openWalkMenu();
            }

            if (offSetX !== 0 || offSetY !== 0) {
                var proposed = {
                    x: offSetX,
                    y: offSetY
                };

                //Check.path returns an object with new offsets
                //it will set the offset to 0 if it's blocked

                var checkedPath = Check.path(game.player.gridLocation, proposed);

                offSetX = checkedPath.x;
                offSetY = checkedPath.y;
                //offSet X/Y is now set to 0 if it's blocked
                if (offSetX !== 0 || offSetY !== 0) {
                    game.playerDirection = checkedPath;
                    game.moveBlock = true;
                    //this tween slides everything in the right directions
                    var tweenMap = game.add.tween(game.map).to({
                        x: game.map.x + game.pxSize * game.zoom * offSetX,
                        y: game.map.y + game.pxSize * game.zoom * offSetY
                    }, game.moveTimeout, Phaser.Easing.Linear.Out, true);
                    //after it updates the data object,
                    //unsets the moveBlock flag,
                    //and calls refresh()
                    tweenMap.onComplete.add(function() {
                        game.offsets.x -= offSetX;
                        game.offsets.y -= offSetY;
                        game.moveBlock = false;
                        game.map.x = 0;
                        game.map.y = 0;
                        this.refresh();
                    }, this);

                    //this gives it a little bounce before the refresh
                    var tweenPlayer = game.add.tween(game.player).to({
                        x: game.player.x - game.pxSize * offSetX * game.zoom / 8,
                        y: game.player.y - game.pxSize * offSetY * game.zoom / 8
                    }, game.moveTimeout, Phaser.Easing.Bounce.Out, true);
                }
            }
        }
        else if (game.menuOpen) {
            //update all the menus, because one is open
            game.infoPanel.update();
            game.dialogPanel.update();
            game.selectionPanel.update();
            game.optionsPanel.update();
            game.walkPanel.update();
            game.itemPanel.update();
        }
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
