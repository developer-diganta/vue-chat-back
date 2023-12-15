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

app.post("/createroom",async (req,res)=>{
  const idToken = req.body.credential;
  const email = req.body.email;
  if(!googleTokenVerify(idToken,email)){
    res.status(400).send("Authentication Failed")
    return;
  }
  const roomId = req.body.roomId;
  const passKey = req.body.passKey;
  if(roomsCollection.includes({roomId,passKey})){
    res.status(400).send("Room ID already exists")
    return;
  }

  roomsCollection.push({roomId,passKey});
      await prisma.room.create({
      data: {
        roomId,
        passKey,
      },
    });

  res.status(200).send("Room ID registered")
})

server.listen(process.env.PORT || 3000,function(){
  console.log("Running on 3000")
});