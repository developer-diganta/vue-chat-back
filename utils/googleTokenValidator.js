const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  "104054768589-ooepq3qbdiefotltottvkj8e723l64vd.apps.googleusercontent.com",
);

const googleTokenVerify = async (idToken, email) => {
  try{
    const ticket = await client.verifyIdToken({
      idToken,
      audience:
        "104054768589-ooepq3qbdiefotltottvkj8e723l64vd.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();
    if (payload.email === email) {
      return true;
    } else {
      return false;
    }
  }catch(error){
    return false;
  }

};

module.exports = googleTokenVerify;
