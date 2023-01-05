# svgx
Optimize all SVG files inside the folder using SVGO algorithms

## How to use
1. Download ZIP and unzip it somewhere into your PC, eg. to `C:/Program Files/`
2. Start CMD inside this folder and run `npm i` to install all dependencies
3. Then run `npm link`, so you can use `svgx` command anywhere
4. Then you can visit any folder containing SVG files and just run `svgx` in CMD in this folder and it will optimize all SVGs inside this folder
5. To optimize all SVGs also inside subfolders use `svgx -r`

## Edit settings
You can edit SVGO settings inside index.js file just edit `plugins: [...]` like you want