var Menu = {
    rectangleTexture: function(w, h) {
        //this function recturns a bordered gray rectangle
        //for use in the selector menu.
        var graphics = game.add.graphics(0, 0);
        graphics.beginFill(0x000000);
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
        this.choiceGrop = game.add.group();
        //this.group.add(this.choiceGrop);
        this.spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
        Menu.spaceBar.onDown.add(this.spacePress);
        Menu.dKey.onDown.add(this.spacePress);




        this.style.fontSize = game.width * .021;
        return this;
    },
    spaceBarCallback: null,
    spacePress: function() {
        if (Menu.spaceBarCallback !== null) {
            var callback = Menu.spaceBarCallback;
            Menu.spaceBarCallback = null;
            callback();
        }
    },
    new: function(settings) {
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
        game.walkPanel.new({
            w: game.width * .25,
            h: game.width * .33,
            x: game.width * .1,
            y: game.width * .1,
            type: 'walkMenu'
        });
    },
    infoPanel: function(settings) {
        //an infoPanel that takes a settings object:
        //x,y,h,w,type:string,text:[strings]
        this.infoText = game.add.text(20, 20, '', this.style);
        this.typeText(this.infoText, settings.text, 0);
        this.group.add(this.infoText);
    },
    walkMenu: function() {
        var options = ["Talk to", "Items", "Magic", "Wear", "Activate", "Status"];
        var keys = ["talkTo", "items", "magic", "wear", "activate", "status"];

        var choiceSettings = {
            choiceArray: options,
            keyArray: keys,
            callback: walkSelection,
            columns: 1,
            clear: false
        };
        var choiceGroup = Menu.options(choiceSettings);
        choiceGroup.x = game.width * .04;
        choiceGroup.y = game.width * .03;
        this.group.add(choiceGroup);

        function walkSelection() {
            var optionKey = Menu.optionArray[Menu.optionSelected].optionKey;

            switch (optionKey) {
                case 'talkTo':
                    var found = false;
                    game.mapData.npcs.forEach(function(npc) {
                        if (game.player.gridLocation.x - game.playerDirection.x === npc.x && game.player.gridLocation.y - game.playerDirection.y === npc.y) {
                            found = true;
                            game.dialogPanel.new({
                                w: game.width * .5,
                                h: game.height * .5,
                                x: game.width * .25,
                                y: game.height * .25,
                                type: 'dialog',
                                dialog: game.dialog[npc.nameKey]
                            });
                        }
                    });
                    if (!found) {
                        game.infoPanel.new({
                            w: game.width * .5,
                            h: game.height * .3,
                            x: game.width * .25,
                            y: game.height * .3,
                            type: 'infoPanel',
                            text: ["There's nobody there!"]
                        });
                    }
                    break;

                default:
                    game.infoPanel.new({
                        w: game.width * .5,
                        h: game.height * .3,
                        x: game.width * .25,
                        y: game.height * .3,
                        type: 'infoPanel',
                        text: ["That menu isn't finished yet!", "Stop clicking it.", "Please."]
                    });
                    // code
            }

        }
    },
    dialog: function(settings) {
        this.dialogText = game.add.text(20, 20, '', this.style);
        this.group.add(this.dialogText);
        this.typeText(this.dialogText, settings.dialog[settings.dialog.startKey].text, 0, nextTalk);
        this.flags = [];

        function nextTalk() {
            Menu.flags = Menu.flags.concat(settings.dialog[settings.dialog.startKey].flags)
            var question = settings.dialog[settings.dialog.startKey].question;
            settings.dialog.startKey = settings.dialog[settings.dialog.startKey].key

            if (settings.dialog.startKey === 'bye') {
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
                Menu.dialogText.setText(Menu.dialogText.text.substring(0, Menu.dialogText.text.length - 1));
                Menu.typeText(Menu.dialogText, settings.dialog[settings.dialog.startKey].text, 0, nextTalk);
            }
            else {
                setTimeout(function() {
                    Menu.dialogText.setText("");
                    Menu.typeText(Menu.dialogText, settings.dialog.questions[question].text, 0, questionOptions);

                    function questionOptions() {
                        Menu.dialogText.setText(Menu.dialogText.text.substring(0, Menu.dialogText.text.length - 1));

                        var choiceSettings = {
                            choiceArray: settings.dialog.questions[question].options,
                            keyArray: settings.dialog.questions[question].keys,
                            callback: endQuestion,
                            columns: 2,
                            clear: true
                        };
                        var choiceGroup = Menu.options(choiceSettings);
                        choiceGroup.x = Menu.panel.x + game.width * .02;
                        choiceGroup.y = Menu.dialogText.height + 20;
                        Menu.dialogText.addChild(choiceGroup);

                        function endQuestion() {
                            settings.dialog[settings.dialog.startKey] = {
                                key: Menu.optionArray[Menu.optionSelected].optionKey
                            };
                            nextTalk();
                        }
                    }
                }, 500);

            }
        }
    },
    options: function(settings) {
        Menu.optionArray = [];
        var optionGroup = game.add.group();
        var choiceArray = settings.choiceArray;
        var keyArray = settings.keyArray;
        var callback = settings.callback;
        var columns = settings.columns;
        var clear = settings.clear;
        game.caretColumns = columns;

        choiceArray.forEach(function(option, index) {
            var sprite = game.add.text(0 + (index % columns * Menu.panel.width / 2), 0 + (Math.floor(index / columns) * game.width * 0.05), option, Menu.style)
            sprite.menuLocation = {
                col: index % columns,
                row: Math.floor(index / columns)
            }
            sprite.optionKey = keyArray[index] //settings.dialog.questions[question].keys[index];
            Menu.optionArray.push(sprite);
            optionGroup.add(sprite);
        });
        Menu.optionSelected = 0;
        Menu.optionCaret = game.add.text(0, 0, '>', Menu.style);
        // Menu.dialogText.addChild(Menu.optionCaret);
        optionGroup.add(Menu.optionCaret);
        Menu.moveCaret();
        Menu.spaceBarCallback = selectItem;
        return optionGroup;

        function selectItem() {
            if (typeof Menu.dialogText !== 'undefined') {
                Menu.dialogText.setText("");
            }
            if (clear) {
                Menu.optionArray.forEach(function(option) {
                    option.destroy();
                });
            }
            Menu.optionCaret.destroy();
            callback();
        }

    },
    moveCaret: function(key) {
        if (!Menu.caretMoving && typeof Menu.optionArray !== 'undefined') {
            Menu.caretMoving = true;
            while (Menu.optionSelected >= Menu.optionArray.length) {
                Menu.optionSelected -= Menu.optionArray.length
            }
            while (Menu.optionSelected < 0) {
                Menu.optionSelected += Menu.optionArray.length
            }
            Menu.optionCaret.x = Menu.optionArray[Menu.optionSelected].x - Menu.optionCaret.width - 5;
            Menu.optionCaret.y = Menu.optionArray[Menu.optionSelected].y;
            setTimeout(function() {
                Menu.caretMoving = false;
            }, 180);
        }

    },
    selector: function(settings) {

    },
    close: function(unBlock) {
        //this clears the group
        if (unBlock) {
            setTimeout(function() {
                game.menuOpen = false;
            }, 200);

        }
        Menu.group.removeAll();
        Menu.caretMoving = true;
    },
    typeText: function(sprite, text, startIndex, callback) { //needs a settings object

        var characterIndex = 0;
        addChar();

        function addChar() {
            sprite.setText(sprite.text + text[startIndex][characterIndex]);
            characterIndex++;
            if (characterIndex < text[startIndex].length) {
                if (sprite.height > Menu.panel.height - 50) {
                    setTimeout(clear, 500);

                    function clear() {
                        sprite.setText('');
                        addChar();
                    }
                }
                else {
                    setTimeout(addChar, 50);
                }
            }
            else {
                if (startIndex < text.length - 1) {
                    sprite.setText(sprite.text + '  >');
                    Menu.spaceBarCallback = nextLine;

                    function nextLine(input) {
                        sprite.setText(sprite.text.substring(0, sprite.text.length - 1));
                        sprite.setText(sprite.text + '\n');
                        Menu.typeText(sprite, text, startIndex + 1, callback);
                    }
                }
                else {
                    if (typeof callback === 'undefined') {
                        sprite.setText(sprite.text + ' *');
                        Menu.spaceBarCallback = shutdown;
                    }
                    else {
                        sprite.setText(sprite.text + '  >');
                        Menu.spaceBarCallback = callback;

                    }


                    function shutdown() {
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
                        Menu.optionSelected += game.pad._rawPad.axes[6];
                    }
                    else {
                        Menu.optionSelected += game.pad._rawPad.axes[7] * game.caretColumns;
                    }
                    Menu.moveCaret();
                }
                if (game.pad._rawPad.buttons[0].pressed) //a button
                {
                    Menu.spacePress();
                }
            }

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
    style: {
        font: 'Press Start 2P',
        fill: '#AAAAAA',
        align: 'left',
        wordWrap: true
    }
};

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
        w: game.width * .5,
        h: game.width * .5,
        x: game.width * .25,
        y: 100,
        type: 'dialog',
        dialog: game.dialog['dan']
    });
}
