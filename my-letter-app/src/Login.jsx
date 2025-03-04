import React, { useEffect, useState } from "react";
import { getUser, loginWithGoogle, logout } from "./api";

const Login = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  return (
    <div className="container">
      {user ? (
        <div>
          <h2>Welcome, {user.displayName}!</h2>
          <img src={user.photos[0].value} alt="Profile" />
          <button onClick={() => { logout(); setUser(null); }}>Logout</button>
        </div>
      ) : (
        <button onClick={loginWithGoogle}>Sign in with Google</button>
      )}
    </div>
  );
};

export default Login;
