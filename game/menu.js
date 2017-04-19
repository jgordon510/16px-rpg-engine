var Menu = {
    rectangleTexture: function(w, h, bgColor) {
        //this function recturns a bordered gray rectangle
        //for use in the selector menu.
        var backgroundColor = bgColor ||0x111111
        var graphics = game.add.graphics(0, 0);
        graphics.beginFill(backgroundColor);
        graphics.lineStyle(5, 0xAAAAAA, 1);
        graphics.drawRect(0, 0, w, h);
        var texture = graphics.generateTexture();
        graphics.destroy();
        return texture;
    },
    create: function() {
        //this function is used in the initial creation of the menu
        this.group = game.add.group();
        this.cursors = game.input.keyboard.createCursorKeys();
        this.choiceGroup = game.add.group();
        //this.group.add(this.choiceGrop);
        this.spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
        Menu.spaceBar.onDown.add(this.spacePress);
        Menu.dKey.onDown.add(this.spacePress);
        this.style.fontSize = 20;
        return this;
    },
    spaceBarCallback: null,
    spacePress: function() {
        //this is the general spacePress callback funtion
        //it runs the spaceBarCallback which is set for different contexts
        if (Menu.spaceBarCallback !== null) {
            var callback = Menu.spaceBarCallback;
            Menu.spaceBarCallback = null;
            callback();
        }
    },
    new: function(settings) {
        //this is used to create the panel that the menu sits in
        //the settings object allows it to be used flexibly to 
        //make any menu
        game.menuOpen = true;
        this.caretMoving = false;
        this.group.destroy();
        this.group = game.add.group();
        //called when a new window is required
        this.panel = game.add.sprite(0, 0, this.rectangleTexture(settings.w, settings.h));
        this.group.add(this.panel);
        this.style.wordWrapWidth = settings.w - 40;
        this.group.x = settings.x;
        this.group.y = settings.y;
        this[settings.type](settings);
    },
    openWalkMenu: function() {
        //opens the walk menu
        game.walkPanel.new({
            w: 200,
            h: 250,
            x: 50,
            y: 50,
            type: 'walkMenu'
        });
    },
    infoPanel: function(settings) {
        console.log(settings)
        //an infoPanel that takes a settings object:
        //x,y,h,w,type:string,text:[strings]
        this.infoText = game.add.text(20, 20, '', this.style);
        console.log("typetext")
        this.typeText(this.infoText, settings.text, 0);
        this.group.add(this.infoText);
    },
    combat: function(settings) {
        Combat.attackMenu()
    },
    itemPanel: function(settings) {
        //an infoPanel that takes a settings object:
        //x,y,h,w,type:string,text:[strings]
        this.infoText = game.add.text(20, 20, 'Items:', this.style);
        this.goldLabel = game.add.text(0, 20, game.playerData.gold.toString() + " gold", this.style);
        this.goldLabel.align = 'right';
        this.goldLabel.right = Menu.panel.width - 20;
        this.group.add(this.goldLabel)
        this.group.add(this.infoText);
        var choiceSettings = {
            choiceArray: game.playerData.inventory,
            keyArray: game.playerData.inventory,
            callback: itemSelection,
            columns: 2,
            clear: false
        };
        //create an options group based on the settings
        var choiceGroup = Menu.options(choiceSettings);
        choiceGroup.x = 60;
        choiceGroup.y = 70;
        this.group.add(choiceGroup);

        function itemSelection() {
            var optionKey = Menu.optionArray[Menu.optionSelected].optionKey;
            console.log(optionKey)
            console.log(game.items.usables[optionKey])
            console.log(game.items.wearables[optionKey])

            if (typeof game.items.usables[optionKey] !== 'undefined') {
                //item is usable
                var item = game.items.usables[optionKey]
                var report = [];
                if (typeof item["hpRecovery"] !== 'undefined' && item["hpRecovery"] != null) {
                    game.playerData.stats.hp.current += item["hpRecovery"];
                    report.push("You recovered " + item["hpRecovery"].toString() + " HP!");
                    if (game.playerData.stats.hp.current >= game.playerData.stats.hp.max) {
                        game.playerData.stats.hp.current = game.playerData.stats.hp.max;
                        report.push("Your HP is now maxed out!");
                    }
                }
                if (typeof item["mpRecovery"] !== 'undefined' && item["mpRecovery"] != null) {
                    game.playerData.stats.mp.current += item["mpRecovery"];
                    report.push("You recovered " + item["mpRecovery"].toString() + " MP!");
                    if (game.playerData.stats.mp.current > game.playerData.stats.mp.max) {
                        game.playerData.stats.mp.current = game.playerData.stats.mp.max;
                        report.push("Your MP is now maxed out!");
                    }
                }
                if (typeof item["statEffects"] !== 'undefined' && item["statEffects"] != null) {
                    for (var key in item["statEffects"]) {
                        if (item["statEffects"].hasOwnProperty(key)) {
                            console.log(key + " -> " + item["statEffects"][key]);
                            game.playerData.stats[key] += item["statEffects"][key].effect
                            report.push('Your ' + game.playerData.stats[key] + ' has ' + item["statEffects"][key].effect > 0 ? 'increased' : 'decreased' + ' by ' + item["statEffects"][key].effect.toString() + '.');
                        }
                    }
                }
                if (typeof item["event"] !== 'undefined' && item["event"] != null) {
                    eval(item["event"]);
                }
                //use it up
                game.playerData.inventory.splice(Menu.optionSelected, 1)
                game.infoPanel.new({
                    w: 400,
                    h: 200,
                    x: game.width / 2 - 200,
                    y: 50,
                    type: 'infoPanel',
                    text: report
                });
            }
            else if (typeof game.items.wearables[optionKey] !== 'undefined') {

                game.infoPanel.new({
                    w: 400,
                    h: 200,
                    x: game.width / 2 - 200,
                    y: 50,
                    type: 'infoPanel',
                    text: ["You need to wear that item."]
                });
            }
            else {
                game.infoPanel.new({
                    w: 400,
                    h: 200,
                    x: game.width / 2 - 200,
                    y: 50,
                    type: 'infoPanel',
                    text: ["What is that?"]
                });
                Menu.close(true);
            }

        }

    },
    walkMenu: function() {
        //this describes the walkMenu
        var options = ["Talk to", "Items", "Magic", "Wear", "Activate", "Status"];
        var keys = ["talkTo", "items", "magic", "wear", "activate", "status"];

        var choiceSettings = {
            choiceArray: options,
            keyArray: keys,
            callback: walkSelection,
            columns: 1,
            clear: false
        };
        //create an options group based on the settings
        var choiceGroup = Menu.options(choiceSettings);
        choiceGroup.x = 40;
        choiceGroup.y = 30;
        this.group.add(choiceGroup);

        //this handles the selection of items in the walk menu
        function walkSelection() {
            //set the optionKey
            var optionKey = Menu.optionArray[Menu.optionSelected].optionKey;
            switch (optionKey) {
                case 'talkTo':
                    var found = false;
                    game.mapData.npcs.forEach(function(npc) {
                        if (game.player.gridLocation.x - game.playerDirection.x === npc.x && game.player.gridLocation.y - game.playerDirection.y === npc.y) {
                            //there is an NPC in the direction the player is facing
                            found = true;
                            //make the dialog panel
                            game.dialogPanel.new({
                                w: 800,
                                h: 270,
                                x: game.width / 2 - 400,
                                y: game.height - 270 - 50,
                                type: 'dialog',
                                dialog: game.dialog[npc.nameKey]
                            });
                        }
                    });
                    if (!found) {
                        //nobody there
                        game.infoPanel.new({
                            w: 400,
                            h: 200,
                            x: game.width / 2 - 200,
                            y: 50,
                            type: 'infoPanel',
                            text: ["There's nobody there!"]
                        });
                    }
                    break;
                case 'items':
                    game.dialogPanel.new({
                        w: 800,
                        h: 450,
                        x: game.width / 2 - 400,
                        y: game.height / 2 - 300,
                        type: 'itemPanel',
                        callback: null
                    });
                    break;
                default:
                    //temporary display for unfinished menus
                    game.infoPanel.new({
                        w: 400,
                        h: 200,
                        x: game.width / 2 - 200,
                        y: 50,
                        type: 'infoPanel',
                        text: ["That menu isn't finished yet!", "Stop clicking it.", "Please."]
                    });
                    // code
            }

        }
    },
    dialog: function(settings) {
        //this displays and processes the dialog files
        this.dialogText = game.add.text(20, 20, '', this.style);
        this.group.add(this.dialogText);
        //typeText displays the text one character at a time
        this.typeText(this.dialogText, settings.dialog[settings.dialog.startKey].text, 0, nextTalk);
        //a flag array to save them up to execute on goodbye
        this.flags = [];

        function nextTalk() {
            //add any new flags
            Menu.flags = Menu.flags.concat(settings.dialog[settings.dialog.startKey].flags);
            //set the question

            var question = settings.dialog[settings.dialog.startKey].question;

            //set the next startKey
            settings.dialog.startKey = settings.dialog[settings.dialog.startKey].key;



            console.log(settings.dialog.startKey)
            if (settings.dialog.startKey === 'bye') {
                //bye ends the conversation
                Menu.dialogText.setText(Menu.dialogText.text.substring(0, Menu.dialogText.text.length - 1))
                Menu.typeText(Menu.dialogText, settings.dialog['bye'].text, 0, cleanUp);

                function cleanUp() {
                    settings.dialog.startKey = settings.dialog['bye'].key;
                    Menu.dialogText.setText(Menu.dialogText.text.substring(0, Menu.dialogText.text.length - 1) + '*');
                    Menu.spaceBarCallback = goodbye;

                    function goodbye() {
                        Menu.close(true);
                        Menu.flags.forEach(function(flag) {
                            console.log("evaluating flag: ", flag)
                            eval(flag)
                        });

                    }
                }
            }
            else if (settings.dialog.startKey !== null) {
                //check for a "check"
                //used to determine the next key based on a boolean
                //useful for stores to determine if player has sufficient money, for example
                evalCheckpoints();
                evalTransactions();

                function evalTransactions() {
                    if (typeof settings.dialog[settings.dialog.startKey].transaction !== 'undefined') {

                        var transaction = settings.dialog[settings.dialog.startKey].transaction;
                        console.log(transaction)
                        game.playerData.gold += transaction.gold;
                        if (typeof transaction.add !== undefined) {
                            game.playerData.inventory = game.playerData.inventory.concat(transaction.add);
                        }
                        if (typeof transaction.remove !== undefined) {
                            transaction.remove.forEach(function(removal) {
                                var index = game.playerData.inventory.indexOf(removal)
                                if (index > -1) {
                                    game.playerData.inventory.splice(index, 1);
                                }
                            });

                        }

                    }
                }



                function evalCheckpoints() {
                    console.log(settings.dialog.startKey)
                    if (typeof settings.dialog[settings.dialog.startKey].check !== 'undefined') {
                        var checkpoint = settings.dialog[settings.dialog.startKey].check;
                        console.log(checkpoint[0])
                        if (eval(checkpoint[0])) //check the boolean for truth
                        {
                            console.log("new key: ", checkpoint[1])
                            settings.dialog.startKey = checkpoint[1]; //set the alternative startKey
                            evalCheckpoints()
                        }
                    }
                }
                //there's still more to say
                //remove the more caret
                Menu.dialogText.setText(Menu.dialogText.text.substring(0, Menu.dialogText.text.length - 2));
                //type the next line
                Menu.typeText(Menu.dialogText, settings.dialog[settings.dialog.startKey].text, 0, nextTalk);
            }
            else { //it must be a question
                setTimeout(function() { //wait 500ms
                    Menu.dialogText.setText(""); //clear the screen
                    //type the question and run the questionOptions callback after
                    Menu.typeText(Menu.dialogText, settings.dialog.questions[question].text, 0, questionOptions);

                    function questionOptions() {
                        Menu.dialogText.setText(Menu.dialogText.text.substring(0, Menu.dialogText.text.length - 1));
                        console.log(settings.dialog.questions[question])
                        console.log(settings.dialog.questions[question].options)

                        var choiceSettings = {
                            choiceArray: settings.dialog.questions[question].options,
                            keyArray: settings.dialog.questions[question].keys,
                            callback: endQuestion, //run after selection
                            columns: settings.dialog.questions[question].columns,
                            clear: true
                        };
                        //make choices for the question
                        console.log(choiceSettings)
                        var choiceGroup = Menu.options(choiceSettings);
                        //shift the group
                        choiceGroup.x = (Menu.panel.width - choiceGroup.width) / 2;
                        choiceGroup.y = Menu.dialogText.height + 20;

                        Menu.dialogText.addChild(choiceGroup);

                        //this is run after selection
                        function endQuestion() {
                            //we have a new startKey in the answer
                            settings.dialog[settings.dialog.startKey] = {
                                key: Menu.optionArray[Menu.optionSelected].optionKey
                            };
                            nextTalk();
                        }
                    }
                }, 500); //delay before the question is asked
            }
        }
    },
    options: function(settings) {
        console.log(settings)
            //this generates a selectable list of options
        Menu.optionArray = [];
        var optionGroup = game.add.group();
        var choiceArray = settings.choiceArray;
        var keyArray = settings.keyArray;
        var callback = settings.callback;
        var columns = settings.columns;
        var clear = settings.clear;
        game.caretColumns = columns;

        //go through the choices
        var extraSpace = 0;
        choiceArray.forEach(function(option, index) {
            //add a sprite for each
            var sprite = game.add.text(0 + (index % columns * Menu.panel.width / columns), extraSpace + (Math.floor(index / columns) * 35), option, Menu.style)
                //adjust the col,row by the number of columns
            sprite.wordWrapWidth = Menu.panel.width / columns
            sprite.fontSize *= .8;
            extraSpace += (sprite.height - sprite.fontSize * 1.3);

            sprite.menuLocation = {
                col: index % columns,
                row: Math.floor(index / columns)
            };

            //set the sprites optionKey
            sprite.optionKey = keyArray[index];
            //push it into the stack
            Menu.optionArray.push(sprite);
            //add the sprite to the group
            optionGroup.add(sprite);
        });
        //set the optionSelected
        Menu.optionSelected = 0;
        //add the selection caret
        Menu.optionCaret = game.add.text(0, 0, '>', Menu.style);
        //add it to the group
        optionGroup.add(Menu.optionCaret);
        //this function sets the caret location
        Menu.moveCaret();
        //set the new spaceBarCallback
        Menu.spaceBarCallback = selectItem;
        //return the group itself
        return optionGroup;

        function selectItem() {
            //run when an item is selected
            if (typeof Menu.dialogText !== 'undefined') {
                //clear the text if we were in dialog
                Menu.dialogText.setText("");
            }
            if (clear) {
                //destroy the options if specified in settings
                Menu.optionArray.forEach(function(option) {
                    option.destroy();
                });
            }
            //don't need it anymore, but the group destruction
            //might handle this
            Menu.optionCaret.destroy();
            //run the callback
            console.log("running cb")
            callback();
        }

    },
    moveCaret: function(key) {
        //this function puts the caret in the righ tplace
        if (!Menu.caretMoving && typeof Menu.optionArray !== 'undefined') {
            //lockout
            Menu.caretMoving = true;
            //adjust for out of bounds values
            while (Menu.optionSelected >= Menu.optionArray.length) {
                Menu.optionSelected -= Menu.optionArray.length;
            }
            while (Menu.optionSelected < 0) {
                Menu.optionSelected += Menu.optionArray.length;
            }
            //place it
            Menu.optionCaret.x = Menu.optionArray[Menu.optionSelected].x - Menu.optionCaret.width - 5;
            Menu.optionCaret.y = Menu.optionArray[Menu.optionSelected].y;
            setTimeout(function() {
                Menu.caretMoving = false;
            }, 180); //unset lockout
        }

    },
    close: function(unBlock) {
        //this clears the group
        if (unBlock) {
            setTimeout(function() {
                //unset the lockout
                game.menuOpen = false;
            }, 200);

        }
        //destroy the group children
        Menu.group.removeAll();
        Menu.caretMoving = true;
    },
    typeText: function(sprite, text, startIndex, callback) { //needs a settings object
        console.log("running typetext")
        //this types the text, char by char
        var characterIndex = 0;
        addChar();

        function addChar() {
            //this is a recursive function
            //add another character
            sprite.setText(sprite.text + text[startIndex][characterIndex]);
            //increment
            characterIndex++;
            //Still have text left?
            if (characterIndex < text[startIndex].length) {
                //too much for panel, wait and clear
                //then continue
                if (sprite.height > Menu.panel.height - 50) {
                    setTimeout(clear, 500);

                    function clear() {
                        sprite.setText('');
                        addChar(); //recursion
                    }
                }
                else {
                    //recursion
                    setTimeout(addChar, 50);
                }
            }
            else { //I'm done with the sentence
                //Another sentence?
                if (startIndex < text.length - 1) {
                    //add a caret
                    sprite.setText(sprite.text + '  >');
                    //wait for spacebar
                    Menu.spaceBarCallback = nextLine;

                    function nextLine(input) {
                        //spacebar pressed? 
                        //remove caret
                        console.log("here")
                        sprite.setText(sprite.text.substring(0, sprite.text.length - 3));
                        //new line
                        sprite.setText(sprite.text + '\n');
                        //continue
                        Menu.typeText(sprite, text, startIndex + 1, callback);
                    }
                }
                else { //actually done?
                    if (typeof callback === 'undefined') {
                        //goodbye
                        sprite.setText(sprite.text + ' *');
                        //wait for spacebar to close
                        Menu.spaceBarCallback = shutdown;
                    }
                    else {
                        //there's more: caret and callback
                        sprite.setText(sprite.text + '  >');
                        Menu.spaceBarCallback = callback;
                    }

                    function shutdown() {
                        //need this to set the input as true
                        Menu.close(true)
                    }
                }
            }
        }
    },
    update: function() {
        if (!Menu.caretMoving) {
            //I've tried removing some of this apparent duplication
            //but it all seems necessary for proper performance
            if (typeof game.pad._rawPad !== 'undefined') {
                //this is necessary to lockout the moveCaret() to moves for performance
                if (game.pad._rawPad.axes[6] !== 0 || game.pad._rawPad.axes[7] !== 0) {
                    //this prevents diagonals, which prevents double moves
                    if (Math.abs(game.pad._rawPad.axes[6]) > 0) {
                        Menu.optionSelected += game.pad._rawPad.axes[6]; //dpadX
                    }
                    else {
                        Menu.optionSelected += game.pad._rawPad.axes[7] * game.caretColumns; //dpadY
                    }
                    Menu.moveCaret();
                }
                if (game.pad._rawPad.buttons[0].pressed) //a button
                {
                    Menu.spacePress();
                }
            }

            //adjust the optionSelected and move the caret
            if (Menu.cursors.down.isDown) {
                Menu.optionSelected += game.caretColumns;
                Menu.moveCaret();
            }
            else if (Menu.cursors.up.isDown) {
                Menu.optionSelected -= game.caretColumns;
                Menu.moveCaret();
            }
            else if (Menu.cursors.left.isDown) {
                Menu.optionSelected--;
                Menu.moveCaret();
            }
            else if (Menu.cursors.right.isDown) {
                Menu.optionSelected++;
                Menu.moveCaret();
            }
        }

    },
    style: { //text style
        font: 'Press Start 2P',
        fill: '#BBBBBB',
        align: 'left',
        wordWrap: true
    }
};


//temporary test functions
//not for actual use
function testMenu() {
    game.menu.new({
        w: game.width * .5,
        h: game.width * .5,
        x: game.width * .25,
        y: 100,
        type: 'infoPanel',
        text: ["This is a test string.  This tests to see how the wrap is working.", "Another statement is here.", "This is a test string.  This tests to see how the wrap is working.", "This is a test string.  This tests to see how the wrap is working."]
    });
}

function testWalkMenu() {
    game.walkPanel.new({
        w: game.width * .25,
        h: game.width * .33,
        x: game.width * .1,
        y: game.width * .1,
        type: 'walkMenu'
    });
}

function testDialog() {
    game.dialogPanel.new({
        w: 800,
        h: 270,
        x: game.width / 2 - 400,
        y: game.height - 270 - 50,
        type: 'dialog',
        dialog: game.dialog['alice']
    });
}

function testCombat() {
    game.dialogPanel.new({
        w: 800,
        h: 270,
        x: game.width / 2 - 400,
        y: game.height - 270 - 50,
        type: 'combat'
    });
}
