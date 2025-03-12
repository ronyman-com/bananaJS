// marketplace.js
const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = 5000;

// Initialize Firebase
const serviceAccount = require('./bananajs-deb7c-firebase-adminsdk-fbsvc-25e88d8519.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Middleware for authentication
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Get all plugins
app.get('/plugins', async (req, res) => {
  const plugins = await db.collection('plugins').get();
  res.json(plugins.docs.map((doc) => doc.data()));
});

// Add a new plugin (requires authentication)
app.post('/plugins', authenticate, async (req, res) => {
  const { name, url } = req.body;
  await db.collection('plugins').doc(name).set({ name, url });
  res.json({ message: 'Plugin added successfully!' });
});

app.listen(PORT, () => {
  console.log(`Plugin marketplace running at http://localhost:${PORT}`);
});