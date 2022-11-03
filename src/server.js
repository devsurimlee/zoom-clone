import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

function publicRooms() {
    // ver1
    // const sids = wsServer.sockets.adapter.sids;
    // const rooms = wsServer.sockets.adapter.rooms;

    //ver 2
    // const { sids, rooms } = wsServer.socket.adapter;

    const {
        sockets: {
            adapter: {sids, rooms},
        },
    } = wsServer;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

wsServer.on("connection", socket => {
    socket["nickname"] = "anonymous";
    socket.onAny((event) => {
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event: ${event}`);
    });
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome", socket.nickname);
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname));
    });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("new_message", (message, roomName, done) => {
        socket.to(roomName).emit("new_message", `${socket.nickname}: ${message}`);
        done();
    });
    socket.on("nickname", nickname => socket["nickname"] = nickname);
});

httpServer.listen(3000, handleListen);

