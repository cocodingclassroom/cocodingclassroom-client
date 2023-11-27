import { showModal } from '../util/modal'

export const UserColorRenameModal = (user) => {
    showModal(
        `
  <div id="cc-user-setting" class="row">
    <div class="col">
    <label for="color">Color</label>
    <input id="user-color-input" type="color" class="cc-user-setting-color" name="usercolor" value="${user.color}">
    </div>
    <div class="col grow" style="margin-left: 50px;">
    <label for="nick">Nickname</label>
    <input id="cocodingnick" class="cc-user-rename" name="nick" type="text" value="${user.name.replace(/["']/g, '')}">
    </div>
  </div>
  `,
        () => {
            let nameInput = document.getElementById('cocodingnick')
            let newName = nameInput.value
            let colorInput = document.getElementById('user-color-input')
            let newColor = colorInput.value

            user.color = newColor
            user.name = newName
        },
        () => {
            let nameInput = document.getElementById('cocodingnick')
            nameInput.select()
        }
    )
}
