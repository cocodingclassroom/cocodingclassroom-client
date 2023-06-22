import { showModal } from "../../util/modal";
import {
  Notification,
  NotificationType,
  NotifyService,
} from "../../services/notify-service";
import { UserService } from "../../services/user-service";

export const showBroadcastViewModal = (message) => {
  showModal(
    `
<p>Broadcast message from teacher:</p>
<h3>
    ${message}
  </h3>`,
    () => {},
    () => {},
    false
  );
};

export const sendBroadCastMessage = () => {
  showModal(
    `
    <div>
     Send message to all rooms?
    </div>
    <div>
     <input id="to-all-message" type="text" placeholder="Send message to all ...">
    </div>
    `,
    () => {
      let messageContent = document.getElementById("to-all-message");
      if (messageContent.value.length === 0) return;
      let notification = new Notification(
        NotificationType.BROADCAST,
        UserService.get().localUser,
        messageContent.value
      );
      NotifyService.get().notify(notification);
    },
    () => {
      let messageContent = document.getElementById("to-all-message");
      messageContent.focus();
    }
  );
};