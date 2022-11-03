const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName = "";

// 받은 채팅 메세지 노출
function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.append(li);
}

// 송신한 채팅 메세지 노출
function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#nickname input");
    socket.emit("nickname", input.value);
}

// 채팅방 입장시 채팅방명 노출
function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const title = document.getElementById("title");
    title.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    const nicknameForm = room.querySelector("#nickname");
    msgForm.addEventListener("submit", handleMessageSubmit);
    nicknameForm.addEventListener("submit", handleNicknameSubmit);
}

// 채팅방 입장
function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", input.value, showRoom);
    roomName = input.value;
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user) => {
    addMessage(`${user} joined~`);
});

socket.on("bye", (user) => {
    addMessage(`${user} left..`);
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerText = "";
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    })
});
