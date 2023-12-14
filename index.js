const PrismaClient = require('@prisma/client').PrismaClient

const express = require('express')
const UserRoutes = require("./routes/UserRoutes")
const prisma = new PrismaClient()
const cors = require("cors")
const app = express();
app.use(cors())
app.use(express.json())

app.use("/",UserRoutes)
app.listen(3000, () =>
  console.log('REST API server ready at: http://localhost:3000'),
)
