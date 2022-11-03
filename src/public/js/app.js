const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName = "";

// 채팅 메세지 생성
function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.append(li);
}

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${ value }`);
    });
    input.value = "";
}

// 채팅방 입장시 채팅방명 노출
function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const title = document.getElementById("title");
    title.innerText = `Room ${roomName}`;
    const form = room.querySelector("form");
    form.addEventListener("submit", handleMessageSubmit);
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

socket.on("welcome", () => {
    addMessage("Someone joined~");
});

socket.on("bye", () => {
    addMessage("Someone left~");
});

socket.on("new_message", addMessage);
