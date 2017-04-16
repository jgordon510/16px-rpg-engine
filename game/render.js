Render = {
    all: function() {
        this.structures();
        this.npcs();
        this.player();    
    },
    structures: function() {

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
    npcs: function() {
        //go through the npcs
        game.mapData.npcs.forEach(function(npc) {
            //handle movement
            var offSetX = 0;
            var offSetY = 0;
            if (Math.random() > 0.8) { //1 in 5 chance to move
                npc.direction = Math.floor(Math.random() * 4);
                switch (npc.direction) {
                    case (0): //down
                        offSetY--;
                        break;
                    case (1): //right
                        offSetX++;
                        break;
                    case (2): //left
                        offSetX--;
                        break;
                    case (3): //up
                        offSetY++;
                        break;
                }
            }
            var proposed = {
                x: offSetX,
                y: offSetY
            };
            //check the path for obstacles
            var checkedPath = Check.path(npc, proposed);
            npc.x -= checkedPath.x;
            npc.y -= checkedPath.y;
            //find the right tile and add the npc sprite to it
            game.map.forEach(function(tile) {
                if (npc.x == tile.gridLocation.x && npc.y == tile.gridLocation.y) {
                    tile.npcSprite = game.add.sprite(0, 0, npc.key);
                    tile.npcSprite.frame = npc.frame;
                    tile.npcSprite.nameKey = npc.nameKey;

                    tile.npcSprite.gridLocation = {
                        x: npc.x,
                        y: npc.y
                    };
                    tile.addChild(tile.npcSprite); //add to the blank grid 
                }
            });

        });



    },
    player: function() {
        //get rid of the old player
        if (typeof game.player !== 'undefined') {
            game.player.destroy();
        }
        else {
            //it's a new player, so the oldPlayerFrame must be set
            game.oldPlayerFrame = 0;
        }
        //add player to middle tile
        game.player = game.add.sprite((game.map.centerTile.x - 1) * game.zoom, (game.map.centerTile.y - 1) * game.zoom, 'player_' + game.playerSheet);
        //set the frame to the saved one
        game.player.frame = game.oldPlayerFrame;
        //zoom
        game.player.scale.setTo(game.zoom);
        //map location
        game.player.gridLocation = {
            x: game.map.centerTile.gridLocation.x,
            y: game.map.centerTile.gridLocation.y
        };


    }
};
