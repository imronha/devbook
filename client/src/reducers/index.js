// Root reducer
import { combineReducers } from "redux";

// Import other reducers
import alert from "./alert";
import auth from "./auth";
import profile from "./profile";
import post from "./post";

export default combineReducers({
  alert,
  auth,
  profile,
  post,
});
