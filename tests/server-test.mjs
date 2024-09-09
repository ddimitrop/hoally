import { Command } from 'commander';
import {
  DEV_PORT,
  PROD_HTTP_PORT,
  //  PROD_HTTPS_PORT,
  parseOptions,
  Server,
} from '../src/server.mjs';

describe('hoally Server', () => {
  let mockApp;
  let mockExpress;
  let program;
  let errStr;
  let server;
  let mockResponse;
  let mockConnection;
  let mockApi;
  const staticResult = {};

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    program.configureOutput({
      writeErr: (str) => (errStr = str),
    });

    mockApp = jasmine.createSpyObj('expressApp', ['get', 'listen', 'use']);
    mockExpress = jasmine.createSpyObj('express', ['static']);
    mockResponse = jasmine.createSpyObj('respones', ['send', 'sendFile']);
    mockExpress.static.and.returnValue(staticResult);
    mockConnection = {};
    mockApi = { init: () => {} };
  });

  function serverOptions(args = '') {
    return parseOptions(program, args.split(' '));
  }

  function startServer(args = '') {
    server = new Server(
      parseOptions(program, args.split(' ')),
      mockApp,
      mockExpress,
      mockConnection,
      mockApi,
    );
    server.start();
  }

  describe('command line arguements', () => {
    it('when missing uses default params', () => {
      expect(serverOptions()).toEqual({ port: DEV_PORT });
    });

    it('will parse them as params ', () => {
      expect(
        serverOptions('node hoally.mjs --https --prod --port 9000'),
      ).toEqual({
        https: true,
        prod: true,
        port: 9000,
      });
    });

    it('will fail when port is not numeric', () => {
      expect(() => serverOptions('node hoally.mjs --port x')).toThrow();
      expect(errStr).toContain('Not a positive integer');
    });
  });

  describe('listens to port', () => {
    it('handles ping requests', () => {
      startServer();
      expect(mockApp.get).toHaveBeenCalledWith('/ping', jasmine.any(Function));
      const pingHandlerCallback = mockApp.get.calls.first().args[1];
      pingHandlerCallback(undefined, mockResponse);
      expect(mockResponse.send).toHaveBeenCalledWith('OK');
    });

    it('default for development', () => {
      startServer();
      expect(mockApp.listen).toHaveBeenCalledWith(DEV_PORT, jasmine.anything());
    });

    it('overriden for development', () => {
      startServer('node hoally.mjs --port 9000');
      expect(mockApp.listen).toHaveBeenCalledWith(9000, jasmine.anything());
    });

    it('http for production', () => {
      startServer('node hoally.mjs --prod');
      expect(mockApp.listen).toHaveBeenCalledWith(
        PROD_HTTP_PORT,
        jasmine.anything(),
      );
    });

    /* No tests for now 
    it('https for production', () => {
      startServer('node hoally.mjs --prod --https');
      expect(mockApp.listen).toHaveBeenCalledWith(
        PROD_HTTPS_PORT,
        jasmine.anything(),
      );
    });*/

    it('ignores port parameter for production', () => {
      startServer('node hoally.mjs --prod --port 9000');
      expect(mockApp.listen).toHaveBeenCalledWith(
        PROD_HTTP_PORT,
        jasmine.anything(),
      );
    });
  });

  describe('ingregrates with react', () => {
    it('forwards to the react router', () => {
      startServer();
      expect(mockExpress.static).toHaveBeenCalledWith(
        jasmine.stringMatching('build'),
      );
      expect(mockApp.use).toHaveBeenCalledWith(staticResult);
      const routerCallback = mockApp.use.calls.mostRecent().args[0];
      routerCallback(undefined, mockResponse, null);
      expect(mockResponse.sendFile).toHaveBeenCalledWith(
        jasmine.stringMatching('index.html'),
      );
    });
  });
});
