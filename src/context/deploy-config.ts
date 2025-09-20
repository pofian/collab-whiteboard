// Set this to false to run the app locally
const serverOnline: boolean = true;

const localServerUrl = "ws://localhost:8080";
const remoteServerUrl = "https://collab-whiteboard-owtq.onrender.com/";

export const serverUrl = serverOnline ? remoteServerUrl : localServerUrl;
