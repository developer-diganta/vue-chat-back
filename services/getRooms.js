const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getRooms = async () => {
  try {
    const rooms = await prisma.rooms.findMany();
    console.log(rooms);
    
    return rooms;
  } catch (error) {
    console.error('Error retrieving rooms:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = getRooms