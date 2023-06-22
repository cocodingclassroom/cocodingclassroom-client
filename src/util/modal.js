import { html, render } from 'lit-html';
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import "../assets/css/modal.css";

export const showModal = (content, onConfirm, afterOpen, showCancel = true) => {

  const oldModal = document.getElementById("single-modal");
  if (oldModal != null) {
    oldModal.parentNode.removeChild(oldModal);
  }

  // create the modal backdrop
  const backdrop = document.createElement('div');
  backdrop.id = "single-modal";
  backdrop.classList.add('modal-backdrop');
  document.body.appendChild(backdrop);
  backdrop.addEventListener("click",(event) => {
    if (event.target === backdrop) {
      document.body.removeChild(backdrop);
    }
  });

  // create the modal content
  const modalContent = html`
    <div class="modal-content">
      ${unsafeHTML(content)}
    </div>
  `;

  // create the close button
  const closeButton = html`
    <button class="modal-close-button modal-button" @click=${() => {
    document.body.removeChild(backdrop);
  }}>Close</button>
  `;

  // create the ok button
  const okButton = html`
    <button class="modal-ok-button modal-button" @click=${() => {
    onConfirm();
    document.body.removeChild(backdrop);
  }}>Ok</button>
  `;

  // render the modal HTML
  const modal = html`
    <div class="modal">
      ${modalContent}
      <div class="modal-button-row">
        ${showCancel ? closeButton : ""}
        ${okButton}
      </div>
    </div>
  `;

  render(modal, backdrop);
  afterOpen();
};
