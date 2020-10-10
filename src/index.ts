import { CloudFormation, SSM } from 'aws-sdk';
import chalk from 'chalk';
import yaml from 'js-yaml';
import markdownTable from 'markdown-table';
import * as util from 'util';

import { ServerlessInstance, SSMParam, SSMParamCloudFormation, SSMParamWithValue } from './types';
import { compareParams, evaluateEnabled, validateParams } from './util';

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
  private params: SSMParamWithValue[];
  private nonExistingParams: SSMParamWithValue[];
  private existingChangedParams: SSMParamWithValue[];
  private existingUnchangedParams: SSMParamWithValue[];
  private cloudFormationOutput: SSMParamWithValue[] | undefined;

  private static prettifyCFOutput(stackResult: CloudFormation.DescribeStacksOutput): SSMParamWithValue[] {
    if (!stackResult.Stacks) return [];

    const stackOutput = stackResult.Stacks[0].Outputs;

    if (!stackOutput) return [];

    const formattedParams = stackOutput
      // ensure output matches our formatting
      .map((output) => ({
      path: output.OutputKey || '',
      value: output.OutputValue || '',
      description: output.Description,
    }));

    return formattedParams || [];
  }

  /**
   * Constructor
   * @param serverless
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

        // Validate plugin variables

        const yamlDefinedParams = validateParams(this.serverless.service.custom.ssmPublish.params, this.throwError.bind(this), this.log.bind(this)) || []; // tslint:disable-line:no-unsafe-any

        // Retrieve Cloud Formation output if necessary
        if (yamlDefinedParams.some((param: SSMParamCloudFormation) => param.source)) {
          this.logIfDebug('Retrieving Cloud Formation Outputs');
          this.cloudFormationOutput = await this.retrieveAndFormatCloudFormationOutput();
        }

        // Merge cloud formation output with yaml defined values
        const checkIfParamHasValue = (param: SSMParam): param is SSMParamWithValue => param.hasOwnProperty('value');

        const mergedParams = yamlDefinedParams.map((slsParam): SSMParamWithValue => {
          if (checkIfParamHasValue(slsParam)) return slsParam;

          const foundCloudFormationParam = this.cloudFormationOutput?.find((cloudFormationParam) => cloudFormationParam.path === slsParam.source);

          if (!foundCloudFormationParam) {
            this.throwError(`No Cloud Formation Output found for source ${slsParam.source}`);
            throw new Error(`No Cloud Formation Output found for source ${slsParam.source}`); // Throwing again as typescript won't recognise throwError as throwing
          }
          return { ...slsParam, value: foundCloudFormationParam.value, description: foundCloudFormationParam.description || slsParam.description };
        });

        // Put params on this for following logic

        this.params = [...mergedParams]; // tslint:disable-line:no-unsafe-any

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
   * We need to account for SSM.GetParameters taking a max of 10 names
   */
  private async getAndCheckParams() {
    if (!this.params) return;

    const chunkArray = ((array: SSMParam[], arraySize: number): SSMParam[][] => {
      const arrayChunks: SSMParam[][] = [];
      for (let i = 0; i < array.length; i += arraySize) {
        arrayChunks.push(array.slice(i, arraySize + i));
      }
      return arrayChunks;
    });

    const getParameters = async (params: SSMParam[]) => this.ssm.getParameters({ Names: params.map((param) => param.path), WithDecryption: true}).promise();

    const paramsToCheck = chunkArray(this.params, 10); // tslint:disable-line:no-magic-numbers

    const retrievedParameterArray = await Promise.all(paramsToCheck.map(async (paramGroup: SSMParam[]) => getParameters(paramGroup)));

    const foundParams = retrievedParameterArray.map((result) => result.Parameters).reduce((acc, curr) => [...acc ? acc : [], ...curr ? curr : []], []);
    const invalidOrNewParams = retrievedParameterArray.map((result) => result.InvalidParameters).reduce((acc, curr) => [...acc ? acc : [], ...curr ? curr : []], []);

    if (invalidOrNewParams?.length) this.log(chalk.yellow(`New or invalid parameters present:\n\t${invalidOrNewParams.join('\n\t')}`));

    const { nonExistingParams, existingChangedParams, existingUnchangedParams } = compareParams(this.params, foundParams);

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
    const toUpdate = [...this.nonExistingParams, ...this.existingChangedParams];
    const putResults = await Promise.all(toUpdate.map(async (param: SSMParamWithValue) => this.ssm.putParameter(
      {
        Name: param.path,
        Description: param.description || `Placed by ${this.serverless.service.getServiceName()} - serverless-ssm-plugin`,
        Value: typeof param.value === 'string' ? param.type !== 'StringList' ? param.value : yaml.safeDump(param.value) : new Array(param.value).join(','),
        Overwrite: true,
        Type: param.type ? param.type : param.secure ? 'SecureString' : 'String',
      }).promise(),
    ));
    this.logIfDebug(`SSM Put Results:\n${chalk.green(
      putResults.length > 0
        ? (markdownTable([
            ['Path', 'Secure', 'Version', 'Tier', 'Type'],
            ...putResults.map(({ Version, Tier }, i) =>
              ([
                toUpdate[i].path,
                toUpdate[i].secure,
                Version ? Version : '',
                Tier ? Tier : '',
                toUpdate[i].type,
              ]) as string[]),
          ]))
        : 'No updates performed.',
    )}`);
  }

  private async retrieveAndFormatCloudFormationOutput(): Promise<SSMParamWithValue[]> {
    const stackResult = await this.fetchCFOutput();
    return ServerlessSSMPublish.prettifyCFOutput(stackResult);
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
    this.log(`SSM Publish Summary:\n${chalk.bold.green(
      markdownTable([
        [
          `Created (${this.nonExistingParams.length})`,
          `Updated (${this.existingChangedParams.length})`,
          `Unchanged (${this.existingUnchangedParams.length})`,
        ],
        ...this.nonExistingParams.map((p) => ([p.path, '', ''])),
        ...this.existingChangedParams.map((p) => (['', p.path, ''])),
        ...this.existingUnchangedParams.map((p) => (['', '', p.path])),
      ]),
    )}`);
  }
}

module.exports = ServerlessSSMPublish;
