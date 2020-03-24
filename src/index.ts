import chalk from 'chalk';

import { ServerlessInstance, ServerlessOptions /*, SSMParam*/ } from './types';

/*
    Ways to implement plugin:
      1. Writing a new CLI command
      2. Extend an existing command to implement additional functionality
      3. Write your own implementation of an existing command from scratch (custom provider)
 */

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
  // private cloudformation: any;  // tslint:disable-line:no-any
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

    // Optional
    this.commands = {
      welcome: {
        usage: 'Helps you start your first Serverless plugin',
        lifecycleEvents: [
          'hello',
          'world',
        ],
        options: {
          message: {
            usage: `Specify the message you want to deploy (e.g. "--message 'My Message'" or "-m 'My Message'")`,
            required: true,
            shortcut: 'm',
          },
        },
      },
    };

    this.hooks = {
      // Pre & post hooks
      'before:welcome:hello': this.hookWrapper.bind(this, this.beforeWelcome.bind(this)),   // tslint:disable-line:no-unsafe-any
      'after:welcome:world': this.hookWrapper.bind(this, this.afterHelloWorld.bind(this)),  // tslint:disable-line:no-unsafe-any

      // Actual lifecycle event handling
      'welcome:hello': this.hookWrapper.bind(this, this.welcomeUser.bind(this)),            // tslint:disable-line:no-unsafe-any
      'welcome:world': this.hookWrapper.bind(this, this.displayHelloMessage.bind(this)),    // tslint:disable-line:no-unsafe-any

      // Serverless lifecycle events
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
        // this.cloudformation = new this.serverless.providers.aws.sdk.CloudFormation(credentialsWithRegion);

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
  //  * Gets rest API id from CloudFormation stack
  //  */
  // private async getRestApiId(): Promise<string> {
  //   if (this.serverless.service.provider.apiGateway && this.serverless.service.provider.apiGateway.restApiId) {
  //     this.serverless.cli.log(`Mapping custom domain to existing API ${this.serverless.service.provider.apiGateway.restApiId}.`);
  //     return this.serverless.service.provider.apiGateway.restApiId;
  //   }
  //   const stackName = this.serverless.service.provider.stackName ||
  //     `${this.serverless.service.name}-${this.serverless.service.provider.stage}`;
  //   const params = {
  //     LogicalResourceId: 'ApiGatewayRestApi',
  //     StackName: stackName,
  //   };
  //
  //   let response;
  //   try {
  //     response = await this.cloudformation.describeStackResource(params).promise();
  //   } catch (err) {
  //     this.logIfDebug(err);
  //     throw new Error(`Error: Failed to find CloudFormation resources for ${stackName}\n`);
  //   }
  //   const restApiId = response.StackResourceDetail.PhysicalResourceId;
  //   if (!restApiId) {
  //     throw new Error(`Error: No RestApiId associated with CloudFormation stack ${stackName}`);
  //   }
  //   return restApiId;
  // }

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

  private beforeWelcome() {
    this.serverless.cli.log(chalk.bold.yellow('Hello from Serverless!'));
  }

  private welcomeUser() {
    this.serverless.cli.log(chalk.bold.grey('Your message:'));
  }

  private displayHelloMessage() {
    this.serverless.cli.log(chalk.bold.red(this.options.message));
  }

  private afterHelloWorld() {
    this.serverless.cli.log(chalk.bold.green('Please come again!'));
  }

  private summary() {
    // const param = await this.provider.request('SSM', 'getParam', { }).promise();
    // this.serverless.cli.log(chalk.bold.grey(param));

    this.serverless.cli.log(chalk.bold.green.underline('This ran after everything was successfully deployed!'));
  }
}

module.exports = ServerlessSSMPublish;
