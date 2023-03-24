import { formatCode } from "./compiler";

const shortcuts = {
  // 'softcompile':{
  // 	'name':'Soft-Compile'
  // 	,'key':'ctrl+enter'
  // 	,'callback':'recompile()'
  // },
  // 'hardcompile':{
  // 	'name':'Hard-Compile'
  // 	,'key':'ctrl+shift+enter'
  // 	,'callback':'recompile(true)'
  // },
  editor: {
    name: "Editor Toggle",
    key: ["ctrl", "e"],
    callback: undefined,
  },
  menu: {
    name: "Menu Toggle",
    key: ["ctrl", "m"],
    callback: undefined,
  },
  // 'settings':{
  // 	'name':'Settings Toggle'
  // 	,'key':'ctrl+,'
  // 	,'callback':'showSettings(true)'
  // },
  // 'references':{
  // 	'name':'References Toggle'
  // 	,'key':'ctrl+r'
  // 	,'callback':'toggleRef()'
  // },
  // 'chalkboard':{
  // 	'name':'Chalkboard Toggle'
  // 	,'key':'ctrl+b'
  // 	,'callback':'toggleChalkboard()'
  // },
  // 'autocompile':{
  // 	'name':'Live-Coding Toggle'
  // 	,'key':'ctrl+a'
  // 	,'callback':'liveCodingToggle()'
  // },
  // 'newsketch':{
  // 	'name':'New Sketch'
  // 	,'key':'ctrl+n'
  // 	,'callback':'loadDefault()'
  // },

  codecomment: {
    name: "Comment Code",
    key: "meta+/",
    init: 'editor.commands.bindKey(settings.shortcuts["codecomment"].key, "togglecomment")',
  },
  fontbigger: {
    name: "Increase Fontsize",
    key: "ctrl+=",
    callback: "fontSizeAdjust(0.25)",
  },
  fontsmaller: {
    name: "Decrease Fontsize",
    key: "ctrl+-",
    callback: "fontSizeAdjust(- 0.25)",
  },
  // 'pause':{
  // 	'name':'Pause'
  // 	,'key':'ctrl+p'
  // 	,'callback':'pauseSketch()'
  // },
  snapshot: {
    name: "Export Snapshot",
    key: "ctrl+s",
    callback: "savePNG()",
  },
  // 'import':{
  // 	'name':'Import Sketch'
  // 	,'key':'ctrl+o'
  // 	,'callback':'importSketchesDialog()'
  // },
  // 'instagram':{
  // 	'name':'Instagram Window'
  // 	,'key':'ctrl+i'
  // 	,'callback':'pop720()'
  // },
  jump: {
    name: "Quick Sketch Jump",
    key: "ctrl", // modifier for 1-0
    init: 'setupJumpSketches(settings.shortcuts["jump"].key)',
    tippy: "Then combine w/ 1, 2,...0 to jump thru sketches",
  },
};
