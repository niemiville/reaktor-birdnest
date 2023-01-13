import axios from 'axios'
const dronesUrl = 'http://localhost:3030/api/drones'
const pilotUrl = 'http://localhost:3030/api/pilot'

const getAllDrones = async () => {
  const request = axios.get(dronesUrl)
  const response = await request
  return response
}

const getPilotInfo = async (serialNumber) => {
  const request = axios.get(`${pilotUrl}/${serialNumber}`)
  const response = await request
  return response
}

export { getAllDrones, getPilotInfo };