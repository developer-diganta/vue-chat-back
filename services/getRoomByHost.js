const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getRoomByHost = async (email) => {
    const rooms = await prisma.rooms.findMany({
        where:{
            host:email
        }
    })
    return rooms;
}

module.exports = getRoomByHost