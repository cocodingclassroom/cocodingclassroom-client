/**
 * @module bindings/ace
 */

import { createMutex } from "lib0/mutex.js";
import { Awareness } from "y-protocols/awareness.js"; // eslint-disable-line
import Ace from "ace-builds/src-min-noconflict/ace";
const Range = Ace.require("ace/range").Range;

/*
	AceBinding // cc teddavis.org 2021
	Binding ace-editor with Yjs
 */
export class AceBinding {
  /**
   * @param {Y.Text} type
   * @param {any} ace
   * @param {Awareness} [awareness]
   */
  constructor(type, ace, awareness) {
    const mux = createMutex();
    const doc = type.doc;
    this.mux = mux;
    this.type = type;
    this.doc = doc;
    this.ace = ace;
    this.aceSession = this.ace.getSession();
    this.ace.session.getUndoManager().reset();
    this.awareness = awareness;

    this._typeObserver = (event) => {
      const aceDocument = this.aceSession.getDocument();
      mux(() => {
        const delta = event.delta;
        let currentPos = 0;
        for (const op of delta) {
          if (op.retain) {
            currentPos += op.retain;
          } else if (op.insert) {
            const start = aceDocument.indexToPosition(currentPos, 0);
            aceDocument.insert(start, op.insert);
            currentPos += op.insert.length;
          } else if (op.delete) {
            const start = aceDocument.indexToPosition(currentPos, 0);
            const end = aceDocument.indexToPosition(currentPos + op.delete, 0);
            const range = new Range(
              start.row,
              start.column,
              end.row,
              end.column
            );
            aceDocument.remove(range);
          }
        }
      });
    };
    this.type.observe(this._typeObserver);

    this._aceObserver = (eventType, delta) => {
      const aceDocument = this.aceSession.getDocument();
      mux(() => {
        if (eventType.action === "insert") {
          const start = aceDocument.positionToIndex(eventType.start, 0);
          this.type.insert(start, eventType.lines.join("\n"));
        } else if (eventType.action === "remove") {
          const start = aceDocument.positionToIndex(eventType.start, 0);
          const length = eventType.lines.join("\n").length;
          this.type.delete(start, length);
        }

        this.type.applyDelta(eventType);
      });
    };
    this.ace.on("change", this._aceObserver);

    // initial load of content to ace *** (newly needed, add upstream to lib??)
    mux(() => {
      const aceDocument = this.aceSession.getDocument();
      aceDocument.setValue(type.toString());
    });
  }

  destroy() {
    // console.log('AceBinding destroyed')
    this.type.unobserve(this._typeObserver);
    this.ace.off("change", this._aceObserver);
  }
}
