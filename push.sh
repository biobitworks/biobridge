#!/bin/bash
# One-shot: initialize and push BioBridge to your GitHub repo.
# Run from inside the biobridge/ folder.
set -e
git init -b main
git add .
git commit -m "BioBridge — GTM AI employee (Nimble/Kylon hackathon)"
git remote add origin https://github.com/biobitworks/biobridge.git
git push -u origin main
echo "Done → https://github.com/biobitworks/biobridge"
