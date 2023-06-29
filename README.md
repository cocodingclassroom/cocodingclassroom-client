# COCODING Classroom II
v 2.0.0  
Live-coding collaborative classroom environment.  
cc [teddavis.org](http://teddavis.org), christoph.voegele@fhnw.ch, marco.soldati@fhnw.ch, 2021 – 2023
*This project was funded through an [FHNW Lehrfonds](https://www.fhnw.ch/de/die-fhnw/strategische-entwicklungsschwerpunkte/hochschullehre-2025) grant.*

[cocodingclassroom.cc](https://cocodingclassroom.cc/)

-----

*Welcome to COCODING Classroom! Here's a rough guide to get you started.*

## SHORTCUTS 
### MacOS
- `CTRL + ENTER` » softCompile
- `CTRL + SHIFT + ENTER` » hardCompile
- `CTRL + E` » editor toggle
- `CTRL + M` » menu toggle
- `CTRL + T` » tidy code
- `CTRL + -` » decrease fontsize
- `CTRL + +` » increase fontsize

### Windows

## QUICK START
### SPLIT-SCREEN
`Teachers Code [:] Students Code`  

The teachers code is on the left (read only for students) and each student can use their own workspace on the right. Adjust the split-screen view by dragging the `|:|` bar. Moving to very right or left pauses collapsed sketch – ie. collapse teacher's view between inputs. User's split-screen position is visible on the left side userlist. Optionally the teacher can sync a view for all users.

### ROOMS
The left-side workspace (teacher) is read-only for students, with toggling write-access per user. Each student should move from the default landing *Sandbox* into a room of choice using the right side drop-down and rename it. Optionally these rooms can be locked (see `Settings`).

### USERLIST
On the left you'll always see all users in Classroom. Your name is always first, followed by peers names and `room number`. Click on this room number to jump into that room. If they request help, you'll see their name pulse at the top, clicking on their waving hand join their room to `Offer Help`.

On the right you'll see users currently in your workspace. 

Click on your own name to change nickname and color. 

### HELP
If students have a bug/issue/question, anyone can `Request Help` by clicking the `✋` icon on their username.

### CODING
By default live-coding (auto compile on keyup) is activated.    
Type `CTRL + ENTER` to force recompile everyone within given workspace. 

- <img class="svg" src="src/assets/resource/file-plus.svg" height="15px"> Start a new sketch. 
- <img class="svg" src="src/assets/resource/git-merge.svg" height="15px"> to see a *diff* between left and right codes. Auto merge snippets or copy and paste manually to update the right-side code.  
Click <img class="svg" src="src/assets/resource/check-circle.svg" height="15px"> to accept changes, or <img class="svg" src="src/assets/resource/minus-circle.svg" height="15px"> to cancel and close the popup.
- <img class="svg" src="src/assets/resource/code.svg" height="15px"> 'Sync Code' to apply teacher's code as template on all workspaces (*Teacher only*).
 
### CHAT
Each workspace has it's own chat. Use the left chat for messages to the entire group. Keep in mind chat is visible for anyone who visits workspace.      
- Click on the `chat...` to type a message.  
- Click *trash icon* to clear chat in own workspace.

### 

## MENU PANELS

### LEFT SIDE
#### TEACHER
- <img class="svg" src="src/assets/resource/file-plus.svg" height="15px"> New Sketch, reset to template.
- <img class="svg" src="src/assets/resource/code.svg" height="15px"> Sync Code, apply teacher code to all rooms.
- <img class="svg" src="src/assets/resource/save.svg" height="15px"> Export Code, save sketch for P5LIVE.
- <img class="svg" src="src/assets/resource/cast.svg" height="15px"> Broadcast mouse/keyboard, syncs with all users.
- <img class="svg" src="src/assets/resource/git-merge.svg" height="15px"> Compare Code, merge code from teacher to student room.
- <img class="svg" src="src/assets/resource/layers.svg" height="15px"> Add Room, for additional rooms.
- <img class="svg" src="src/assets/resource/users.svg" height="15px"> Walk Classroom, auto jumps between users to follow process.
- <img class="svg" src="src/assets/resource/message-square.svg" height="15px"> Broadcast Message, announcement popup to all users.
- <img class="svg" src="src/assets/resource/layout.svg" height="15px"> Sync Split-Screen, sets the ratio for all users.

#### STUDENT
- <img class="svg" src="src/assets/resource/save.svg" height="15px"> Export Code, save sketch for P5LIVE.
- <img class="svg" src="src/assets/resource/git-merge.svg" height="15px"> Compare Code, merge code from teacher to student room.

### RIGHT SIDE
#### TEACHER
- <img class="svg" src="src/assets/resource/file-plus.svg" height="15px"> New Sketch, reset to template.
- <img class="svg" src="src/assets/resource/save.svg" height="15px"> Export Code, save sketch for P5LIVE.
- <img class="svg" src="src/assets/resource/cast.svg" height="15px"> Broadcast mouse/keyboard, syncs with all users.

#### STUDENT
- <img class="svg" src="src/assets/resource/file-plus.svg" height="15px"> New Sketch, reset to template.
- <img class="svg" src="src/assets/resource/save.svg" height="15px"> Export Code, save sketch for P5LIVE.


## SETTINGS PANEL
### TEACHER
- Mode, `edit` / `gallery`, switch classroom between modes.
- [x] Live Coding __sec, auto-compile on keyup.
- [x] Line Numbers, next to each line of code.
- [ ] Room Locks, allow users to lock their room from edits.
- Walk Delay, set speed to of switching during Walk Classroom.
- Font Size, set size of code editor.

### STUDENT
- Font Size, set size of code editor.


## MODES
COCODING Classroom has two modes, which the teacher can switch between in `Settings`:

- `edit` for learning and coding.
- `gallery` for show + tell of sketches.

### EDIT
This is the default mode that is selected when creating a COCODING Classroom. In this mode, all rooms are editable for learning and collaboration.

### GALLERY
In gallery mode, the Split-Screen is replaced by a single synchronized view, which the Teacher controls from a drop-down list of rooms. The *Sandbox* room acts as a landing page to start the *show + tell*. There's a unique gallery chat per room to facilitate critiques. Changes to any sketch are only modified locally (not synced with the server), so students are encouraged to tweak each sketch and learn how it works by remixing any line of code.

You can manually switch between the rooms during a critique, or activate `Walk Classroom` with a custom delay within the settings, for use in an automated exhibition setting.

### DISCLAIMER
COCODING Classroom is in its first beta stage form, this means, consider your code volatile and export/save sketches often. Rooms are kept active for 1 week after their last access, at which point they're purged for privacy and memory purposes. Currently, there is no persistance layer (storage) active for the server-websocket, so it is possible an update to the server could interrupt your work, but in-app announcements will try to warn of planned updates. COCODING Classroom is released "as-is" - without any warranty, responsibility or liability. 

## Development
You are very welcome to contribute to Cocoding classroom II. Please check the [developers pages](./docs/develop.md) for further information 
