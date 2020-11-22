# rollup-plugin-preval

compile-time eval for rollup

performant:  
eval static expressions at compile time  
allow shorter load times for client

readable:  
avoid "magic numbers"  
colocate "all the code" in one place

powerful:  
use any node package on compile time

license = CC0-1.0 = public domain  
warranty = none

## install

```sh
npm install -D https://github.com/milahu/rollup-plugin-preval.git
```

## config

merge this with your `rollup.config.js`

```js
import { preval } from 'rollup-plugin-preval';

export default {
  plugins: [
    preval({ basedir: __dirname }), // directory of rollup.config.js
  ],
};
```

## use sample

```js
// preval object
let testPrevalObj = preval(() => ({
  a: Math.PI * 0.5,
  b: Math.sqrt(2),
}));

// result
let testPrevalObj = {
  a: 1.5707963267948966,
  b: 1.4142135623730951
};
```

## using modules

yes you can use modules inside the preval code

```js
let testPreval = preval(() => {
  const fs = require('fs');
  return fs.readFileSync('input.txt').toString();
});
```

## using modules with relative paths

require works relative to the directory of `rollup-plugin-preval.js`, so

```js
let res = preval(() => require('./src/script.js').someProp);
```

will try to require `node_modules/rollup-plugin-preval/src/src/script.js`

you could fix that with a relative path like `../../../src/script.js`  
but this is not portable  
for example this breaks with `pnpm` package manager  
cos symlinks are unidirectional and `../../../` is the pnpm global store

better solution: use absolute paths

in your `rollup.config.js` set

```js
        preval({
          basedir: __dirname, // directory of rollup.config.js
        }),
```

and in your script use

```js
let res = preval(({basedir}) => require(basedir+'/src/script.js').someProp);
```
