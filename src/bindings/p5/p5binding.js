// p5 binding

import { BindingTemplate } from "../binding";

export class p5binding extends BindingTemplate {
  codeTemplate = `function setup() {
	createCanvas(windowWidth, windowHeight)

}

function draw() {

}`;

  customCode = `/* CUSTOM FUNCTIONS FOR P5LIVE */
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

new p5();`;

  iframeTemplate = `
<head>
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
		<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.6.0/p5.min.js" integrity="sha512-3RlxD1bW34eFKPwj9gUXEWtdSMC59QqIqHnD8O/NoTwSJhgxRizdcFVQhUMFyTp5RwLTDL0Lbcqtl8b7bFAzog==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</head>
<body>
</body>
`;
  getIFrameTemplate = () => {
    return `
    <!DOCTYPE html>
      <html>
      ${this.iframeTemplate}
      </html>
    `;
  };
}
