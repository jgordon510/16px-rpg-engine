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
        this.group = game.add.group();
        this.spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.style.fontSize = game.width * .021;
        return this;
    },
    new: function(settings) {
        this.panel = game.add.sprite(0, 0, this.rectangleTexture(settings.w, settings.h));
        this.group.add(this.panel);
        this.style.wordWrapWidth = settings.w - 40;
        this.group.x = settings.x;
        this.group.y = settings.y;
        this[settings.type](settings);
    },
    dialog: function(settings) {

    },
    infoPanel: function(settings) {
        this.info = game.add.text(20, 20, '', this.style);
        this.typeText(this.info, settings.text, 0);
        this.group.add(this.info);
    },
    selector: function(settings) {

    },
    close: function() {

        Menu.group.removeAll();
    },
    typeText: function(sprite, text, startIndex) {
        game.moveBlock = true;
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
                    Menu.spaceBar.onDown.addOnce(nextLine, this);

                    function nextLine(input) {
                        sprite.setText(sprite.text.substring(0, sprite.text.length - 1));
                        sprite.setText(sprite.text + '\n');
                        Menu.typeText(sprite, text, startIndex + 1);
                    }
                }
                else {
                    sprite.setText(sprite.text + '\n*');

                    Menu.spaceBar.onDown.addOnce(shutdown);

                    function shutdown() {
                        game.moveBlock = false;
                        Menu.close()
                    }
                }
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
