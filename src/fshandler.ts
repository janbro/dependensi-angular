let fs = require('fs');

export default class fshandler {
  static readJSON(dir) {
    return JSON.parse(fs.readFileSync(dir, 'utf8'));
  }

  static readFileSync(dir) {
    return fs.readFileSync(dir, 'utf8');
  }

  static writeFileSync(dir, contents) {
    return fs.writeFileSync(dir, contents, 'utf8');
  }
}
