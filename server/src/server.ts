import initApp from "./index";
import fs from "fs";
import https from "https";

const port = Number(process.env.PORT) || 3000;
const keyPath = process.env.SSL_KEY_PATH;
const certPath = process.env.SSL_CERT_PATH;

const shouldUseHttps = Boolean(
  process.env.NODE_ENV === "production"
  && keyPath
  && certPath
  && fs.existsSync(keyPath)
  && fs.existsSync(certPath),
);

initApp().then((app) => {
  if (shouldUseHttps && keyPath && certPath) {
    const credentials = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    https.createServer(credentials, app).listen(port, () => {
      console.log(`App listening at https://localhost:${port}`);
    });
    return;
  }

  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
});