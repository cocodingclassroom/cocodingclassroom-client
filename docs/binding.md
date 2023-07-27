# p5 binding

## loadLibrary

`function loadLibrary(path_to_library);`

Load an additional library. 
Place at the beginning of your p5 file.

`path_to_library` absolute URL to the javascript library to be loaded.

### Example
Load p5.sound.js from CDN.

```javascript
loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/addons/p5.sound.js')

let song;

function preload() {
  song = loadSound('https://cdn.freesound.org/previews/243/243628_3509815-lq.mp3');
}

function mousePressed() {
    if (song.isPlaying()) {
      // .isPlaying() returns a boolean
      song.stop();
      background(255, 0, 0);
    } else {
      song.play();
      background(0, 255, 0);
    }
  }
  

```