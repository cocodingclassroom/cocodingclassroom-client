import { BindingService } from "../services/binding-service";
import loopBreaker from "loop-breaker";

export const recompile = (
  force,
  iframe,
  editor,
  iframeMeta,
  currentPositions,
  consoleCallback
) => {
  let iframeContent = iframe.contentWindow;
  let activeBinding = BindingService.get().binding;

  // clearTimeout(this.errorTimer)
  // if (this.collapsed) {
  //   return;
  // }

  // if(cc.safeMode){
  //     console.log('in safeMode! to disable, remove #bug from URL and refresh page')
  //     return
  // }

  let pVars = {};
  if (iframeContent.frameCount !== undefined) {
    // p5 specific
    pVars.frameCount = iframeContent.frameCount + 1;
    pVars.mouseX = iframeContent.mouseX;
    pVars.mouseY = iframeContent.mouseY;
  }

  let codeNoComments = removeComments(editor.getValue());
  // let rawLines = editor.session.getLines(0, editor.session.getLength());

  // softCompile
  if (!force) {
    // && !this.windowBroken) {
    // p5 specific
    if (iframeContent.frameCount !== undefined) {
      let drawPos = []; //{};
      let drawPosSel = -1;
      let countBrackets = false;
      let braces = 0;
      let softFunction = false;
      let softClass = false;

      let allLines = codeNoComments.split("\n");

      // sandbox
      let sandboxMatch = editor
        .getValue()
        .match(/^\/\/\s*(hydra)*sandbox.*?\/\/.*?(hydra)*sandbox.*?\n/ims);
      if (sandboxMatch !== null) {
        let currline = editor.getSelectionRange().start.row;

        let currCode = editor.session.getLine(currline);
        let sandboxParts = sandboxMatch[0].split("\n");
        if (sandboxParts.indexOf(currCode) > -1) {
          iframeContent.eval(sandboxMatch[0]);
          if (!force) {
            return false;
          }
        }
      }

      // test purging of comments
      // let offLines = 6;
      // console.log(rawLines[offLines]);
      // console.log(allLines[offLines]);

      // extract all functions and their line number
      for (let i = 0; i < allLines.length; i++) {
        // catch function or class
        if (allLines[i].includes("function ") && !countBrackets) {
          countBrackets = true;
          let functionName = allLines[i]
            .match(/function ([\w\d]*)\(/)[1]
            .trim();
          drawPos.push({ type: "function", name: functionName, start: i });
        } else if (allLines[i].includes("class ") && !countBrackets) {
          countBrackets = true;
          let className = allLines[i].match(/class\s([\w\d]*)/)[1].trim();
          drawPos.push({ type: "class", name: className, start: i });
        }

        // count {} and mark where class/function ends
        if (countBrackets) {
          if (allLines[i].includes("{")) {
            braces += (allLines[i].match(/{/g) || []).length;
          }
          if (allLines[i].includes("}")) {
            braces -= (allLines[i].match(/}/g) || []).length;
            if (braces === 0) {
              drawPos[drawPos.length - 1].end = i;
              countBrackets = false;
            }
          }
        }
      }

      // check all changed positions + if custom function
      let funName = "";
      for (let i = 0; i < drawPos.length; i++) {
        for (let j = 0; j < currentPositions.length; j++) {
          let cPos = currentPositions[j];
          if (cPos.row >= drawPos[i].start && cPos.row <= drawPos[i].end) {
            // console.log(drawPos[i].name); // debug where change occured
            if (
              drawPos[i].name !== "setup" &&
              drawPos[i].name !== "preload" &&
              drawPos[i].type === "function"
            ) {
              softFunction = true;
              drawPosSel = i;
              funName = drawPos[i].name;
            } else if (drawPos[i].type === "class") {
              softClass = true;
              drawPosSel = i;
            }
          }
        }
      }

      // if custom function, grab where it's used
      let functionPos = [];
      for (let j = 0; j < drawPos.length; j++) {
        if (funName === drawPos[j].name) {
          // find lines where drawPos[i].name sits
          for (let i = 0; i < allLines.length; i++) {
            if (allLines[i].includes(drawPos[j].name + "(")) {
              functionPos.push(i);
            }
          }
        }
      }

      // catch custom functions in preload + setup
      for (let i = 0; i < functionPos.length; i++) {
        let fPos = functionPos[i];
        for (let j = 0; j < drawPos.length; j++) {
          if (fPos >= drawPos[j].start && fPos <= drawPos[j].end) {
            // console.log(drawPos[i].name); // debug where chage occured
            if (drawPos[j].name === "setup" || drawPos[j].name === "preload") {
              // && !settings.cocoding.active
              softFunction = false;
            }
          }
        }
      }

      // if possible, only overwrite function/class for softCompile
      if (softClass || softFunction) {
        softCompile(
          drawPos[drawPosSel].type,
          drawPos[drawPosSel].name,
          drawPos[drawPosSel].start,
          drawPos[drawPosSel].end,
          editor,
          iframe,
          consoleCallback
        );
        // this.curPositions = [];
        return false; // prevent complete rebuild
      }
    }
  }

  // base template
  let el = document.createElement("html");
  el.innerHTML = activeBinding.iframeTemplate;
  let iFrameHead = el.getElementsByTagName("head")[0]; //el.document.getElementsByTagName('body')[0];
  let iFrameBody = el.getElementsByTagName("body")[0]; //el.document.getElementsByTagName('body')[0];

  // COCODING Classroom meta for console/error etc
  let sMeta = document.createElement("script");
  sMeta.type = "text/javascript";
  sMeta.innerHTML = iframeMeta;
  iFrameHead.appendChild(sMeta);

  let scriptsCol = [];
  let scriptsList = processLibs(codeNoComments);
  for (let i = 0; i < scriptsList.length; i++) {
    scriptsCol.push(scriptsList[i]);
  }

  for (let sc of scriptsCol) {
    let s = document.createElement("script");
    s.type = "text/javascript";
    s.src = sc;
    // s.async = false;
    iFrameHead.appendChild(s);
  }

  // sketch as script tag
  let s = document.createElement("script");
  s.type = "text/javascript";
  let sketchCode = editor.getValue();

  // break infinite loops
  if (!sketchCode.match(/(\/\/).*(no.*protect)/g)) {
    try {
      sketchCode = loopBreaker(sketchCode).code;
    } catch (e) {
      // validCode = false;
      consoleCallback(
        `👀 error found near line ~ ${e.lineNumber}, ${e.description}`
      );
      console.log(e.description); // debug full message
      return;
    }
  }
  55;

  let fullCode = sketchCode + "\n\n" + activeBinding.codeCustom;
  s.innerHTML = fullCode;

  // set template as iframe srcdoc
  iframe.srcdoc = el.innerHTML;

  // when ready, add sketch script
  iframe.onload = () => {
    // windowBroken = false;
    iframeContent.ccSelf = this;
    iframeContent.document.body.appendChild(s);
    // this.validCode = true
    // this.consoleClear()

    // p5 specific
    if (pVars.hasOwnProperty("frameCount")) {
      iframeContent.frameCount = pVars.frameCount;
      iframeContent.mouseX = pVars.mouseX;
      iframeContent.mouseY = pVars.mouseY;
    }
    // this.curPositions = [];
  };
};

const softCompile = (
  codeType,
  codeName,
  codeStart,
  codeEnd,
  editor,
  iframe,
  consoleCallback
) => {
  let curCodeTemp = "";
  if (codeType === "function") {
    curCodeTemp = editor.session.getLines(codeStart, codeEnd).join("\n");
  } else if (codeType === "class") {
    curCodeTemp =
      codeName +
      " = class {" +
      editor.session.getLines(codeStart + 1, codeEnd).join("\n");
  }
  let s = document.createElement("script");
  s.type = "text/javascript";

  // break infinite loops
  if (!editor.getValue().match(/(\/\/).*(no.*protect)/g)) {
    try {
      curCodeTemp = loopBreaker(curCodeTemp).code;
    } catch (e) {
      // console.log(e.description)
      // this.validCode = false
      consoleCallback(
        `👀 error found near line ~ ${e.lineNumber}, "${e.description}"`
      );
      console.log(e.description); // debug full message
      return;
    }
  }
  s.innerHTML = curCodeTemp;
  iframe.contentWindow.document.head.appendChild(s);
  // this.validCode = true
  // this.consoleClear()
};

const removeComments = (code) => {
  return code.replace(/\/\*[\s\S]*?\*\/|([^:\}\)]|^)\/\/.*$/gm, (_, g1, g2) =>
    Array(_.split("\n").length).join("\n")
  );
};

const processLibs = (code) => {
  let sketchTest = code.replace(/(?:\r\n|\r|\n|\t)/g, "");
  let sketchScriptsString = sketchTest.match(
    /(?=loadScripts|libs|scripts).*?(\])/
  );
  let scriptsList = [];
  if (sketchScriptsString !== null) {
    let sketchLoadScripts = sketchScriptsString[0].match(
      /(["'])(?:(?=(\\?))\2.)*?\1/g
    );
    for (let i = 0; i < sketchLoadScripts.length; i++) {
      if (sketchLoadScripts[i] !== "") {
        scriptsList.push(sketchLoadScripts[i].replace(/["']/g, ""));
      }
    }
  }
  return scriptsList;
};
