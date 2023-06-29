import { UserService } from "../../services/user-service";
import { showModal } from "../../util/modal";

export const forceSplitView = () => {
  let value = UserService.get().localUser.leftSize;
  showModal(
    `
      <div style="display: flex; flex-direction: column; justify-content: space-evenly; height: 200px">
        <div>
          Set split screen
        </div>
        <div style="display: flex; flex-direction: row; justify-content: space-between; width: 90%; margin-top:30px;">
          <div>
            <div id="left-split-label">
              Teacher (50%)
            </div>
          </div>
          <div>
            <div id="right-split-label">
              Student (50%)
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
      const leftLabel = document.getElementById("left-split-label");
      const rightLabel = document.getElementById("right-split-label");
      slider.addEventListener("input", (e) => {
        let snap_value = e.target.value;
        if (e.target.value < 10) {
          snap_value = 0;
        }
        if (e.target.value > 45 && e.target.value < 55) {
          snap_value= 50;
        } 
        if (e.target.value > 90) {
          snap_value = 100;
        }

        slider.value = snap_value;

        leftLabel.innerText = `Teacher (${snap_value}%)`;
        rightLabel.innerText = `Student (${(100 - snap_value)}%)`;
        slider.style.backgroundSize = snap_value + '% 100%'
      });

      slider.addEventListener("change", (e) => {
        value = e.target.value;
      });
    },
    true
  );
};
