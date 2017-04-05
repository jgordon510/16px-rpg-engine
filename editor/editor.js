//  The Google WebFont Loader will look for this object, so create it before loading the script.
WebFontConfig = {

    //  'active' means all requested fonts have finished loading
    //  We set a 1 second delay before calling 'createText'.
    //  For some reason if we don't the browser cannot render the text the first time it's created.

    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
        families: ['Inconsolata']
    }
};

var States = {};

//*****************************************************************************************
//FONT LOAD STATE
//This is a 1 second state used to load the google webfont script
//It then loads the menu state
States.LoadFonts = function() {};
States.LoadFonts.prototype = {
    preload: function() {
        //load the font script
        game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
        game.load.json('textures', '/editor/textures.json');
    },
    create: function() {
        game.stage.backgroundColor = '#333333';
        // place the assets and elements in their initial positions, create the state 
        game.time.events.add(Phaser.Timer.SECOND, startGame, this)

        function startGame() {
            game.state.start('EditorState');
        }
    },
    update: function() {}
};

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'gameDiv', States.LoadFonts);

// *****************************************************************************************
// Main Game State
// These preload, create, and update functions are run during the main part of the game

States.EditorState = function() {};
States.EditorState.prototype = {
    preload: function() {
        game.style = {
            font: 'Inconsolata',
            fill: '#002222',
            align: 'center',
            fontSize: 34
        };
        game.drawing = false;
        game.rectStart = null;
        game.rectEnd = null;
        game.zoom = 1;
        game.tileRotation = 0;
        game.overTile = {
            x: null,
            y: null
        };
        game.tileSelection = {
            start: null,
            end: null
        };
        game.mode = 'P'; //passables
        game.currentTexture = 'unpassable';
        game.textureFrameNumber = 0;
        game.textureType = 'image';
        game.mapKey = 'testmap';
        game.pxSize = 16;
        game.selectionPanelWidth = 300;
        game.load.json('map', '/editor/maps/' + game.mapKey + '.json');

        game.world.setBounds(-3000, -3000, 6000, 6000);
        //this removes any dithering from scaling
        //this gives similar results to phaser's tilemap scaling
        Phaser.scaleModes.DEFAULT = 1;
        //Load all textures in the json file
        //loaded in previous state
        game.textures = game.cache.getJSON('textures');
        for (var key in game.textures) {
            if (game.textures.hasOwnProperty(key)) {
                game.textures[key].forEach(function(texture) {
                    if (texture.type === "image") {
                        game.load.image(texture.key, '/assets/' + texture.key + '.png');
                    }
                    else if (texture.type === "sheet") {
                        game.load.spritesheet(texture.key, '/assets/' + texture.key + '.png', 18, 18);
                    }

                });
            }
        }
    },
    create: function() {
        game.cursors = game.input.keyboard.createCursorKeys();
        game.map = game.add.group();
        game.rectangleGroup = game.add.group();
        game.structureGroup = game.add.group();
        game.selector = game.add.group();

        this.makeSelector();
        this.makeGrid();
        this.renderPassables();
        this.renderStrucures();
        this.renderEvents();
        this.renderNPCS();
        this.makeHighlightedTile();
        this.setHighlightTexture('unpassable');
        game.input.mouse.mouseWheelCallback = this.zoomView;
        var saveKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
        saveKey.onDown.add(this.saveMapJSON);
    },
    makeHighlightedTile: function() {
        game.highlightTile = game.add.sprite(0, 0, 'highlight');
        game.highlightTile.alpha = 0.75;
        game.highlightTile.visible = false;
    },
    rectangleTexture: function(w, h) {
        var graphics = game.add.graphics(0, 0);
        //Back
        graphics.beginFill(0xAAAAAA);
        graphics.lineStyle(5, 0xDDDDDD, 1);
        graphics.drawRect(0, 0, w, h);
        var texture = graphics.generateTexture();
        graphics.destroy()
        return texture;
    },
    makeSelector: function() {
        game.selector.fixedToCamera = true;
        //Back
        game.selector.selectionBack = game.add.sprite(game.width - game.selectionPanelWidth - 15, 0, this.rectangleTexture(game.selectionPanelWidth, game.height - 15));
        game.selector.add(game.selector.selectionBack);

        //Top Menu Back
        game.selector.topBack = game.add.sprite(game.width - game.selectionPanelWidth - 15 + 10, 10, this.rectangleTexture(game.selectionPanelWidth - 20, 100));
        game.selector.add(game.selector.topBack);

        game.selector.indicator = game.add.text(game.selector.topBack.width / 2, 50, '- passables -', game.style);
        game.selector.indicator.anchor.setTo(0.5, 0)
        game.selector.topBack.addChild(game.selector.indicator)
        var buttonList = [{
            letter: 'P',
            key: 'passables',
            title: '- passables -'
        }, {
            letter: 'S',
            key: 'structures',
            title: '- structures -'
        }, {
            letter: 'E',
            key: 'events',
            title: '- events -'
        }, {
            letter: 'N',
            key: 'npcs',
            title: '- NPCs -'
        }, ];
        var spacing = game.selectionPanelWidth / buttonList.length;
        buttonList.forEach(function(button, index) {
            var buttonSprite = game.add.text(index * spacing + 20, 10, button.letter, game.style);
            buttonSprite.inputEnabled = true;
            buttonSprite.input.useHandCursor = true;
            buttonSprite.events.onInputDown.add(selectMode);
            game.selector.topBack.addChild(buttonSprite);

            function selectMode() {
                game.selector.indicator.setText(button.title);
                game.mode = button.letter;
                newTextureGroup(button, 0);
            }

        });
        game.turnPage = function()
        {
            console.log("You haven't selected a texture yet.")    
        };
    },
    makeGrid: function() {
        //this function makes a group of blank tiles.
        //the blank tiles have no te
        //add a blank underTile to the map group
        game.mapData = game.cache.getJSON('map');
        console.log(game.mapData)
        for (var x = 0; x < game.mapData.size.x; x++) {
            for (var y = 0; y < game.mapData.size.y; y++) {
                var tile = game.add.sprite(x * game.pxSize, y * game.pxSize, 'blank');
                tile.gridLocation = {
                    x: x,
                    y: y
                };

                tile.inputEnabled = true;
                //tile.input.useHandCursor = true;
                //the endDraw function lacks the scope to reach the render functions
                tile.renderPassables = this.renderPassables;
                tile.renderStrucures = this.renderStrucures;
                tile.events.onInputOver.add(highlightTile, tile);
                tile.events.onInputOut.add(unhighlighTile, tile);
                tile.events.onInputDown.add(startDraw, tile);
                tile.events.onInputUp.add(endDraw, this.renderPassables);


                game.map.add(tile);
            }


        }

        function highlightTile(tile) {
            game.highlightTile.visible = true;
            game.rectangleGroup.removeAll();
            tile.addChild(game.highlightTile)
            if (game.drawing) {
                game.highlightTile.visible = false;
                game.endDraw = tile.gridLocation;
                var startXs = [game.startDraw.x, game.endDraw.x];
                var startYs = [game.startDraw.y, game.endDraw.y];
                startXs.sort();
                startYs.sort();
                tiles();

                function tiles() {
                    for (var x = startXs[0]; x <= startXs[1]; x++) {
                        for (var y = startYs[0]; y <= startYs[1]; y++) {
                            var rectTile = game.add.sprite(x * game.pxSize * game.map.scale.x, y * game.pxSize * game.map.scale.y, game.currentTexture);
                            rectTile.scale = game.map.scale;
                            //account for the 1px border on spritesheets
                            if (game.textureType === 'sheet') {
                                rectTile.x -= 1 * game.map.scale.x;
                                rectTile.y -= 1 * game.map.scale.y;
                            }
                            rectTile.alpha = 0.5;
                            rectTile.frame = game.textureFrameNumber;

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
            game.highlightTile.visible = false;
        }

        function startDraw(tile) {
            game.drawing = true;
            game.startDraw = tile.gridLocation;
            //this ensures the rectangle is drawn on a single click
            highlightTile(tile);
        }

        function endDraw(sprite) {
            game.drawing = false;
            //todo: currently this doesn't reflect anything but unpassable tiles
            game.rectangleGroup.forEach(function(tile) {
                setTiles(tile)
            });
            sprite.renderPassables();
            sprite.renderStrucures();

            game.startDraw = null;
            game.endDraw = null;
            game.rectangleGroup.removeAll();
        }
        this.centerMap();
    },
    centerMap: function() {
        game.camera.x = game.map.width / 2 - game.width / 2 + 300 / 2;
        game.camera.y = game.map.height / 2 - game.height / 2;
    },
    renderPassables: function() {
        //This function adds the passables sprite layer.  They are
        //children of the game.map blank tiles.
        //go through the blank tiles looking at their location on the passables grid
        game.map.forEach(function(tile) {
            if (typeof tile.passableSprite !== 'undefined') {
                tile.passableSprite.destroy();
            }
            //mark the passable texture layer appropriately
            var textureKey = 'unpassable';
            if (game.mapData.passables[tile.gridLocation.x][tile.gridLocation.y]) {
                textureKey = 'passable';
            }
            tile.passableSprite = game.add.sprite(0, 0, textureKey);
            tile.addChild(tile.passableSprite);
        });
    },
    renderStrucures: function() {
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
    renderEvents: function() {
        //todo
    },
    renderNPCS: function() {
        //todo
    },
    update: function() {
        this.rotatePlacement();
        this.scrollView();
        this.deleteTile();
    },
    setHighlightTexture: function() {
        game.highlightTile.loadTexture(game.currentTexture);
    },
    rotatePlacement: function() {

    },
    scrollView: function() {
        var scrollSpeed = 5;
        if (game.cursors.up.isDown) {
            game.camera.y -= scrollSpeed;
        }
        else if (game.cursors.down.isDown) {
            game.camera.y += scrollSpeed;
        }
        if (game.cursors.left.isDown) {
            if(game.cursors.left.ctrlKey)
            {
                game.turnPage(-1);
            } else
            {
                game.camera.x -= scrollSpeed;
            }
            
        }
        else if (game.cursors.right.isDown) {
            if(game.cursors.right.ctrlKey)
            {
                game.turnPage(1);
            } else
            {
                game.camera.x += scrollSpeed;
            }
            
        }
    },
    zoomView: function() {
        console.log()
        if (game.input.mouse.input.x < game.width - game.selectionPanelWidth - 15) {
            var slowZoom = 15;
            game.zoom += game.input.mouse.wheelDelta / slowZoom;
            game.map.scale.setTo(game.zoom, game.zoom);
        }
        else {
            var scrollScale = 50;
            game.textureGroup.y += game.input.mouse.wheelDelta * scrollScale;
            game.textureGroup.forEach(function(texture) {
                console.log(texture.world.y)
                if (texture.y + game.textureGroup.y > 120 && texture.y + game.textureGroup.y < game.height) {
                    texture.visible = true;
                }
                else {
                    texture.visible = false;
                }
                if (game.textureGroup.y > 0) {
                    game.textureGroup.y = 0
                }
            })

        }

    },
    deleteTile: function() {

    },
    saveMapJSON: function(key) {
        //check to see if CTRL is pressed
        if (key.ctrlKey) {
            var str = JSON.stringify(game.mapData);
            var blob = new Blob([str], {
                type: "text/plain;charset=utf-8"
            });
            saveAs(blob, "newmap.json");
        }
    }
};

game.state.add('EditorState', States.EditorState);

function setTiles(tile) {

    switch (game.mode) {
        case 'P':
            var mapData = 0; //unpassable
            if (game.currentTexture === 'passable') {
                mapData = 1;
            }
            game.mapData.passables[tile.gridLocation.x][tile.gridLocation.y] = mapData;
            break;
        case 'S':
            console.log("structure");
            console.log(game.currentTexture, game.textureFrameNumber)
            var structure = {
                key: game.currentTexture,
                frame: game.textureFrameNumber,
                x: tile.gridLocation.x,
                y: tile.gridLocation.y
            };
            console.log(game.mapData)
            game.mapData.structures.push(structure);
            break;
        default:
            console.log("unspecified mode!");
    }
}

function newTextureGroup(button, page) {
    game.turnPage = function(direction) {
        if(!game.turningPage)
        {
            game.turningPage = true;
            newTextureGroup(button, page + direction);
            setTimeout(function() {
                game.turningPage = false;
            }, 100);
        }
        
    };
    
    if (typeof game.textureGroup !== 'undefined') {
        game.textureGroup.destroy();
    }
    game.textureGroup = game.add.group();
    game.textureGroup.x = game.selectionPanelWidth * .1 - 10;
    game.selector.addChild(game.textureGroup);
    var boxCounter = 0;

    var frameCount = 0;
    var frames = [];
    var textureStartIndices = [];
    game.textures[button.key].forEach(function(texture, i) {
        textureStartIndices.push({
            key: texture.key,
            type: texture.type,
            index: frames.length
        });
        var frameArray = game.cache.getFrameData(texture.key).getFrames();
        frames = frames.concat(frameArray);
    });
    if(page < 0 ) page = Math.floor(frames.length/21);
    var boxWidth = game.selectionPanelWidth * .25;
    for (var column = 0; column < 3; column++) {
        for (var row = 0; row < 7; row++) {
            if (frameCount < frames.length) {}

            //box and button
            var texture = null;
            textureStartIndices.forEach(function(checkTexture) {
                if (checkTexture.index <= (frameCount + page * 21) % frames.length) {
                    texture = checkTexture;
                }
            });
            console.log(texture)
            var xLoc = game.selector.selectionBack.x + 10 + (boxCounter % 3 * (boxWidth * 1.1));
            var yLoc = Math.floor(boxCounter / 3) * (boxWidth * 1.1) + 160;
            var textureBox = game.add.sprite(xLoc, yLoc, States.EditorState.prototype.rectangleTexture(boxWidth, boxWidth));
            textureBox.inputEnabled = true;
            textureBox.input.useHandCursor = true;
            textureBox.events.onInputDown.add(setTexture);
            textureBox.frameNumber = (frameCount + page * 21) % frames.length - texture.index;
            textureBox.textureData = texture;

            var textureSample = game.add.sprite(textureBox.width / 2, textureBox.height / 2, texture.key, textureBox.frameNumber);
            textureSample.height = textureBox.height * .7;
            textureSample.width = textureBox.height * .7;
            textureSample.anchor.setTo(0.5, 0.5);
            textureBox.addChild(textureSample);
            game.textureGroup.add(textureBox);
            frameCount++;
            boxCounter++;

            function setTexture(sprite, pointer) {
                var frameNumber = sprite.frameNumber
                var texture = sprite.textureData
                game.currentTexture = texture.key;

                game.highlightTile.loadTexture(game.currentTexture);
                game.highlightTile.frame = frameNumber;
                game.textureFrameNumber = frameNumber;
                game.textureType = texture.type;
                //account for the 1px border on spritesheets
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
