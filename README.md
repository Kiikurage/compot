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

<!-- @comp name="my-tag" src="./my-tag.html" -->
<my-tag>
    This is <b>my custom tag</b>
</my-tag>
```

```html
<!-- my-tag.html -->

<div class="my-tag">
    <header><content></content></header>
    <p> Lorem ipsum </p>
</div>
```

```bash
compot ./main.html ./build.html
```

The output is,

```html
<!-- build.html -->
<div class="my-tag">
    <header>This is <b>my custom tag</b></header>
    <p> Lorem ipsum </p>
</div>
```
