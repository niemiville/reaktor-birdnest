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
const originX = 250000.0; //Birdnest coordinate X
const originY = 250000.0; //Birdnest coordinate Y
const NDZRadius = 100000.0; //No drone zone radius
const REFRESH_INTERVAL = parseInt(process.env.REFRESH_INTERVAL, 10) || 10000; //How often data will be fetched from API.
const INFO_PERSIST_TIME_MS = parseInt(process.env.INFO_PRESIST_TIME_MS, 10) || (10 * 60 * 1000); // Default 10 * 60 * 1000
var NDZViolators = []

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(requestLogger)

/**
 * Gets current NDZ violators from API
 * @returns current NDZ violating drones
 */
const getDrones = async () => {
  try {
    const response = await axios.get(GET_DRONES_LINK);
		return await parseStringPromise(response.data);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Gets pilot information from the API
 * @param {*} serialNumber 
 * @returns pilot information
 */
const getPilotInfo = async (serialNumber) => {
  try {
    return await axios.get(GET_PILOT_LINK + serialNumber);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Calculates distance between two 2D points.
 * @param {*} x1 
 * @param {*} y1 
 * @param {*} x2 
 * @param {*} y2 
 * @returns 
 */
const getDistanceBetweenTwoPoints = (x1, y1, x2, y2) => {
  return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
}

/**
 * Updates the NDZViolators array with current violators.
 */
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

/**
 * Deletes the old violator info from NDZViolators array
 * Default deletion time is after 10 minutes
 */
const deleteOldViolators = () => {
  for(let i = 0; i < NDZViolators.length; i++){
    if((Date.parse(new Date) - Date.parse(NDZViolators[i].lastSeen)) > INFO_PERSIST_TIME_MS){
      NDZViolators.splice(i, 1)
    }
  }
}

/**
 * Ads NDZ violators first name, last name, phone number and email 
 * to the NDZViolators array of objects
 * @param {*} serialNumber 
 */
const addViolatorInfo = (serialNumber) => {
  getPilotInfo(serialNumber).then((pilotInfo) => {
    const i = NDZViolators.findIndex(violator => violator.serialNumber === serialNumber);
    NDZViolators[i].firstName = pilotInfo.data.firstName;
    NDZViolators[i].lastName = pilotInfo.data.lastName;
    NDZViolators[i].phoneNumber = pilotInfo.data.phoneNumber;
    NDZViolators[i].email = pilotInfo.data.email;
  });
}

/**
 * Main loop
 * Manages the violators in NDZViolator array
 */
const scanForViolators = () => {
  setTimeout(() => { 
    try{
    getNDZViolators(); 
    deleteOldViolators(); 
    //console.log(NDZViolators); 
    scanForViolators();
    } catch (error){
      console.error(error);
      scanForViolators();
    }
  }, REFRESH_INTERVAL);
}
scanForViolators(); 

/**
 * Get method for client to get the current violators
 */
app.get('/api/violations', (request, response) => {
  response.send(NDZViolators)
})

const unknownEndpoint = (request, response) => {
response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = parseInt(process.env.PORT, 10) || 3030;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

module.exports = index;