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
        const productsCollection = client.db('bysell-assignment-12-db').collection('products');
        const usersCollection = client.db('bysell-assignment-12-db').collection('users');

        // Get all users data
        app.get('/users', async(req, res) => {
           const result = await usersCollection.find({}).toArray();
           res.send(result);
        });
        // Get all users data
        app.post('/current-user-data', async(req, res) => {
            const currentEmail = await req.body.currentUserEmail;
            const result = await usersCollection.find({email : currentEmail}).toArray();
            res.send(result);
        });

        // insert a user
        app.post('/add-user', async(req, res) => {
            const userinfo =await req.body.userData;
            // check user exist ?
            const existUser = await usersCollection.find({email : userinfo.email}).toArray();
            if(existUser.length > 0){
                res.send({status : true, message : 'User already added'});
            }else{
                const result = await usersCollection.insertOne(userinfo);
                res.send({status : true, message : 'New user added success'});
                
            }
         });

        // insert a product
        app.post('/add-product', async(req, res) => {
            const uploadProd =await req.body.uploadProductData;
            console.log('uploaded product ', uploadProd);
            const result = await productsCollection.insertOne(uploadProd);
            res.send(result);
        });

        // fetch uploaded product specific user
        app.post('/fetch-my-products', async(req, res) => {
            const email =await req.body.currentUserEmail;
            const result = await productsCollection.find({userEmail : email}).sort({uploadedTime : -1}).toArray();
            res.send(result);
        });

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