const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId, OrderedBulkOperation } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l0kqykq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


//verify jwt token function;

const verifyJwt = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) return res.status(401).send({ error: true, message: 'unathorised user' })
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.status(401).send({ error: true, message: 'unathorised user' })
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const servicesCallaction = client.db('cardoctor').collection('services');

        const bookingCallection = client.db('cardoctor').collection('booking');

        //jwt access token

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })

            res.send({ token })

        })


        //service routes
        app.get('/services', async (req, res) => {
            const cursor = servicesCallaction.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {

            const id = req.params.id;

            const query = { _id: new ObjectId(id) }

            const options = {

                projection: { title: 1, service_id: 1, price: 1, facility: 1, img: 1 },
            };

            const result = await servicesCallaction.findOne(query, options);
            res.send(result);

        })

        // booking before verify jwt affter passing data

        app.get('/bookings', verifyJwt, async (req, res) => {
            const decoded = req.decoded;
            let query = {}

            // check jwt email and query email;

            if (decoded.email !== req.query.email) {
                return res.status(403).send({ error: true, message: 'unathorised user' })
            }

            if (req.query?.email) {
                email = { query: req.query.email }
            }
            console.log(query);
            const result = await bookingCallection.find(query).toArray();
            res.send(result);
        })

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const updatedBooking = req.body;

            const filter = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };

            const result = await bookingCallection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.post('/booking', async (req, res) => {
            const bookingData = req.body;
            const result = await bookingCallection.insertOne(bookingData);
            res.send(result);
        })


        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCallection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('doctor is running')
})

app.listen(port, () => {
    console.log(`doctor is running on port ${port}`);
})