var Events = {
    introTown: function() { //back to town from interiors
        switch (game.mapKey) {
            case 'introInterior1':
                game.mapStart = {
                    x: 4,
                    y: 17
                };
                break;
            case 'introInterior2':
                game.mapStart = {
                    x: 9,
                    y: 15
                };
                break;
            case 'introInterior3':
                game.mapStart = {
                    x: 14,
                    y: 17
                };
                break;
            case 'introInterior4':
                game.mapStart = {
                    x: 19,
                    y: 16
                };
                break;
            case 'introInterior5':
                game.mapStart = {
                    x: 18,
                    y: 8
                };
                break;
        }
        game.mapKey = 'introStart';
        States.GameState.prototype.reload();
    },
    introTown1: function() { //door number 1
        game.mapKey = 'introInterior1';
        game.mapStart = {
            x: 6,
            y: 7
        };
        States.GameState.prototype.reload();
        game.player.frame = 10;

    },
    introTown2: function() { //door number 2
        game.mapKey = 'introInterior2';
        game.mapStart = {
            x: 10,
            y: 7
        };
        States.GameState.prototype.reload();
        game.player.frame = 10;

    },
    introTown3: function() { //door number 3
        game.mapKey = 'introInterior3';
        game.mapStart = {
            x: 6,
            y: 7
        };
        States.GameState.prototype.reload();
        game.player.frame = 10;

    },
    introTown4: function() { //door number 4
        game.mapKey = 'introInterior4';
        game.mapStart = {
            x: 6,
            y: 7
        };
        States.GameState.prototype.reload();
        game.player.frame = 10;

    },
    introTown5: function() { //door number 5
        game.mapKey = 'introInterior5';
        game.mapStart = {
            x: 6,
            y: 7
        };
        States.GameState.prototype.reload();
        game.player.frame = 10;

    },
    downstairs: function() { //From townInterior2 to maze
        game.mapKey = 'introMaze';
        game.mapStart = {
            x: 2,
            y: 2
        };
        States.GameState.prototype.reload();
    },
    introTextAlt: function() { //unused
        //this is currently how I'm keeping things from recurring
        //eventually these flags will be stored on the 
        //playerData object instead
        if (!this.flags['introTextAlt']) {
            this.flags['introTextAlt'] = true;
            game.moveBlock = true;
            swal("Backyard", 'You\'re quite the explorer aren\'t you?', "success").then(function() {
                game.moveBlock = false;
            });
        }
    },
    test: function() { //unused
        game.mapKey = 'introStart';
        States.GameState.prototype.reload();
    },
    flags: {}
};