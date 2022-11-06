const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");

let myStream;
let muted = false;
let cameraOff = false;
const camerasSelect = document.getElementById("cameras");

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

async function getMedia() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        myFace.srcObject = myStream;
        await getCameras();
    } catch (e) {
        console.log(e);
        alert(e);
    }
}

getMedia();

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
    myStream.getAudioTracks()
        .getVideoTracks().forEach(track => track.enabled = !track.enabled);
    if (!cameraOff) {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    } else {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }
};

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
