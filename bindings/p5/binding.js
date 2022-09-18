// p5 binding

var binding = {}

binding.codeTemplate = `function setup() {
	createCanvas(windowWidth, windowHeight)

}

function draw() {

}`


// injected AFTER the main code (for adding extra functions etc)
binding.codeCustom = `/* CUSTOM FUNCTIONS FOR P5LIVE */
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

new p5();`


// iframe template for code to live in ()
binding.iframeTemplate = `<!DOCTYPE html>
<html>
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
		<script type="text/javascript" src="${cc.bindingPath}p5.min.js"></script>
		<script type="text/javascript" src="${cc.bindingPath}addons/p5.sound.min.js"></script>


</head>
<body>
</body>
</html>
`


binding.roomExport = function(roomID){
	let tExport = {
		"version": "1.3.7",
		"revision": 42,
		"structure": [],
		"count": {
			"sketches": 0,
			"folders": 0
		}
	};

	let flash = cc.rooms.get(roomID).htmlContainer.querySelector('.cc-flash')
	flash.classList.add('cc-flash-active')

	let roomFrame = cc.rooms.get(roomID).iframeContent

	let tCode = cc.rooms.get(roomID).editor.getValue()
	let tName = cc.y.rooms.get(roomID.toString()).name

	vex.dialog.open({
		input:`
			<div id="cc-room-setting" class="vex-form">
					<div class="cocoding-rename-input" ><label for="nick">Sketch name:</label><br>
					<input id="roomnick" name="nick" type="text" value="${tName}"></div>
			</div>
		`,
		callback: function (data) {
			if(data){
				let tempName = data.nick
				let tName = cc.sanitize(tempName)
				let tSketch = {
					"name": tName,
				      "mod": cc.timeDate(),
				      "type": "sketch",
				      "code": tCode
				}
				tExport.structure.push(tSketch)
				tExport.count.sketches++
				let tFilename = 'CC_'+tName + cc.timeStampFile()
				cc.exportJSON(tExport, tFilename + '.json')
				cc.roomImage(roomID, tFilename)
			}
		},
		afterOpen: function(){
			cc.vexSmall(this.rootEl)
			roomFrame.frameCount !== undefined ? roomFrame.noLoop() : ''
			setTimeout(function(){document.getElementById('roomnick').select()}, 0)

		},
		afterClose: function(){
			flash.classList.remove('cc-flash-active')
			roomFrame.frameCount !== undefined ? roomFrame.loop() : ''
		}
	})
}

binding.roomImage = function(roomID, filename){
	let roomFrame = cc.rooms.get(roomID).iframeContent
	roomFrame.save(filename + '.png');
}