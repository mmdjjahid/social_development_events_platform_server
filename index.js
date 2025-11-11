const express = require("express")
const cors = require("cors")
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 3000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PSS}@cluster0.teai1fq.mongodb.net/?appName=Cluster0`

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(express.json())
app.use(cors())

async function run() {
  try {
    await client.connect();

    const eventDB = client.db("SocialEvents"); 
    const eventCollection = eventDB.collection("events");
    const joinedCollection = eventDB.collection("joinedEvents");

    app.post("/events", async (req, res) => {
      const eventData = req.body;
      const result = await eventCollection.insertOne(eventData);
      res.send(result);
    });

    app.get("/events", async (req, res) => {
      const { type, search } = req.query;
      
      let query = {
        eventDate: { $gt: new Date() }
      };

      if (type) {
        query.eventType = type;
      }
      
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      const events = await eventCollection.find(query).sort({ eventDate: 1 }).toArray();
      res.send(events);
    });

    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const event = await eventCollection.findOne(query);
      res.send(event);
    });


    app.post("/join-event", async (req, res) => {
      const joinedEventData = req.body;
      const result = await joinedCollection.insertOne(joinedEventData);
      res.send(result);
    });

    app.get("/joined-events/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const options = { sort: { eventDate: 1 } };
      const joinedEvents = await joinedCollection.find(query, options).toArray();
      res.send(joinedEvents);
    });


    app.get("/manage-events/:email", async (req, res) => {
      const email = req.params.email;
      const query = { creatorEmail: email };
      const myEvents = await eventCollection.find(query).sort({ eventDate: 1 }).toArray();
      res.send(myEvents);
    });



    app.put("/events/:id", async (req, res) => {
      const id = req.params.id;
      const eventData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: eventData.title,
          description: eventData.description,
          eventType: eventData.eventType,
          thumbnail: eventData.thumbnail,
          location: eventData.location,
          eventDate: new Date(eventData.eventDate) // Ensure it's a Date object
        }
      };
      const result = await eventCollection.updateOne(filter, updateDoc);
      res.send(result);
    });





    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


  } finally {
    
  }
}
run().catch(console.dir);



app.get("/", (req, res)=>{
    res.send("hello")
})

app.listen(port,()=>{
    console.log(`listening port ${port}`)
})