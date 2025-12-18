const express = require('express');
const Database = require('better-sqlite3');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar base de datos
const db = new Database('facturacion.db');

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    cif TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS servicios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS facturas (
    id TEXT PRIMARY KEY,
    numero TEXT NOT NULL UNIQUE,
    cliente_id TEXT NOT NULL,
    fecha DATE NOT NULL,
    total REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );

  CREATE TABLE IF NOT EXISTS factura_items (
    id TEXT PRIMARY KEY,
    factura_id TEXT NOT NULL,
    servicio_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL,
    cantidad INTEGER NOT NULL,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id)
  );
`);

// ============= RUTAS CLIENTES =============
app.get('/api/clientes', (req, res) => {
  try {
    const clientes = db.prepare('SELECT * FROM clientes ORDER BY nombre').all();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clientes', (req, res) => {
  try {
    const { id, nombre, cif, email, telefono, direccion } = req.body;
    const stmt = db.prepare(`
      INSERT INTO clientes (id, nombre, cif, email, telefono, direccion)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, nombre, cif, email, telefono, direccion);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clientes/:id', (req, res) => {
  try {
    const { nombre, cif, email, telefono, direccion } = req.body;
    const stmt = db.prepare(`
      UPDATE clientes 
      SET nombre = ?, cif = ?, email = ?, telefono = ?, direccion = ?
      WHERE id = ?
    `);
    stmt.run(nombre, cif, email, telefono, direccion, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clientes/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM clientes WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= RUTAS SERVICIOS =============
app.get('/api/servicios', (req, res) => {
  try {
    const servicios = db.prepare('SELECT * FROM servicios ORDER BY nombre').all();
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/servicios', (req, res) => {
  try {
    const { id, nombre, descripcion, precio } = req.body;
    const stmt = db.prepare(`
      INSERT INTO servicios (id, nombre, descripcion, precio)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, nombre, descripcion, precio);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/servicios/:id', (req, res) => {
  try {
    const { nombre, descripcion, precio } = req.body;
    const stmt = db.prepare(`
      UPDATE servicios 
      SET nombre = ?, descripcion = ?, precio = ?
      WHERE id = ?
    `);
    stmt.run(nombre, descripcion, precio, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/servicios/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM servicios WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= RUTAS FACTURAS =============
app.get('/api/facturas', (req, res) => {
  try {
    const facturas = db.prepare('SELECT * FROM facturas ORDER BY fecha DESC').all();
    
    const facturasConItems = facturas.map(factura => {
      const items = db.prepare('SELECT * FROM factura_items WHERE factura_id = ?').all(factura.id);
      return { ...factura, items };
    });
    
    res.json(facturasConItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/facturas', (req, res) => {
  try {
    const { id, numero, cliente_id, fecha, total, items } = req.body;
    
    const stmtFactura = db.prepare(`
      INSERT INTO facturas (id, numero, cliente_id, fecha, total)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmtFactura.run(id, numero, cliente_id, fecha, total);
    
    const stmtItem = db.prepare(`
      INSERT INTO factura_items (id, factura_id, servicio_id, nombre, descripcion, precio, cantidad)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    items.forEach(item => {
      stmtItem.run(item.id, id, item.servicioId, item.nombre, item.descripcion, item.precio, item.cantidad);
    });
    
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/facturas/:id', (req, res) => {
  try {
    const { numero, cliente_id, fecha, total, items } = req.body;
    
    const stmtFactura = db.prepare(`
      UPDATE facturas 
      SET numero = ?, cliente_id = ?, fecha = ?, total = ?
      WHERE id = ?
    `);
    stmtFactura.run(numero, cliente_id, fecha, total, req.params.id);
    
    db.prepare('DELETE FROM factura_items WHERE factura_id = ?').run(req.params.id);
    
    const stmtItem = db.prepare(`
      INSERT INTO factura_items (id, factura_id, servicio_id, nombre, descripcion, precio, cantidad)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    items.forEach(item => {
      stmtItem.run(item.id, req.params.id, item.servicioId, item.nombre, item.descripcion, item.precio, item.cantidad);
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/facturas/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM factura_items WHERE factura_id = ?').run(req.params.id);
    db.prepare('DELETE FROM facturas WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= GENERAR PDF =============
app.post('/api/generar-pdf', async (req, res) => {
  try {
    const { facturaId } = req.body;
    
    const factura = db.prepare('SELECT * FROM facturas WHERE id = ?').get(facturaId);
    const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(factura.cliente_id);
    const items = db.prepare('SELECT * FROM factura_items WHERE factura_id = ?').all(facturaId);
    
    const htmlContent = generarHTMLFactura(factura, cliente, items);
    
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Factura_${factura.numero}.pdf`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

function generarHTMLFactura(factura, cliente, items) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .company-info { font-size: 12px; color: #666; line-height: 1.8; }
    .invoice-number {
      font-size: 28px;
      font-weight: bold;
      color: #1a1a1a;
      text-align: right;
    }
    .invoice-date {
      color: #666;
      font-size: 14px;
      text-align: right;
      margin-top: 5px;
    }
    .client-section {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .client-name {
      font-size: 16px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .client-details { font-size: 13px; color: #666; line-height: 1.8; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead { background: #1e293b; color: white; }
    th {
      text-align: left;
      padding: 12px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    th.text-right { text-align: right; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    td.text-right { text-align: right; }
    .item-name { font-weight: 600; margin-bottom: 4px; }
    .item-desc { font-size: 12px; color: #64748b; }
    .amount { font-weight: 600; }
    .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
    .totals-table { width: 300px; }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .subtotal-row { color: #64748b; }
    .iva-row {
      color: #64748b;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 8px;
    }
    .total-row {
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
      padding-top: 8px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">TU EMPRESA</div>
      <div class="company-info">
        <div>CIF: B00000000</div>
        <div>Calle Principal 123, Madrid</div>
        <div>Teléfono: 900 000 000</div>
        <div>Email: info@tuempresa.com</div>
      </div>
    </div>
    <div>
      <div class="invoice-number">FACTURA ${factura.numero}</div>
      <div class="invoice-date">Fecha: ${formatDate(factura.fecha)}</div>
    </div>
  </div>
  <div class="client-section">
    <div class="section-title">Facturar a</div>
    <div class="client-name">${cliente.nombre}</div>
    <div class="client-details">
      <div>CIF/NIF: ${cliente.cif}</div>
      ${cliente.direccion ? `<div>${cliente.direccion}</div>` : ''}
      ${cliente.email ? `<div>Email: ${cliente.email}</div>` : ''}
      ${cliente.telefono ? `<div>Teléfono: ${cliente.telefono}</div>` : ''}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 50%">Descripción</th>
        <th class="text-right" style="width: 15%">Cantidad</th>
        <th class="text-right" style="width: 18%">Precio Unit.</th>
        <th class="text-right" style="width: 17%">Importe</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>
            <div class="item-name">${item.nombre}</div>
            ${item.descripcion ? `<div class="item-desc">${item.descripcion}</div>` : ''}
          </td>
          <td class="text-right">${item.cantidad}</td>
          <td class="text-right amount">${formatCurrency(item.precio)}</td>
          <td class="text-right amount">${formatCurrency(item.precio * item.cantidad)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-table">
      <div class="totals-row subtotal-row">
        <span>Base imponible</span>
        <span class="amount">${formatCurrency(factura.total)}</span>
      </div>
      <div class="totals-row iva-row">
        <span>IVA (21%)</span>
        <span class="amount">${formatCurrency(factura.total * 0.21)}</span>
      </div>
      <div class="totals-row total-row">
        <span>TOTAL</span>
        <span>${formatCurrency(factura.total * 1.21)}</span>
      </div>
    </div>
  </div>
  <div class="footer">Gracias por confiar en nuestros servicios</div>
</body>
</html>`;
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: facturacion.db`);
});

process.on('SIGINT', () => {
  db.close();
  process.exit();
});
