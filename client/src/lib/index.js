const dev = process.env.REACT_APP_DEV_URL;
const prod = process.env.REACT_APP_PROD_URL;

export const baseURL =
  window.location.hostname.split(":")[0] === "localhost" ||
  window.location.hostname.includes("192")
    ? dev
    : prod;