// Takes in token and adds to header if available
// If not delete from headers
// This will send a token with every request if available

// Add global header using axios
import axios from "axios";

const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["x-auth-token"] = token;
  } else {
    delete axios.defaults.headers.common["x-auth-token"];
  }
};

export default setAuthToken;
