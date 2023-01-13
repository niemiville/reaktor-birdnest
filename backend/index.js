const express = require('express')
const app = express()
const cors = require('cors')
const index = express.Router();
require('dotenv').config(); 

app.use(express.static('build'))
app.use(cors())
app.use(express.json())

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(requestLogger)


app.get('/api/drones', (request, response) => {
    //TODO
  })

app.get('/api/pilot/:serialNumber', (request, response) => {
    //TODO
})


const unknownEndpoint = (request, response) => {
response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

module.exports = index;