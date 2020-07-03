import { Application } from 'probot';
import { handleAction } from './service';

export = (app: Application): void => {
  app.on('pull_request_review', handleAction);
};
