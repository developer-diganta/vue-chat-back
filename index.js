const PrismaClient = require('@prisma/client').PrismaClient

const express = require('express')
const UserRoutes = require("./routes/UserRoutes")
const prisma = new PrismaClient()
const cors = require("cors")
const app = express();
app.use(cors())
app.use(express.json())
const http = require("http");
const socketio=require("socket.io");
const googleTokenVerify = require('./utils/googleTokenValidator')
const formatMessage = require('./utils/formatMessage')
const getRooms = require('./services/getRooms')
const checkRoom = require('./services/checkRoom')
const checkNewJoinee = require("./services/checkNewJoinee")
const addMessage = require('./services/addMessage')
const server = http.createServer(app);

const io = require("socket.io")(server, {
	cors: {
		origins: [

			"http://localhost:8080"
		],
    credentials: true
	},
});
let roomsCollection=[];
io.on("connection",socket=>{
  socket.on("joinRoom",async ({token, email, roomId})=>{
    //  const rooms = getRooms();
    console.log(roomId)
     if(!checkRoom(roomId)){
      socket.emit("invalidRoom","Invalid Room")
     }
    const validateTokenResult = await googleTokenVerify(token,email);
    if(!validateTokenResult)
      {
        socket.emit("expired","Expired Token")
      }
    else{
      socket.emit("message",formatMessage("Bot","HELLO"));
    }
    console.log("PPPP")
    if(!await checkNewJoinee(email,roomId)){
      socket.emit("falseJoin","User doesnot exist")
      console.log("HERE")
      return;
    }

    socket.join(roomId);

    socket.broadcast.to(roomId).emit("message",formatMessage("Bot",`${email} has just joined`))

  });

  socket.on("message",async ({name,email,msg, roomId})=>{
    // const user=getCurrentUser(socket.id);
    console.log(roomId)
    await addMessage(email, name,roomId,msg)
    io.to(roomId).emit("message",formatMessage(name,msg));

  });

  
  socket.on("disconnect",()=>{
    // const user=userLeave(socket.id);
    // if(user){
    //   io.to(user.room).emit('message', formatMessage("Bot", `${user.username} has left the chat`));
    //   io.to(user.room).emit("roomUsers",{
    //     room:user.room,
    //     users: getRoomUsers(user.room)
    //   });
    // }
  });

})

app.use("/",UserRoutes)
function generateRandomString() {
  const timestamp = new Date().getTime().toString(36); // Convert timestamp to base36 string
  const randomPart = Math.random().toString(36).substring(2, 8); // Random string part

  const randomString = `${timestamp}${randomPart}`; // Concatenate timestamp and random string
  return randomString;
}

function generateRandomInt() {
  const timestamp = new Date().getTime(); // Get current timestamp
  const randomPart = Math.floor(Math.random() * 1000000); // Generate random integer

  const randomInt = parseInt(`${timestamp}${randomPart}`); // Concatenate timestamp and random integer
  return randomInt;
}

app.post("/createroom",async (req,res)=>{
  const idToken = req.body.credential;
  const email = req.body.email;
  if(!googleTokenVerify(idToken,email)){
    res.status(400).send("Authentication Failed")
    return;
  }
  const roomId = generateRandomString();
  const passKey = generateRandomString();

  if(roomsCollection.includes({roomId,passKey})){
    res.status(400).send("Room ID already exists")
    return;
  }

    await prisma.rooms.create({
      data: {
        name:roomId,
        passkey:passKey,
        host: email
      },
    });

  res.status(200).send({
    roomId,
    passKey
  })
})


app.post("/join", async (req,res)=>{

  const email = req.body.email;
  const roomId = req.body.roomId;

  await prisma.user_room.create({
    data: {
      user_id:email,
      room_id:roomId,
    },
  });
  res.status(200).send("Joined")
})

server.listen(3000,function(){
  console.log("Running on 3000")
});

