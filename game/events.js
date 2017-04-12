var Events = {
    test: function() {
        game.playerSheet = 'baby';
        game.mapKey = 'plaidTown';
        console.log(game.mapKey)
        States.GameState.prototype.reload();
    },
    downstairs: function() {
        game.mapKey = 'introMaze';
        States.GameState.prototype.reload();
    },
    introText1: function() {
        //this is currently how I'm keeping things from recurring
        //eventually these flags will be stored on the 
        //playerData object instead
        if (!this.flags['introText1']) {
            this.flags['introText1'] = true;
            game.moving = true;
            swal({
                title: "Events",
                text: 'This event was added with the map editor and coded in the events.js file.',
                type: 'success'
            }).then(function() {
                game.moving = false;
            });
        }


    },
    introText2: function() {
        if (!this.flags['introText2']) {
            this.flags['introText2'] = true;
            game.moving = true;
            swal("Events", 'Each event has a key, which is the name of the function that is run when you touch it.', "success").then(function() {
                game.moving = false;
            });
        }
    },
    introText3: function() {
        if (!this.flags['introText3']) {
            this.flags['introText3'] = true;
            game.moving = true;
            swal("Events", 'Events can do many things.  The stairway inside the house even loads a different map!', "success").then(function() {
                game.moving = false;
            });
        }
    },
    introTextAlt: function() {
        if (!this.flags['introTextAlt']) {
            this.flags['introTextAlt'] = true;
            game.moving = true;
            swal("Backyard", 'You\'re quite the explorer aren\'t you?', "success").then(function() {
                game.moving = false;
            });
        }
    },
    flags: {}
};
