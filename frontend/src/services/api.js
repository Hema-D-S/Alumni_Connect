import axios from "axios";
import { getApiUrl, getBaseUrl, getWsUrl } from "../config/environment";

// Create axios instance with dynamic base URL
const API = axios.create({
  baseURL: getApiUrl(),
});

// Export URL helpers for use in components
export { getApiUrl, getBaseUrl, getWsUrl };

export const signup = async (formData) => {
  const { data } = await API.post("/auth/register", formData);
  return data;
};

export const signin = async (formData) => {
  const { data } = await API.post("/auth/login", formData);
  return data;
};
