// *****************************************************************************************
// COmbat Game State
// These preload, create, and update functions are run during the main part of the game



States.Combat = function() {};
States.Combat.prototype = {
    preload: function() {

    },

    create: function() {
        game.backgroundGroup = game.add.group();
        game.combatPanel = Menu.create();
        Combat.newPanel();
        game.enemyGroup = game.add.group();
        game.combatEnemies = [
            ["goblin1", "goblin1", "goblin3"],
            ["goblin2"]
        ];
        game.enemyArray = [];
        game.combatEnemies.forEach(function(row, rowNumber) {
            var rowGroup = game.add.group();
            row.forEach(function(enemy, enemyNumber) {
                var shadow = game.add.sprite(64 * 3 * enemyNumber, 0, game.enemies[enemy].textureKey)
                shadow.scale.setTo(2.3, 0.3);
                shadow.anchor.setTo(0.1, 1)
                shadow.tint = 0x000000
                shadow.alpha = 0.3
                var enemySprite = game.add.sprite(64 * 3 * enemyNumber, 0, game.enemies[enemy].textureKey)
                enemySprite.scale.setTo(2);
                enemySprite.shadow = shadow;
                enemySprite.rowNumber = rowNumber;
                enemySprite.enemyNumber = enemyNumber;
                game.enemyArray.push(enemySprite)
                enemySprite.anchor.setTo(0, 1);
                var label = game.add.text(enemySprite.x + enemySprite.width / 2, enemySprite.y + 10, game.enemies[enemy].name, Menu.style)
                label.fontSize = 10
                enemySprite.label = label;
                label.x -= label.width / 2
                rowGroup.add(label);
                rowGroup.add(shadow);
                rowGroup.add(enemySprite);
            });
            rowGroup.x = game.width / 2 - rowGroup.width / 2;
            rowGroup.y = 250 + 150 * rowNumber;
            game.enemyGroup.add(rowGroup)
        });
        console.log(game.enemyGroup.y = 20)
    },
    update: function() {
        game.combatPanel.update();
        game.enemyArray.forEach(function(enemy) {
            if (Combat.selecting && enemy.rowNumber == Combat.enemySelected.row && enemy.enemyNumber == Combat.enemySelected.enemyNumber) {
                enemy.tint = 0xff3333
                enemy.shadow.tint = 0xff0000
                enemy.label.tint = 0xff8888
            }
            else {
                enemy.tint = 0xFFFFFF
                enemy.shadow.tint = 0xFFFFFF
                enemy.label.tint = 0xFFFFFF
            }
        });
        if (Combat.selecting && !game.combatSelectionTimeout) {
            if (game.cursors.right.isDown) {
                game.combatSelectionTimeout = true;
                Combat.enemySelected.enemyNumber++;
                checkBounds('enemy');

            }
            else if (game.cursors.left.isDown) {
                game.combatSelectionTimeout = true;
                Combat.enemySelected.enemyNumber--;
                checkBounds('enemy');

            }
            else if (game.cursors.up.isDown) {
                game.combatSelectionTimeout = true;
                Combat.enemySelected.row++;
                checkBounds();


            }
            else if (game.cursors.down.isDown) {
                game.combatSelectionTimeout = true;
                Combat.enemySelected.row--;
                checkBounds();

            }

            function checkBounds(type) {
                if (type === 'enemy') {
                    if (Combat.enemySelected.enemyNumber >= game.combatEnemies[Combat.enemySelected.row].length) {
                        Combat.enemySelected.row++;
                        checkBounds();
                        Combat.enemySelected.enemyNumber = 0;
                    }
                    else if (Combat.enemySelected.enemyNumber < 0) {
                        Combat.enemySelected.row--;
                        checkBounds();
                        Combat.enemySelected.enemyNumber = game.combatEnemies[Combat.enemySelected.row].length - 1;
                    }
                }
                else {
                    if (Combat.enemySelected.row >= game.combatEnemies.length) {
                        Combat.enemySelected.row = 0
                        if (Combat.enemySelected.enemyNumber >= game.combatEnemies[Combat.enemySelected.row].length) {
                            Combat.enemySelected.enemyNumber = 0
                        }
                        else if (Combat.enemySelected.enemyNumber < 0) {
                            Combat.enemySelected.enemyNumber = game.combatEnemies[Combat.enemySelected.row].length - 1
                        }

                    }
                    else if (Combat.enemySelected.row < 0) {
                        Combat.enemySelected.row = game.combatEnemies.length - 1
                        if (Combat.enemySelected.enemyNumber >= game.combatEnemies[Combat.enemySelected.row].length) {
                            Combat.enemySelected.enemyNumber = game.combatEnemies[Combat.enemySelected.row].length - 1
                        }
                        else if (Combat.enemySelected.enemyNumber < 0) {
                            Combat.enemySelected.enemyNumber = 0

                        }
                    }
                }



            }

            if (game.combatSelectionTimeout) {
                setTimeout(function() {
                    game.combatSelectionTimeout = false;
                }, 200)
            }
        }


    },
    render: function() {}
};

game.state.add('Combat', States.Combat);

var Combat = {
    enemySelected: {
        row: 0,
        enemyNumber: 0
    },
    test: function() {
        game.screenShot = game.map.generateTexture();
        game.state.start('Combat');
    },
    attackMenu: function() {
        game.combatBackground = game.add.sprite(0, 0, game.screenShot)
        game.combatBackground.scale.setTo(game.zoom);
        game.combatBackground.tint = 0xFF0000
        game.backgroundGroup.add(game.combatBackground)
        game.combatBackPanel = game.add.sprite(0, 0, Menu.rectangleTexture(600, 400, 0x444444))
            //game.combatBackPanel.centerX = game.centerX
            //an infoPanel that takes a settings object:
            //x,y,h,w,type:string,text:[strings]
        game.combatBackPanel.x = game.width / 2 - game.combatBackPanel.width / 2;
        game.combatBackPanel.y = 70
        var options = ['Hit', 'Magic', 'Items', 'Run'];
        var choiceSettings = {
            choiceArray: options,
            keyArray: options,
            callback: action,
            columns: 4,
            clear: false
        };
        
        //create an options group based on the settings
        var choiceGroup = Menu.options(choiceSettings);
        choiceGroup.x = 60;
        choiceGroup.y = 50;
        Menu.group.add(choiceGroup);

        function action() {
            Menu.optionCaret.destroy();
            choiceGroup.alpha = 0.5;
            Combat.attack(Menu.optionArray[Menu.optionSelected].optionKey);
        }
    },
    attack: function(type) {
        console.log(type);

        if (type === 'Hit') {
            Combat.selecting = true;;
        }
    },
    newPanel: function() {
        game.combatPanel.new({
            w: 800,
            h: 100,
            x: game.width / 2 - 400,
            y: game.height - 100 - 50,
            type: 'combat'
        });
    }
}
