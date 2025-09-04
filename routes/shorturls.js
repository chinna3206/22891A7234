const express = require('express')
const router = express.Router()
const Log = require('../Logging_Middleware/logger')
// Correct path

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./db/urlshortener.db')

// Create Short URL
router.post('/', (req, res) => {
  const {url, validity = 30, shortcode} = req.body

  if (!url) {
    Log('backend', 'error', 'handler', 'URL is required')
    return res.status(400).json({error: 'URL is required'})
  }

  const code = shortcode || Math.random().toString(36).substring(2, 8)
  const expiryDate = new Date(Date.now() + validity * 60000).toISOString()

  db.run(
    'INSERT INTO shorturls (shortcode, original_url, expiry) VALUES (?, ?, ?)',
    [code, url, expiryDate],
    function (err) {
      if (err) {
        Log('backend', 'error', 'db', err.message)
        return res.status(500).json({error: 'Database error'})
      }

      Log('backend', 'info', 'handler', `Short URL created: ${code}`)
      res.status(201).json({
        shortLink: `http://localhost:3000/${code}`,
        expiry: expiryDate,
      })
    },
  )
})

// Get Stats
router.get('/stats/:shortcode', (req, res) => {
  const {shortcode} = req.params

  db.get(
    'SELECT * FROM shorturls WHERE shortcode = ?',
    [shortcode],
    (err, row) => {
      if (err) return res.status(500).json({error: 'Database error'})
      if (!row) return res.status(404).json({error: 'Shortcode not found'})

      db.all(
        'SELECT * FROM clicks WHERE shortcode = ?',
        [shortcode],
        (err, clicks) => {
          if (err) return res.status(500).json({error: 'Database error'})

          res.json({
            shortcode: row.shortcode,
            original_url: row.original_url,
            created_at: row.created_at,
            expiry: row.expiry,
            totalClicks: clicks.length,
            clickDetails: clicks,
          })
        },
      )
    },
  )
})

module.exports = router // ✅ Make sure to export the router
