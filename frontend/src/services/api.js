import axios from "axios";

export const getPortfolio = async () => {
  const res = await axios.get("http://localhost:5000/portfolio");
  return res.data;
};