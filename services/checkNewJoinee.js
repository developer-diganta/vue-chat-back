const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const checkNewJoinee = async (userId, roomId) => {
  try {
    // Check if the combination of userId and roomId exists in user_room table
    const existingRecord = await prisma.user_room.findFirst({
      where: {
        AND: [{ user_id: userId }, { room_id: roomId }],
      },
    });
    return !!existingRecord; // Returns true if the combination exists, false otherwise
  } catch (error) {
    console.error("Error checking combination in user_room table:", error);
    return false; // Return false in case of any error
  }
};

module.exports = checkNewJoinee;
