var Events = {
    test: function() {
        game.playerSheet = 'baby';
        game.mapKey='plaidTown';
        console.log(game.mapKey)
        States.GameState.prototype.reload();
    }
};
