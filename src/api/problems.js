import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:4000",
});

export async function getProblems() {
  const { data } = await api.get("/api/problems");
  return data;
}

export async function getProblem(id) {
  const { data } = await api.get(`/api/problems/${id}`);
  return data;
}
