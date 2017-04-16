Animate = {
    player: function() {

        //this happens 3 times during the moveBlock
        //game.turning is set to false 3 times by the timeout
        //the setTimeout also runs the npc's movement
        if (!game.turning && game.moveBlock && !game.menuOpen) {
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

            //set the frame
            game.player.frame = game.oldPlayerFrame;
            if (typeof game.player.frame === 'undefined') {
                game.player.frame = 0;
                game.playerFrameOffset = 0;
            }
            game.player.frame = game.player.targetFrame + game.playerFrameOffset % 3;
            game.playerFrameOffset++; //0,1,2
            game.player.frame = game.player.frame % 12; //12 frames total
            game.oldPlayerFrame = game.player.frame;
            setTimeout(function() {
                //reruns this funtion
                game.turning = false;
                //run the NPC animation each time too
                Animate.npcs();
            }, game.moveTimeout / 3);
        }

    },
    npcs: function() {

        //this is run by the setTimeout of the animatePlayer function
        //3 times
        game.mapData.npcs.forEach(function(npc) {
            //the direction here is a number 0-3
            var targetFrame = npc.direction * 3;
            if (typeof npc.frameOffset === 'undefined') {
                npc.frameOffset = 0;
            }
            npc.frame = targetFrame + npc.frameOffset % 3;
            npc.frameOffset++;
            npc.frame = npc.frame % 12;
            //find the npcs in the tile
            game.map.forEach(function(tile) {
                if (typeof tile.npcSprite !== 'undefined') {
                    if (tile.npcSprite.gridLocation.x === npc.x && tile.npcSprite.gridLocation.y === npc.y) {
                        //set the new frame
                        tile.npcSprite.frame = npc.frame;
                    }
                }
            });
        });

    }
}
