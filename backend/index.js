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
const INFO_PERSIST_TIME_MS = 2 * 60 * 1000; //10 * 60 * 1000
var NDZViolators = []

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(requestLogger)

const getDrones = async () => {
  try {
    const response = await axios.get(GET_DRONES_LINK);
		return await parseStringPromise(response.data);
  } catch (error) {
    console.error(error);
  }
}

const getPilotInfo = async (serialNumber) => {
  try {
    return await axios.get(GET_PILOT_LINK + serialNumber);
  } catch (error) {
    console.error(error);
  }
}

const getDistanceBetweenTwoPoints = (x1, y1, x2, y2) => {
  return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
}

const getNDZViolators = async () => {
  const droneData = await getDrones()
  console.log(droneData.report.capture[0]['$'].snapshotTimestamp, NDZViolators.length)
  for(let drone of droneData.report.capture[0].drone){
    const distanceToNest = getDistanceBetweenTwoPoints(originX, originY, drone.positionX, drone.positionY)
    if(distanceToNest <= NDZRadius){
      const i = NDZViolators.findIndex(d => d.serialNumber === drone.serialNumber[0])
      if (i > -1) {
        NDZViolators[i].lastSeen = droneData.report.capture[0]['$'].snapshotTimestamp
        if(NDZViolators[i].closestDistanceToNest > distanceToNest){
          NDZViolators[i].closestDistanceToNest = distanceToNest
        }
      } else {
        NDZViolators.push({
          serialNumber: drone.serialNumber[0], 
          lastSeen: droneData.report.capture[0]['$'].snapshotTimestamp,
          closestDistanceToNest: distanceToNest
          })
        addViolatorInfo(drone.serialNumber[0])
      }
    }
  }
}

const scanForViolators = () => {
  const waitTime = 7500;
  setTimeout(() => { getNDZViolators(); deleteOldViolators(); console.log(NDZViolators); scanForViolators()}, waitTime);
}
scanForViolators()

const deleteOldViolators = () => {
  for(let i = 0; i < NDZViolators.length; i++){
    if((Date.parse(new Date) - Date.parse(NDZViolators[i].lastSeen)) > INFO_PERSIST_TIME_MS){
      NDZViolators.splice(i, 1)
    }
  }
}

const addViolatorInfo = (serialNumber) => {
  getPilotInfo(serialNumber).then((pilotInfo) => {
    const i = NDZViolators.findIndex(violator => violator.serialNumber === serialNumber);
    NDZViolators[i].firstName = pilotInfo.data.firstName;
    NDZViolators[i].lastName = pilotInfo.data.lastName;
    NDZViolators[i].phoneNumber = pilotInfo.data.phoneNumber;
    NDZViolators[i].email = pilotInfo.data.email;
  });
}

const manageViolators = () => {
  //TODO
}

app.get('/api/violations', (request, response) => {
  response.send(NDZViolators)
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