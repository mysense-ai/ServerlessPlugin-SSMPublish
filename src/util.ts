import { SSM } from 'aws-sdk';
import chalk from 'chalk';
import yaml from 'js-yaml';

import { ServerlessInstance, SSMParam, SSMParamWithValue } from './types';

/**
 * Determines whether this plugin should be enabled.
 *
 * This method reads the ssmPublish property "enabled" to see if this plugin should be enabled.
 * If the property's value is undefined, a default value of true is assumed (for backwards compatibility).
 * If the property's value is provided, this should be boolean, otherwise an exception is thrown.
 */
export const evaluateEnabled = (serviceCustomBlock: ServerlessInstance['service']['custom'], throwFunction: (message) => void): boolean  => {
    if (!serviceCustomBlock || !serviceCustomBlock.ssmPublish) {
      throwFunction('Plugin configuration is missing.');
    }

    const enabled = serviceCustomBlock.ssmPublish.enabled;

    // Enabled by default
    if (enabled === undefined) {
      return true;
    }

    switch (typeof enabled) {
      case 'boolean':
        return enabled;
      case 'string':
        if (enabled === 'true') return true;
        if (enabled === 'false') {
          return false;
        }
        throwFunction(`Ambiguous value for "enabled": '${enabled}'`);
        return false;
      default:
        throwFunction(`Ambiguous value for "enabled": '${enabled}'`);
        return false;
    }
  };

/**
 * Validates params passed in serverless.yaml
 * Throws error if no params or incorrect syntax.
 */

const isParam = (param: SSMParam | undefined): param is SSMParam => !!param;

export const validateParams = (params: ServerlessInstance['service']['custom']['ssmPublish']['params'], throwFunction: (message) => void, logFunction: (message) => void): SSMParam[] => {
    if (!params || !params.length) {
      throwFunction('No params defined');
      throw new Error('only here for typescript'); // typescript doesn't recognise that throwFunction above throws
    }

    const validateParam = (param: SSMParamWithValue): SSMParam | undefined => {
      const maxNameLength = 1011; // needs to account for ARN stuff being added
      const maxDescriptionLength = 1024;
      const maxDepth = 15;
      const paramKeys = Object.keys(param);
      if (
        !paramKeys.includes('path') ||
        ['value', 'source'].every((requiredKey: string) => paramKeys.includes(requiredKey)) ||
        !['value', 'source'].some((requiredKey: string) => paramKeys.includes(requiredKey)))
      throwFunction('path and either value or source are required fields for params');
      if (param.secure && typeof param.secure !== 'boolean') { // tslint:disable-line:strict-type-predicates
        logFunction(chalk.redBright(`Param at path ${param.path} should pass secure as boolean value`));
      }
      if (
          param.path.match(/^(aws|ssm)/gi) || // check if name begins with illegal patterns (aws/ssm)
          param.path.match(/[^a-zA-Z0-9_.\-\/]/g) || // check if name contains illegal characters
          (param.path.match(/\//g) || []).length > maxDepth ||
          param.path.length > maxNameLength
        )
        throwFunction(`Param ${param.path} name doesn't match AWS constraints`);
      if (param.description && param.description.length > maxDescriptionLength)
        throwFunction(`Param ${param.path} description is too long`);
      if (param.secure && typeof param.secure !== 'boolean') { // tslint:disable-line:strict-type-predicates
        logFunction(chalk.redBright(`Param at path ${param.path} should pass "secure" as boolean value`));
      }
      if (paramKeys.includes('enabled') && param.enabled === false) return undefined;

      return { ...param, secure: param.secure !== false };
    };

    return params.map(validateParam).filter(isParam);
  };

/**
 * Helper function to compare values in sls.yaml and remote SSM
 */
export const compareParams = (localParams: SSMParamWithValue[], remoteParams: SSM.GetParametersResult['Parameters']) => localParams.reduce< { nonExistingParams: SSMParamWithValue[]; existingChangedParams: SSMParamWithValue[]; existingUnchangedParams: SSMParamWithValue[] }>((acc, curr) => {

  const existingParam = remoteParams?.find((param) => param.Name === curr.path);
  if (!existingParam) {
    acc.nonExistingParams.push(curr);
    return acc;
  }

  // Compare unchanged
  if (typeof curr.value === 'string') {
    // Simple string comparison
    if (existingParam.Value === curr.value) {
      acc.existingUnchangedParams.push(curr);
      return acc;
    }
  } else {
    // Can't rely on serialized YAML string to be the same as the original definition.
    // We therefore parse it & do quick-n-dirty deep object comparison via JSON.stringify
    const parsedExisting = yaml.load(existingParam.Value ? existingParam.Value : '');
    if (JSON.stringify(parsedExisting) === JSON.stringify(curr.value)) {
      acc.existingUnchangedParams.push(curr);
      return acc;
    }
  }

  // Compare changed
  acc.existingChangedParams.push(curr);
  return acc;
}
, { nonExistingParams: [], existingChangedParams: [], existingUnchangedParams: [] });
