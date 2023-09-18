import { css, unsafeCSS } from "lit";

export const secondary = () => unsafeCSS("#aaaaaa");

export const editorBackground = () => unsafeCSS("#000000");

export const menuBorder1 = () => unsafeCSS("#aaaaaa");
export const menuBorder2 = () => unsafeCSS("#555555");
export const menuForegroundLight = () => unsafeCSS("#f5f5f5");
export const menuForegroundDark = () => unsafeCSS("#1f1f1f");
export const menuBackground1 = () => unsafeCSS("#222222");
export const menuBackground1Hover = () => unsafeCSS("#222222");
export const menuBackground2 = () => unsafeCSS("#444444");
export const menuBackground2Hover = () => unsafeCSS("#555555");
export const menuBackground3 = () => unsafeCSS("#666666");
export const menuBackground3Hover = () => unsafeCSS("#555555");

export const menuHighlight = () => unsafeCSS("#960d0d");
export const menuHighlightHover = () => unsafeCSS("#960d0d");

export const menuRowStyles = () => css`
  .cc-controls-row {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    height: 26px;
    width: 100%;
    border-top: 1px solid ${menuBorder1()};
  }

  .cc-controls-row:last-child {
    border-bottom: 1px solid ${menuBorder1()};
  }

  .cc-controls-row div {
    font-size: 12px;
    width: 100%;
    padding: 2px;
    background: ${menuBackground1()};
    border: 1px solid ${menuBorder1()};
    border-style: none solid none none;
    text-align: center;
    cursor: pointer;
  }

  .cc-controls-row > div:first-child {
    border-left: 1px solid ${menuBorder1()};
  }

  .cc-controls-row div:hover {
    background: ${menuBackground3()};
  }

  .cc-controls-row div.bg1 {
    background: ${menuBackground1()};
  }

  .cc-controls-row div.bg1:hover {
    background: ${menuBackground1Hover()};
  }

  .cc-controls-row div.bg2 {
    background: ${menuBackground2()};
  }

  .cc-controls-row div.bg2:hover {
    background: ${menuBackground2Hover()};
  }

  .cc-controls-row div.bg3 {
    background: ${menuBackground3()};
  }

  .cc-controls-row div.bg3.active {
    background: ${menuBackground3Hover()};
  }

  .cc-controls-row div.bg3:hover {
    background: ${menuBackground3Hover()};
  }

  .cc-controls-row div.highlight {
    background: ${menuHighlight()};
  }

  .cc-controls-row div.highlight:hover {
    background: ${menuHighlightHover()};
    animation: pulse 1s linear infinite alternate !important;
  }

  .cc-controls-row div.disabled {
    background: #9a9a9a;
    opacity: 0.5;
  }
`;

export const basicFlexStyles = () => css`
  .row {
    flex-direction: row;
    display: flex;
  }

  .col {
    flex-direction: column;
    display: flex;
  }

  .grow {
    flex-grow: 1;
  }

  .center {
    justify-content: center;
  }

  .center-cross-axis {
    align-items: center;
  }
`;

export const pulseStyle = () => css`
  .pulse:hover {
    animation: pulse 1s linear infinite alternate !important;
  }

  .pulse-on {
    animation: pulse 1s linear infinite alternate !important;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
    100% {
      opacity: 1;
    }
  }
`;

export const cursorTipStyle = () => css`
  .pointer {
    cursor: pointer;
  }

  .help {
    cursor: help;
  }

  .alias {
    cursor: alias;
  }
`;

export const toolTipStyle = () => css`
  .tooltip {
    position: fixed;
    z-index: 70;
    font-size: 12px;
    line-height: 12px;
    padding: 5px;
    background: ${menuBackground1()};
    color: ${menuForegroundLight()};
    border: 1px solid ${menuBorder1()};
    border-radius: 5px;
    font-family: sans-serif;
    box-sizing: border-box;
    transition: opacity 0.3s, visibility 0s;
    visibility: hidden;
    opacity: 0;
  }

  .tooltip-arrow {
    position: absolute;
    width: 7px;
    height: 7px;
    background: inherit;
    transform: rotate(45deg);
    border: 1px solid ${menuBorder1()};
  }
`;

export const helpRotationStyle = () => css`
  @keyframes help-rotation {
    0% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(25deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  .help-rotation {
    animation: help-rotation 1s infinite linear;
  }
`;

export const inputStyle = () => css`
  input {
    outline: none;
  }

  input:focus {
    outline: #435a62 solid 3px;
  }

  select {
    outline: none;
  }

  .input-slim:focus {
    background-color: #394144;
    outline: none;
  }
`;
