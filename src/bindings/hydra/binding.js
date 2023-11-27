import { BindingBase, JSLoadingConfig } from '../binding-base'
import hydraAutocomplete from './hydra_autocomplete.json'

export class binding extends BindingBase {
    bindingName = 'Hydra'

    getCodeTemplate = () => {
        return `noise().out()`
    }

    getCustomCode = () => {
        return `
    function exportImage() {
      hydra.getScreenImage()
    }
    `
    }

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
			canvas: document.querySelector("canvas")
		});
		setTimeout(() =>  {
      	setResolution(window.innerWidth, window.innerHeight);
		}, 50);
	</script>
</body>
`
    }

    getScriptTags = () => {
        return [
            new JSLoadingConfig(
                '<script type="text/javascript" src="https://unpkg.com/hydra-synth"></script>',
                'Hydra',
                './bindings/hydra/hydra-synth.js'
            ),
        ]
    }

    bindingSpecificSoftCompile = (editor) => {
        let rawLines = editor.session.getLines(0, editor.session.getLength())
        let currline = editor.getSelectionRange().start.row
        let currCode = editor.session.getLine(currline)

        // search +/- cur pos for new lines
        let block = currCode
        let start = currline
        let end = currline

        let i = currline - 1
        while (i >= 0 && rawLines[i].trimStart() !== '') {
            block = editor.session.getLine(i) + '\n' + block
            start--
            i--
        }

        i = currline + 1
        while (i < rawLines.length && rawLines[i].trimStart() !== '') {
            block += '\n' + editor.session.getLine(i)
            end++
            i++
        }

        return block
    }

    exportPicture = (room) => {
        room.l_iframeForRoom.contentWindow.exportImage()
    }

    getAutoCompleteJson = () => {
        return hydraAutocomplete
    }
}
