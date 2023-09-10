import { API } from "aws-amplify";
import { Auth } from "aws-amplify";

const API_NAME = "ccApiFront";

const getAuthHeaders = async () => {
  try {
    const session = await Auth.currentSession();
    const idToken = session?.getIdToken()?.getJwtToken();

    if (idToken) {
      return {
        headers: {
          Authorization: `Cognito ${idToken}`,
        },
      };
    }

    console.warn("No ID token found");
    return {};
  } catch (error) {
    console.error("Error getting token", error);
    return {};
  }
};

const makeRequest = async (method, path, body, additionalConfig) => {
  const authHeaders = await getAuthHeaders();
  const mergedConfig = { ...additionalConfig, ...authHeaders };

  if (body) {
    mergedConfig.body = body;
  }

  return API[method](API_NAME, path, mergedConfig);
};

const apiWrapper = {
  get: (path, config) => makeRequest("get", path, null, config),
  post: (path, body, config) => makeRequest("post", path, body, config),
  put: (path, body, config) => makeRequest("put", path, body, config),
  delete: (path, config) => makeRequest("del", path, null, config),
};

export default apiWrapper;
