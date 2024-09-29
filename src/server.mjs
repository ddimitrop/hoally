import express from 'express';
import fs from 'fs';
import { Command, InvalidArgumentError } from 'commander';
import { Crypto } from './utils/crypto.mjs';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';
import { hoaUserApi } from './db/hoauser.mjs';
import { communityApi } from './db/community.mjs';
import { memberApi } from './db/member.mjs';
import { topicApi } from './db/topic.mjs';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createTransport } from 'nodemailer';
import http from 'http';
import https from 'https';
import { forceDomain } from 'forcedomain';

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

    // Redirect other domains to www
    if (this.options.forcedomain) {
      const options = {
        hostname: this.options.forcedomain,
      };
      if (!this.options.prod) {
        options.port = port;
      }
      if (this.options.https) {
        options.protocol = 'https';
      }
      this.app.use(forceDomain(options));
    }

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

    if (this.options.https) {
      const certPath =
        this.options.cert || '/etc/letsencrypt/live/www.hoally.net/';

      const certOptions = {
        key: fs.readFileSync(`${certPath}privkey.pem`),
        cert: fs.readFileSync(`${certPath}fullchain.pem`),
      };

      // Redirect http to https.
      const httpPort = this.options.prod ? PROD_HTTP_PORT : port + 2;
      const httpApp = this.express();
      httpApp.get('*', function (req, res, next) {
        const host = req.headers.host.replace(`:${httpPort}`, `:${port}`);
        const path = req.path;
        res.redirect(301, `https://${host}${path}`);
      });
      http.createServer(httpApp).listen(httpPort, function () {
        console.log(`Redirecting http port ${httpPort} to ${port}`);
      });

      const httpsServer = https.createServer(certOptions, this.app);
      httpsServer.listen(port);
      httpsServer.on('listening', (e) => {
        console.log(`Listening for https on port ${port}`);
      });
    } else {
      this.app.listen(port, () => {
        console.log(`Listening on port ${port}`);
      });
    }
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
    .option('--prod', 'Prod environment (default port 80 or 443 for https)')
    .option('--cert <string>', 'Path to the https cetificate directory')
    .option('--secrets <string>', 'Path to the secrets directory')
    .option('--forcedomain <string>', 'Redirect request to domain');
  program.parse(args);

  return program.opts();
}

export function prepareConnection(options) {
  const SECRETS_DIRECTORY = options.secrets || '/usr/lib/hoally/run/secrets';
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
  const [, username, password, host] = dbCredentials;
  const database = 'hoadb';

  const sql = postgres({
    database,
    username,
    password,
    host,
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
    communityApi(connection, app);
    memberApi(connection, app);
    topicApi(connection, app);
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
