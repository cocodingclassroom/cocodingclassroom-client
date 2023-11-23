import { BindingService } from "../services/binding-service";
import loopBreaker from "loop-breaker";
import { js as beautify } from "js-beautify";

export const interpret = (
  fullRebuild,
  room,
  messageCallback,
  errorCallback,
  compilationOkayCallback,
  activeError = false
) => {
  let iframeContent = room.l_iframeForRoom.contentWindow;
  let iframe = room.l_iframeForRoom;
  let iframeMeta = room.l_iframeMeta;
  let editor = room.l_editorForRoom;
  let activeBinding = BindingService.get().binding;
  let currentPositions = room.l_changedPositions;

  let codeNoComments = removeComments(editor.getValue());

  if (!fullRebuild && !activeError) {
    let softInterpretResultFromBinding =
      activeBinding.bindingSpecificSoftCompile(editor);
    if (softInterpretResultFromBinding) {
      try {
        iframeContent.eval(softInterpretResultFromBinding);
        compilationOkayCallback();
        return;
      } catch (e) {
        errorCallback(`👀 error found:, "${e}"`);
        return;
      }
    }

    trySoftInterpretation(
      iframeContent,
      editor,
      codeNoComments,
      iframe,
      currentPositions,
      errorCallback,
      compilationOkayCallback
    );
    return;
  }

  fullRebuildOfIframe(
    activeBinding,
    iframeMeta,
    editor,
    errorCallback,
    iframe,
    iframeContent,
    messageCallback,
    compilationOkayCallback
  );
};

const fullRebuildOfIframe = (
  activeBinding,
  iframeMeta,
  editor,
  errorCallback,
  iframe,
  iframeContent,
  messageCallback,
  compilationOkayCallback
) => {
  let el = document.createElement("html");
  el.innerHTML = activeBinding.getIInAppFrameTemplate();
  let iFrameHead = el.getElementsByTagName("head")[0]; //el.document.getElementsByTagName('body')[0];
  let iFrameBody = el.getElementsByTagName("body")[0]; //el.document.getElementsByTagName('body')[0];

  // COCODING Classroom meta for console/error etc
  let sMeta = document.createElement("script");
  sMeta.type = "text/javascript";
  sMeta.innerHTML = iframeMeta;
  iFrameHead.appendChild(sMeta);
  let sketchCode = editor.getValue();

  let scriptsList = processLibs(sketchCode);
  for (let sc of scriptsList) {
    let s = document.createElement("script");
    s.type = "text/javascript";
    s.src = sc;
    iFrameHead.appendChild(s);
  }

  // sketch as script tag
  let s = document.createElement("script");
  s.type = "text/javascript";

  // break infinite loops
  if (!sketchCode.match(/(\/\/).*(no.*protect)/g)) {
    try {
      sketchCode = loopBreaker(sketchCode).code;
    } catch (e) {
      // validCode = false;
      errorCallback(
        `❌ error found near line ~ ${e.lineNumber}, ${e.description}`
      );
      console.log(e.description); // debug full message
      return;
    }
  }

  s.innerHTML = activeBinding.getCustomCode() + "\n\n" + sketchCode;

  // set template as iframe srcdoc
  iframe.sandbox =
    "allow-same-origin allow-scripts allow-downloads allow-pointer-lock";
  iframe.srcdoc = el.innerHTML;

  // when ready, add sketch script
  iframe.onload = () => {
    // windowBroken = false;
    iframeContent.ccSelf = {};
    iframeContent.ccSelf.consoleMessage = (message) => {
      messageCallback(message);
    };
    iframeContent.ccSelf.errorCallback = (message) => {
      errorCallback(message);
    };
    iframeContent.ccSelf.passMouse = (event) => {
      console.log(event);
    };

    iframeContent.document.body.appendChild(s);

    compilationOkayCallback();
  };
};

const trySoftInterpretation = (
  iframeContent,
  editor,
  codeNoComments,
  iframe,
  currentPositions,
  errorCallback,
  compilationOkayCallback
) => {
  if (iframeContent !== undefined) {
    let drawPos = []; //{};
    let drawPosSel = -1;
    let countBrackets = false;
    let braces = 0;
    let softFunction = false;
    let softClass = false;

    let allLines = codeNoComments.split("\n");

    // sandbox
    // let sandboxMatch = editor
    //     .getValue()
    //     .match(/^\/\/\s*(hydra)*sandbox.*?\/\/.*?(hydra)*sandbox.*?\n/ims);
    // if (sandboxMatch !== null) {
    //   let currline = editor.getSelectionRange().start.row;
    //
    //   let currCode = editor.session.getLine(currline);
    //   let sandboxParts = sandboxMatch[0].split("\n");
    //   if (sandboxParts.indexOf(currCode) > -1) {
    //     iframeContent.eval(sandboxMatch[0]);
    //     if (!forceCompile) {
    //       return false;
    //     }
    //   }
    // }

    // test purging of comments
    // let offLines = 6;
    // console.log(rawLines[offLines]);
    // console.log(allLines[offLines]);

    // extract all functions and their line number
    for (let i = 0; i < allLines.length; i++) {
      // catch function or class
      if (allLines[i].includes("function ") && !countBrackets) {
        countBrackets = true;
        let functionName = allLines[i].match(/function ([\w\d]*)\(/)[1].trim();
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
      softInterpretation(
        drawPos[drawPosSel].type,
        drawPos[drawPosSel].name,
        drawPos[drawPosSel].start,
        drawPos[drawPosSel].end,
        editor,
        iframe,
        errorCallback
      );
      // this.curPositions = [];
      compilationOkayCallback();
    }
  }
};

const softInterpretation = (
  codeType,
  codeName,
  codeStart,
  codeEnd,
  editor,
  iframe,
  errorCallback
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
      errorCallback(
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

// https://regex101.com/r/9Q7JOj/1
const regex = /\/[\/\*]+\s*@script\s*=\s*(?<link>"[^"]+"|'[^']+')\s*/gm;
//  // @script='https://xpy.com?query=st_-ring'
//  // @script =  "https://xpy.com?query=t_e-s%3At"
//  /* @script= "https://xpy.com?query=t_e-s%3At" */
//  /** @script=  "https://xpy.com?query=t_e-s%3At" */
const processLibs = (code) => {
    let m;
    let scriptsList = [];  
    while ((m = regex.exec(code)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        const link = m.groups["link"].replace(/["']/g, "")
        if (link !== "")
            scriptsList.push(link)
    }
    return scriptsList;
}

export const formatCode = (editor) => {
  // beautify!
  let beautifyOptions = {
    indent_size: "1",
    indent_char: "\t",
    max_preserve_newlines: "5",
    preserve_newlines: true,
    keep_array_indentation: false,
    break_chained_methods: false,
    indent_scripts: "normal",
    brace_style: "collapse",
    space_before_conditional: false,
    unescape_strings: false,
    jslint_happy: false,
    end_with_newline: false,
    wrap_line_length: "0",
    indent_inner_html: false,
    comma_first: false,
    e4x: false,
  };

  let tempPos = editor.getCursorPosition();
  let tempCode = beautify(editor.getValue(), beautifyOptions);
  editor.setValue(tempCode, -1);
  editor.gotoLine(tempPos.row + 1, tempPos.column, false);
};
