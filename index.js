const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.b0di4c5.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");
        // database
        const db = client.db('visualizerDashboard');
        // Table
        const dataCollection = db.collection('mainData');
        const usersCollection = db.collection('users');

        
        // User Login
        app.post('/api/auth/login', async (req, res) => {
            const { email, password } = req.body;
            console.log(req.body);

            try {
                // Find user by email
                const user = await usersCollection.findOne({ email });
                if (!user) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }

                // Compare hashed password
                const isPasswordValid = user?.password === password;
                if (!isPasswordValid) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }

                // Generate JWT token
                const token = jwt.sign({
                    email: user.email,
                }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

                // Log successful login
                console.log(`User ${email} logged in successfully.`);

                // Respond with token
                res.json({
                    success: true,
                    message: 'Login successful',
                    token,
                    email: user?.email
                });
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });

        app.get('/data', async (req, res) => {
            const search = {};
            const result = await dataCollection.find(search).toArray();
            res.send(result);
        })

        app.post('/data', async (req, res) => {
            const search = req.body;
            const result = await dataCollection.insertOne(search);
            res.send(result);
        })

        app.delete('/data/:id', async (req, res) => {
            const search = req?.params?.id;
            try {
                const query = { _id: new ObjectId(search) };
                const result = await dataCollection.deleteOne(query);
                console.log(result);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        })


        app.get('/data/:id', async (req, res) => {
            const search = req?.params?.id;
            try {
                const query = { _id: new ObjectId(search) };
                const result = await dataCollection.findOne(query);
                console.log(result);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        })

        app.patch('/data/:id', async (req, res) => {
            const id = req.params.id; // Get the ID from the URL params
            const updatedData = req.body; // Get the updated data from the request body
            try {
                // Convert the ID to an ObjectId (assuming you're using MongoDB's ObjectId)
                const result = await dataCollection.updateOne(
                    { _id: new ObjectId(id) }, // Filter to find the document by ID
                    { $set: updatedData } // Set the fields that are being updated
                );
                console.log('resss',result);
                if (result.matchedCount > 0) {
                    res.status(200).send({ message: 'Data updated successfully', result });
                } else {
                    res.status(404).send({ message: 'Data not found' });
                }
            } catch (error) {
                console.error('Error updating data:', error);
                res.status(500).send({ message: 'Failed to update data', error });
            }
        });
        
        // ==============================================================
        // WRITE YOUR CODE HERE
        // app.get('/supplies', async (req, res) => {
        //     const search = {};
        //     const result = await suppliesCollection.find(search).toArray();
        //     res.send(result);
        // })
        // app.post('/supplies', async (req, res) => {
        //     const query = req.body;
        //     const result = await suppliesCollection.insertOne(query);
        //     res.send(result);
        // })

        // FLASH_SALE PRODUCT - GET
        // app.get('/flash-products', async (req, res) => {
        //     try {
        //         const page = parseInt(req.query.page) || 1; // Default to page 1 if no page query parameter is provided
        //         const limit = 10; // Number of products per page
        //         const skip = (page - 1) * limit; // Calculate the number of documents to skip
        //         const search = { flashsale: "true" };
        //         const result = await productsCollection.find(search).skip(skip).limit(limit).toArray();
        //         // Optionally, you can also return the total number of documents to help with client-side pagination calculations
        //         const totalDocuments = await productsCollection.countDocuments(search);
        //         res.send({
        //             data: result,
        //             totalDocuments,
        //             totalPages: Math.ceil(totalDocuments / limit),
        //             currentPage: page
        //         });
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send('An error occurred while fetching products');
        //     }
        // });


        // // TOP PRODUCT - GET
        // app.get('/top-products', async (req, res) => {
        //     const search = {};
        //     const sortOptions = { rating: -1 }; // Sort by rating in descending order
        //     const result = await productsCollection.find(search).sort(sortOptions).toArray();
        //     res.send(result);
        // });

        // app.get('/all-products', async (req, res) => {
        //     const search = {};
        //     const result = await productsCollection.find(search).toArray();
        //     res.send(result);
        // });



        // // POST into FlashProducts
        // app.post('/flash-products', async (req, res) => {
        //     const query = req.body;
        //     const result = await flashProductsCollection.insertOne(query);
        //     res.send(result);
        // })

        // app.post('/products', async (req, res) => {
        //     const query = req.body;
        //     const result = await productsCollection.insertOne(query);
        //     res.send(result);
        // })


        // app.get('/products', async (req, res) => {
        //     try {
        //         const page = parseInt(req.query.page) || 1; // Default to page 1 if no page query parameter is provided
        //         const limit = 10; // Number of products per page
        //         const skip = (page - 1) * limit; // Calculate the number of documents to skip

        //         const search = {};
        //         const result = await productsCollection.find(search).skip(skip).limit(limit).toArray();

        //         // Optionally, you can also return the total number of documents to help with client-side pagination calculations
        //         const totalDocuments = await productsCollection.countDocuments(search);

        //         res.send({
        //             data: result,
        //             totalDocuments,
        //             totalPages: Math.ceil(totalDocuments / limit),
        //             currentPage: page
        //         });
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send('An error occurred while fetching products');
        //     }
        // });





        // app.get('/update-products/:productId', async (req, res) => {
        //     const search = req.params.productId;
        //     try {
        //         const query = { _id: new ObjectId(search) };
        //         const result = await productsCollection.findOne(query);
        //         if (result) {
        //             res.send(result);
        //         } else {
        //             res.status(404).send({ message: 'Product not found' });
        //         }
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send({ message: 'Internal Server Error' });
        //     }
        // });




        // app.get('/all-users', async (req, res) => {
        //     const search = {};
        //     try {
        //         const result = await usersCollection.find(search).toArray();
        //         res.send(result);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send(error);
        //     }
        // });


        // app.get(`/user/:userEmail`, async (req, res) => {
        //     const search = req?.params?.userEmail;
        //     const query = { email: search }
        //     try {
        //         const result = await usersCollection.findOne(query);
        //         res.send(result);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send(error);
        //     }
        // });

        // app.get(`/products/:productId`, async (req, res) => {
        //     const search = req?.params?.productId;
        //     const query = { _id: new ObjectId(search) };
        //     try {
        //         const result = await productsCollection.findOne(query);
        //         res.send(result);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send(error);
        //     }
        // });

        // app.get(`/products/:productId/reviews`, async (req, res) => {
        //     const search = req?.params?.productId;
        //     const query = { _id: new ObjectId(search) };
        //     try {
        //         const result = await productsCollection.find(query);
        //         res.send({ data: result.review });
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send(error);
        //     }
        // });

        // app.delete('/admin/user-delete/:userId', async (req, res) => {
        //     const search = req?.params?.userId;
        //     try {
        //         const query = { _id: new ObjectId(search) };
        //         const result = await usersCollection.deleteOne(query);
        //         res.send(result);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send(error);
        //     }
        // });


        // app.patch('/admin/make-admin-edit/:userId', async (req, res) => {
        //     const search = req?.params?.userId;
        //     try {
        //         const query = { _id: new ObjectId(search) };
        //         const update = { $set: { role: 'admin' } };
        //         const options = { upsert: true };
        //         const result = await usersCollection.updateOne(query, update, options);
        //         res.send(result);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send(error);
        //     }
        // });


        // app.post('/add/cart', async (req, res) => {
        //     const query = req.body;
        //     try {
        //         const result = await cartCollection.insertOne(query);
        //         res.send({ result, addedOne: true });
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send(error);
        //     }
        // })


        // app.get(`/cart/:userEmail`, async (req, res) => {
        //     const search = req?.params?.userEmail;
        //     const query = { email: search }
        //     try {
        //         const result = await cartCollection.find(query).toArray();
        //         console.log(result);
        //         res.send(result);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send(error);
        //     }
        // });


        // app.get(`/products/:productId`, async (req, res) => {
        //     const search = req?.params?.productId;
        //     const query = { _id: new ObjectId(search) };
        //     try {
        //         const result = await productsCollection.find(query).toArray();
        //         res.send(result);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send(error);
        //     }
        // });



        // app.post('/top-products-filter', async (req, res) => {
        //     const { rating, category, newPrice } = req.query;

        //     // Initialize search object
        //     const search = {};

        //     // Add rating filter if provided
        //     if (rating) {
        //         search.rating = { $gte: parseFloat(rating) }; // Filter products with rating greater than or equal to provided rating
        //     }

        //     // Add category filter if provided
        //     if (category) {
        //         search.category = category;
        //     }

        //     // Add new price filter if provided
        //     if (newPrice) {
        //         // Assuming newPrice is in the format "$10 - $20"
        //         const [minString, maxString] = newPrice.split(' - ');
        //         const min = parseFloat(minString.trim().replace('$', ''));
        //         const max = parseFloat(maxString.trim().replace('$', ''));
        //         search.price = { $gte: min, $lte: max }; // Filter products with price within the provided range
        //     }

        //     // Sort by rating in descending order by default
        //     const sortOptions = { rating: -1 };

        //     try {
        //         const result = await topProductsCollection.find(search).sort(sortOptions).toArray();
        //         res.send(result);
        //     } catch (error) {
        //         console.error("Error occurred while fetching top products:", error);
        //         res.status(500).send("Internal server error");
        //     }
        // });


        // app.get('/products/:productId', async (req, res) => {
        //     const productId = req.params.productId;

        //     try {
        //         const query = { _id: new ObjectId(productId) };
        //         const result = await topProductsCollection.findOne(query);

        //         if (!result) {
        //             // If product not found, send 404 Not Found status
        //             return res.status(404).json({ error: 'Product not found' });
        //         }

        //         // If product found, send it as response
        //         res.json(result);
        //     } catch (error) {
        //         console.error("Error retrieving product:", error);
        //         res.status(500).json({ error: 'Internal Server Error' });
        //     }
        // });


        // app.post('/testimonial', async (req, res) => {
        //     const query = req.body;
        //     const result = await testimonialCollection.insertOne(query);
        //     res.send(result);
        // })

        // app.post('/community-comments', async (req, res) => {
        //     const query = req.body;
        //     const result = await commentsCollection.insertOne(query);
        //     res.send(result);
        // })




        // app.get('/leaderboard', async (req, res) => {
        //     const search = {};
        //     const result = await donorCollection.find(search).sort({ total_donation: -1 }).toArray();
        //     console.log(result);
        //     res.send(result);
        // })

        // app.delete('/supplies/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) };
        //     const result = await suppliesCollection.deleteOne(query);
        //     res.send(result);
        // });
        // ==============================================================

        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}
run().catch(console.dir);


// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});