import * as path from 'path';
import * as ts from 'typescript';
import fshandler from './fshandler';
import { NodeObject, ComponentContainer, Component, Dependencies } from './models';
const safeJsonStringify = require('safe-json-stringify');

export default function tcompile(fileNames: string[], options: ts.CompilerOptions, outDir: string = "./output/", routes = null): number {
  fileNames.forEach(file => {
    try{
      fshandler.readFileSync(file);
    }
    catch(e) {
      throw 'Source file ' + file + ' does not exist.';
    }
  });
  let program = ts.createProgram(fileNames, options);
  let emitResult = program.emit();

  let exitCode: number = emitResult.emitSkipped ? 1 : 0;

  exitCode = exitCode? 1 : extractData(program, outDir, routes);
  return exitCode;
}

let container: ComponentContainer = new ComponentContainer();

function extractData(program, outDir: string, routerMap) {
  let sourceFiles = program.getSourceFiles() || [];

  //Iterate through all source files
  sourceFiles.map((file: ts.SourceFile) => {

    let filePath = file.fileName;

    //Only parse ts files
    if (path.extname(filePath) === '.ts') {

      //Ignore node_modules and testing files
      if (filePath.lastIndexOf('.d.ts') === -1 && filePath.lastIndexOf('spec.ts') === -1 && !(filePath as any).includes('node_modules')) {

        let tmpcomp: Component = new Component();

        //Get file information
        tmpcomp.dir = filePath.split('/').slice(0,-1).join('/') + "/";
        tmpcomp.filename = filePath.split('/').slice(-1)[0];

        try {
          ts.forEachChild(file, (node: any) => {

            //Get class name
            if(node.name && node.name.text) tmpcomp.name = node.name.text;

            if(node.parent.locals) {
              node.parent.locals.forEach((value, key) => {
                container.types.some((item) => {
                  if(key === item) {
                    tmpcomp.type = key;
                    return true;
                  }
                })
              });
            }

            //Get imports
            let externalimports: string[] = [];
            let imports: string[] = [];

            if(node.parent.resolvedModules) {
              node.parent.resolvedModules.forEach((value, key)=> {
                if(!value || value.isExternalLibraryImport) externalimports.push(key);
                else imports.push(value.resolvedFileName);
              }, []);
            }

            if(imports.length > 0) tmpcomp.rawimports = imports;

            if(externalimports.length > 0) tmpcomp.externalimports = externalimports;

            if(node.decorators) {

              node.decorators.forEach((visitedNode) => {

                if(visitedNode.expression.arguments.slice(-1)[0]) {
                  //Get relevant decorator properties
                  let props = visitedNode.expression.arguments.slice(-1)[0].properties;

                  if(props) {
                    if(getComponentSelector(props)) tmpcomp.selector = getComponentSelector(props)[0];

                    //Get templateurl and routerlinks
                    if(getComponentTemplateUrl(props)[0]) {
                      tmpcomp.templateUrl = getComponentTemplateUrl(props)[0];
                      let templatecontent = fshandler.readFileSync(tmpcomp.dir + tmpcomp.templateUrl);
                      // if(templatecontent.includes('routerLink')) {
                      //   let tmp = templatecontent.substring(templatecontent.search('routerLink'));
                      //   tmpcomp.routerLink = tmp.match(/".+?"/).map(item => item.substring(1, item.length-1));
                      // }
                    }

                    //Get template html and routerlinks
                    if(getComponentTemplate(props)[0]) {
                      tmpcomp.template = getComponentTemplate(props)[0];
                      // if((tmpcomp.template as any).includes('routerLink')) {
                      //   let tmp = tmpcomp.template.substring(tmpcomp.template.search('routerLink'));
                      //   tmpcomp.routerLink = tmp.match(/".+?"/).map(item => item.substring(1, item.length-1));
                      // }
                    }
                  }
                }

              });
            }
          });
        }
        catch (e) {
          console.log(e + " : " + file.fileName);
        }

        container.add(tmpcomp);
      }
    }
  });

  container.getComponents().map(component => {
    //Parse html template for component dependencies
    if(component.templateUrl) {
      let fileOut = fshandler.readFileSync(component.dir + component.templateUrl);
      let foundSelectors: Component[] = container.getComponents().reduce((prev, innercomponent) => {
        if(fileOut.includes("</"+innercomponent.selector+">")) return prev.concat(innercomponent);
        return prev;
      }, []);
      if(foundSelectors.length > 0) component.htmlcomponents = foundSelectors;
    }
    else if(component.template) {
      let foundSelectors: Component[] = container.getComponents().reduce((prev, innercomponent) => {
        if((component.template as any).includes("</"+innercomponent.selector+">")) return prev.concat(innercomponent);
        return prev;
      }, []);
      if(foundSelectors.length > 0) component.htmlcomponents = foundSelectors;
    }

    //Convert relative import directory paths to respective component objects
    if(component.rawimports) {
      let importcomponents: Component[] = [];
      component.rawimports.map(imprt => {
        container.getComponents().map(innercomponent => {
          if(imprt === innercomponent.dir + innercomponent.filename) {
            importcomponents.push(innercomponent);
          }
        });
      });
      if(importcomponents.length > 0) component.importcomponents = importcomponents;
    }
  });

  //console.log(container.toString());
  let res = "[";
  res += container.getComponents().reduce((prev, item) => prev.concat(safeJsonStringify(item)), []).join(",");
  res += "]"
  fshandler.writeFileSync((outDir + 'dependenSi.json'), res);
  fshandler.writeFileSync((outDir + 'dependenSiMap.json'), JSON.stringify(container.toDependenSiMap(routerMap), null, '\t'));
  fshandler.writeFileSync((outDir + 'dependenSiMapEdges.json'), JSON.stringify(container.toDependenSiMapEdges(), null, '\t'));
  return 0;
}

