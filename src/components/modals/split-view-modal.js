import { UserService } from "../../services/user-service";
import { showModal } from "../../util/modal";

export const forceSplitView = () => {
  let value = UserService.get().localUser.leftSize;
  showModal(
    `
      <div style="display: flex; flex-direction: column; justify-content: space-evenly; height: 150px">
        <div>
          Force Split View of Students
        </div>
        <div style="display: flex; flex-direction: row; justify-content: space-between; width: 90%">
          <div>
            <div>
              Left
            </div>
            <div>
              50%
            </div>
          </div>
          <div>
            <div>
              Right
            </div>
            <div>
              50%
            </div>
          </div>
      </div>
       <input id="slider" type="range" min="0" max="100" value="50" class="slider">
      </div>`,
    () => {
      UserService.get().otherUsers.forEach((otherUser) => {
        otherUser.leftSize = value;
      });
    },
    () => {
      let slider = document.getElementById("slider");
      slider.addEventListener("change", (e) => {
        value = e.target.value;
      });
    },
    true
  );
};
