const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();
const app = express();
const userRouter = require("./routers/usersRouter.js");
const emailReadReceiptRouter = require("./routers/emailReadReceiptRouter.js");
const viewingRouter = require("./routers/viewingRouter.js");
const paymentRouter = require("./routers/paymentRouter.js");
const PORT = process.env.PORT || 9000;
const publicPath = path.join(__dirname, "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

app.use(userRouter);
app.use(emailReadReceiptRouter);
app.use(viewingRouter);
app.use(paymentRouter);

app.listen(PORT, () => console.log(`Server program is running on port ${PORT}`));


/* 
(Every time)
./mongodb/bin/mongod --dbpath "./mongodb-data-1" --logpath "./mongodb-data-1/mongo.log" --port 7000 --replSet myReplicaSet --fork

./mongodb/bin/mongod --dbpath "./mongodb-data-2" --logpath "./mongodb-data-2/mongo.log" --port 8000 --replSet myReplicaSet --fork

(Only first time)
mongosh --port 7000

rs.initiate();
rs.add("localhost:8000");


*/
// const Cryptr = require("cryptr");
// const encryptionObject = new Cryptr(process.env.BCRYPT_SALT);
// const a = encryptionObject.encrypt("67448ace5f8b6a0b927254a2");
// console.log(a.length);

// const b = encryptionObject.decrypt(a);
// console.log(b);
