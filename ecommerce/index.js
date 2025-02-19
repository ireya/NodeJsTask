require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');

const Product = require('./models/product');

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('Loading initial data from JSON file...');
      const rawData = fs.readFileSync('./data.json', 'utf-8');
      const products = JSON.parse(rawData);
      await Product.insertMany(products);
      console.log('Initial data loaded successfully.');
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const writeProductsToFile = async () => {
  try {
    const products = await Product.find();
    fs.writeFileSync('./data.json', JSON.stringify(products, null, 2), 'utf-8');
    console.log('Data written to data.json successfully.');
  } catch (error) {
    console.error('Error writing to data.json:', error.message);
  }
};

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, description, imageUrl } = req.body;
    const product = new Product({ name, price, description, imageUrl });
    await product.save();

    await writeProductsToFile();

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, description, imageUrl } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, description, imageUrl },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await writeProductsToFile();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await writeProductsToFile();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
