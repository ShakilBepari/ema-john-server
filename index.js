const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const { initializeApp } = require("firebase-admin/app");
var admin = require("firebase-admin");
const env = require("dotenv").config();
app.use(bodyParser.json());
app.use(cors());

const port = 4000;
const { MongoClient } = require("mongodb");


var serviceAccount = require("./configs/burj-al-arab-17f0d-firebase-adminsdk-82jhf-b9c3b8866a.json");
const { auth } = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4fukdfd.mongodb.net/?retryWrites=true&w=majority`;
  
const client = new MongoClient(uri);

async function run() {
  try {
    const database = client.db(`${process.env.DB_NAME}`);
    const bookingCollection = database.collection(`${process.env.DB_COLLECTION}`);

    app.post("/addbooking", (req, res) => {
      bookingCollection.insertOne(req.body).then((result) => {
        console.log(result);
        res.send(result.acknowledged);
      });
    });

    app.get("/bookings", (req, res) => {
      const bearer = req.headers.authorization;
      if (bearer && bearer.startsWith("Bearer ")) {
        const newToken = req.headers.authorization.split(" ")[1];
        auth()
          .verifyIdToken(newToken)
          .then((decodedToken) => {
            const userEmail = decodedToken.email;
            if (req.query.email == userEmail) {
              bookingCollection
                .find({ email: req.query.email })
                .toArray((err, result) => result)
                .then((result) => res.send(result));
            }else{
              res.status(401).send('un authorized');
            }
          })
          .catch((error) => {
            res.status(401).send('un authorized');
          });
      }else{
        res.status(401).send('un authorized');
      }
    });

    console.log("database connected");
  } catch (err) {
    console.log(err.stack);
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("Server is running......");
});
