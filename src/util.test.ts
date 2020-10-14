import { ServerlessInstance, SSMParamTypes } from './types';
import { compareParams, evaluateEnabled, validateParams } from './util';

const throwFunction = (message: string): void => { throw new Error(message); };
const logFunction = (message: string): void => { console.log(message); }; // tslint:disable-line:no-console

describe('evaluateEnabled should correctly validate if the plugin is enabled', () => {

  test('It should throw if no ssmPublish settings are passed', () => {
    const testEvaluate = () => evaluateEnabled({ } as ServerlessInstance['service']['custom'], throwFunction); // tslint:disable-line:no-object-literal-type-assertion
    expect(testEvaluate).toThrow();
  });

  test('It should throw if enabled is a string and not true or false', () => {
    const testEvaluate = () => evaluateEnabled({ ssmPublish: { enabled: 'bla'}} as ServerlessInstance['service']['custom'] , throwFunction); // tslint:disable-line:no-object-literal-type-assertion
    expect(testEvaluate).toThrow(); // tslint:disable-line:no-object-literal-type-assertion
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

describe('validateParams should correctly validate user input', () => {

    test('It should throw if no params are present', () => {
    const mockData = undefined;

    const testValidate = () => validateParams(mockData as ServerlessInstance['service']['custom']['ssmPublish']['params'], throwFunction, logFunction); // tslint:disable-line:no-object-literal-type-assertion
    expect(testValidate).toThrow('No params defined');
  });

    test('It should throw if required fields are missing', () => {
    const mockData = [{ path: 'bblablabla'}];

    const testValidate = () => validateParams(mockData as ServerlessInstance['service']['custom']['ssmPublish']['params'], throwFunction, logFunction); // tslint:disable-line:no-object-literal-type-assertion
    expect(testValidate).toThrow('path and either value or source are required fields for params');
  });

    test('It should throw if the param path breaks AWS namespace rules (aws/ssm start)', () => {
    const mockData = [{ path: 'aws/test/', value: 'test'}];

    const testValidate = () => validateParams(mockData, throwFunction, logFunction);
    expect(testValidate).toThrow(`Param aws/test/ name doesn't match AWS constraints`);
  });

    test('It should throw if the param path breaks AWS namespace rules (illegal characters)', () => {
    const mockData = [{ path:  '/test/*__+23s', value: 'test'}];

    const testValidate = () => validateParams(mockData, throwFunction, logFunction);
    expect(testValidate).toThrow(`Param /test/*__+23s name doesn't match AWS constraints`);
  });

    test('It should throw if the param path breaks AWS namespace rules (max nesting depth)', () => {
    const mockData = [{ path:  '/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/', value: 'test'}];

    const testValidate = () => validateParams(mockData, throwFunction, logFunction);
    expect(testValidate).toThrow(`Param /a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/ name doesn't match AWS constraints`);
  });

    test('It should throw if the param path breaks AWS namespace rules (max maxLength)', () => {
    const maxNameLength = 1011;
    const mockData = [{ path:  'a'.repeat(maxNameLength + 1), value: 'test'}];

    const testValidate = () => validateParams(mockData, throwFunction, logFunction);
    expect(testValidate).toThrow(`Param ${'a'.repeat(maxNameLength + 1)} name doesn't match AWS constraints`);
  });

    test('It should throw if the param description breaks AWS validation rules (max maxLength)', () => {
    const maxNameLength = 1024;
    const mockData = [{ path:  'test', value: 'test', description: 'a'.repeat(maxNameLength + 1)}];

    const testValidate = () => validateParams(mockData, throwFunction, logFunction);
    expect(testValidate).toThrow(`Param test description is too long`);
  });

    test('It should return valid input as expected (default secure to true)', () => {
    const mockData = [
      { path: '/test/param', value: 'test'},
      { path: '/test/param1', value: 'test', secure: false, description: 'valid'},
      { path: 'test/param2', value: 'test', secure: true, description: 'valid'},
      { path: 'test/param3', value: 'test,test2', secure: true , type: 'StringList' as SSMParamTypes, description: 'valid'},
    ];

    const expectedResult = [
      { path: '/test/param', value: 'test', secure: true},
      { path: '/test/param1', value: 'test', secure: false, description: 'valid'},
      { path: 'test/param2', value: 'test', secure: true, description: 'valid'},
      { path: 'test/param3', value: 'test,test2', secure: true, type: 'StringList' as SSMParamTypes, description: 'valid'},
    ];
    expect(validateParams(mockData, throwFunction, logFunction)).toStrictEqual(expectedResult);
  });
});

describe('compareParams should correctly compare and sort local and remote params', () => {

  test('It should show all local params as nonExisting if no remote params were found', () => {
    const localMockData1 =  [
      { path: '/test/ssmParams/testToken2', value: 'update', description: 'test description', secure: true},
      { path: '/test/ssmParams/testToken3', value: ['update1', 'update2'], type: 'StringList' as SSMParamTypes, description: 'test description'},
    ];
    expect(compareParams(localMockData1, []).nonExistingParams).toStrictEqual(localMockData1);
  });

  test('It should correctly assign all 3 possibilities', () => {
    const localMockData =  [
      { path: '/test/ssmParams/unchangedToken', value: 'update', description: 'test description', secure: true},
      { path: '/test/ssmParams/changedToken', value: 'testtesttest', secure: true},
      { path: '/test/ssmParams/nonExistingToken', value: 'newToken', secure: true},
      { path: '/test/ssmParams/testToken3', value: ['update1', 'update2'], type: 'StringList' as SSMParamTypes, description: 'test description'},

    ];

    const remoteMockData = [
      {
      Name: '/test/ssmParams/changedToken',
      Type: 'String',
      Value: 'changed',
      },
      {
      Name: '/test/ssmParams/testToken3',
      Type: 'StringList' as SSMParamTypes,
      Value: 'update',
      },
      {
      Name: '/test/ssmParams/unchangedToken',
      Type: 'SecureString',
      Value: 'update',
      },
    ];
    expect(compareParams(localMockData, remoteMockData).existingUnchangedParams).toStrictEqual([localMockData[0]]);
    expect(compareParams(localMockData, remoteMockData).existingChangedParams).toStrictEqual([localMockData[1], localMockData[3]]); // tslint:disable-line:no-magic-numbers
    expect(compareParams(localMockData, remoteMockData).nonExistingParams).toStrictEqual([localMockData[2]]); // tslint:disable-line:no-magic-numbers

    });

});
