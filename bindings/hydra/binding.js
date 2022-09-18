// hydra binding

class CocodingClassroomBinding{
	constructor(){
		// default code added to editor
		this.codeTemplate = ``


		// injected AFTER the main code (for adding extra functions etc)
		this.codeCustom = ``


		// iframe template for code to live in ()
		this.iframeTemplate = `<!DOCTYPE html>
<html>
<head>
	<title>HYRDA</title>
	<meta charset="utf-8">
	<style type="text/css">
		body{
			margin:0;
			width:100%;
			height:100%;
			overflow:hidden;
			cursor:crosshair;
		}
		canvas{
			position:absolute;
			top:0;
			left:0;
			width:100%;
			height:100%;
			margin:0;
		}
		input{
			cursor:crosshair;
		}
	</style>
	<script type="text/javascript" src="https://unpkg.com/hydra-synth"></script>

</head>
<body>
	<canvas></canvas>
	<script>
		let hydra = new Hydra({
			detectAudio: false,
			canvas: document.querySelector('canvas')
		})
	</script>
</body>
</html>
`



		this.sessionExport = function(sessionID){
			// let tExport = {
			// 	"version": "1.3.7",
			// 	"revision": 42,
			// 	"structure": [],
			// 	"count": {
			// 		"sketches": 0,
			// 		"folders": 0
			// 	}
			// };



			// let tCode = cc.classrooms.get(sessionID).editor.getValue()
			// let tName = cc.sessionsMap.get(sessionID) //cc.sessions.get(sessionID).name

			// let tempName = prompt('Sketch name:', tName)
			// if(tempName && tempName !== null){
			// 	let tName = cc.sanitize(tempName)
			// 	let tSketch = {
			// 		"name": tName,
			// 	      "mod": cc.timeDate(),
			// 	      "type": "sketch",
			// 	      "code": tCode
			// 	}
			// 	tExport.structure.push(tSketch)
			// 	tExport.count.sketches++
			// 	let tFilename = 'CC_'+tName + '_' + cc.timeStampFile()
			// 	cc.exportJSON(tExport, tFilename + '.json')
			// 	cc.sessionImage(sessionID, tFilename)
			// }
		}

		this.sessionImage = function(){
			// let sessionFrame = cc.classrooms.get(sessionID).iframeContent
			// sessionFrame.save(filename + '.png');
		}
	}
}





