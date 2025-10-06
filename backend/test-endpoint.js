const http = require("http");

// Test if the server is responding
function testServer() {
  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/forgot-password",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const data = JSON.stringify({
    email: "test@example.com",
  });

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });

    res.on("end", () => {
      console.log("Response body:", body);
    });
  });

  req.on("error", (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(data);
  req.end();
}

testServer();
