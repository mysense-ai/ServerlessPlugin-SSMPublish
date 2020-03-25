import { SSM } from 'aws-sdk';
import chalk from 'chalk';

import { ServerlessInstance, ServerlessOptions, SSMParam } from './types';

const unsupportedRegionPrefixes = [
  'ap-east-1',    // Hong Kong - region disabled by default
  'me-south-1',   // Bahrain - region disabled by default
];

class ServerlessSSMPublish {

  // Serverless specific properties
  public hooks: { [i: string]: () => void };
  public commands: object;

  private readonly serverless: ServerlessInstance;
  private readonly options: ServerlessOptions;
  private readonly provider: any;        // tslint:disable-line:no-any

  // AWS SDK resources
  private ssm: SSM;             // tslint:disable-line:no-any

  // SSM Publish internal properties
  private initialized = false;
  private enabled: boolean;

  // SSM Publish custom variables
  private region: string;
  private params: SSMParam[] | undefined;
  private nonExistingParams: SSMParam[];
  private existingChangedParams: SSMParam[];
  private existingUnchangedParams: SSMParam[];

  /**
   * Constructor
   * @param serverless
   * @param options
   */
  constructor(serverless: ServerlessInstance, options: ServerlessOptions) {
    this.serverless = serverless;
    this.options = options;

    // Bind plugin to aws provider. It will not run on a different provider.
    this.provider = this.serverless.getProvider('aws');
    this.logIfDebug(`Options passed in: ${String(this.options)}`);

    // Optional
    this.commands = {
      ssmPublish: {
        usage: 'Helps you publish params to SSM',
        lifecycleEvents: [
          'checkIfParamsExist',
          'upsertParams',
        ],
      },
    };

    this.hooks = {
      // Pre & post hooks
      'after:ssmPublish:upsertParams':  this.hookWrapper.bind(this, this.summary.bind(this)),          // tslint:disable-line:no-unsafe-any

      // Actual lifecycle event handling
      'ssmPublish:checkIfParamsExist': this.hookWrapper.bind(this, this.getAndCheckParams.bind(this)), // tslint:disable-line:no-unsafe-any
      'ssmPublish:upsertParams': this.hookWrapper.bind(this, this.updateParams.bind(this)),            // tslint:disable-line:no-unsafe-any

      // Serverless lifecycle events
      'after:package:createDeploymentArtifacts': async () => { // check if this is the best place to call our plugin
        await this.hookWrapper.bind(this, this.getAndCheckParams.bind(this))();                        // tslint:disable-line:no-unsafe-any
        await this.hookWrapper.bind(this, this.updateParams.bind(this))();                             // tslint:disable-line:no-unsafe-any
        this.hookWrapper.bind(this, this.summary.bind(this))();                                        // tslint:disable-line:no-unsafe-any
      },
      'after:deploy:deploy': this.hookWrapper.bind(this, this.summary.bind(this)),                     // tslint:disable-line:no-unsafe-any
      'after:info:info': this.hookWrapper.bind(this, this.summary.bind(this)),                         // tslint:disable-line:no-unsafe-any
    };
  }

  /**
   * Wrapper for lifecycle function, initializes variables and checks if enabled.
   * @param lifecycleFunc lifecycle function that actually does desired action
   */
  public async hookWrapper(lifecycleFunc: any) {  // tslint:disable-line:no-any
    this.initializeVariables();

    if (!this.enabled) {
      this.log('serverless-ssm-publish: SSM Publish is disabled.');
    } else {
      return lifecycleFunc.call(this);  // tslint:disable-line:no-unsafe-any
    }
  }

  /**
   * Goes through custom ssm publish properties and initializes local variables.
   */
  private initializeVariables(): void {
    if (!this.initialized) {
      this.enabled = this.evaluateEnabled();

      if (this.enabled) {
        const credentials = this.provider.getCredentials(); // tslint:disable-line:no-unsafe-any

        // Extract plugin variables
        this.region = this.serverless.service.provider.region;

        // Initialize AWS SDK clients
        const credentialsWithRegion = { ...credentials, region: this.region };
        this.ssm = new this.provider.sdk.SSM(credentialsWithRegion); // tslint:disable-line:no-unsafe-any

        this.params = this.validateParams();

        unsupportedRegionPrefixes.forEach((unsupportedRegionPrefix) => {
          if (this.region.startsWith(unsupportedRegionPrefix)) {
            this.log(chalk.bold.yellow(`The configured region ${this.region} does not support SSM. Plugin disabled`));
            this.enabled = false;
          }
        });
      }

      this.initialized = true;
    }
  }

