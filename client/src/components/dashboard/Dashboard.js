// Main dashboard component
// Fetch all data using actions and pass down to other components
import React, { useEffect, Fragment } from "react";
import PropTypes from "prop-types";
import Spinner from "../layout/Spinner";
import { Link } from "react-router-dom";

// Connect dashboard component to redux
import { connect } from "react-redux";

// Import actions
import { getCurrentProfile, deleteAccount } from "../../actions/profile";
import DashboardActions from "./DashboardActions";

import Experience from "./Experience";
import Education from "./Education";

const Dashboard = ({
  getCurrentProfile,
  deleteAccount,
  auth: { user },
  profile: { profile, loading },
}) => {
  useEffect(() => {
    getCurrentProfile();
  }, [getCurrentProfile]);

  // If loading+profile = true, show spinner. Else show dashboard
  return loading && profile === null ? (
    <Spinner />
  ) : (
    <Fragment>
      <h1 className="large text-primary">Dashboard</h1>
      <p className="lead"></p>
      <i className="fas fa-user">Welcome {user && user.name}</i>
      {profile !== null ? (
        <Fragment>
          <DashboardActions />

          <Experience experience={profile.experience} />
          <Education education={profile.education} />
          <div className="my-2">
            <button className="btn btn-danger" onClick={() => deleteAccount()}>
              <i className="fas fa-user-minus">Delete My Account</i>
            </button>
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <p>Please set up your profile</p>
          <Link to="/create-profile" className="btn btn-primary my-1">
            Create Profile
          </Link>
        </Fragment>
      )}
    </Fragment>
  );
};

Dashboard.propTypes = {
  getCurrentProfile: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  profile: PropTypes.object.isRequired,
  deleteAccount: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  profile: state.profile,
});

export default connect(mapStateToProps, { getCurrentProfile, deleteAccount })(
  Dashboard
);
