const axios = require('axios')

function Log(stack, level, pkg, message) {
  axios
    .post(
      'http://20.244.56.144/evaluation-service/logs',
      {
        stack,
        level,
        package: pkg,
        message,
      },
      {
        headers: {Authorization: `Bearer ${process.env.LOG_TOKEN}`},
      },
    )
    .catch(err => console.error('Logging failed:', err.message))
}

module.exports = Log
