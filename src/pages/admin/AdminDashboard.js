// import { API, Auth } from "aws-amplify";
// import { useEffect, useState } from "react";

import TokenDecoder from "../../components/TokenDecoder";

function AdminDashboard() {
  // const [tmp, setTmp] = useState();

  // const fetch = async () => {
  //   const response = await API.get("ccApiFront", `/user/auth`);
  //   setTmp(response);
  // };

  // Auth.currentSession().then((res) => {
  //   let accessToken = res.getAccessToken();
  //   let jwt = accessToken.getJwtToken();

  //   //You can print them to see the full objects
  //   console.log(`myAccessToken: ${JSON.stringify(accessToken)}`);
  //   console.log(`myJwt: ${jwt}`);
  // });

  // useEffect(() => {
  //   fetch();
  // }, []);

  return (
    <>
      <h1>Admin Dashboard</h1>
      <TokenDecoder />
      {/* {tmp ? (
        <div>
          <p>Project ID: {tmp}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )} */}
    </>
  );
}

export default AdminDashboard;
