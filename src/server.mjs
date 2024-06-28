import express from 'express';
import { Command, InvalidArgumentError } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEV_PORT = 8080;
export const PROD_HTTP_PORT = 80;
export const PROD_HTTPS_PORT = 443;

export class Server {
  constructor(program, params, app, express) {
    program
      .name('hoally')
      .description('Webapp for an HOA forum')
      .option(
        '--port <integer>',
        'Web server port',
        (value) => {
          const portNumber = Number(value);
          if (
            isNaN(portNumber) ||
            !Number.isInteger(portNumber) ||
            portNumber <= 0
          ) {
            throw new InvalidArgumentError('Not a positive integer.');
          }
          return portNumber;
        },
        DEV_PORT,
      )
      .option('--https', 'Use https protocol')
      .option('--prod', 'Prod environment (default port 80 or 443 for https)');

    program.parse(params);
    this.options = program.opts();
    this.app = app;
    this.express = express;
  }

  start() {
    const PROD_PORT = this.options.https ? PROD_HTTPS_PORT : PROD_HTTP_PORT;
    const port = this.options.prod ? PROD_PORT : this.options.port;

    this.app.use(
      this.express.static(path.join(__dirname, '..', 'app', 'build')),
    );

    this.app.get('/ping', (request, response) => {
      // Used only for testing and server health checks.
      return response.send('OK');
    });

    this.app.use((req, res, next) => {
      res.sendFile(path.join(__dirname, '..', 'app', 'build', 'index.html'));
    });

    this.app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  }
}

export function startServer() {
  const app = express();
  const program = new Command();

  const server = new Server(program, process.argv, app, express);
  server.start();
}
