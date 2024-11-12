const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const bcryptjs = require('bcryptjs')

const app = express();
app.use(cors());
app.use(express.json());
app.use('/bikes/image', express.static(path.join(__dirname, 'images')));
app.use(bodyParser.json({ limit: '10mb' })); 

app.get('/', (req, res) => {
    return res.json("From Backend Side");
});

// Test route
app.get('/test', (req, res) => {
    return res.json("This is a test route");
});

const db = mysql.createConnection({
    host: "localhost",
    user: "raju",
    password: "root",
    database: "raju"
});

app.get('/bikes',(req,res)=>{
    const sql = "SELECT * FROM bikes";
    db.query(sql,(err,data)=>{
        if(err) return res.json(err);
        return res.json(data);
    });
});
app.get('/bikes', (req, res) => {
    const sql = "SELECT id, Name, price,image FROM bikes";
    db.query(sql, (err, data) => {
      if (err) return res.json(err);
      return res.json(data);
    });
  });
  app.get('/bikes/image/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT image FROM bikes WHERE id = ?";
    db.query(sql, [id], (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }
      if (result.length > 0 && result[0].image) {
        res.contentType('image/jpeg'); // Adjust this if your images are not JPEG
        res.send(result[0].image);
      } else {
        res.status(404).send('Image not found');
      }
    });
  });
  app.post('/cart', async (req, res) => {
    const { id, Name , Price,Quantity } = req.body; // Expecting productId and quantity in the request body
    try {
        await db.query('INSERT INTO cart (id, Name , Price, Quantity) VALUES (?, ?, ? , ?)', [id, Name, Price , Quantity]);
        res.status(201).json({ message: 'Product added to cart' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/cart', async (req, res) => {
  try {
      db.query('SELECT * FROM cart', (err, rows) => {
          if (err) return res.status(500).json(err);
          res.status(200).json(rows);
      });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});
app.get('/users', async (req, res) => {
    try {
        db.query('SELECT * FROM users', (err, rows) => {
            if (err) return res.status(500).json(err);
            res.status(200).json(rows);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });
app.delete('/cart/:id', async (req, res) => {
  const { id } = req.params;

  // Ensure id is a valid number (if your ids are numbers)
  if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
      // Execute the delete query
      db.query('DELETE FROM cart WHERE id = ?', [id], (err, result) => {
          if (err) {
              return res.status(500).json({ error: err.message });
          }

          // Check if any row was affected
          if (result.affectedRows === 0) {
              return res.status(404).json({ message: 'Product not found in cart' });
          }

          // Successfully deleted
          res.status(200).json({ message: 'Product removed from cart' });
      });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'User  already exists' });
        }
        return res.status(201).json({ message: 'User  created successfully' });
    });
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'User  not found' });

        const user = results[0];
        // Compare password
        const match = await bcryptjs.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid password' });

        // Login successful
        return res.status(200).json({ message: 'Login successful', userId: user.id });
    });
});
// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});

app.listen(8093, () => {
    console.log("Server is listening on port 8093");
});