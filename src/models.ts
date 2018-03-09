import fshandler from './fshandler';

let isRoute = function(routes, comp) {
  if(routes) {
    return routes.some(route => {
      if(route.component && comp.name && route.component === comp.name) return true;
      if(route.children) return isRoute(route.children, comp);
    });
  }
}

export interface NodeObject {
  kind: Number;
  pos: Number;
  end: Number;
  text: string;
  initializer: NodeObject,
  name?: { text: string };
  expression?: NodeObject;
  elements?: NodeObject[];
  arguments?: NodeObject[];
  properties?: any[];
  parserContextFlags?: Number;
  equalsGreaterThanToken?: NodeObject[];
  parameters?: NodeObject[];
  Component?: String;
  body?: {
    pos: Number;
    end: Number;
    statements: NodeObject[];
  }
}

export class ComponentContainer {
  components: Component[] = [];

  types:string[] = ["Component", "Injectable", "NgModule"];

  add(component) {
    this.components.push(component);
  }

  getComponents() {
    return this.components;
  }

  toDependenSiMap(routerMap) {
    return this.components.reduce((prev, current) => {
      return prev.concat(current.toDependenSiMap(routerMap));
    },[]);
  }

  toDependenSiMapEdges() {
    return this.components.reduce((prev, current) => {
      return prev.concat(current.toDependenSiMapEdges());
    },[]);
  }

  toString() {
    return this.components.reduce((prev, component) => {
      return prev.concat(component.toString());
    },[]).join("\n\n");
  }
}

let colorMap = function(type) {
  switch(type) {
    case "Component":
      return {
        background: "#82b2ff",
        border: "#6083bc",
        highlight: {
          background: "#b7d3ff",
          border: "#6083bc"
        }
      }
    case "Injectable":
      return {
        background: "#f7f5a3",
        border: "#a09f6b",
        highlight: {
          background: "#fffed6",
          border: "#a09f6b"
        }
      }
    case "NgModule":
      return {
        background: "#c7a3f7",
        border: "#896ead",
        highlight: {
          background: "#decdf4",
          border: "#896ead"
        }
      }
    case "RouterLink":
      return {
        background: "#93ffa0",
        border: "#5ea366",
        highlight: {
          background: "#ccffd1",
          border: "#5ea366"
        }
      }
    default:
      return {
        background: "#c9c9c9",
        border: "#9e9e9e",
        highlight: {
          background: "#e0e0e0",
          border: "#9e9e9e",
        }
      }
  }
}

export class Component {
  name: string;
  dir: string;
  filename: string;
  selector: string;
  type: string;
  templateUrl: string;
  template: string;
  htmlcomponents: Component[];
  routerLink: string[];
  importcomponents: Component[];
  externalimports: string[];
  rawimports: string[];
  toString =  function (verbose = null) {
    let result = "";
    if(this.name) result += "\nName: " + this.name;
    result += "\nFilename: " + this.filename;
    result += "\nDirectory: " + this.dir;
    if(this.selector) result += "\nSelector: " + this.selector;
    if(this.type) result += "\nType: " + this.type;
    // if(this.imports) result += "\nImports: " + this.imports.join(', ');
    if(this.externalimports) result += "\nExternal Imports: " + this.externalimports.join(', ');
    if(this.importcomponents) result += "\nImports: " + this.importcomponents.reduce((prev, component) => { if(component.name) return prev.concat(component.name); return prev.concat(component.filename) },[]).join(", ");
    if(this.htmlcomponents) result += "\nHTMLComponents: " + this.htmlcomponents.reduce((prev, component) => { return prev.concat(component.name); },[]).join(", ");
    if(this.routerLink) result += "\nRouterLink: " + this.routerLink;
    if(verbose) {
      if(this.template) result += "\nTemplate: " + this.template;
    }
    return result;
  }
  toDependenSiMap = function (routerMap) {
    let result = {
      id: this.dir + this.filename,
      label: "",
      color: colorMap(this.type),
      mass: 3,
      title: this.toString()
    }
    if(this.name && isRoute(routerMap, this)) result.color = colorMap("RouterLink");
    if(this.name) result.label = this.name;
    else result.label = this.filename;
    return result;
  }
  toDependenSiMapEdges = function () {
    let result = [];
    let result2 = [];
    if(this.importcomponents) {
      result = this.importcomponents.reduce((prev, current) => {
        return prev.concat({from: this.dir + this.filename, to: current.dir + current.filename, arrows: "to", color: "blue", length: 100, selectionWidth: 3});
      },[]);
    }
    if(this.htmlcomponents) {
      result2 = this.htmlcomponents.reduce((prev, current) => {
        return prev.concat({from: this.dir + this.filename, to: current.dir + current.filename, arrows: "to", color: "red", length: 100, selectionWidth: 3});
      },[]);
    }
    return result.concat(result2);
  }
}

export interface Dependencies {
  name: string;
  selector?: string;
  label?: string;
  file?: string;
  templateUrl?: string[];
  styleUrls?: string[];
  providers?: Dependencies[];
  imports?: Dependencies[];
  exports?: Dependencies[];
  declarations?: Dependencies[];
  bootstrap?: Dependencies[];
  __raw?: any
}
