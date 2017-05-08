// *****************************************************************************************
// COmbat Game State
// These preload, create, and update functions are run during the main part of the game



States.Combat = function() {};
States.Combat.prototype = {
    preload: function() {},
    create: function(enemies) {
        game.backgroundGroup = game.add.group();
        game.combatPanel = Menu.create();
        Combat.newPanel();
        game.enemyGroup = game.add.group();

        game.enemyArray = [];

        game.combatEnemies.forEach(function(row, rowNumber) {
            var rowGroup = game.add.group();
            row.forEach(function(enemy, enemyNumber) {
                var shadow = game.add.sprite(rowGroup.width, 0, game.enemies[enemy].textureKey)
                shadow.scale.setTo(2.3, 0.3);
                shadow.anchor.setTo(0.1, 1)
                shadow.tint = 0x000000
                shadow.alpha = 0.3
                var enemySprite = game.add.sprite(rowGroup.width, 0, game.enemies[enemy].textureKey)
                shadow.x += 30;
                enemy.x += 30;
                enemySprite.scale.setTo(2);
                enemySprite.shadow = shadow;
                enemySprite.rowNumber = rowNumber;
                enemySprite.enemyNumber = enemyNumber;
                if (typeof game.existingEnemies === 'undefined' || game.existingEnemies === null) {
                    enemySprite.name = game.enemies[enemy].name;
                    enemySprite.hp = game.enemies[enemy].hp;
                    enemySprite.offense = game.enemies[enemy].offense;
                    enemySprite.defense = game.enemies[enemy].defense;
                    enemySprite.spells = game.enemies[enemy].spells;
                    enemySprite.xp = game.enemies[enemy].xp;
                    enemySprite.drops = game.enemies[enemy].drops;
                }
                else {
                    enemySprite.name = game.existingEnemies[rowNumber][enemyNumber].name;
                    enemySprite.hp = game.existingEnemies[rowNumber][enemyNumber].hp;
                    enemySprite.offense = game.existingEnemies[rowNumber][enemyNumber].offense;
                    enemySprite.defense = game.existingEnemies[rowNumber][enemyNumber].defense;
                    enemySprite.spells = game.existingEnemies[rowNumber][enemyNumber].spells;
                    enemySprite.xp = game.existingEnemies[rowNumber][enemyNumber].xp;
                    enemySprite.drops = game.existingEnemies[rowNumber][enemyNumber].drops;

                }
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
        game.enemyGroup.y = 20;
        if (game.enemyArray.length == 0) {
            Combat.infoPanel.new({
                w: 550,
                h: 100,
                x: game.width / 2 - 375,
                y: game.height - 100 - 50,
                type: 'infoPanel',
                text: ["You won.", "Here's where the loot text goes."],
                callback: test
            });
        }

        function test() {
            console.log("hello again")
            game.mapData.start.y = 0;
            game.mapData.start.x = 0;
            game.existingEnemies = null;
            game.moveBlock = false;
            game.state.start('GameState');
        }
    },
    update: function() {
        game.combatPanel.update();

        setSelection();

        function setSelection() {

            game.enemyArray.forEach(function(enemy) {
                if (Combat.selecting && enemy.rowNumber == Combat.enemySelected.row && enemy.enemyNumber == Combat.enemySelected.enemyNumber) {
                    enemy.tint = 0xff3333;
                    enemy.shadow.tint = 0xff0000;
                    enemy.label.tint = 0xff8888;
                    Combat.enemySelected.sprite = enemy;

                }
                else {
                    enemy.tint = 0xFFFFFF;
                    enemy.shadow.tint = 0x000000;
                    enemy.label.tint = 0xFFFFFF;
                }
            });
        }

        if (Combat.selecting && !game.combatSelectionTimeout) {
            checkBounds();
            if (game.cursors.right.isDown || game.cursors.down.isDown) {
                game.combatSelectionTimeout = true;
                Combat.enemySelected.enemyNumber++;
                setSelection();
                checkBounds('enemy');
            }
            else if (game.cursors.left.isDown || game.cursors.up.isDown) {
                game.combatSelectionTimeout = true;
                Combat.enemySelected.enemyNumber--;
                setSelection();
                checkBounds('enemy');

            }

            if (game.spaceBar.isDown) {
                //var key = game.combatEnemies[Combat.enemySelected.row][Combat.enemySelected.enemyNumber];
                Combat.selecting = false;
                Combat.playerAttack([Combat.enemySelected.sprite], Combat.attackType);
            }

            function checkBounds(type) {
                if (type === 'enemy') {
                    if (Combat.enemySelected.enemyNumber >= game.combatEnemies[Combat.enemySelected.row].length || game.combatEnemies[Combat.enemySelected.row].length == 0) {
                        Combat.enemySelected.row++;
                        checkBounds();

                        Combat.enemySelected.enemyNumber = 0;
                    }
                    else if (Combat.enemySelected.enemyNumber < 0 || game.combatEnemies[Combat.enemySelected.row].length == 0) {
                        Combat.enemySelected.row--;
                        checkBounds();
                        Combat.enemySelected.enemyNumber = game.combatEnemies[Combat.enemySelected.row].length - 1;
                    }
                }
                else {
                    if (Combat.enemySelected.row >= game.combatEnemies.length) {
                        Combat.enemySelected.row = 0;
                        if (Combat.enemySelected.enemyNumber >= game.combatEnemies[Combat.enemySelected.row].length) {
                            Combat.enemySelected.enemyNumber = 0;
                        }
                        else if (Combat.enemySelected.enemyNumber < 0) {
                            Combat.enemySelected.enemyNumber = game.combatEnemies[Combat.enemySelected.row].length - 1;
                        }
                    }
                    else if (Combat.enemySelected.row < 0) {
                        Combat.enemySelected.row = game.combatEnemies.length - 1
                        if (Combat.enemySelected.enemyNumber >= game.combatEnemies[Combat.enemySelected.row].length) {
                            Combat.enemySelected.enemyNumber = game.combatEnemies[Combat.enemySelected.row].length - 1;
                        }
                        else if (Combat.enemySelected.enemyNumber < 0) {
                            Combat.enemySelected.enemyNumber = 0;
                        }
                    }
                }
                if (game.combatEnemies[Combat.enemySelected.row].length == 0) {
                    Combat.enemySelected.row++;
                    checkBounds();
                }
            }

            if (game.combatSelectionTimeout) {
                setTimeout(function() {
                    game.combatSelectionTimeout = false;
                }, 200);
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
        game.combatEnemies = [
            ["goblin1", "goblin1", "goblin3"],
            ["goblin2"]
        ];
        game.screenShot = game.map.generateTexture();
        game.state.start('Combat');
    },
    attackMenu: function() {
        console.log(game.screenShot.offSetX, game.screenShot.offSetY)
        game.combatBackground = game.add.sprite(game.screenShot.offSetX, game.screenShot.offSetY, game.screenShot)
        game.combatBackground.scale.setTo(game.zoom);
        game.combatBackground.tint = 0xFF0000
        game.backgroundGroup.add(game.combatBackground)
        game.combatBackPanel = game.add.sprite(0, 0, Menu.rectangleTexture(600, 400, 0x444444))

        //game.combatBackPanel.centerX = game.centerX
        //an infoPanel that takes a settings object:
        //x,y,h,w,type:string,text:[strings]
        game.combatBackPanel.x = game.width / 2 - game.combatBackPanel.width / 2;
        game.combatBackPanel.y = 70;


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
        choiceGroup.y = 40;
        Menu.group.add(choiceGroup);
        var playerInfoBack = game.add.sprite(choiceGroup.width + 60, 0, Menu.rectangleTexture(200, 100, 0x000000))

        Combat.playerStatLabel = game.add.text(playerInfoBack.width / 2, playerInfoBack.height / 2, '', Menu.style)
        Combat.setPlayerInfo();
        Combat.playerStatLabel.anchor.setTo(0.5, 0.5);
        Combat.playerStatLabel.fontSize = 17
        playerInfoBack.addChild(Combat.playerStatLabel)
        Menu.group.add(playerInfoBack)

        function action() {
            Menu.optionCaret.destroy();
            choiceGroup.alpha = 0.5;
            Combat.processAttack(Menu.optionArray[Menu.optionSelected].optionKey);
        }
    },
    setPlayerInfo: function() {
        console.log("setting info")
        var playerInfo = 'HP: ' + game.playerData.stats.hp.current + '/' + game.playerData.stats.hp.max + '\nMP: ' + game.playerData.stats.mp.current + '/' + game.playerData.stats.mp.max
        Combat.playerStatLabel.setText(playerInfo);
    },
    processAttack: function(type) {
        console.log(type);
        //todo use for magic too
        if (type === 'Hit') { //pick the enemy
            Combat.selecting = true;
            Combat.attackType = type;
            game.combatSelectionTimeout = true;
            setTimeout(function() {
                game.combatSelectionTimeout = false;
            }, 200)
        }
        //run - go straight to attack
        //item - open inventory
    },
    playerAttack: function(enemyList, type) {
        if (type === 'Hit') {
            var text = [];
            Combat.infoPanel = Menu.create();
            enemyList.forEach(function(enemy) {
                //determine hit/miss
                //roll a number 1-100
                var roll1 = Math.floor(Math.random() * 100);
                //get the difference between my offense and the enemy's
                var difference = game.playerData.stats.offense - enemy.defense
                    //mark the larger number for later calculations
                var biggerStat = game.playerData.stats.offense > enemy.defense ? game.playerData.stats.offense : enemy.defense
                var evenMissChance = 25; //25% chance to hit on even stats
                //50% chance for a hit, no matter how outclassed you are

                //use the difference/biggerStat to set a negative number out of 50
                //to subtract (add) from the halfRoll
                var target = evenMissChance - difference / biggerStat * evenMissChance
                    //did I make the cut?
                console.log(target)
                console.log(roll1)
                if (roll1 < target) {
                    //miss
                    console.log("miss")
                    text = ["You missed!"]

                }
                else {
                    //hit
                    //a critical hit marker
                    var critical = false;
                    //another 1-100 roll
                    var roll2 = Math.floor(Math.random() * 100);
                    //the baseDamage is half the player's offense
                    var baseDamage = (game.playerData.stats.offense / 2);

                    //the modified damage based on the roll and the player's offense
                    var modDamage = roll2 / 100 * game.playerData.stats.offense

                    //scale the modDamage to the difference (maybe negative)
                    var difference = game.playerData.stats.offense - enemy.defense
                    console.log(difference)
                    modDamage += modDamage * difference / biggerStat;
                    console.log(modDamage)
                        //sum them to get the total
                    var damage = Math.round(baseDamage + modDamage);
                    if (roll2 > 95) { //1 in 20 chance for a critical
                        critical = true;
                        damage *= 2; //double damage that is already high
                    };
                    enemy.hp -= damage;
                    console.log(enemy.hp)
                    if (enemy.hp <= 0) {
                        var tween = game.add.tween(enemy).to({
                            alpha: 0
                        }, 1000, Phaser.Easing.Bounce.In, true);
                        game.add.tween(enemy.shadow).to({
                            alpha: 0
                        }, 1000, Phaser.Easing.Bounce.In, true);
                        game.add.tween(enemy.label).to({
                            alpha: 0
                        }, 1000, Phaser.Easing.Bounce.In, true);
                        tween.onComplete.add(finish);
                        var oldWidth = enemy.width;
                        console.log(game.combatEnemies[enemy.rowNumber][enemy.enemyNumber])
                        game.combatEnemies[enemy.rowNumber].splice(enemy.enemyNumber, 1);
                        console.log(game.combatEnemies)

                        function finish() {
                            var rowNumber = enemy.rowNumber;
                            enemy.shadow.destroy();
                            enemy.label.destroy();
                            enemy.destroy();
                            console.log(oldWidth, game.enemyGroup.children[rowNumber].width)
                            console.log(game.enemyGroup.children[enemy.rowNumber])
                            game.add.tween(game.enemyGroup.children[enemy.rowNumber]).to({
                                centerX: game.width / 2
                            }, 500, Phaser.Easing.Exponential.In, true);
                        }



                    }

                    if (critical) text.push("Critical Hit!")

                    text.push("You did " + damage.toString() + " damage to the " + enemy.name + "!");
                    if (enemy.hp <= 0) text.push("You've killed it!");
                    Combat.attackAnimation(enemy)

                }
                console.log(enemy);

            });
            Combat.infoPanel.new({
                w: 550,
                h: 100,
                x: game.width / 2 - 375,
                y: game.height - 100 - 50,
                type: 'infoPanel',
                text: text,
                callback: test
            });

            function test() {
                console.log("this")
                Combat.infoPanel.group.destroy();
                Combat.enemyAttack(0);
            }
        }
    },
    enemyAttack: function(enemyNumber) {

        var text = [];
        //Combat.infoPanel = Menu.create();
        console.log();
        var enemy = game.enemyArray[enemyNumber];
        if (enemy.hp > 0) {
            //determine hit/miss
            //roll a number 1-100
            var roll1 = Math.floor(Math.random() * 100);
            //get the difference between the enemy's offense and mine
            //reversed from the playerAttack function
            var difference = enemy.offense - game.playerData.stats.defense
                //mark the larger number for later calculations
            var biggerStat = game.playerData.stats.defense > enemy.offense ? game.playerData.stats.defense : enemy.offense
            var evenMissChance = 25; //25% chance to hit on even stats
            //50% chance for a hit, no matter how outclassed you are

            //use the difference/biggerStat to set a negative number out of 50
            //to subtract (add) from the halfRoll
            var target = evenMissChance - difference / biggerStat * evenMissChance
                //did I make the cut?

            if (roll1 < target) //miss
            {
                //miss
                console.log("miss")
                text = [enemy.name + " missed!"]
            }
            else {
                //hit
                //a critical hit marker
                var critical = false;
                //another 1-100 roll
                var roll2 = Math.floor(Math.random() * 100);
                //the baseDamage is half the player's offense
                var baseDamage = (enemy.offense / 3);

                //the modified damage based on the roll and the player's offense
                var modDamage = roll2 / 100 * enemy.offense / 3;

                //scale the modDamage to the difference (maybe negative)
                var difference = enemy.offense - game.playerData.stats.defense
                modDamage += modDamage * difference / biggerStat;
                //sum them to get the total
                var damage = Math.round(baseDamage + modDamage);
                if (roll2 > 95) { //1 in 20 chance for a critical
                    critical = true;
                    damage *= 2; //double damage that is already high
                };
                game.playerData.stats.hp.current -= damage;
                Combat.setPlayerInfo();
                //death check here
                if (critical) text.push(enemy.name + " critical hit!")
                text.push(enemy.name + " did " + damage.toString() + " damage to you!");
                game.camera.shake(0.02, 500);
            }
            Combat.infoPanel.new({
                w: 550,
                h: 100,
                x: game.width / 2 - 375,
                y: game.height - 100 - 50,
                type: 'infoPanel',
                text: text,
                callback: nextEnemyAttack
            });
        }
        else //dead
        {
            nextEnemyAttack();
        }


        function nextEnemyAttack() {
            if (enemyNumber + 1 < game.enemyArray.length) {
                Combat.infoPanel.group.destroy();
                Combat.enemyAttack(enemyNumber + 1);
            }
            else {
                game.existingEnemies = [
                    [],
                    []
                ]
                game.enemyArray.forEach(function(enemy) {
                    console.log(enemy)
                    if (enemy.hp > 0) {
                        game.existingEnemies[enemy.rowNumber].push({
                            name: enemy.name,
                            hp: enemy.hp,
                            offense: enemy.offense,
                            defense: enemy.defense,
                            spells: enemy.spells,
                            xp: enemy.xp,
                            drops: enemy.drops
                        })
                    }

                });
                game.state.start('Combat');


            }
        }
    },
    attackAnimation: function(sprite) {
        var originalX = sprite.x;
        var originalY = sprite.y;
        var originalShadowX = sprite.shadow.x;
        console.log("ATTACK ANIMATION")
        var effectSprite = game.add.sprite(0, 0, sprite.generateTexture());
        effectSprite.tint = 0xff0000;
        effectSprite.alpha = 0;
        effectSprite.anchor.setTo(sprite.anchor.x, sprite.anchor.y);
        sprite.addChild(effectSprite);
        var shakeCount = 0;
        shake();

        function shake() {
            if (shakeCount < 15) {
                var noise = {
                    x: Math.random() * 8,
                    y: Math.random() * 5
                }
                var shakeTween = game.add.tween(sprite).to({
                    x: originalX + noise.x,
                    y: originalY + noise.y,
                }, 25, Phaser.Easing.Bounce.Out, true);
                var shakeTween = game.add.tween(sprite.shadow).to({
                    x: originalShadowX + noise.x
                }, 25, Phaser.Easing.Bounce.Out, true);
                shakeCount++
                shakeTween.onComplete.add(shake);
            }
            else {
                sprite.x = originalX;
                sprite.y = originalY;
                sprite.shadow.x = originalShadowX;
            }
        }
        var redTween = game.add.tween(effectSprite).to({
            alpha: 1
        }, 1000, Phaser.Easing.Bounce.Out, true);
        redTween.onComplete.add(deleteSprite, this);

        function deleteSprite() {
            effectSprite.destroy();
        }
    },
    newPanel: function() {
        game.combatPanel.new({
            w: 550,
            h: 100,
            x: game.width / 2 - 375,
            y: game.height - 100 - 50,
            type: 'combat'
        });
    }
}
