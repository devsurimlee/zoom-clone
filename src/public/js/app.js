const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName = "";

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.append(li);
}

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

function showRoom(newCount) {
    welcome.hidden = true;
    room.hidden = false;
    const title = document.getElementById("title");
    title.innerText = `Room ${roomName} (${newCount})`;
    const msgForm = room.querySelector("#msg");
    const nicknameForm = room.querySelector("#nickname");
    msgForm.addEventListener("submit", handleMessageSubmit);
    nicknameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", input.value, showRoom);
    roomName = input.value;
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
    const title = document.getElementById("title");
    title.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${user} joined~`);
});

socket.on("bye", (user, newCount) => {
    const title = document.getElementById("title");
    title.innerText = `Room ${roomName} (${newCount})`;
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
