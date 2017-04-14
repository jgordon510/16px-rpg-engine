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
        this.style.fontSize = game.width * .021;
        return this;
    },
    new: function(settings) {
        //called when a new window is required
        this.panel = game.add.sprite(0, 0, this.rectangleTexture(settings.w, settings.h));
        this.group.add(this.panel);
        this.style.wordWrapWidth = settings.w - 40;
        this.group.x = settings.x;
        this.group.y = settings.y;
        this[settings.type](settings);
    },
    infoPanel: function(settings) {
        //an infoPanel that takes a settings object:
        //x,y,h,w,type:string,text:[strings]
        this.infoText = game.add.text(20, 20, '', this.style);
        this.typeText(this.infoText, settings.text, 0);
        this.group.add(this.infoText);
    },
    dialog: function(settings) {
        settings.dialog.met = true;
        this.dialogText = game.add.text(20, 20, '', this.style);
        this.group.add(this.dialogText);
        this.typeText(this.dialogText, settings.dialog[settings.dialog.startKey].text, 0, nextTalk);

        function nextTalk() {
            console.log("nextTalk: ", settings.dialog.startKey)
            var question = settings.dialog[settings.dialog.startKey].question;
            settings.dialog.startKey = settings.dialog[settings.dialog.startKey].key

            if (settings.dialog.startKey === 'bye') {
                Menu.dialogText.setText(Menu.dialogText.text.substring(0, Menu.dialogText.text.length - 1))
                Menu.typeText(Menu.dialogText, settings.dialog['bye'].text, 0, cleanUp);

                function cleanUp() {
                    settings.dialog.startKey = settings.dialog['bye'].key;
                    Menu.dialogText.setText(Menu.dialogText.text.substring(0, Menu.dialogText.text.length - 1) + '*');
                    Menu.spaceBar.onDown.addOnce(goodbye);
                    function goodbye() {
                        Menu.close(true);
                    }
                }



            }
            else if (settings.dialog.startKey !== null) {
                Menu.dialogText.setText(Menu.dialogText.text.substring(0, Menu.dialogText.text.length - 1))
                Menu.typeText(Menu.dialogText, settings.dialog[settings.dialog.startKey].text, 0, nextTalk);
            }
            else {
                setTimeout(function() {
                    Menu.dialogText.setText("");
                    Menu.typeText(Menu.dialogText, settings.dialog.questions[question].text, 0, questionOptions);

                    function questionOptions() {
                        Menu.dialogText.setText(Menu.dialogText.text.substring(0, Menu.dialogText.text.length - 1));
                        Menu.optionArray = [];
                        settings.dialog.questions[question].options.forEach(function(option, index) {
                            var sprite = game.add.text((Menu.panel.x + 20) + (index % 2 * Menu.panel.width / 2), (Menu.dialogText.height + 20) + (Math.floor(index / 2) * game.width * 0.05), option, Menu.style)
                            sprite.menuLocation = {
                                col: index % 2,
                                row: Math.floor(index / 2)
                            }
                            sprite.optionKey = settings.dialog.questions[question].keys[index];
                            Menu.optionArray.push(sprite)
                            Menu.dialogText.addChild(sprite);
                        });
                        Menu.optionSelected = 0;
                        Menu.optionCaret = game.add.text(0, 0, '>', Menu.style);
                        Menu.dialogText.addChild(Menu.optionCaret);
                        Menu.moveCaret();
                        Menu.spaceBar.onDown.addOnce(selectItem);

                        function selectItem() {
                            console.log(Menu.optionSelected)
                            settings.dialog[settings.dialog.startKey] = {
                                key: Menu.optionArray[Menu.optionSelected].optionKey
                            };
                            Menu.dialogText.setText("");
                            Menu.optionArray.forEach(function(option) {
                                option.destroy();
                            });
                            Menu.optionCaret.destroy();
                            nextTalk();
                            //Menu.close(true);
                        }

                    }
                }, 500);

            }
        }

    },
    moveCaret: function(key) {
        if (!Menu.caretMoving) {
            Menu.caretMoving = true;
            console.log(Menu.optionSelected)
            while (Menu.optionSelected >= Menu.optionArray.length) {
                Menu.optionSelected -= Menu.optionArray.length
            }
            while (Menu.optionSelected < 0) {
                Menu.optionSelected += Menu.optionArray.length
            }
            console.log(Menu.optionSelected)
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
        Menu.group.removeAll();
    },
    typeText: function(sprite, text, startIndex, callback) { //needs a settings object
        console.log(text)
        game.moveBlock = true;
        var characterIndex = 0;
        addChar();

        function addChar() {
            console.log("adding")
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
                    Menu.spaceBar.onDown.addOnce(nextLine, this);

                    function nextLine(input) {
                        sprite.setText(sprite.text.substring(0, sprite.text.length - 1));
                        sprite.setText(sprite.text + '\n');
                        Menu.typeText(sprite, text, startIndex + 1, callback);
                    }
                }
                else {
                    if (typeof callback === 'undefined') {
                        sprite.setText(sprite.text + ' *');
                        Menu.spaceBar.onDown.addOnce(shutdown);
                    }
                    else {
                        sprite.setText(sprite.text + '  >');
                        Menu.spaceBar.onDown.addOnce(callback);

                    }


                    function shutdown() {
                        game.moveBlock = false;
                        Menu.close(true)
                    }
                }
            }
        }
    },
    update: function() {
        if (!Menu.caretMoving) {
            if (Menu.cursors.down.isDown) {
                Menu.optionSelected -= 2;
                Menu.moveCaret();
            }
            else if (Menu.cursors.up.isDown) {
                Menu.optionSelected += 2;
                Menu.moveCaret();
            }
            else if (Menu.cursors.left.isDown || Menu.cursors.right.isDown) {
                if (Menu.optionSelected % 2 == 0) {
                    Menu.optionSelected++;
                }
                else {
                    Menu.optionSelected--;
                }
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

function testDialog() {
    game.menu.new({
        w: game.width * .5,
        h: game.width * .5,
        x: game.width * .25,
        y: 100,
        type: 'dialog',
        dialog: game.dialog['dan']
    });
}
