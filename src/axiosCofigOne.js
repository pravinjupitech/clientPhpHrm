import axios from "axios";

const instance = axios.create({
  baseURL: "https://node-second.rupioo.com/",
  // baseURL: "http://174.138.68.198:4000/"
});

export default instance;
