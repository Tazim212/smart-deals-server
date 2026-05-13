const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
const uri = "mongodb://SmartDB:SHMoSLaApxtIqlja@ac-eqifd2k-shard-00-00.tbmejyb.mongodb.net:27017,ac-eqifd2k-shard-00-01.tbmejyb.mongodb.net:27017,ac-eqifd2k-shard-00-02.tbmejyb.mongodb.net:27017/?ssl=true&replicaSet=atlas-bvjx8p-shard-0&authSource=admin&appName=Cluster0";

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


        app.post("/product", async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product)
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

        app.post("/user", async (req, res) => {
            const user = req.body
            const query = { email: user.email, name: user.name }
            // const existingUser = await userCellection.findOne(query)
            // if (existingUser) {
            //     return res.send({
            //         message: "user already exist"
            //     }
            //     )
            // }
            const result = await userCellection.insertOne(query)
            res.send(result)
        })


        // --------------- Bids ---------------

        app.get("/product/bids/:productId", async (req, res) => {
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
