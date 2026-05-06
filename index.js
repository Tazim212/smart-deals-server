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

app.get("/", (req, res) =>{
    res.send("Server is choltase")
})

async function run() {
  try {
    await client.connect();

    const db = client.db("ProductDB")
    const productCollection = db.collection("productCollection")

    app.get("/product", async(req, res) =>{
        // const projects = {title: 1, price_max: 1}
        // const query = productCollection.find().sort({ price_max: -1 }).limit(3).skip(2).project(projects)
        const email = req.query.email
        const cursor = {}
        if(email){
            cursor.email = email
        }
        const query = productCollection.find(cursor)
        const proCollection = await query.toArray()
        res.send(proCollection)
    })

    app.post("/product", async(req, res) =>{
        const product = req.body;
        const result = await productCollection.insertOne(product)
        res.send(result)
    })

    app.patch("/product/:id", async(req, res) =>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const cursor = req.body
        const update = {
            $set : {
                name: cursor.name,
                price: cursor.price
            }
        }
        const result = await productCollection.updateOne(query, update)
        res.send(result)
    })

    app.delete("/product/:id", async(req, res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await productCollection.deleteOne(query)
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


app.listen(port, () =>{
    console.log(`the port is running on: ${port}`)
})
// SHMoSLaApxtIqlja