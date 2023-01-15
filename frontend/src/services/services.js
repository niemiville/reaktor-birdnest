import axios from 'axios'
const violationsUrl = 'http://localhost:3030/api/violations'

const getViolations = async () => {
  const violations = await axios.get(violationsUrl);
  return violations.data;
}

export { getViolations };