import { ServerlessInstance,
  // SSMParam,
} from './types';
import {
  // compareParams,
  evaluateEnabled,
   validateParams,
  } from './util';

const throwFunction = (message: string): void => { throw new Error(message); };
const logFunction = (message: string): void => { console.log(message); }; // tslint:disable-line:no-console

describe('evaluateEnabled should correctly validate if the plugin is enabled', () => {

  test('It should throw if no ssmPublish settings are passed', () => {
    const testEvalute = () => evaluateEnabled({ } as ServerlessInstance['service']['custom'], throwFunction); // tslint:disable-line:no-object-literal-type-assertion
    expect(testEvalute).toThrow();
  });

  test('It should throw if enabled is a string and not true or false', () => {
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

describe('validateParams should correctly validate user input', () => {

  test('It should throw if no params are present', () => {
    const mockData = { enabled: true };
    const testValidate = () => validateParams(mockData as ServerlessInstance['service']['custom']['ssmPublish'], throwFunction, logFunction); // tslint:disable-line:no-object-literal-type-assertion
    expect(testValidate).toThrow('No params defined');
  });

  test('It should throw if required fields are missing', () => {
    const mockData = { enabled: true, params: [{ path: 'bblablabla'}] };
    const testValidate = () => validateParams(mockData as ServerlessInstance['service']['custom']['ssmPublish'], throwFunction, logFunction); // tslint:disable-line:no-object-literal-type-assertion
    expect(testValidate).toThrow('Path and Value are required fields for params');
  });

  test('It should throw if the param path breaks AWS namespace rules (aws/ssm start)', () => {
    const mockData = { enabled: true, params: [{ path: 'aws/test/', value: 'test'}] };
    const testValidate = () => validateParams(mockData, throwFunction, logFunction);
    expect(testValidate).toThrow(`Param aws/test/ name doesn't match AWS constraints`);
  });

  test('It should throw if the param path breaks AWS namespace rules (illegal characters)', () => {
    const mockData = { enabled: true, params: [{ path:  '/test/*__+23s', value: 'test'}] };
    const testValidate = () => validateParams(mockData, throwFunction, logFunction);
    expect(testValidate).toThrow(`Param /test/*__+23s name doesn't match AWS constraints`);
  });

  test('It should throw if the param path breaks AWS namespace rules (max nesting depth)', () => {
    const mockData = { enabled: true, params: [{ path:  '/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/', value: 'test'}] };
    const testValidate = () => validateParams(mockData, throwFunction, logFunction);
    expect(testValidate).toThrow(`Param /a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/ name doesn't match AWS constraints`);
  });

  test('It should throw if the param path breaks AWS namespace rules (max maxLength)', () => {
    const maxNameLength = 1011;
    const mockData = { enabled: true, params: [{ path:  'a'.repeat(maxNameLength + 1), value: 'test'}] };
    const testValidate = () => validateParams(mockData, throwFunction, logFunction);
    expect(testValidate).toThrow(`Param ${'a'.repeat(maxNameLength + 1)} name doesn't match AWS constraints`);
  });

  test('It should throw if the param description breaks AWS validation rules (max maxLength)', () => {
    const maxNameLength = 1024;
    const mockData = { enabled: true, params: [{ path:  'test', value: 'test', description: 'a'.repeat(maxNameLength + 1)}] };
    const testValidate = () => validateParams(mockData, throwFunction, logFunction);
    expect(testValidate).toThrow(`Param test description is too long`);
  });

  test('It should return valid input as expected', () => {
    const mockData = {
      enabled: true,
      params: [
        { path: 'test/param', value: 'test'},
        { path: 'test/param', value: 'test', description: 'valid'},
        { path: 'test/param', value: 'test', secure: true, description: 'valid'},
      ],
    };
    const expectedResult = [
      { path: 'test/param', value: 'test', secure: false},
      { path: 'test/param', value: 'test', secure: false, description: 'valid'},
      { path: 'test/param', value: 'test', secure: true, description: 'valid'},
    ];
    expect(validateParams(mockData, throwFunction, logFunction)).toStrictEqual(expectedResult);
  });
});
