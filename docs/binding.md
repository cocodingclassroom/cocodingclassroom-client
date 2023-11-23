# p5 binding

## @script

The `// @script` directive loads an external resource before playing the current sketch.

```javascript
// @script='path_to_library'
or
// @script="path_to_library"
or
/* @script='path_to_library' */
```

Load an additional library. 
Place at the beginning of your p5 file.

`path_to_library` absolute URL to the javascript library to be loaded.

### Example
Load p5.tween.js from CDN.

```javascript
// @script='https://unpkg.com/p5.tween/dist/p5.tween.min.js';
const myShape = {
  x: 200,
  y: 100,
  w: 50,
  h: 50
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER)

  p5.tween.manager.addTween(myShape, 'tween1')
    .addMotions([
      { key: 'y', target: height },
      { key: 'w', target: 30 },
      { key: 'h', target: 80 },
    ], 600, 'easeInQuad')
    .addMotions([
        { key: 'w', target: 100 },
        { key: 'h', target: 10 },
      ], 120)
    .addMotions([
        { key: 'w', target: 10 },
        { key: 'h', target: 100 },
      ], 100)
    .addMotions([
        { key: 'w', target: 50 },
        { key: 'h', target: 50 },
        { key: 'y', target: 100 }
     ], 500, 'easeOutQuad')
    .startLoop()
}

function draw() {
  background(0);
  noStroke()
  fill(255, 0, 0)
  ellipse(myShape.x, myShape.y, myShape.w, myShape.h)
}

function mousePressed() {
  let tween = p5.tween.manager.getTween('tween1')

  if(tween.isPaused)  tween.resume()
  else                tween.pause()
}
```