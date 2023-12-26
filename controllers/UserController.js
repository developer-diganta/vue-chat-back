const { OAuth2Client } = require("google-auth-library");

const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();
const client = new OAuth2Client(
  "104054768589-ooepq3qbdiefotltottvkj8e723l64vd.apps.googleusercontent.com",
);

const auth = async (req, res) => {
  const { idToken } = req.body; // Assuming you're sending the ID token from the frontend

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience:
        "104054768589-ooepq3qbdiefotltottvkj8e723l64vd.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
    const userId = payload.sub;
    const userEmail = payload.email;
    const userName = payload.name;


    res
      .status(200)
      .json({ success: true, user: { userId, userEmail, userName } });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(400).json({ success: false, error: "Invalid token" });
  }
};

module.exports = {
  auth,
};


