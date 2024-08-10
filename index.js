const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.b0di4c5.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: 'https://visualized-dashboard.vercel.app', // Update this with your client URL
    allowedHeaders: ['Authorization', 'Content-Type'],
}));

// Middleware to authenticate the token
function authenticateToken(req, res, next) {
    console.log('Request Headers:', req.headers); // Add this line
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next(); // Continue to the next middleware or route handler
    });
}


async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");
        // database
        const db = client.db('visualizerDashboard');
        // Collections
        const dataCollection = db.collection('Datas');
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

        app.get('/data',authenticateToken, async (req, res) => {
            const search = {};
            const ress = req?.user?.email;
            const query = {email: ress};
            const email_res = await usersCollection.findOne(query);
            if(!email_res) {
                return res.status(401).json({ message: 'Unauthorized access' });
            }
            const result = await dataCollection.find(search).toArray();
            res.send(result);
        })

        app.post('/data',authenticateToken, async (req, res) => {
            const search = req.body;
            const result = await dataCollection.insertOne(search);
            res.send(result);
        })

        app.delete('/data/:id',authenticateToken, async (req, res) => {
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

        app.patch('/data/:id',authenticateToken, async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            try {
                const result = await dataCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedData }
                );
                console.log('resss', result);
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
run().catch();


