import { css, unsafeCSS } from "lit";

export const white = () => unsafeCSS("#f5f5f5");
export const black = () => unsafeCSS("#1f1f1f");
export const secondary = () => unsafeCSS("#aaaaaa");

export const menuRowStyles = () => css`
  .cc-controls-row {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    height: 26px;
    border-bottom: 1px solid #aaa;
    width: 100%;
  }

  .cc-controls-row div {
    width: 90%;
    padding: 2px;
    background: #444;
    border: 1px solid #aaa;
    border-top: none;
    text-align: center;
    cursor: pointer;
  }

  .cc-controls-row div:hover {
    background: #555;
  }

  .cc-controls-row-container {
    border-top: 1px solid #aaa;
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
    z-index: 9999;
    font-size: 12px;
    line-height: 12px;
    padding: 5px;
    background: #222;
    color: ${white()};
    border: 1px solid ${secondary()};
    border-radius: 5px;
    font-family: sans-serif;
    box-sizing: border-box;
    /*box-shadow: -1px 2px 5px rgba(0, 0, 0, 0.2);*/
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
    border: 1px solid ${secondary()};
  }
`;
