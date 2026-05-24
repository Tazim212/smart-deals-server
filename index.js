const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
// const admin = require("firebase-admin");
const jwt = require("jsonwebtoken")
const port = process.env.PORT || 5000


// const serviceAccount = require("./smart-deals-firebase-adminsdk.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });


app.use(cors())
app.use(express.json())

// const verifyUserToken = async (req, res, next) => {
//     if (!req.headers.authorization) {
//         return res.status(401).send({ message: "unauthorized access" })
//     }
//     const token = req.headers.authorization.split(" ")[1]
//     if (!token) {
//         return res.status(401).send({ message: "unathorized access" })
//     }

//     try {
//         const userInfo = await admin.auth().verifyIdToken(token)
//         req.token_email = userInfo.email
//         // console.log("user info:", userInfo)
//         next()
//     }
//     catch {
//         console.log("invalid user")
//         return res.status(401).send({ message: "unathorized access" })
//     }
// }

const verifyJwtToken =(req, res, next) =>{
    const authorization = req.headers.authorization
    // console.log(authorization)
    if(!authorization){
        return res.status(403).send({message: "unauthorized access"})
    }
    const token = authorization.split(' ')[1]
    if(!token){
        return res.status(403).send({message: 'unauthorized access'})
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) =>{
        if(err){
            return res.status(401).send({message: "forbidden access"})
        }
        req.token_email = decoded.email
        next()
    })
}

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-eqifd2k-shard-00-00.tbmejyb.mongodb.net:27017,ac-eqifd2k-shard-00-01.tbmejyb.mongodb.net:27017,ac-eqifd2k-shard-00-02.tbmejyb.mongodb.net:27017/?ssl=true&replicaSet=atlas-bvjx8p-shard-0&authSource=admin&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get("/", (req, res) => {
    res.send("Server is choltase")
})

async function run() {
    try {
        await client.connect();

        const db = client.db("ProductDB")
        const productCollection = db.collection("productCollection")
        const userCellection = db.collection('userCollection')
        const bidCollection = db.collection("bidCollection")
        const newProductsColl = db.collection("newProducts")

        app.post("/getToken", (req, res) =>{
            const loggedUser = req.body;
            const token = jwt.sign(loggedUser, process.env.JWT_SECRET,{expiresIn: "1h"})
            res.send({token: token})
        })


        // ------------------  this is product api ------------------
        app.get("/recentproduct", async (req, res) => {
            // const projects = {title: 1, price_max: 1}
            // const query = productCollection.find().sort({ price_max: -1 }).limit(3).skip(2).project(projects)
            const query = productCollection.find().sort({ created_at: -1 }).limit(6)
            // const email = req.query.email
            // const cursor = {}
            // if(email){
            //     cursor.email = email
            // }
            // const proCollection = productCollection.find(query)
            const result = await query.toArray()
            res.send(result)
        })

        app.get("/allproducts", async (req, res) => {
            //     const search = req.query.search || ""
            //     const query = {
            //     title: {
            //         $regex: search,
            //         // $options: "i"
            //     }
            // }
            const result = await productCollection.find().toArray();
            res.send(result)
        })

        app.get("/productdetails/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: id }
            const result = await productCollection.findOne(query)
            res.send(result)
        })
        app.get("/myproducts", verifyJwtToken, async (req, res) => {
            const email = req.query.email;
            const query = {}
            if (email) {
                query.seller_email = email
            }
            if (email !== req.token_email) {
                return res.status(403).send({ message: "forbidden access" })
            }
            const cursor = newProductsColl.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post("/product", async (req, res) => {
            const product = req.body;
            const result = await newProductsColl.insertOne(product)
            res.send(result)
        })

        app.patch("/product/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const cursor = req.body
            const update = {
                $set: {
                    name: cursor.name,
                    price: cursor.price
                }
            }
            const result = await productCollection.updateOne(query, update)
            res.send(result)
        })

        app.delete("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productCollection.deleteOne(query)
            res.send(result)
        })

        app.delete("/myproducts/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await newProductsColl.deleteOne(query)
            res.send(result)
        })

        // ------------------- User API ---------------

        app.post("/user", async (req, res) => {
            const user = req.body
            const query = { email: user.email, name: user.name }
            const existingUser = await userCellection.findOne(query)
            if (existingUser) {
                return res.send({
                    message: "user already exist"
                }
                )
            }
            const result = await userCellection.insertOne(query)
            res.send(result)
        })


        // --------------- Bids ---------------

        app.get("/bids", verifyJwtToken, async (req, res) => {
            const email = req.query.email
            const query = {}
            if (email) {
                query.buyer_email = email
            }
            if (email !== req.token_email) {
                    return res.status(403).send({ message: "forbidden access" })
                }
            const cursor = bidCollection.find(query).sort({ bid_price: 1 })
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get("/product/bids/:productId", verifyJwtToken, async (req, res) => {
            const id = req.params.productId
            const query = { productId: id }
            const cursor = bidCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post("/bids", async (req, res) => {
            const bids = req.body;
            const result = await bidCollection.insertOne(bids)
            res.send(result)
        })

        app.delete("/bids/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bidCollection.deleteOne(query)
            res.send(result)
        })






        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`the port is running on: ${port}`)
})
