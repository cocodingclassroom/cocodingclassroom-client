/**
 * @module bindings/ace
 */

import { createMutex } from "lib0/mutex.js";
import { Awareness } from "y-protocols/awareness.js"; // eslint-disable-line
import Ace from "ace-builds/src-min-noconflict/ace";
const Range = Ace.require("ace/range").Range;

/*
	AceCursors // cc teddavis.org 2021
	Tracking collaborative cursors + selection in Ace Editor
 */
export class AceCursors {
  /**
   * @param {AceBinding} binding
   */
  constructor(binding) {
    this.type = binding.type;
    this.doc = binding.type.doc; //doc
    this.ace = binding.ace;
    this.aceSession = binding.aceSession;
    this.awareness = binding.awareness;

    this.marker = {};
    this.marker.self = this;
    this.markerID = {};
    this.marker.cursors = [];
    this.aceID = this.ace.id;
    this.idCursor = "ace_cursor_" + this.aceID + "_";
    this.idStyle = "ace_cursor_style_" + this.aceID + "_";
    this.awarenessCursor = "cursor"; // 'cursor-' + this.aceID
    this.cursorsMemory = [];

    this.marker.update = function (html, markerLayer, session, config) {
      // console.log([html, markerLayer, session, config])
      let start = config.firstRow,
        end = config.lastRow;
      let cursorsClear = this.self.ace.container
        .querySelectorAll(".cursor")
        .forEach((elm) => {
          elm.remove();
        });

      let cursors = this.cursors;
      for (let i = 0; i < cursors.length; i++) {
        let cursor = this.cursors[i];
        let client = this.self.awareness.getStates().get(cursor.id);

        if (cursor.row < start) {
          continue;
        } else if (cursor.row > end) {
          break;
        } else {
          // only show cursor in single session
          if (cursor.ace !== this.self.aceID || cursor.blur) {
            return false;
          }

          // compute cursor position on screen
          // this code is based on ace/layer/marker.js
          let screenPos = session.documentToScreenPosition(
            cursor.row,
            cursor.col
          );
          let aceGutter =
            document.getElementsByClassName("ace_gutter")[0].offsetWidth;

          // fixes split-screen line-number offset, especially 2-digit numbers
          if (cursor.ace != "editor1") {
            // aceGutter = document.getElementsByClassName('ace_gutter')[1].offsetWidth
            document.querySelectorAll(".ace_gutter").forEach(function (gutter) {
              // Now do something with my button
              if (gutter.offsetWidth > 0) {
                aceGutter = gutter.offsetWidth;
              }
            });
          }

          let height = config.lineHeight;
          let width = config.characterWidth;
          let top = markerLayer.$getTop(screenPos.row, config);
          let left =
            markerLayer.$padding + aceGutter + screenPos.column * width + 0;
          console.log(aceGutter);

          // draw cursor and flag
          let el = document.createElement("div");
          el.id = this.self.idCursor + cursor.id;
          el.className = "cursor";
          el.style = `
							position: absolute;
							background: ${client.user.color};
							height: ${height}px;
							width: ${width / 3}px;
							top: ${top}px;
							left: ${left}px;
							border-left: 2px solid ${client.user.color};
							z-index: 100;
							color: #000;
							cursor: help;
						`;
          el.innerHTML =
            '<div class="cursor-label" style="background: ' +
            client.user.color +
            ';top: -1.3em;white-space: nowrap;">' +
            client.user.name +
            "</div>";
          this.self.ace.container.appendChild(el);
        }
      }
    }; // eof marker update

    // awareness change of cursors
    this._awarenessChange = ({ added, removed, updated }) => {
      const states = this.awareness.getStates();

      // check for cursor changes
      let cursorsCurrent = [];
      updated.forEach((id) => {
        let client = states.get(id);
        if (
          client.hasOwnProperty("cursor") &&
          client.cursor.ace == this.aceID
        ) {
          cursorsCurrent.push(this.parseCursor(id));
        }
      });

      // only redraw if changes detected
      if (
        JSON.stringify(cursorsCurrent) !== JSON.stringify(this.cursorsMemory)
      ) {
        this.cursorsMemory = cursorsCurrent.slice();

        this.marker.cursors = [];
        updated.forEach((id) => {
          let client = states.get(id);
          if (
            client.hasOwnProperty("cursor") &&
            client.cursor.ace == this.aceID
          ) {
            this.marker.cursors.push(this.parseCursor(id));
            this.parseSelection(id);
          }
        });

        this.marker.redraw();
      }

      // redraw cursors on add/remove
      if (added.length > 0 || removed.length > 0) {
        this.marker.cursors = [];

        added.forEach((id) => {
          // console.log('added: ' + id)
          this.marker.cursors.push(this.parseCursor(id));
          this.parseSelection(id);
        });
        removed.forEach((id) => {
          // console.log('removed: ' + id)
          this.marker.cursors.push(this.parseCursor(id));
          this.parseSelection(id);
        });

        this.marker.redraw();
      }
    };

    this._cursorObserver = () => {
      let client = this.awareness.getLocalState();
      let aceSession = this.aceSession;
      let curSel = aceSession.selection;
      let cursor = {
        id: this.doc.clientID,
        ace: this.aceID,
        sel: !curSel.isEmpty(),
      };

      let indexAnchor = aceSession.doc.positionToIndex(
        curSel.getSelectionAnchor()
      );
      let indexHead = aceSession.doc.positionToIndex(curSel.getSelectionLead());
      cursor.anchor = indexAnchor;
      cursor.head = indexHead;
      // console.log(curSel.getSelectionAnchor())
      // console.log(this.ace.getSession().doc.indexToPosition(indexAnchor))// ***

      // flip if selected right to left
      if (indexAnchor > indexHead) {
        cursor.anchor = indexHead;
        cursor.head = indexAnchor;
      }

      if (cursor.anchor !== cursor.head) {
        cursor.sel = true;
      }

      if (this.ace.getReadOnly()) {
        return;
      }

      // share cursor if unique pos
      if (
        client[this.awarenessCursor] == undefined ||
        cursor.anchor !== client[this.awarenessCursor].anchor ||
        cursor.head !== client[this.awarenessCursor].head ||
        cursor.ace !== client[this.awarenessCursor].ace
      ) {
        this.awareness.setLocalStateField(this.awarenessCursor, cursor);
      }
    };

    // update cursors
    this.aceSession.selection.on("changeCursor", () => this._cursorObserver());
    // this.aceSession.selection.on('changeSelection', ()=>this._cursorObserver())

    if (this.awareness) {
      this.awareness.on("change", this._awarenessChange);
    }

    this.marker.redraw = function () {
      this.session._signal("changeFrontMarker");
    };

    this.marker.session = this.aceSession;
    this.marker.session.addDynamicMarker(this.marker, true);
  } // end of constructor

