let compiler = require('../dist/index');
let fs = require('fs');
let outputDir = './output/';
let routes;

if(!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
else {
  try {
    routes = JSON.parse(fs.readFileSync('./output/dependenSiRoutes.json', 'utf8'));
  }
  catch(e) { }
}

let angCompiler = new compiler.compiler(process.argv[2]);

angCompiler.compile({"routes":routes, "outDir": outputDir});
