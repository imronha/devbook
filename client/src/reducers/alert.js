// Function that takes in a piece of state related to alerts and actions

import { SET_ALERT, REMOVE_ALERT } from "../actions/types";

const initialState = [];

export default function (state = initialState, action) {
  // Destructure/pull out type and payload from action
  const { type, payload } = action;

  switch (type) {
    case SET_ALERT:
      return [...state, payload];
    case REMOVE_ALERT:
      // Filter through and return all alerts except the one that matches payload
      return state.filter((alert) => alert.id !== payload);
    default:
      return state;
  }
}
