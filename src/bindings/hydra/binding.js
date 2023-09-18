import { BindingBase } from "../binding-base";

export class binding extends BindingBase {
  bindingName = "hydra";
  // default code added to editor

  codeTemplate = ``;

  // injected AFTER the main code (for adding extra functions etc)
  customCode = ``;

  // iframe template for code to live in ()
  iframeTemplate = `<!DOCTYPE html>
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
`;
}
