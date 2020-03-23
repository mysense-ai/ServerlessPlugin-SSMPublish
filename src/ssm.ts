import { SSM } from 'aws-sdk';
import Serverless from 'serverless';

export const getSSM = (serverless: Serverless) =>
  new SSM({
    region: serverless.service.provider.region,
    apiVersion: '2014-11-06',
  });
