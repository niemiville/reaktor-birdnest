const express = require('express')
const app = express()
const cors = require('cors')
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const index = express.Router();
require('dotenv').config(); 

app.use(express.static('build'))
app.use(cors())
app.use(express.json())

const GET_DRONES_LINK = process.env.GET_DRONES_LINK || 'https://assignments.reaktor.com/birdnest/drones';
const GET_PILOT_LINK = process.env.GET_PILOT_LINK || 'https://assignments.reaktor.com/birdnest/pilots/';
const originX = 250000.0;
const originY = 250000.0;
const NDZRadius = 100000.0;

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(requestLogger)

async function getDrones() {
  try {
    const response = await axios.get(GET_DRONES_LINK);
		return await parseStringPromise(response.data);
  } catch (error) {
    console.error(error);
  }
}

async function getPilotInfo(serialNumber) {
  try {
    const response = await axios.get(GET_PILOT_LINK + serialNumber);
    return await parseStringPromise(response.data);
  } catch (error) {
    console.error(error);
  }
}
//getPilotInfo('SN-mozUMVHF3o')
//getDrones()
const getDistanceBetweenTwoPoints = (x1, y1, x2, y2) => {
  return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
}

const getNDZViolators = async () => {
  let droneData = await getDrones()
  for(let drone of droneData.report.capture[0].drone){
    const distanceToNest = getDistanceBetweenTwoPoints(originX, originY, drone.positionX, drone.positionY)
    let violation = false;
    if(distanceToNest <= NDZRadius){
      violation = true;
    }
    console.log(drone.serialNumber[0], distanceToNest, violation)
  }
}
getNDZViolators()

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