var Events = {
    test: function() {
        game.playerSheet = 'baby';
        game.mapKey='plaidTown';
        console.log(game.mapKey)
        States.GameState.prototype.reload();
    },
    downstairs: function(){
        
        game.mapKey='introMaze';
        States.GameState.prototype.reload();
    },
    introText1: function(){
        swal("Events", 'This event was added with the map editor and coded in the events.js file.', "success");
    },
    introText2: function(){
        swal("Events", 'Each event has a key, which is the name of the function that is run when you touch it.', "success");
    },
    introText3: function(){
        swal("Events", 'Events can do many things.  The stairway inside the house even loads a different map!', "success");
    },
    introTextAlt: function(){
        swal("Backyard", 'You\'re quite the explorer aren\'t you?', "success");
    }
};
