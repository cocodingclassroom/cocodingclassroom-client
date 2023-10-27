import { BindingBase, JSLoadingConfig } from "../binding-base";

export class binding extends BindingBase {
  bindingName = "Hydra";

  getCodeTemplate = () => {
    return `
 osc(5, 0.9, 0.001)
 .kaleid([3,4,5,7,8,9,10].fast(0.1))
 .color(0.5, 0.3)
 .colorama(0.4)
 .rotate(0.009,()=>Math.sin(time)* -0.001 )
 .modulateRotate(o0,()=>Math.sin(time) * 0.003)
 .modulate(o0, 0.9)
 .scale(0.9)
 .out(o0)
    `;
  };

  getCustomCode = () => {
    return ``;
  };

  getIFrameTemplate = () => {
    return `
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
	{SCRIPTS}
</head>
<body>
	<canvas></canvas>
	<script type="text/javascript">
		let hydra = new Hydra({
			detectAudio: false,
			canvas: document.querySelector('canvas')
		})
	</script>
</body>
`;
  };

  getScriptTags = () => {
    return [
      new JSLoadingConfig(
        '<script type="text/javascript" src="https://unpkg.com/hydra-synth"></script>',
        "Hydra"
      ),
    ];
  };

  bindingSpecificSoftCompile = (editor) => {
    let rawLines = editor.session.getLines(0, editor.session.getLength());
    let currline = editor.getSelectionRange().start.row;
    let currCode = editor.session.getLine(currline);

    // search +/- cur pos for new lines
    let block = currCode;
    let start = currline;
    let end = currline;

    let i = currline - 1;
    while (i >= 0 && rawLines[i].trimStart() !== "") {
      block = editor.session.getLine(i) + "\n" + block;
      start--;
      i--;
    }

    i = currline + 1;
    while (i < rawLines.length && rawLines[i].trimStart() !== "") {
      block += "\n" + editor.session.getLine(i);
      end++;
      i++;
    }

    return block;
  };
}
