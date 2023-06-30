#!/bin/sh
# TODO: esnure installed node 18 +
cd mo_screen
# TODO: esnure installed pnpm 
pnpm build
node .output/server/index.mjs &
cd ~/servicios/pos_coffee_service
chmod +x deploy.sh
./deploy.sh &
