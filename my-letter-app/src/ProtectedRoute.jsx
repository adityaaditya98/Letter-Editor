import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getUser } from "./api";

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;