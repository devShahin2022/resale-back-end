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
        const bookedSoldCollection = client.db('bysell-assignment-12-db').collection('bookedOrSoldProduct');
        const brandCollection = client.db('bysell-assignment-12-db').collection('brand-category');
        const bookedOrSoldCollection = client.db('bysell-assignment-12-db').collection('bookedOrSoldProduct');
        const wishListCollection = client.db('bysell-assignment-12-db').collection('wishlist-products');
        const reportProductCollection = client.db('bysell-assignment-12-db').collection('reportProduct');
        

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
    
        // make advirtised product
        app.put('/make-advirtised', async(req, res) => {
            const id =await req.body.id;
            const result = await productsCollection.updateOne( { _id: ObjectId(id) }, [ { $set: { "advirtised": true} } ] )

            res.send(result);
        });

        // make delete product
        app.delete('/delete-product', async(req, res) => {
            const id =await req.body.id;
            const result = await productsCollection.deleteOne( { _id: ObjectId(id) } );

            res.send(result);
        });

        // get my buyers  //incompleted
        app.get('/my-buyers', async(req, res) => {
            const id =await req.body.email;
            const result = await bookedSoldCollection.find({userEmail : email}).sort({uploadedTime : -1}).toArray();

            res.send(result);
        });

        // get all category name 
        app.get('/all-category', async(req, res) => {
            const id =await req.body.email;
            const result = await brandCollection.find({}).toArray();
            res.send(result);
        });
        // get data by category name
        app.get('/getdata-by-brand', async(req, res) => {
            const Id = await req.query.id;
            const result = await productsCollection.find({brandId : Id, status : "available"}).sort({uploadedTime : -1}).toArray();
            console.log(result);
            res.send(result);
        });

        // get single data for brand name
        app.get('/single-cat-name', async(req, res) => {
            const Id =await req.query.id;
            const result = await brandCollection.find({_id : ObjectId(Id)}).toArray();
            res.send(result);
        });

        // store booked data
        app.post('/store-booked-data', async(req, res) => {
            const data =await req.body.bookedInformation;
            const result = await bookedOrSoldCollection.insertOne(data);
            // res.send(result);
            if(result.acknowledged){
                const id = data.prodId;
                const updateRes = await productsCollection.updateOne( { _id: ObjectId(id) }, [ { $set: { status : "booked"} } ] )
                res.send(updateRes);
                console.log(updateRes);
            }
        });

        // combine information fetch for orders data ( category + order + Products + seller )
        app.post('/booked-products-data', async(req, res) => {

            const BuyerEmail =await req.body.email;
            const result = await bookedOrSoldCollection.aggregate([
                    { $match: { buyerEmail : BuyerEmail } },
                    {
                        $addFields: {
                            makeobjectId: {
                            $toObjectId: "$prodId"
                            }
                        }
                    },
                    {
                        $lookup: {
                        from: "products",
                        localField: "makeobjectId",
                        foreignField: "_id",
                        as: "productDetails"
                        }
                    },
                    {
                        $unwind: "$productDetails"
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "productDetails.userEmail",
                            foreignField: "email",
                            as: "userInfo"
                        }
                    },
                    {
                        $unwind: "$userInfo"
                    },
                    {
                        $lookup: {
                            from: "brand-category",
                            localField: "productDetails.customCatIdByTime",
                            foreignField: "time",
                            as: "categoryInfo"
                        }
                    },
                    {
                        $unwind: "$categoryInfo"
                    },
                ]).toArray();

                // console.log('buyer email', BuyerEmail);
                // console.log('data', result);

            res.send(result);
        });

        // cancel product from my order
        app.delete('/cancel-order', async(req, res) => {
            const Id =await req.body.id;
            const result = await bookedOrSoldCollection.deleteOne({ prodId : Id });
            if(result.acknowledged){
                const resultUpdated = await productsCollection.updateOne( { _id: ObjectId(Id) }, [ { $set: { status : "available"} } ] );
                res.send(resultUpdated);
            }else{
                return res.send({"acknowledged" : false});
            }
        });

    // add product to my wishlist 
    app.post('/store-wishlist-data', async(req, res) => {
        const data =await req.body.wishListProductInfo;

        // first check data alreadt exit or not
        const productId = data.prodId;
        const productBuyer = data.buyerEmail;

        const checkResult = await wishListCollection.find({ 
            prodId : productId , buyerEmail : productBuyer
        
        }).toArray();
        if(checkResult.length > 0){
            res.send({"status" : false, "msg" : "Product already added wishlist"})
        }else{
            const result = await wishListCollection.insertOne(data);
            res.send({"status" : true, "msg" : "Suceess product added wishlist"})
        }
    });

    // combine information fetch for orders data for wishlist ( category + order + Products + seller )
    app.post('/wishlist-product', async(req, res) => {

        const BuyerEmail =await req.body.email;
        const result = await wishListCollection.aggregate([
                { $match: { buyerEmail : BuyerEmail } },
                {
                    $addFields: {
                        makeobjectId: {
                        $toObjectId: "$prodId"
                        }
                    }
                },
                {
                    $lookup: {
                    from: "products",
                    localField: "makeobjectId",
                    foreignField: "_id",
                    as: "productDetails"
                    }
                },
                {
                    $unwind: "$productDetails"
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "productDetails.userEmail",
                        foreignField: "email",
                        as: "userInfo"
                    }
                },
                {
                    $unwind: "$userInfo"
                },
                {
                    $lookup: {
                        from: "brand-category",
                        localField: "productDetails.customCatIdByTime",
                        foreignField: "time",
                        as: "categoryInfo"
                    }
                },
                {
                    $unwind: "$categoryInfo"
                },
            ]).toArray();

            // console.log('buyer email', BuyerEmail);
            // console.log('data', result);

        res.send(result);
    });

    // remove a wishlist product from db
        app.delete('/cancel-wishlist-product', async(req, res) => {
            const Id =await req.body.id;
            const result = await wishListCollection.deleteOne({ prodId : Id });
            res.send(result);
        });
        
    //////======== get my buyers route =====
    // uses previous route  name : booked-products-data
        
    app.post('/seller/booked-products-data', async(req, res) => {

        const sellmail =await req.body.email;
        console.log(sellmail);
        const result = await bookedOrSoldCollection.aggregate([
                { $match: { sellerEmail : sellmail } },
                {
                    $addFields: {
                        makeobjectId: {
                        $toObjectId: "$prodId"
                        }
                    }
                },
                {
                    $lookup: {
                    from: "products",
                    localField: "makeobjectId",
                    foreignField: "_id",
                    as: "productDetails"
                    }
                },
                {
                    $unwind: "$productDetails"
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "productDetails.userEmail",
                        foreignField: "email",
                        as: "userInfo"
                    }
                },
                {
                    $unwind: "$userInfo"
                },
                {
                    $lookup: {
                        from: "brand-category",
                        localField: "productDetails.customCatIdByTime",
                        foreignField: "time",
                        as: "categoryInfo"
                    }
                },
                {
                    $unwind: "$categoryInfo"
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "buyerEmail",
                        foreignField: "email",
                        as: "buyerInfo"
                    }
                },
                {
                    $unwind: "$buyerInfo"
                }
            ]).toArray();

            // console.log('buyer email', BuyerEmail);
            // console.log('data', result);

        res.send(result);
    });

