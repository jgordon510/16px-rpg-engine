# About
This is an engine for a top-down story-based rpg with 16px square tiles.  It is based on Phaser, but it does not use the tilemap feature.  Instead it includes a tilemap level editor, which builds a custom tilemap file, a JSON file.
Currently, developement is focused on the level editor.  Long-term developement plans include a dialog system, a checkpoint system, a scene graph for simple cut scene animations, items, combat, weapons, enemies, magic, doors and keys, and stat progress - all relying on JSON files for their data.
#Map Editor
Currently, the map defaults to a 50x50 blank grid.  Running the blankGrid() function will allow creation of a grid of arbitrary sized grid.
## P - Passables
Passables allow for blocking player movement.  Select the proper icon to block the right or bottom path from the tile.  They can be combines.  The blank square clears both paths.  (Blocking the bottom, also blocks movement from the square below, as does right to left.)
## S - Structures
The structures menu is populated with the tile graphics.  Most of these come from opengameart.  You can place and combine them with the mouse, after selecting your texture.  Dragging will create a rectangular pattern of them.  CTRL-Left/Right to switch pages.
## E - Events
INCOMPLETE - You'll be able to set a key that specifies a function to run in the events switch.
## N - NPCs
INCOMPLETE - You'll be able to add an NPC, that will have a key to specify its dialog.
## Controls
Use the arrow keys to move around.  Scrolling your mouse will zoom the view in and out, but zooming out will slow down movement significantly.  CTRL-Left/Right will allow you to switch pages in the Structures menu. CTRL-S to save and download the file to your computer.  You can drag the file onto the editor window to load the file.
