import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup SQLite Database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    serial_number TEXT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    material_ratio TEXT,
    humidity REAL,
    kiln_temperature REAL,
    other_conditions TEXT,
    defects TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safely add new columns if they don't exist
const addColumn = (columnDef: string) => {
  try {
    db.exec(`ALTER TABLE products ADD COLUMN ${columnDef}`);
  } catch (e) {
    // Column likely already exists
  }
};

addColumn('firing_date TEXT');
addColumn('kiln_type TEXT');
addColumn('operator TEXT');
addColumn('firing_time REAL');

// Ensure uploads and archived_data directories exist
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const archivedDataDir = path.resolve(__dirname, 'archived_data');
if (!fs.existsSync(archivedDataDir)) {
  fs.mkdirSync(archivedDataDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
  const { status } = req.query;
  try {
    let query = 'SELECT * FROM products ORDER BY created_at DESC';
    let params: any[] = [];
    
    if (status) {
      query = 'SELECT * FROM products WHERE status = ? ORDER BY created_at DESC';
      params.push(status);
    }
    
    const products = db.prepare(query).all(...params);
    res.json(products.map((p: any) => {
      const parsed = p.material_ratio ? JSON.parse(p.material_ratio as string) : [];
      const migrated = parsed.map((m: any) => ({
        name: m.name,
        amount: m.amount !== undefined ? m.amount : m.percentage,
        unit: m.unit || '%'
      }));
      return {
        ...p,
        material_ratio: migrated
      };
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const parsed = product.material_ratio ? JSON.parse(product.material_ratio) : [];
    const migrated = parsed.map((m: any) => ({
      name: m.name,
      amount: m.amount !== undefined ? m.amount : m.percentage,
      unit: m.unit || '%'
    }));
    res.json({
      ...product,
      material_ratio: migrated
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new pending product
app.post('/api/products', (req, res) => {
  const { name, material_ratio, humidity, kiln_temperature, other_conditions, firing_date, kiln_type, operator, firing_time } = req.body;
  const id = crypto.randomUUID();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO products (id, name, status, material_ratio, humidity, kiln_temperature, other_conditions, firing_date, kiln_type, operator, firing_time)
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      name,
      JSON.stringify(material_ratio || []),
      humidity || null,
      kiln_temperature || null,
      other_conditions || '',
      firing_date || null,
      kiln_type || '',
      operator || '',
      firing_time || null
    );
    
    res.status(201).json({ id, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product (Verify / Archive)
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { serial_number, defects, image_base64, status } = req.body;
  
  try {
    let image_url = null;
    
    // Handle base64 image upload
    if (image_base64) {
      const matches = image_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const extension = matches[1].split('/')[1] || 'png';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `${id}-${Date.now()}.${extension}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, buffer);
        image_url = `/uploads/${filename}`;
      }
    }

    const currentProduct = db.prepare('SELECT image_url FROM products WHERE id = ?').get(id) as any;
    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const finalImageUrl = image_url || currentProduct.image_url;

    const stmt = db.prepare(`
      UPDATE products 
      SET serial_number = ?, defects = ?, image_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      serial_number || null,
      defects || '',
      finalImageUrl,
      status || 'pending',
      id
    );
    
    // Save to separate folder if archived
    if (status === 'archived') {
      const archivedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      if (archivedProduct) {
        try {
          // Parse JSON fields for better readability in the saved file
          const productToSave = { ...archivedProduct };
          if (typeof productToSave.material_ratio === 'string') {
            productToSave.material_ratio = JSON.parse(productToSave.material_ratio);
          }
          const filePath = path.join(archivedDataDir, `${id}.json`);
          fs.writeFileSync(filePath, JSON.stringify(productToSave, null, 2));
        } catch (e) {
          console.error('Failed to save archived product JSON:', e);
        }
      }
    }
    
    res.json({ message: 'Product updated successfully', image_url: finalImageUrl });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
