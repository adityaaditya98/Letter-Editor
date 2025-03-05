import axios from "axios";

const API_BASE_URL = "https://letter-editor.onrender.com";

export const getUser = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/auth/user`, { withCredentials: true });
    return res.data;
  } catch {
    return null;
  }
};

export const loginWithGoogle = () => {
  window.location.href = `${API_BASE_URL}/auth/google`;
};

export const logout = async () => {
  await axios.get(`${API_BASE_URL}/auth/logout`, { withCredentials: true });
};
