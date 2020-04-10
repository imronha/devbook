// Profile Actions

import axios from "axios";
// import { setAlert } from "./alert";

// Import Types
import { GET_PROFILE, PROFILE_ERROR } from "./types";

// Get current users profile. Send req to backend /api/proifle/me using axios
export const getCurrentProfile = () => async (dispatch) => {
  try {
    const res = await axios.get("/api/profile/me");

    dispatch({
      type: GET_PROFILE,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.data.msg, status: err.response.status },
    });
  }
};