  /**
   * Determines whether this plugin should be enabled.
   *
   * This method reads the ssmPublish property "enabled" to see if this plugin should be enabled.
   * If the property's value is undefined, a default value of true is assumed (for backwards compatibility).
   * If the property's value is provided, this should be boolean, otherwise an exception is thrown.
   */
  private evaluateEnabled(): boolean {
    if (!this.serverless.service.custom?.ssmPublish) {
      this.throwError('Plugin configuration is missing.');
    }

    const enabled = this.serverless.service.custom.ssmPublish.enabled;
    // const err = new Error(`Ambiguous value for "enabled": '${enabled}'`);

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
        this.log(chalk.bold.red(`Ambiguous value for "enabled": '${enabled}'`));
        return false;
        // Should we be throwing here?
      default:
        this.log(chalk.bold.red(`Ambiguous value for "enabled": '${enabled}'`));
        return false;
        // Should we be throwing here?
    }
  }

  /**
   * Validates params passed in serverless.yaml
   * Throws error if no params or incorrect syntax.
   * Might want to call this in evaluateEnabled?
   * Need to add some more validation here
   */
  private validateParams(): SSMParam[] | undefined {
    if (!this.serverless.service?.custom?.ssmPublish?.params || !this.serverless.service?.custom?.ssmPublish?.params.length) {
      this.throwError('No params defined'); // should we just disable and log a warning here?
    }

    const validateParam = (param: SSMParam) => {
      if (!['path', 'value'].every((requiredKey: string) => Object.keys(param).includes(requiredKey))) {
        this.throwError('Path and Value are required fields for params');
      }
      if (typeof param.secure !== 'boolean') {
        this.log(`Param at path ${param.path} should pass Secure as boolean value`);
      }
      return { ...param, Secure: !!param.secure };
    };

    return this.serverless.service.custom.ssmPublish.params?.map(validateParam);
  }

  /**
   * Checks whether parameters exist in SSM and if they've been changed
   * Stores arrays of changed/unchanged/new Parameters on class
   */
  private async getAndCheckParams() {
    if (!this.params) return;
    const retrievedParameters = await this.ssm.getParameters({ Names: this.params.map((param) => param.path), WithDecryption: true}).promise();

    const { nonExistingParams, existingChangedParams, existingUnchangedParams } = this.params.reduce< { nonExistingParams: SSMParam[]; existingChangedParams: SSMParam[]; existingUnchangedParams: SSMParam[] }>((acc, curr) => {
      const existingParam = retrievedParameters.Parameters?.find((param) => param.Name === curr.path);
      if (!existingParam) {
        acc.nonExistingParams.push(curr);
        return acc;
      }
      if (existingParam.Value === curr.value) {
        acc.existingUnchangedParams.push(curr);
        return acc;
      }
      acc.existingChangedParams.push(curr);
      return acc;
    }
    , { nonExistingParams: [], existingChangedParams: [], existingUnchangedParams: [] });

    this.logIfDebug(`New param paths: ${nonExistingParams.map((param) => param.path).join(', ')}`);
    this.logIfDebug(`Changed param paths: ${existingChangedParams.map((param) => param.path).join(', ')}`);
    this.logIfDebug(`Unchanged param paths: ${existingUnchangedParams.map((param) => param.path).join(', ')}`);

    this.nonExistingParams = nonExistingParams;
    this.existingChangedParams = existingChangedParams;
    this.existingUnchangedParams = existingUnchangedParams;
}

  /**
   * Makes putParameter request for all changed/new parameters
   */
  private async updateParams() {
    const putResults = await Promise.all([...this.nonExistingParams, ...this.existingChangedParams].map(async (param: SSMParam) => this.ssm.putParameter(
      {
        Name: param.path,
        Description: `Placed by ${this.serverless.service.package.name} - serverless-ssm-plugin`,
        Value: param.value,
        Overwrite: true,
        Type: param.secure ? 'SecureString' : 'String',
      },
        ).promise(),
      ));
    this.logIfDebug(`SSM Put Results: ${putResults.join('/n ')}`);
}

  /**
   * Logs message with prefix
   * @param message message to be printed
   */
  private log(message: string): void {
    this.serverless.cli.log(`[serverless-ssm-publish]: ${message}`);
}

  /**
   * Logs message with prefix if SLS_DEBUG is set
   * @param message message to be printed
   */
  private logIfDebug(message: string): void {
    if (process.env.SLS_DEBUG) {
      this.serverless.cli.log(`[serverless-ssm-publish]: ${message}`);
    }
  }

  /**
   * Throws error using Serverless formatting
   * @param message message to be printed
   */
  private throwError(message: string): void {
    throw new this.serverless.classes.Error(`[serverless-ssm-publish]: ${message}`); // tslint:disable-line:no-unsafe-any
  }

  private summary() {
    this.log(chalk.bold.green.underline(`
    SSM Publish Summary
      Created: ${this.nonExistingParams.length}
      Updated: ${this.existingChangedParams.length}
      Unchanged: ${this.existingUnchangedParams.length}
    `));
  }
}

module.exports = ServerlessSSMPublish;
