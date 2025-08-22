import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // Your backend base URL
});

export const signup = async (formData) => {
  const { data } = await API.post("/auth/register", formData);
  return data;
};

export const signin = async (formData) => {
  const { data } = await API.post("/auth/login", formData);
  return data;
};
