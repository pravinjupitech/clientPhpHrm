import axios from "axios";

const instance = axios.create({
  // baseURL: "https://node.rupioo.com/",
  baseURL:
    "https://linen-cod-497801.hostingersite.com/demo/demo/api/ApiCommonController/",
  // baseURL: "https://customer-node.rupioo.com/",
});

export default instance;
