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
const getRoomByHost = require("./services/getRoomByHost");
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origins: ["http://localhost:8080"],
    credentials: true,
  },
});
var roomsCollection=[];
let currentUsers = new Map();
let userRooms = new Map();
io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ token, email, roomId }) => {
    console.log("PPPPPPP")

    const existingRecord = await prisma.user_room.findMany({
      where: {
        user_id:email,
      },
    });
    let existingRooms = [];
    existingRooms = [];
    existingRooms = existingRecord.map((x)=>x.room_id)
    if (userRooms.has(email)) {
      let rooms = userRooms.get(email);
      if (!rooms.includes(roomId)) {
        userRooms.set(email, [...rooms, roomId]);
      }
    } else {
      userRooms.set(email, [...existingRooms]);
    }

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

  console.log(userRooms)
    socket.join(roomId);
    // socket.broadcast
    //   .to(roomId)
    //   .emit("message", formatMessage("Bot", `${email} has just joined`));
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
    console.log("msg:",msg,"::",roomId)
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

  if (userRooms.has(email)) {
    let rooms = userRooms.get(email);
    if (!rooms.includes(roomId)) {
      userRooms.set(email, [...rooms, roomId]);
    }
  } else {
    userRooms.set(email, [roomId]);
  }

  res.status(200).send({
    roomId,
    passKey,
  });
});

app.post("/join", async (req, res) => {
  const email = req.body.email;
  const roomId = req.body.roomId;
  const passkey = req.body.roomKey;

  const room = await getRoom(roomId);
  if(!room){
    res.status(400).send("Invalid Values");
    return;
  }
  if (room.passkey !== passkey) {
    res.status(400).send("AUTH FAILED");
    return;
  } 


  const data = await prisma.user_room.findFirst({
    where:{
      user_id:email,
      room_id: roomId
    }
  })
  if(data!=null){
  res.status(200).send("Joined");
    return;
  }
  await prisma.user_room.create({
    data: {
      user_id: email,
      room_id: roomId,
    },
  });
  if (userRooms.has(email)) {
    let rooms = userRooms.get(email);
    if (!rooms.includes(roomId)) {
      userRooms.set(email, [...rooms, roomId]);
    }
  } else {
    userRooms.set(email, [roomId]);
  }

  console.log(userRooms)

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

app.post("/getMessages", async (req,res)=>{
  const messages = await prisma.messages.findMany({
    where: {
      room_id: req.body.roomId,
    },
  });
  res.status(200).send(messages)
})

app.post("/getRooms", async (req,res)=>{
  try{
    const rooms = await getRoomByHost(req.body.email);
    res.status(200).send(rooms)
  }catch(error){
    res.status(400).send("Some error")
  }
})

app.post("/userRooms", async (req,res)=>{
  try{
    console.log(userRooms)
    const userId = req.body.userId;
    console.log(userRooms.get(userId))
    const rooms = [];
    // for (let [key, value] of userRooms) {
    //   console.log(userId)
    //   if (value === userId) {
    //     console.log("here")
    //     rooms.push(key);
    //   }
    // }
    res.status(200).send(userRooms.get(userId));
  }catch(error){
    console.log(error)
    res.status(400).send("Some Error")
  }
})

server.listen(3000, function () {
  console.log("Running on 3000");
});
