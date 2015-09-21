# compot

Component-like template engine.

## install

```
(sudo) npm install compot
```

## usage

```
compot src dest
```

## example

```html
<!-- main.html -->

<link rel="compot" href="./my-tag.html">

<my-tag class="foo">
    This is <b>my custom tag</b>
</my-tag>
```

```html
<!-- my-tag.html -->

<template type="compot" name="my-tag">
    <div class="buz">
        <header>
            <content></content>
        </header>
        <p> bar </p>
    </div>
</template>
```

```bash
compot ./main.html ./build.html
```

The output is,

```html
<!-- build.html -->
<div class="buz foo">
    <header>
        This is <b>my custom tag</b>
    </header>
    <p> bar </p>
</div>
```
