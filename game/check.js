var Check = {
    events: function() {
        //this checks the event table for a stepped on event and
        //runs the event key
        game.mapData.events.forEach(function(event) {
            if (event.x === game.player.gridLocation.x) {
                if (event.y === game.player.gridLocation.y) {
                    Events[event.key]();
                }
            }
        });
    },
    path: function(gridLocation, proposed) {

        var offSetX = proposed.x;
        var offSetY = proposed.y;
        //this function checks the proposed path and returns
        //an object containing the original offsets if it's clear
        //but sets the offset to 0 if it's blocked.


        if (offSetX > 0) { //left
            //check index 0 of the one to the left
            //passables
            if (game.mapData.passables[gridLocation.y][gridLocation.x - 1][0]) {
                offSetX = 0;
            }
            //player
            if (game.player.gridLocation.x == gridLocation.x - 1 && game.player.gridLocation.y == gridLocation.y) {
                offSetX = 0;
            }
            //npcs
            game.mapData.npcs.forEach(function(npc) {
                if (npc.x == gridLocation.x - 1 && npc.y == gridLocation.y) {
                    offSetX = 0;
                }
            });
        }
        else if (offSetX < 0) { //right - note the patter for the second two conditionals
            //is different from left
            //check index 0 of the current tile
            if (game.mapData.passables[gridLocation.y][gridLocation.x][0]) {
                offSetX = 0;
            }
            game.mapData.npcs.forEach(function(npc) {
                if (npc.x == gridLocation.x + 1 && npc.y == gridLocation.y) {
                    offSetX = 0;
                }
            });
            if (game.player.gridLocation.x == gridLocation.x + 1 && game.player.gridLocation.y == gridLocation.y) {
                offSetX = 0;
            }
        }
        else if (offSetY < 0) { //down
            //check index 1 of the current tile
            if (game.mapData.passables[gridLocation.y][gridLocation.x][1]) {
                offSetY = 0;
            }
            game.mapData.npcs.forEach(function(npc) {
                if (npc.x == gridLocation.x && npc.y == gridLocation.y + 1) {
                    offSetY = 0;
                }
            });
            if (game.player.gridLocation.x == gridLocation.x && game.player.gridLocation.y == gridLocation.y + 1) {
                offSetY = 0;
            }
        }
        else if (offSetY > 0) { //up
            //check index 1 of the one above
            if (game.mapData.passables[gridLocation.y - 1][gridLocation.x][1]) {
                offSetY = 0;
            }
            game.mapData.npcs.forEach(function(npc) {
                if (npc.x == gridLocation.x && npc.y == gridLocation.y - 1) {
                    offSetY = 0;
                }
            });
            if (game.player.gridLocation.x == gridLocation.x && game.player.gridLocation.y == gridLocation.y + 1) {
                offSetY = 0;
            }
        }
        //return the new offsets 0,0 if it's blocked
        return {
            x: offSetX,
            y: offSetY
        };

    }
}
