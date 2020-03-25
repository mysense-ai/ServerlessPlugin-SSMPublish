import { ServerlessInstance,
  // ,
  // SSMParam
} from './types';
import {
  // compareParams,
  evaluateEnabled,
  //  validateParams
  } from './util';

const throwFunction = (message: string): void => { throw new Error(message); };

describe('It should correctly validate the settings', () => {

  test('It should throw if no ssmPublish settings are passed', () => {
    const testEvalute = () => evaluateEnabled({ } as ServerlessInstance['service']['custom'], throwFunction); // tslint:disable-line:no-object-literal-type-assertion
    expect(testEvalute).toThrow();
  });

  test('It should throw if enabled is not true or false', () => {
    const testEvalute = () => evaluateEnabled({ ssmPublish: { enabled: 'bla'}} as ServerlessInstance['service']['custom'] , throwFunction); // tslint:disable-line:no-object-literal-type-assertion
    expect(testEvalute).toThrow(); // tslint:disable-line:no-object-literal-type-assertion
  });

  test('It should return false if enabled is set to false', () => {
    expect(evaluateEnabled({ ssmPublish: { enabled: false}} as ServerlessInstance['service']['custom'] , throwFunction)).toEqual(false); // tslint:disable-line:no-object-literal-type-assertion
  });

  test('It should return true if enabled does not exist', () => {
    expect(evaluateEnabled({ ssmPublish: { }} as ServerlessInstance['service']['custom'] , throwFunction)).toEqual(true); // tslint:disable-line:no-object-literal-type-assertion
  });

  test('It should return true if enabled is true', () => {
    expect(evaluateEnabled({ ssmPublish: { enabled: true }} as ServerlessInstance['service']['custom'] , throwFunction)).toEqual(true); // tslint:disable-line:no-object-literal-type-assertion
  });
});
