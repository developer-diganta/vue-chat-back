const PrismaClient = require("@prisma/client").PrismaClient;

const express = require("express");
const UserRoutes = require("./routes/UserRoutes");
const prisma = new PrismaClient();
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const http = require("http");
const socketio = require("socket.io");
const googleTokenVerify = require("./utils/googleTokenValidator");
const formatMessage = require("./utils/formatMessage");
const getRooms = require("./services/getRooms");
const checkRoom = require("./services/checkRoom");
const checkNewJoinee = require("./services/checkNewJoinee");
const addMessage = require("./services/addMessage");
const getRoom = require("./services/getRoom");
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origins: ["http://localhost:8080"],
    credentials: true,
  },
});
let currentUsers = new Map();
io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ token, email, roomId }) => {
    currentUsers.set(socket.id, { email, roomId });
    if (!checkRoom(roomId)) {
      socket.emit("invalidRoom", "Invalid Room");
    }
    const validateTokenResult = await googleTokenVerify(token, email);
    if (!validateTokenResult) {
      socket.emit("expired", "Expired Token");
      return;
    }

    if (!(await checkNewJoinee(email, roomId))) {
      socket.emit("falseJoin", "User doesnot exist");
      return;
    }

    socket.join(roomId);
    socket.broadcast
      .to(roomId)
      .emit("message", formatMessage("Bot", `${email} has just joined`));
    const currentList = [];
    currentUsers.forEach((value, key) => {
      if (value.roomId === roomId) {
        currentList.push({ name: value.email });
      }
    });
    io.to(roomId).emit("newJoin", currentList);
  });

  socket.on("message", async ({ name, email, msg, roomId }) => {
    await addMessage(email, name, roomId, msg);
    io.to(roomId).emit("message", formatMessage(name, msg));
  });

  socket.on("disconnect", () => {
    const user = currentUsers.get(socket.id);
    currentUsers.delete(socket.id);
    const currentList = [];
    currentUsers.forEach((value, key) => {
      if (value.roomId === user.roomId) {
        currentList.push({ name: value.email });
      }
    });
    io.to(user.roomId).emit(
      "message",
      formatMessage("Bot", `${user.email} has left the chat`),
    );
    io.to(user.roomId).emit("newJoin", currentList);
  });
});

app.use("/", UserRoutes);
function generateRandomString() {
  const timestamp = new Date().getTime().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);

  const randomString = `${timestamp}${randomPart}`;
  return randomString;
}

function generateRandomInt() {
  const timestamp = new Date().getTime();
  const randomPart = Math.floor(Math.random() * 1000000);

  const randomInt = parseInt(`${timestamp}${randomPart}`);
  return randomInt;
}

app.post("/createroom", async (req, res) => {
  const idToken = req.body.credential;
  const email = req.body.email;
  if (!googleTokenVerify(idToken, email)) {
    res.status(400).send("Authentication Failed");
    return;
  }
  const roomId = generateRandomString();
  const passKey = generateRandomString();

  if (roomsCollection.includes({ roomId, passKey })) {
    res.status(400).send("Room ID already exists");
    return;
  }

  await prisma.rooms.create({
    data: {
      name: roomId,
      passkey: passKey,
      host: email,
    },
  });

  await prisma.user_room.create({
    data: {
      user_id: email,
      room_id: roomId,
    },
  });

  res.status(200).send({
    roomId,
    passKey,
  });
});

app.post("/join", async (req, res) => {
  const email = req.body.email;
  const roomId = req.body.roomId;
  const passkey = req.body.passKey;

  const room = await getRoom(roomId);
  if (room.passkey !== passkey) {
    res.status(400).send("AUTH FAILED");
    return;
  }

  await prisma.user_room.create({
    data: {
      user_id: email,
      room_id: roomId,
    },
  });
  res.status(200).send("Joined");
});

app.post("/getkey", async (req, res) => {
  const email = req.body.email;
  const roomId = req.body.roomId;

  const room = await getRoom(roomId);
  res.status(200).send(room.passkey);
  return;
  res.status(400).send("Invalid");
});

server.listen(3000, function () {
  console.log("Running on 3000");
});
