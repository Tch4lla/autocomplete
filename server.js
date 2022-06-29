const express = require('express')
const app = express()
const cors = require('cors')
const {MongoClient, ObjectId} = require('mongodb')
require('dotenv').config()
const PORT = 4000

let db,
    dbConnectionStr = process.env.DB_STRING,
    dbName = 'sample_mflix',
    collection

MongoClient.connect(dbConnectionStr)
    .then(client =>{
        console.log('Connected to database')
        db = client.db(dbName)
        collection = db.collection('movies')
    })
//Bit of middleware to help parse data
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
app.use(express.json())
app.use(cors())

//request methods, allows server to talk back and forth between client 

app.get('/',(request,response)=> {
    response.sendFile(__dirname + '/index.html')
})
//get request reads data from server, brings back array of possibilities
//brings back data while I'm typing
app.get('/search', async(request,response) => {
    try {
        //sending search object to mongodb to have mongo search the db
        let result = await collection.aggregate([
            {
                "$search" : {
                    "autocomplete" : {
                        "query": `${request.query.query}`,
                        "path":"title",
                        "fuzzy": {
                            "maxEdits":2,
                            "prefixLength":3
                        }
                    }
                }
            }
        ]).toArray()
        console.log(result)
        response.send(result)
    } catch(error){
        response.status(500).send({message: error.message})
    }
})

//get request when the user actually selects an item, bring back the information from the selection
app.get('/get/:id',async (request,response)=> {
    try{
        let result = await collection.findOne({
            //sending the object id to mongo for the document that I want to find 
            //object id is the same as the id parameter that I'm passing in
            '_id': ObjectId(request.params.id)
        })
        //send result back if the async function was fulfilled 
        response.send(result)
    }catch(error){
        response.status(500).send({message: error.message})

    }
})

app.listen(process.env.PORT || PORT, () => {
    console.log('Server is runnuing')
})