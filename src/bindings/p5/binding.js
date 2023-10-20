// p5 binding

import { BindingBase, JSLoadingConfig } from "../binding-base";

export class binding extends BindingBase {
  bindingName = "p5";

  getCodeTemplate = () => {
    return `function setup() {
  createCanvas(windowWidth, windowHeight)

}

function draw() {

}`;
  };

  getCustomCode = () => {
    return `
  /* CUSTOM FUNCTIONS FOR P5LIVE */
  // keep fullscreen if window resized
  function windowResized() {
  	resizeCanvas(windowWidth, windowHeight)
  }
  
  // custom ease function
  function ease(iVal, oVal, eVal){
  	return oVal += (iVal - oVal) * eVal
  }
  
  // processing compatibility
  function println(msg){
  	print(msg)
  }
  
  new p5()
`;
  };

  getIFrameTemplate = () => {
    return `<head>
	<title>COCODING Classroom - p5.js</title>
	<meta charset="utf-8">
	<style type="text/css">
		body{
			margin: 0;
			width: 100%;
			height: 100%;
			overflow: hidden;
			cursor: crosshair;
			background: #000;
		}
		canvas{
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			margin: 0;
		}
		input{
			cursor: crosshair;
		}
	</style>
 {SCRIPTS}
</head>
<body>
</body>`;
  };

  getScriptTags = () => {
    return [
      new JSLoadingConfig(
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.6.0/p5.min.js" integrity="sha512-3RlxD1bW34eFKPwj9gUXEWtdSMC59QqIqHnD8O/NoTwSJhgxRizdcFVQhUMFyTp5RwLTDL0Lbcqtl8b7bFAzog==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        "P5",
        "./bindings/p5/p5.min.js"
      ),
      new JSLoadingConfig(
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.6.0/addons/p5.sound.min.js" integrity="sha512-WzkwpdWEMAY/W8WvP9KS2/VI6zkgejR4/KTxTl4qHx0utqeyVE0JY+S1DlMuxDChC7x0oXtk/ESji6a0lP/Tdg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
        "P5Sound",
        "./bindings/p5/addons/p5.sound.min.js"
      ),
    ];
  };
}

/*
kept for reference --> need reeimplement
// count number of loaded libraries
var __libcounter=0;

function loadLibrary(lib) {
	if (lib) {
		__libcounter++;
		let scriptEl = document.createElement("script");
		document.body.appendChild(scriptEl);
		scriptEl.type = "text/javascript";
		scriptEl.onload = function() {__onLibraryLoaded(lib)};
		scriptEl.src = lib;
	}
}

// callback being called after library has been loaded
async function __onLibraryLoaded(lib) {
	__libcounter--;
	// console.log("lib loaded: " + lib + " counter: " + __libcounter)
	if (__libcounter == 0) {
		// console.log("all libs loaded, starting p5")
		clearTimeout(runner);
		new p5();
	}
}

// start p5 if no library has been loaded,
// HACK: use setTimeout() without time to start p5 in the next event cycle.
const runner = setTimeout(() => {
	// console.log("no library loaded, starting p5");
	if (__libcounter <= 0)
		new p5();
	}
);
 */