// accepted product route accepted-order
    app.post('/accepted-order', async(req, res) => {
        const Id =await req.body.id;
        const result = await bookedOrSoldCollection.updateOne( { _id: ObjectId(Id) }, [ { $set: { orderStatus : "booked"} } ] );
        return res.send(result);
    });

// Keep pending order data
app.post('/keep-pending-order', async(req, res) => {
    const Id =await req.body.id;
    const result = await bookedOrSoldCollection.updateOne( { _id: ObjectId(Id) }, [ { $set: { orderStatus : "pending"} } ] );
    return res.send(result);
});

// store report data

app.post('/keep-report-data', async(req, res) => {
    const data =await req.body.reportItem;

    const productId = data.prod._id;
    const currentUser = data.reporter.email;
    const result = await reportProductCollection.find({ ProdId : productId, reporterEmail : currentUser }).toArray();

    if(result.length ===  0){
        const dataInsert = await reportProductCollection.insertOne(data);
        if(dataInsert.acknowledged){
            return res.send({"acknowledged" : true , "msg" : "report send success"});
        }
    }
    else{
        return res.send({"acknowledged" : false , "msg" : "You already report this product"});
    }

});

// Admin route for fetching report item







///////////////////////////////////
//////////////Fake api

// delete
app.get('/delete', async (req, res) => {
    const result = await reportProductCollection.deleteMany({});
    res.send(result);
})




    }
    catch{
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