const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.b0di4c5.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");
        // database
        const db = client.db('visualizerDashboard');
        // Collections
        const dataCollection = db.collection('mainData');
        const usersCollection = db.collection('users');

        
        // User Login
        app.post('/api/auth/login', async (req, res) => {
            const { email, password } = req.body;
            console.log(req.body);

            try {
                const user = await usersCollection.findOne({ email });
                if (!user) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }

    
                const isPasswordValid = user?.password === password;
                if (!isPasswordValid) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }

                const token = jwt.sign({
                    email: user.email,
                }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

                console.log(`User ${email} logged in successfully.`);

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
            const id = req.params.id; 
            const updatedData = req.body;
            try {
                const result = await dataCollection.updateOne(
                    { _id: new ObjectId(id) }, 
                    { $set: updatedData } 
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