function getComponentTemplateUrl(props: NodeObject[]): string[] {
  return sanitizeUrls(getSymbolDeps(props, 'templateUrl'));
}

function getComponentTemplate(props: NodeObject[]): string[] {
  return getSymbolDeps(props, 'template');
}

function getComponentSelector(props: NodeObject[]): string[] {
  return getSymbolDeps(props, 'selector').slice(-1);
}

function getComponentStyleUrls(props: NodeObject[]): string[] {
  return sanitizeUrls(getSymbolDeps(props, 'styleUrls'));
}

function sanitizeUrls(urls: string[]) {
  return urls.map(url => url.replace('./', ''));
}

function getSymbolDeps(props: NodeObject[], type: string): string[] {

  let deps = props.filter((node: NodeObject) => {
    return node.name.text === type;
  });

  let buildIdentifierName = (node: NodeObject, name = '') => {

    if (node.expression) {
      name = name ? `.${name}` : name;

      let nodeName;
      if (node.name) {
        nodeName = node.name.text;
      }
      else if (node.text) {
        nodeName = node.text;
      }
      else if (node.expression) {

        if (node.expression.text) {
          nodeName = node.expression.text;
        }
        else if(node.expression.elements) {

          if (node.expression.kind === ts.SyntaxKind.ArrayLiteralExpression) {
            nodeName = node.expression.elements.map( el => el.text ).join(', ');
            nodeName = `[${nodeName}]`;
          }

        }
      }

      if (node.kind ===  ts.SyntaxKind.SpreadElement) {
        return `...${nodeName}`;
      }
      return `${buildIdentifierName(node.expression, nodeName)}${name}`
    }

    return `${node.text}.${name}`;
  }

  let parseProviderConfiguration = (o: NodeObject): string => {
    // parse expressions such as:
    // { provide: APP_BASE_HREF, useValue: '/' },
    // or
    // { provide: 'Date', useFactory: (d1, d2) => new Date(), deps: ['d1', 'd2'] }

    let _genProviderName: string[] = [];
    let _providerProps: string[] = [];

    (o.properties || []).forEach((prop: NodeObject) => {

      let identifier = prop.initializer.text;
      if (prop.initializer.kind === ts.SyntaxKind.StringLiteral) {
        identifier = `'${identifier}'`;
      }

      // lambda function (i.e useFactory)
      if (prop.initializer.body) {
        let params = (prop.initializer.parameters || <any>[]).map((params: NodeObject) => params.name.text);
        identifier = `(${params.join(', ')}) => {}`;
      }

      // factory deps array
      else if (prop.initializer.elements) {
        let elements = (prop.initializer.elements || []).map((n: NodeObject) => {

          if (n.kind === ts.SyntaxKind.StringLiteral) {
            return `'${n.text}'`;
          }

          return n.text;
        });
        identifier = `[${elements.join(', ')}]`;
      }

      _providerProps.push([

        // i.e provide
        prop.name.text,

        // i.e OpaqueToken or 'StringToken'
        identifier

      ].join(': '));

    });

    return `{ ${_providerProps.join(', ')} }`;
  }

  let parseSymbolElements = (o: NodeObject | any): string => {
    // parse expressions such as: AngularFireModule.initializeApp(firebaseConfig)
    if (o.arguments) {
      let className = buildIdentifierName(o.expression);

      // function arguments could be really complexe. There are so
      // many use cases that we can't handle. Just print "args" to indicate
      // that we have arguments.

      let functionArgs = o.arguments.length > 0 ? 'args' : '';
      let text = `${className}(${functionArgs})`;
      return text;
    }

    // parse expressions such as: Shared.Module
    else if (o.expression) {
      let identifier = buildIdentifierName(o);
      return identifier;
    }

    return o.text ? o.text : parseProviderConfiguration(o);
  };

  let parseSymbols = (node: NodeObject): string[] => {

    let text = node.initializer.text;
    if (text) {
      return [text];
    }

    else if (node.initializer.expression) {
      let identifier = parseSymbolElements(node.initializer);
      return [
        identifier
      ];
    }

    else if (node.initializer.elements) {
      return node.initializer.elements.map(parseSymbolElements);
    }

  };
  return deps.map(parseSymbols).pop() || [];
}
