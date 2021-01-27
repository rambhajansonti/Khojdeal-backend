const session = require("express-session");
const bcrypt = require("bcrypt");
const session_secret = "Khojdeal";
const cors = require("cors");
const SALT = 10;
//Express is a minimal and flexible Node. js web application framework that provides a robust set of
//features for web and mobile applications.
const express = require("express");
const app = express();
//midlleware for parsing body
//CORS is shorthand for Cross-Origin Resource Sharing. It is a mechanism to allow or restrict
//requested resources on a web server depend on where the HTTP request was initiated.
app.use(
   cors({
      credentials: true,
      origin: "http://localhost:3000",
   })
);

//add a property session to req //internally handle al encrption/ decrption
app.use(
   session({
      secret: session_secret,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
   })
);
app.use(express.json());
//Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It manages relationships
// between data, provides schema validation, and is used to translate between objects in code and the
// representation of those objects in MongoDB.
const mongoose = require("mongoose");
const port = 9999;
//connection
const conn_url = "mongodb://localhost:27017/Khojdeal";
const db = mongoose.createConnection(conn_url, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
});

//database schema
const empSchema = new mongoose.Schema({
   EMPID: String,
   EMPNAME: String,
   DOJ: String,
   MOBILENO: String,
   STATUS: String,
   STATE: String,
   CITY: String,
   ADDEDON: String,
   UPDATEDON: String,
   USERSTATUS: String,
   REASON: String,
   SOURCE: String,
});
const userSchema = new mongoose.Schema({
   name: String,
   email: String,
   password: String,
});
//model for employee
const employee = db.model("employee", empSchema);
const user = db.model("User", userSchema);

const isNullOrUndefined = (value) => {
   return value === undefined || value === null;
};
//save data of employee into data
app.post("/saveData", async (req, res) => {
   const { obj } = req.body;
   const newemployee = new employee(obj);
   await newemployee.save();
   res.send("employee saved!");
});
app.get("/allUser", async (req, res) => {
   // const alluser = await employee.find().count({ USERSTATUS: "updated" });
   const allDistinctDate = await employee
      .find()
      .distinct("DOJ")
      .then(async (allDistinctDate) => {
         console.log("date:", allDistinctDate);
         let abc = await allDistinctDate
            .map(async (val) => {
               return await employee
                  .find({
                     DOJ: allDistinctDate[0],
                     STATUS: "active",
                     USERSTATUS: "added",
                  })
                  .count();
            })
            .then((r) => {
               return r;
            });
         // return await abc;
      })
      .then((r) => {
         console.log("final res:", r);
      });

   // console.log(res1);

   // res.send({ data: res1 });
   res.send("ok");
});
app.post("/login", async (req, res) => {
   const { email, password } = req.body;
   const existingUser = await user.findOne({ email });
   if (isNullOrUndefined(existingUser)) {
      res.status(401).send({ err: `username/password don't match` });
   } else {
      const hashedPwd = existingUser.password;
      if (bcrypt.compareSync(password, hashedPwd)) {
         req.session.userId = existingUser._id;
         res.status(200).send({
            success: `log in `,
         });
      } else {
         res.status(401).send({
            err: `username/password don't match`,
         });
      }
   }
});
app.post("/signup", async (req, res) => {
   const { name, email, password } = req.body;
   // console.log(name, email, password);
   const existingUser = await user.findOne({ email });
   if (!isNullOrUndefined(existingUser)) {
      res.status(401).send("username already exist");
   } else {
      const hashPwd = bcrypt.hashSync(password, SALT);
      const newUser = new user({
         name,
         email,
         password: hashPwd,
      });
      await newUser.save();
      req.session.userId = newUser._id;
      res.status(201).send({
         success: `sign up`,
      });
   }
});
app.get("/logout", async (req, res) => {
   if (!isNullOrUndefined(req.session)) {
      req.session.destroy(() => {
         res.sendStatus(200);
      });
   } else {
      res.sendStatus(200);
   }
});
const AuthMiddleware = async (req, res, next) => {
   if (
      isNullOrUndefined(req.session) ||
      isNullOrUndefined(req.session.userId)
   ) {
      res.status(401).send({ err: "not logged in" });
   } else {
      next();
   }
};
app.get("/userinfo", AuthMiddleware, async (req, res) => {
   // console.log("id:", req.session.userId);
   // const user = await user.findById(req.session.userId);
   if (req.session.userId) res.send();
   else res.status(401).send();
});
app.listen(port, () => {
   console.log(`App is listening on port ${port}.....`);
});
