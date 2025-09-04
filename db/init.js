const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./db/urlshortener.db') // relative to project root

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS shorturls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shortcode TEXT UNIQUE,
    original_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry DATETIME
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shortcode TEXT,
    clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    referrer TEXT,
    geo TEXT
  )`)
})

console.log('Database initialized successfully!')
