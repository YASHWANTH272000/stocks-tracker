import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export const getPortfolio = async () => {
  const res = await axios.get(`${API_URL}/portfolio`);
  return res.data;
};