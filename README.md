# DependenSi
Generates component dependency graphs for Angular2+ projects.

## Usage
`npm run build`

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

## License
 
The MIT License (MIT)

Copyright (c) 2018 Alejandro Munoz

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
