import express from 'express';
import fs from 'fs';
import { Command, InvalidArgumentError } from 'commander';
import { Crypto } from './utils/crypto.mjs';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';
import { hoaUserApi } from './db/hoauser.mjs';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createTransport } from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEV_PORT = 8080;
export const PROD_HTTP_PORT = 80;
export const PROD_HTTPS_PORT = 443;

export class Server {
  constructor(options, app, express, connection, api) {
    this.options = options;
    this.app = app;
    this.express = express;
    this.connection = connection;
    this.api = api;
  }

  start() {
    const PROD_PORT = this.options.https ? PROD_HTTPS_PORT : PROD_HTTP_PORT;
    const port = this.options.prod ? PROD_PORT : this.options.port;

    // Provide access to the react's app static files.
    this.app.use(
      this.express.static(path.join(__dirname, '..', 'app', 'build')),
    );

    this.app.use(express.json());

    this.app.get('/ping', (request, response) => {
      // Used only for testing and server health checks.
      return response.send('OK');
    });

    this.api.init(this.connection, this.app);

    if (this.options.proxy) {
      // Proxying to react live server for fast development.
      this.app.use(cors());
      this.app.options('*', cors());
      console.log(`Will proxy for development to app ${this.options.proxy}`);
      this.app.use(
        createProxyMiddleware({
          target: this.options.proxy,
          changeOrigin: true,
        }),
      );
    } else {
      // In production forward requests to the react app.
      this.app.use((req, res, next) => {
        res.sendFile(path.join(__dirname, '..', 'app', 'build', 'index.html'));
      });
    }

    this.app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  }
}

export function parseOptions(program, args) {
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
    .option('--proxy <string>', 'Proxy for development')
    .option('--prod', 'Prod environment (default port 80 or 443 for https)');
  program.parse(args);

  return program.opts();
}

export function prepareConnection(options) {
  const SECRETS_DIRECTORY = '/run/secrets/hoally';
  const environment = options.prod ? 'prod' : 'dev';

  const cryptoSecrets = fs.readFileSync(
    `${SECRETS_DIRECTORY}/hoa-crypto`,
    'utf8',
  );
  const cryptoCredentials = cryptoSecrets
    .split('\n')
    .map((line) => line.split(':'))
    .find((row) => row[0] === environment);
  if (!cryptoCredentials) throw Error('No hoa-crypto secrets file');
  const [, secret] = cryptoCredentials;
  const crypto = new Crypto(secret);

  const dbSecrets = fs.readFileSync(`${SECRETS_DIRECTORY}/hoadb`, 'utf8');
  const dbCredentials = dbSecrets
    .split('\n')
    .map((line) => line.split(':'))
    .find((row) => row[0] === environment);
  if (!dbCredentials) throw Error('No hoadb secrets file');
  const [, userName, password] = dbCredentials;
  const DB_NAME = 'hoadb';

  const sql = postgres({
    database: DB_NAME,
    username: userName,
    password: password,
  });

  const emailSecrets = fs.readFileSync(
    `${SECRETS_DIRECTORY}/hoa-email`,
    'utf8',
  );
  const emailCredentials = emailSecrets
    .split('\n')
    .map((line) => line.split(':'))
    .find((row) => row[0] === environment);
  if (!emailCredentials) throw Error('No hoa-email secrets file');
  const [, emailName, emailPassword] = emailCredentials;
  const EMAIL_SERVICE = 'gmail';
  const emailAddress = `${emailName}@gmail.com`;

  console.log(emailName, emailPassword, emailAddress);

  const transporter = createTransport({
    service: EMAIL_SERVICE,
    auth: {
      user: emailName,
      pass: emailPassword,
    },
  });

  const sendMail = (to, subject, html) => {
    const mailOptions = { from: emailAddress, to, subject, html };
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
  };

  return { crypto, sql, sendMail };
}

const api = {
  init: (connection, app) => {
    hoaUserApi(connection, app);
  },
};

export function startServer() {
  const app = express();
  const program = new Command();

  const options = parseOptions(program, process.argv);
  const connection = prepareConnection(options);

  const server = new Server(options, app, express, connection, api);
  server.start();
  return server;
}
