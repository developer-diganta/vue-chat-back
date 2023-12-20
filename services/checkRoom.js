const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const checkRoom = async (roomId) => {
  try {
    const room = await prisma.rooms.findMany({
      where: {
        name: roomId,
      },
    });
    if (room.length) {
      console.log(`Room with ID ${roomId} exists!`);
      return true;
    } else {
      console.log(`Room with ID ${roomId} does not exist.`);
      return false;
    }
  } catch (error) {
    console.error("Error checking room:", error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = checkRoom;
