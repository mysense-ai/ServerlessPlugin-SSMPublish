import chalk from 'chalk';

import { ServerlessInstance, ServerlessOptions /*, SSMParam*/ } from './types';

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
  // private ssm: any;             // tslint:disable-line:no-any

  // SSM Publish internal properties
  private initialized = false;
  private enabled: boolean;

  // SSM Publish custom variables
  private region: string;
  // private params: SSMParam[];

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
    this.serverless.cli.log(`Provider is: ${this.provider}`);

    // Log options (for use later)
    this.serverless.cli.log(`Encryption option for params: ${this.options.encryption}`);

    // Optional
    this.commands = {
      ssmPublish: {
        usage: 'Helps you publish params to SSM',
        lifecycleEvents: [
          'checkIfExists',
          'checkIfIdentical',
          'upsertParam',
        ],
        options: {
          encryption: {
            usage: `Specify whether param should be encrypted - defaults to true (e.g. "--encryption true" or "-e true")`,
            required: false,
            shortcut: 'e',
          },
        },
      },
    };

    this.hooks = {
      // Pre & post hooks

      // Actual lifecycle event handling

      // Serverless lifecycle events
      'after:package:createDeploymentArtifacts': this.summary.bind(this),  // tslint:disable-line:no-unsafe-any
      'after:deploy:deploy': this.hookWrapper.bind(this, this.summary.bind(this)),          // tslint:disable-line:no-unsafe-any
      'after:info:info': this.hookWrapper.bind(this, this.summary.bind(this)),              // tslint:disable-line:no-unsafe-any
    };
  }

  /**
   * Wrapper for lifecycle function, initializes variables and checks if enabled.
   * @param lifecycleFunc lifecycle function that actually does desired action
   */
  public async hookWrapper(lifecycleFunc: any) {  // tslint:disable-line:no-any
    this.initializeVariables();

    if (!this.enabled) {
      this.serverless.cli.log('serverless-ssm-publish: SSM Publish is disabled.');
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
        // const credentials = this.serverless.providers.aws.getCredentials();

        // Extract plugin variables
        this.region = this.serverless.service.provider.region;
        // this.params = this.serverless.service.custom.ssmPublish.params || [] as SSMParam[];

        // Initialize AWS SDK clients
        // const credentialsWithRegion = { ...credentials, region: this.region };
        // this.ssm = new this.serverless.providers.aws.sdk.ACM(credentialsWithRegion);

        unsupportedRegionPrefixes.forEach((unsupportedRegionPrefix) => {
          if (this.region.startsWith(unsupportedRegionPrefix)) {
            this.serverless.cli.log(chalk.bold.yellow(`The configured region ${this.region} does not support SSM. Plugin disabled`));
            // this.enabled = false;
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
    if (!this.serverless.service.custom || !this.serverless.service.custom.ssmPublish) {
      throw new Error('serverless-ssm-publish: Plugin configuration is missing.');
    }

    const enabled = this.serverless.service.custom.ssmPublish.enabled;
    const err = new Error(`serverless-ssm-publish: Ambiguous value for "enabled": '${enabled}'`);

    // Enabled by default
    if (enabled === undefined) {
      return true;
    }

    switch (typeof enabled) {
      case 'boolean':
        return enabled;
      case 'string':
        if (enabled === 'true') return true;
        if (enabled === 'false') return false;
        throw err;
      default:
        throw err;
    }
  }

  // /**
  //  * Logs message if SLS_DEBUG is set
  //  * @param message message to be printed
  //  */
  // private logIfDebug(message: string): void {
  //   if (process.env.SLS_DEBUG) {
  //     this.serverless.cli.log(message, 'Serverless SSM Publish');
  //   }
  // }

  // private listParams() {
  //   return this.ssm.listParams({ params: this.params }).promise();
  // }

  private summary() {
    // const param = await this.provider.request('SSM', 'getParam', { }).promise();
    // this.serverless.cli.log(chalk.bold.grey(param));

    this.serverless.cli.log(chalk.bold.green.underline('This ran after everything was successfully deployed!'));
  }
}

module.exports = ServerlessSSMPublish;
