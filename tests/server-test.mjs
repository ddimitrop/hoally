import { Command } from 'commander';
import {
  DEV_PORT,
  PROD_HTTP_PORT,
  PROD_HTTPS_PORT,
  Server,
} from '../src/server.mjs';

describe('hoally Server', () => {
  describe('command line arguements', () => {
    let errStr;

    function serverOptions(args = '') {
      const mockApp = jasmine.createSpyObj('expressApp', ['get', 'listen']);
      const program = new Command();
      program.exitOverride();
      program.configureOutput({
        writeErr: (str) => (errStr = str),
      });
      new Server(program, args.split(' '), mockApp);
      return program.opts();
    }

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
    let mockApp;
    function startServer(args = '') {
      mockApp = jasmine.createSpyObj('expressApp', ['get', 'listen']);
      const program = new Command();
      const server = new Server(program, args.split(' '), mockApp);
      server.start();
    }

    it('handles ping requests', () => {
      startServer();
      expect(mockApp.get).toHaveBeenCalledWith('/ping', jasmine.any(Function));
      const mockResponse = jasmine.createSpyObj('respones', ['send']);
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

    it('https for production', () => {
      startServer('node hoally.mjs --prod --https');
      expect(mockApp.listen).toHaveBeenCalledWith(
        PROD_HTTPS_PORT,
        jasmine.anything(),
      );
    });

    it('ignores port parameter for production', () => {
      startServer('node hoally.mjs --prod --port 9000');
      expect(mockApp.listen).toHaveBeenCalledWith(
        PROD_HTTP_PORT,
        jasmine.anything(),
      );
    });
  });
});
