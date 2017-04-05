#!/usr/bin/env bash


#!/bin/bash
echo This script splits concatenated 16px sheets into tiled ones for Phaser
echo name of script is $0
echo file to process is $1

echo splitting file into parts
convert $1 -crop 16x16 parts-%02d.png

echo checking for blank tiles
for i in parts*; do
    
    NUMCOLORS="$(identify -format "%k" $i)"
    if [ "$NUMCOLORS" -eq 1 ] ; then
        echo removing blank file $i
        rm $i

    fi
done
echo removing duplicate files
fdupes . -d
echo reassembling the parts with 1px border
montage -geometry '+1+1' -background none parts* output.png
echo cleaning up...
rm parts*
echo output.png created!