import { showModal } from "../../util/modal";

export const showBroadcastViewModal = (message) => {
  showModal(`
<p>Broadcast message from teacher:</p>
<h3>
    ${message}
  </h3>`,
    () => {
    }, () => {
    },
    false);
};
