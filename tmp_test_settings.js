const http = require("http");

async function run() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "kidayos2014@gmail.com", password: "12345678" })
  });
  
  if (!loginRes.ok) {
    console.error("Login failed:", await loginRes.text());
    return;
  }
  
  const authData = await loginRes.json();
  const token = authData.token;
  
  console.log("Logged in successfully. Token length:", token.length);
  
  const putRes = await fetch("http://localhost:3000/api/admin/settings", {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ key: "app_name", value: "Prime Addis Updated", type: "string" })
  });
  
  if (putRes.ok) {
    console.log("Success! Settings updated:", await putRes.json());
  } else {
    console.error(`HTTP Status: ${putRes.status}`);
    console.error("Error body:", await putRes.text());
  }
}

run().catch(console.error);
