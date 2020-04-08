// Req to backend made here using axios
import axios from "axios";
import { setAlert } from "./alert";

// Import setAuthToken (use to check for token and send with req header, else delete headers )
import setAuthToken from "../utils/setAuthToken";

// Import types
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
} from "./types";

// Load user
export const loadUser = () => async (dispatch) => {
  // Check if token is available
  if (localStorage.token) {
    // Send token to global header using setAuthToken
    setAuthToken(localStorage.token);
  }

  // Make req to load user
  try {
    const res = await axios.get("/api/auth");
    dispatch({
      type: USER_LOADED,
      payload: res.data,
    });
  } catch (error) {
    dispatch({
      type: AUTH_ERROR,
    });
  }
};

// Register the user
export const register = ({ name, email, password }) => async (dispatch) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const body = JSON.stringify({ name, email, password });

  try {
    const res = await axios.post("/api/users", body, config);
    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data,
    });
  } catch (err) {
    const errors = err.response.data.errors;
    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }
    dispatch({
      type: REGISTER_FAIL,
    });
  }
};
