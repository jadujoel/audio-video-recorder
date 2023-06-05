import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

// The directory you want to serve
const dirToServe = './';

// Read the certificate and private key
const options = {
  key: fs.readFileSync('localhost-key.pem'),  // Replace with the path to your private key
  cert: fs.readFileSync('localhost.pem'),  // Replace with the path to your certificate
};

const server = https.createServer(options, (req, res) => {
  let filePath: string;

  if (req.url === '/' || req.url === undefined) {
    // If no specific file is requested, serve index.html
    filePath = path.join(dirToServe, 'index.html');
  } else {
    // Resolve the path to the requested file
    filePath = path.join(dirToServe, req.url);
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // File not found or other error
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }

    // File found, send it to the client
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(data);
  });
});

// The port on which the server will listen
const port = 8443;  // 8443 is a common port for HTTPS

server.listen(port, () => {
  console.log(`Server is running and serving the directory ${dirToServe} at https://localhost:${port}`);
});
