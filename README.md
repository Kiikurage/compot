# compot
Component-like template engine.

## Get Started

The recommended way to use compot is using gulp plugin.

- [gulp-compot - GitHub](https://github.com/Kiikurage/gulp-compot)
- [gulp-compot - npm](https://www.npmjs.com/package/gulp-compot)

## Install

```
(sudo) npm install -g compot
```

## usage

### Command Line Intergace

```
compot src dest
```

### Node.js

```js
var compot = require('compot'),
    fs = require('fs');

var src = fs.readFileSync('path/to/src', 'utf8');

compot.render(src, {
    root: 'path/to/root'
}, function(err, res){
    fs.writeFileSync(res, 'path/to/dest', 'utf8');
});
```

#### `compot.render(source, option, callback)`
return converted html string.

##### parmeters

name        | type     | description
----------- | -------- | ------------------------------------------------------------
source      | string   | source html string
option      | Object   | options(optional)
option.root | string   | root directory which is used in resolving import compot file
callback    | Function | called as callback(Error, string)

## example

```html
<!-- main.html -->

<link rel="compot" href="./my-tag.html">

<my-tag class="foo" title="Compot!">
    This is <b>my custom tag</b>
</my-tag>
```

```html
<!-- my-tag.html -->

<template type="compot" name="my-tag">
    <div class="buz">
        <header>{{title}}</header>
        <p>
            <content></content>
        </p>
    </div>
</template>
```

```bash
# CLI
compot ./main.html ./build.html
```

The output is,

```html
<!-- build.html -->
<div class="buz foo">
    <header>Compot!</header>
    <p>
        This is <b>my custom tag</b>
    </p>
</div>
```
