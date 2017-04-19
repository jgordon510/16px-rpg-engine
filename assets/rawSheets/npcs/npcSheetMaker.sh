#!/usr/bin/env bash


#!/bin/bash
echo This script splits concatenated 16px sheets into tiled ones for Phaser
echo name of script is $0
echo file to process is $1

echo splitting file into parts
convert $1   -transparent '#ff00ff' $1 
convert $1 -crop 16x16 parts-%02d.png

echo checking for blank tiles
# for i in parts*; do
#     NUMCOLORS="$(identify -format "%k" $i)"
#     if [ "$NUMCOLORS" -eq 1 ] ; then
#         echo removing blank file $i
#         rm $i

#     fi
# done
# echo removing duplicate files
# fdupes . -d
echo reassembling the parts with 1px border
montage -geometry '+1+1' -background none parts-12.png parts-02.png parts-13.png parts-03.png parts-17.png parts-03.png parts-01.png parts-09.png parts-01.png parts-04.png parts-00.png parts-05.png sheet-$1
echo cleaning up...
rm parts*
echo sheet-$1 created!