import {css} from "lit";

export const menuRowStyles = () => css`
  .cc-controls-row {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    height: 24px;
    border-bottom: 1px solid #aaa;
    width: 100%;
  }

  .cc-controls-row div {
    height: 90%;
    width: 90%;
    padding: 2px;
    background: #444;
    border: 1px solid #aaa;
    text-align: center;
    cursor: pointer;
  }

  .cc-controls-row div:hover {
    background: #555;
  }
`
