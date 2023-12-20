const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getRoom = async (roomId) => {
  try {
    const room = await prisma.rooms.findFirst({
      where: {
        name: roomId,
      },
    });
    return room;
  } catch (error) {
    console.error("Error fetching room:", error);
    return null; // or handle the error accordingly
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = getRoom;
