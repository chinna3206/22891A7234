const express = require('express')
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose()
const shorturlsRouter = require('./routes/shorturls')
const Log = require('./Logging_Middleware/logger')

const app = express()

// Middleware
app.use(bodyParser.json())
app.use('/shorturls', shorturlsRouter)

// Database
const db = new sqlite3.Database('./db/urlshortener.db')

// Redirect route
app.get('/:shortcode', (req, res) => {
  const {shortcode} = req.params

  db.get(
    'SELECT * FROM shorturls WHERE shortcode = ?',
    [shortcode],
    async (err, row) => {
      if (err) {
        await Log('backend', 'error', 'db', `Redirect DB error: ${err.message}`)
        return res.status(500).send('Database error')
      }

      if (!row) {
        await Log(
          'backend',
          'warn',
          'handler',
          `Shortcode not found: ${shortcode}`,
        )
        return res.status(404).send('Shortcode not found')
      }

      const now = new Date()
      const expiry = new Date(row.expiry)

      if (now > expiry) {
        await Log(
          'backend',
          'info',
          'handler',
          `Expired shortcode: ${shortcode}`,
        )
        return res.status(410).send('Short link expired')
      }

      // Log click in DB
      db.run(
        'INSERT INTO clicks (shortcode, clicked_at, referrer, geo) VALUES (?, ?, ?, ?)',
        [
          shortcode,
          now.toISOString(),
          req.get('referer') || 'direct',
          'unknown',
        ],
      )

      await Log(
        'backend',
        'info',
        'handler',
        `Redirecting ${shortcode} -> ${row.original_url}`,
      )
      res.redirect(row.original_url)
    },
  )
})

// Start server
const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  Log('backend', 'info', 'server', `Server started on port ${PORT}`)
})
