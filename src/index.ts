import { CloudFormation , SSM } from 'aws-sdk';
import chalk from 'chalk';
import * as util from 'util';

import { ServerlessInstance, SSMParam } from './types';
import { addPathPrefix, compareParams, evaluateEnabled, validateParams } from './util';

const unsupportedRegionPrefixes = [
  'ap-east-1',    // Hong Kong - region disabled by default
  'me-south-1',   // Bahrain - region disabled by default
];

class ServerlessSSMPublish {

  // Serverless specific properties
  public hooks: { [i: string]: () => void };
  public commands: object;

  private readonly serverless: ServerlessInstance;
  private readonly provider: any;        // tslint:disable-line:no-any

  // AWS SDK resources
  private ssm: SSM;             // tslint:disable-line:no-any

  // SSM Publish internal properties
  private initialized = false;
  private enabled: boolean;
  private stackName: string;

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
  constructor(serverless: ServerlessInstance) {
    this.serverless = serverless;

    // Bind plugin to aws provider. It will not run on a different provider.
    this.provider = this.serverless.getProvider('aws');

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
      'after:deploy:deploy': async () => { // check if this is the best place to call our plugin
        await this.hookWrapper.bind(this, this.getAndCheckParams.bind(this))();                        // tslint:disable-line:no-unsafe-any
        await this.hookWrapper.bind(this, this.updateParams.bind(this))();                             // tslint:disable-line:no-unsafe-any
        this.hookWrapper.bind(this, this.summary.bind(this))();                                        // tslint:disable-line:no-unsafe-any
      },
    };
  }

  /**
   * Wrapper for lifecycle function, initializes variables and checks if enabled.
   * @param lifecycleFunc lifecycle function that actually does desired action
   */
  public async hookWrapper(lifecycleFunc: any) {  // tslint:disable-line:no-any
    await this.initializeVariables();

    if (!this.enabled) {
      this.log('serverless-ssm-publish: SSM Publish is disabled.');
    } else {
      return lifecycleFunc.call(this);  // tslint:disable-line:no-unsafe-any
    }
  }

  /**
   * Goes through custom ssm publish properties and initializes local variables.
   */
  private async initializeVariables(): Promise<void> {
    if (!this.initialized) {
      this.enabled = evaluateEnabled(this.serverless.service.custom, this.throwError.bind(this)); // tslint:disable-line:no-unsafe-any

      if (this.enabled) {
        const credentials = this.provider.getCredentials(); // tslint:disable-line:no-unsafe-any

        // Extract plugin variables
        this.region = this.serverless.service.provider.region;

        this.stackName = util.format('%s-%s',
          this.serverless.service.getServiceName(),
          this.serverless.getProvider('aws').getStage(),
        );

        // Initialize AWS SDK clients
        const credentialsWithRegion = { ...credentials, region: this.region };

        this.ssm = new this.provider.sdk.SSM(credentialsWithRegion); // tslint:disable-line:no-unsafe-any

        const yamlDefinedParams = validateParams(this.serverless.service, this.throwError.bind(this), this.log.bind(this)) || []; // tslint:disable-line:no-unsafe-any

        const cloudFormationOutputParams = this.serverless.service.custom.ssmPublish.publishCloudFormationOutput ?
         (await this.retrieveAndFormatCloudFormationOutput())
          .map((param) => ({ ...param, path: addPathPrefix(this.serverless.service, param)})) : // tslint:disable-line:no-unsafe-any
         [];

        this.params = [...yamlDefinedParams, ...cloudFormationOutputParams]; // tslint:disable-line:no-unsafe-any

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
   * Checks whether parameters exist in SSM and if they've been changed
   * Stores arrays of changed/unchanged/new Parameters on class
   */
  private async getAndCheckParams() {
    if (!this.params) return;
    const retrievedParameters = await this.ssm.getParameters({ Names: this.params.map((param) => param.path), WithDecryption: true}).promise();

    if (retrievedParameters.InvalidParameters?.length) this.log(chalk.yellow(`New or invalid parameters present:\n\t${retrievedParameters.InvalidParameters.join('\n\t')}`));

    const { nonExistingParams, existingChangedParams, existingUnchangedParams } = compareParams(this.params, retrievedParameters.Parameters);

    this.logIfDebug(`New param paths:\n\t${nonExistingParams.map((param) => param.path).join('\n\t')}`);
    this.logIfDebug(`Changed param paths:\n\t${existingChangedParams.map((param) => param.path).join('\n\t')}`);
    this.logIfDebug(`Unchanged param paths:\n\t${existingUnchangedParams.map((param) => param.path).join('\n\t')}`);

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
        Description: param.description || `Placed by ${this.serverless.service.getServiceName()} - serverless-ssm-plugin`,
        Value: param.value,
        Overwrite: true,
        Type: param.secure ? 'SecureString' : 'String',
      },
        ).promise(),
      ));
    this.logIfDebug(`SSM Put Results:\n\t${putResults.join('\n\t')}`);
}
  private async retrieveAndFormatCloudFormationOutput(): Promise<SSMParam[]> {
    const stackResult = await this.fetchCFOutput();

    const outputForSSM = this.prettifyCFOutput(stackResult);

    return outputForSSM;
  }

  private async fetchCFOutput(): Promise<CloudFormation.DescribeStacksOutput> {
    return this.serverless.getProvider('aws').request(
      'CloudFormation',
      'describeStacks',
      { StackName: this.stackName },
      this.serverless.getProvider('aws').getStage(),
      this.serverless.getProvider('aws').getRegion(),
    );
  }

  private prettifyCFOutput(stackResult: CloudFormation.DescribeStacksOutput): SSMParam[] {
    if (!stackResult.Stacks) return [];

    const stackOutput = stackResult.Stacks[0].Outputs;

    if (!stackOutput) return [];

    const formattedParams = stackOutput
      // remove the standard CF Outputs
      .filter((output) => output.ExportName !== 'HandlerLambdaFunctionQualifiedArn' && output.ExportName !== 'ServerlessDeploymentBucketName')
      // ensure output matches our formatting
      .map((output) => ({
      path: output.OutputKey || '',
      value: output.OutputValue || '',
      description: output.Description,
      secure: true,
    }));

    return formattedParams || [];
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
