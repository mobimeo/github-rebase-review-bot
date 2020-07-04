import { createHash } from 'crypto';
import nock from 'nock';
// Requiring our app implementation
import app from '../src';
import { Probot } from 'probot';
import { readFile } from 'fs';
import { join } from 'path';
import * as repository from '../src/repository';

// suppress deprecation warning from probot
global.console.warn = jest.fn();

jest.mock('../src/repository');
const setSpy = jest.spyOn(repository, 'set');
const getSpy = jest.spyOn(repository, 'get');

describe('reviews', () => {
  let probot: any;
  let mockCert: string;

  beforeAll((done: (err?: Error) => void) => {
    readFile(
      join(__dirname, 'fixtures/mock-cert.pem'),
      (err: Error | null, cert: Buffer) => {
        if (err) return done(err);
        mockCert = cert.toString();
        done();
      },
    );
  });

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({ id: 123, cert: mockCert });

    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' });

    // Load our app into probot
    probot.load(app);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    jest.resetAllMocks();
  });

  describe('approved', () => {
    test('writes diff hash to store', async done => {
      const diff = 'some diff';
      // Test that diff is retrieved
      nock('https://api.github.com')
        .get('/repos/blub/bla/pulls/1')
        .reply(200, diff);

      const payload = require('./fixtures/submitted.json');
      // Receive a webhook event
      await probot.receive({ name: 'pull_request_review', payload });
      const url = 'https://api.github.com/repos/blub/bla/pulls/1';
      const hash = createHash('sha256').update(diff).digest('hex');
      done(expect(setSpy).toHaveBeenCalledWith(url, hash));
    });
  });

  describe('changes requested', () => {
    test('does not write diff hash to store', async done => {
      // diff
      nock('https://api.github.com')
        .get('/repos/blub/bla/pulls/1')
        .reply(200, 'mock diff');

      const payload = require('./fixtures/changes_requested.json');
      // Receive a webhook event
      await probot.receive({ name: 'pull_request_review', payload });
      done(expect(setSpy).not.toHaveBeenCalled());
    });
  });

  describe('dismissed', () => {
    test('terminates on diff mismatch', async done => {
      // diff
      nock('https://api.github.com')
        .get('/repos/blub/bla/pulls/1')
        .reply(200, 'mock diff');

      getSpy.mockResolvedValueOnce('old hash');

      const payload = require('./fixtures/dismissed.json');
      // Receive a webhook event
      await probot.receive({ name: 'pull_request_review', payload });
      // test will hang, if the unmocked reviews api is called
      done(expect(getSpy).toHaveBeenCalled());
    });

    test('issues a review on diff match', async done => {
      const diff = 'mock diff';
      // diff
      nock('https://api.github.com')
        .get('/repos/blub/bla/pulls/1')
        .reply(200, diff);

      const hash = createHash('sha256').update(diff).digest('hex');
      getSpy.mockResolvedValueOnce(hash);

      nock('https://api.github.com')
        .post('/repos/blub/bla/pulls/1/reviews', body => {
          done(
            expect(body).toMatchObject({
              body: 'Dismissal dismissed, diff did not change!',
              event: 'APPROVE',
            }),
          );
          return true;
        })
        .reply(201);

      const payload = require('./fixtures/dismissed.json');
      // Receive a webhook event
      await probot.receive({ name: 'pull_request_review', payload });
    });
  });
});