  parseCursor(id) {
    let client = this.awareness.getStates().get(id);
    if (client !== undefined && client.hasOwnProperty(this.awarenessCursor)) {
      let c = client[this.awarenessCursor];

      // skip cursors from other editor session
      if (c.ace !== this.aceID && this.aceID != "editor1") {
        return false;
      }

      let pos = this.aceSession.doc.indexToPosition(c.head);

      // clone and extend awareness state
      let curCursor = { ...c }; // {id:c.id, session:c.session, row:pos.row, col:pos.column}
      curCursor.session = client.session;
      curCursor.row = pos.row;
      curCursor.col = pos.column;
      // curCursor.blur = client.user.blur
      return curCursor;
    } else {
      return false;
    }
  }

  parseSelection(id) {
    let client = this.awareness.getStates().get(id);
    if (client !== undefined && client.hasOwnProperty(this.awarenessCursor)) {
      let c = client[this.awarenessCursor];

      // skip cursors from other editor session
      // if((c.ace !== this.aceID) && this.aceID != 'editor1'){
      // 	return false
      // }

      // handle selection
      if (c.sel) {
        return; // *** fix bug on tidy code/paste/etc

        if (
          this.markerID[c.id] !== undefined &&
          this.markerID[c.id].hasOwnProperty("sel") &&
          this.markerID[c.id].sel !== undefined
        ) {
          this.ace.session.removeMarker(this.markerID[c.id].sel);
          this.markerID[c.id].sel = undefined;
        }

        let anchor = this.aceSession.doc.indexToPosition(c.anchor);
        let head = this.aceSession.doc.indexToPosition(c.head);

        let customStyle = document.getElementById(this.idStyle + c.id);
        if (customStyle) {
          customStyle.innerHTML =
            ".selection-" +
            c.id +
            " { position: absolute; z-index: 20; opacity: 0.5; background: " +
            client.user.color +
            "; }";
        } else {
          let style = document.createElement("style");
          style.type = "text/css";
          style.id = this.idStyle + c.id;
          document.getElementsByTagName("head")[0].appendChild(style);
        }

        this.markerID[c.id] = {
          id: c.id,
          sel: this.ace.session.addMarker(
            new Range(anchor.row, anchor.column, head.row, head.column),
            "selection-" + c.id,
            "text"
          ),
        };
      } else {
        if (
          this.markerID[c.id] !== undefined &&
          this.markerID[c.id].hasOwnProperty("sel") &&
          this.markerID[c.id].sel !== undefined
        ) {
          this.ace.session.removeMarker(this.markerID[c.id].sel);
          this.markerID[c.id].sel = undefined;
        }
      }
    }
  }

  destroy() {
    // console.log(this.aceID + ' - AceCursors destroyed')
    if (this.awareness) {
      this.awareness.off("change", this._awarenessChange);
    }
    this.aceSession.selection.off("changeCursor", () => this._cursorObserver());
    this.aceSession.selection.off("changeSelection", () =>
      this._cursorObserver()
    );
  }
}

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
