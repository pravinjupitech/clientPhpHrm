import axios from "axios";

const instance = axios.create({
  baseURL: "https://nodejs.rupioo.com/",
  // baseURL: "http://13.201.119.216:8050",
  // baseURL: "http://localhost:8050",
  // baseURL: "https://api.luxand.cloud",
});

export default instance;
