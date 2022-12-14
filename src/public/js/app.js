const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const roomList = document.getElementById("roomList");
const msgList = document.getElementById("msgList");
const msgForm = msgList.querySelector("form");


call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myNickname = "Anonymous";
let myPeerConnection;
let myDataChannel;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];

        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label == camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: {facingMode: "user"}
    };

    const cameraConstrains = {
        audio: true,
        video: {deviceId: {exact: deviceId}}
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}

// getMedia();  //주석

function handleMuteClick() {
    myStream.getAudioTracks()
        .forEach(track => track.enabled = !track.enabled);

    if (!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
};

function handleCameraClick() {
    myStream.getVideoTracks()
        .forEach(track => track.enabled = !track.enabled);
    if (!cameraOff) {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    } else {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }
};

async function handleCameraChange() {
    await getMedia(camerasSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);


// Chane Nickname
const nickname = document.getElementById("nickname");
const nicknameForm = nickname.querySelector("form");

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    myNickname = input.value;
    socket.emit("nickname", input.value);
}

nicknameForm.addEventListener("submit", handleNicknameSubmit);


// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
    welcome.hidden = true;
    roomList.hidden = true;
    call.hidden = false;
    // await getMedia();  //주석
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

socket.on("room_change", (rooms) => {
    handleRoomList(rooms);
});

function handleRoomList(rooms) {
    const ul = roomList.querySelector("ul");
    ul.innerText = "";
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        ul.append(li);
    });
    if (rooms.length === 0) {
        const li = document.createElement("li");
        li.innerText = "It's quiet for new.. You can make new Room!";
        ul.append(li);
    }
};

function addMessage(message) {
    const ul = msgList.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.append(li);
}

// message
function handleMsgSubmit() {
    event.preventDefault();
    const input = msgForm.querySelector("input");
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", console.log);
    addMessage(`You: ${input.value}`);
    const value = input.value;
    myDataChannel.addEventListener("open", (event) => {
        myDataChannel.send(`${myNickname}: ${value}`);
    });

    input.value = "";
}

msgList.addEventListener("submit", handleMsgSubmit);

// Socket Code
socket.on("show_all_rooms", (rooms) => {
    handleRoomList(rooms);
});

socket.on("welcome", async (user) => {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", console.log);
    console.log("made data channel");
    addMessage(`${user} joined~`);

    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer.");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event) => {
            addMessage(event.data);
        });
    });

    console.log("received the offer.");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer.");
});

socket.on("answer", (answer) => {
    console.log("received the answer.");
    myPeerConnection.setRemoteDescription(answer);
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event) => {
            addMessage(event.data);
        });
    });

});

socket.on("ice", ice => {
    console.log("received candidate.");
    myPeerConnection.addIceCandidate(ice);
});

//RTC code
function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ]
            }
        ]
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("track", handlePeersStream);

    // 주석
    // myStream.getTracks()
    //     .forEach(track => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
    console.log("sent candidate.");
    socket.emit("ice", data.candidate, roomName);
}

function handlePeersStream(data) {
    const peerFace = document.getElementById("peerFace");
    console.log("got an stream from my peer!");
    peerFace.srcObject = data.streams[0];
}
