import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/auth",
});

// REGISTER -> envoie password (backend hash)
export const registerUser = (data) => API.post("/register", data);

// LOGIN
export const loginUser = (data) => API.post("/login", data);