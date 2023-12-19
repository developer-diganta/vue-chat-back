const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const addMessage = async (email,name,roomId,message) => {
    await prisma.messages.create({
        data:{
            user_id:email,
            name:name,
            room_id: roomId,
            message
        }
    });
}

module.exports = addMessage;