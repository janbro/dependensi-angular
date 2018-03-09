# DependenSi
Generates component dependency graphs for Angular2+ projects.

## Usage
`npm run analyze -- '[angularprojectdir]/app.module.ts'`

`npm run serve`

![alt text](./res/graphscreencap.png "Component dependency graph example")

## Routing information (optional)
Run the script below on the homepage of your standing angular2+ application and paste the results into output/dependenSiRoutes.json

```javascript
fix = function(o) {
	o.forEach(item => {
        if(item.component) item.component = item.component.name;
        if(item.children) fix(item.children);
    });
}
let tmp = ng.probe($('app-root')).injector.get(ng.coreTokens.Router).config;
fix(tmp);
console.log(JSON.stringify(tmp, null, '\t'));
```

**TODO:** Automate routing information retrieval, git changes integration
