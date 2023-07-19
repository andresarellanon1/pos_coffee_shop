#!/bin/sh
git fetch
git add .
git commit -m "$1"
git pull origin master
git push https://$GITU:$GITP@github.com/andresarellanon1/pos_coffee_shop.git
