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
const server = http.createServer(app);

const io=socketio(server);
let roomsCollection=[];
io.on("connection",socket=>{
  socket.on("joinRoom",({username,room})=>{
    console.log(username);
    const user=userJoin(socket.id,username,room);
    console.log(user);
    socket.join(user.room);

    socket.emit("message",formatMessage("Bot","Welcome to chatter"));

    socket.broadcast.to(user.room).emit("message",formatMessage("Bot", `A ${user.username} has joined the chat!`));
    io.to(user.room).emit("roomUsers",{
      room:user.room,
      users: getRoomUsers(user.room)
    });

  });

  socket.on("chatMessage",(msg)=>{
    const user=getCurrentUser(socket.id);
  
    io.to(user.room).emit("message",formatMessage(user.username,msg));
  });

  
  socket.on("disconnect",()=>{
    const user=userLeave(socket.id);
    if(user){
      io.to(user.room).emit('message', formatMessage("Bot", `${user.username} has left the chat`));
      io.to(user.room).emit("roomUsers",{
        room:user.room,
        users: getRoomUsers(user.room)
      });
    }
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

     const resq= await prisma.rooms.create({
      data: {
        name:roomId,
        passkey:passKey
      },
    });
    console.log(resq)


  res.status(200).send({
    roomId,
    passKey
  })
})

server.listen(process.env.PORT || 3000,function(){
  console.log("Running on 3000")
});