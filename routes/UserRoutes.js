const express = require("express");
const router = express.Router();

const {auth} = require("../controllers/UserController")
router.post("/auth", auth);

module.exports = router