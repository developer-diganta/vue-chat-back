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
    // Extract user details from the payload
    const userId = payload.sub;
    const userEmail = payload.email;
    const userName = payload.name;
    // console.log(payload)
    // Here, you can use the user details as needed (e.g., store in database, create a session, etc.)

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

// try{
//     const code = req.headers.authorization;
//     console.log('Authorization Code:', code);

//     const response = await axios.post(
//       'https://oauth2.googleapis.com/token',
//       {
//         code,
//         client_id: '587301-d27f8hofgi6i0.apps.googleusercontent.com',
//         client_secret: 'GOCSPX-u02eNWutQVi',
//         redirect_uri: 'postmessage',
//         grant_type: 'authorization_code'
//       }
//     );
//     const accessToken = response.data.access_token;
//     console.log('Access Token:', accessToken);

//     const userResponse = await axios.get(
//       'https://www.googleapis.com/oauth2/v3/userinfo',
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`
//         }
//       }
//     );
//     const userDetails = userResponse.data;
//     console.log('User Details:', userDetails);
//     const token = jwt.sign(
//         {
//           email:userDetails.email,
//           provider:'google'
//         },
//         process.env.SECRET_KEY,
//       );

//     res.status(200).json({ message: 'Authentication successful' });    }catch(error){

// }
