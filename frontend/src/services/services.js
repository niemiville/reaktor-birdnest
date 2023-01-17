import axios from 'axios'
const violationsUrl = 'https://birdnest-api-vn.onrender.com/api/violations/'

const getViolations = async () => {
  const violations = await axios.get(violationsUrl);
  return violations.data;
}

export { getViolations };