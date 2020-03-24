declare class AwsProvider {
  constructor(serverless: ServerlessInstance, options: Options)

  public getProviderName(): string;
  public getRegion(): string;
  public getServerlessDeploymentBucketName(): string;
  public getStage(): string;
}

interface Config {
  servicePath: string;
}

interface Event {
  eventName: string;
}

interface FunctionDefinition {
  name: string;
  package: Package;
  runtime?: string;
  handler: string;
  timeout?: number;
  memorySize?: number;
  environment?: { [ name: string ]: string };
}

interface Options {
  function?: string;
  watch?: boolean;
  extraServicePath?: string;
  stage: string | null;
  region: string | null;
  noDeploy?: boolean;
}

interface Package {
  include: string[];
  exclude: string[];
  artifact?: string;
  individually?: boolean;
}

declare abstract class Plugin {
  public hooks: {
    [event: string]: Promise<any>;  // tslint:disable-line:no-any
  };

  constructor(serverless: ServerlessInstance, options: Options)
}

interface PluginManager {
  cliOptions: { };
  cliCommands: { };
  serverless: ServerlessInstance;
  plugins: Plugin[];
  commands: { };
  hooks: { };
  deprecatedEvents: { };

  setCliOptions(options: Options): void;
  setCliCommands(commands: { }): void;

  addPlugin(plugin: typeof Plugin): void;
  loadAllPlugins(servicePlugins: { }): void;
  loadPlugins(plugins: { }): void;
  loadCorePlugins(): void;
  loadServicePlugins(servicePlugins: { }): void;
  loadCommand(pluginName: string, details: { }, key: string): { };
  loadCommands(pluginInstance: Plugin): void;
  spawn(commandsArray: string | string[], options?: any): Promise<void>;  // tslint:disable-line:no-any
}

interface Provider {
  apiGateway: {
    restApiId: string;
  };
  compiledCloudFormationTemplate: {
    Resources: any[];       // tslint:disable-line:no-any
    Outputs?: {
      [key: string]: any;   // tslint:disable-line:no-any
    };
  };
  name: string;
  region: string;
  runtime?: string;
  stackName: string;
  stage: string;
  timeout?: number;
  versionFunctions: boolean;
}

interface Service {
  name: string;
  provider: Provider;
  custom: {
    ssmPublish: SSMPublish;
  };

  load(rawOptions: { }): Promise<any>;   // tslint:disable-line:no-any
  setFunctionNames(rawOptions: { }): void;

  getServiceName(): string;
  getAllFunctions(): string[];
  getAllFunctionsNames(): string[];
  getFunction(functionName: string): FunctionDefinition;
  getEventInFunction(eventName: string, functionName: string): Event;
  getAllEventsInFunction(functionName: string): Event[];

  mergeResourceArrays(): void;
  validate(): Service;

  update(data: { }): { };
}

interface Classes {
  Error: any; // tslint:disable-line:no-any
}

interface SSMPublish {
  enabled: boolean | string | undefined;
  params: SSMParam[] | undefined;
}

interface Utils {
  getVersion(): string;
  dirExistsSync(dirPath: string): boolean;
  fileExistsSync(filePath: string): boolean;
  writeFileDir(filePath: string): void;
  writeFileSync(filePath: string, contents: string): void;
  writeFile(filePath: string, contents: string): PromiseLike<{ }>;
  appendFileSync(filePath: string, contents: string): PromiseLike<{ }>;
  readFileSync(filePath: string): { };
  readFile(filePath: string): PromiseLike<{ }>;
  walkDirSync(dirPath: string): string[];
  copyDirContentsSync(srcDir: string, destDir: string): void;
  generateShortId(length: number): string;
  findServicePath(): string;
  logStat(serverless: ServerlessInstance, context: string): PromiseLike<{ }>;
}

declare class YamlParser {
  public parse(yamlFilePath: string): Promise<any>;   // tslint:disable-line:no-any

  constructor(serverless: ServerlessInstance)
}

// ---------------------------------------------------------------------------------------------------------------------

export interface ServerlessInstance {
  cli: {
    log(message: string, entity?: string): null;
    consoleLog(str: any);            // tslint:disable-line:no-any
  };
  config: Config;
  pluginManager: PluginManager;
  providers: {
    aws: {
      sdk: {
        APIGateway: any;        // tslint:disable-line:no-any
        Route53: any;           // tslint:disable-line:no-any
        CloudFormation: any;    // tslint:disable-line:no-any
        ACM: any;               // tslint:disable-line:no-any
        SSM: any;               // tslint:disable-line:no-any
      };
      getCredentials();
      getRegion();
    };
  };
  serverlessDirPath: string;
  service: Service;
  classes: Classes;
  utils: Utils;
  variables: { };
  version: string;
  yamlParser: YamlParser;

  init(): Promise<any>;       // tslint:disable-line:no-any
  run(): Promise<any>;        // tslint:disable-line:no-any

  setProvider(name: string, provider: AwsProvider): null;
  getProvider(name: string): AwsProvider;

  getVersion(): string;
}

export interface ServerlessOptions {
  encryption: string;
}

export interface SSMParam {
  path: string;
  value: string;
  secure?: boolean;
}
