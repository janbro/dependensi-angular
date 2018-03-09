import tcompile from './testcompiler';
import * as ts from 'typescript';
let rimraf = require('rimraf');

export class compiler {

  files: string[];
  routes: any;
  outDir: string;

  constructor(file: string) {
    this.files = [file];
  }

  setRoutes(routes) {
    this.routes = routes;
  }

  compile(options: any = {}) {
    if(this.files) {
      let exitCode = tcompile(this.files, {
        experimentalDecorators: true, allowJs: true, outDir: './tmp',
        target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.ES2015
      }, options.outDir, options.routes);
      rimraf.sync('./tmp');
      // console.log(`Process exiting with code '${exitCode}'.`);
      return exitCode;
    }
    else {
      throw "file not defined.";
    }
  }
}
