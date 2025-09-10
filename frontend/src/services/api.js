import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export const signup = async (formData) => {
  const { data } = await API.post("/auth/register", formData);
  return data;
};

export const signin = async (formData) => {
  const { data } = await API.post("/auth/login", formData);
  return data;
};
