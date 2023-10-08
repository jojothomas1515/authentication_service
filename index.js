require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerConfig = require("./swagger_output.json");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/auth', authRoutes);
app.use(bodyParser.json());

// Sync the model with the database
const sequelize = require("./config/db");

sequelize.authenticate();


app.use(passport.initialize()); 
require('./middleware/authEmail')(passport); 
app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(swaggerConfig));

// Routes
require('./routes/userRoutes')(app);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
