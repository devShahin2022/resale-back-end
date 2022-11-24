const express = require('express');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
// make express app
const app = express();
// Middlewares
app.use(cors());
app.use(express.json());
// Mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.r3k7any.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Database all operation
async function run (){
    try{
        // All collections or data tables
        const products = client.db('bysell-assignment-12-db').collection('products');
        const users = client.db('bysell-assignment-12-db').collection('users');

        console.log('db connection success');
        
    }catch{
        console.log('Database relevant error occured!');
    }
}

run();














// test routes
app.get('/', (req, res)=> {
    res.send(`server running on port ${port}`);
})
// app listen
app.listen(port, () => {
    console.log(`server is running on port ${port}` );
})