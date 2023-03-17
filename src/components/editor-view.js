import { css, html, LitElement } from "lit";
import * as ace from "ace-builds";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/mode-javascript";
import { styleMap } from "lit/directives/style-map.js";

export class EditorView extends LitElement {
  static properties = {
    editorIdentifier: { type: String },
    editorWidth: { type: Number },
    leftAlign: { type: Boolean },
  };

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    let cont = this.shadowRoot.getElementById(this.editorIdentifier);
    let editor = ace.edit(cont);
    editor.renderer.attachToShadowRoot();
    editor.setTheme("ace/theme/cobalt");
    editor.getSession().setMode("ace/mode/javascript");
    editor.session.setMode("ace/mode/javascript");
    editor.setOptions({
      showPrintMargin: false,
      animatedScroll: true,
      displayIndentGuides: false,
      useWorker: false,
      scrollPastEnd: 1,
      showLineNumbers: true,
      showGutter: true,
      tabSize: 4,
      useSoftTabs: false,
    });
    editor.commands.removeCommands([
      "gotolineend", // ctrl + e
      "transposeletters", // ctrl + t (totally removed)
    ]);
  }

  render() {
    const styles = {};
    styles.width = `${this.editorWidth}%`;

    // styles.set("width", );
    if (this.leftAlign) {
      styles.left = 0;
    } else {
      styles.right = 0;
    }
    return html`
        <div class="editor" 
             id=${this.editorIdentifier}
             style="${styleMap(styles)}"">
        </div> `;
  }

  static styles = css`
    .editor {
      position: absolute;
      top: 0;
      bottom: 0;
    }
  `;
}

window.customElements.define("cc-editor", EditorView);
