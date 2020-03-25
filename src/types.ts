declare class AwsProvider {
  constructor(serverless: ServerlessInstance, options: Options)

  public getProviderName(): string;
  public getRegion(): string;
  public getServerlessDeploymentBucketName(): string;
  public getStage(): string;
}

interface Options {
  function?: string;
  watch?: boolean;
  extraServicePath?: string;
  stage: string | null;
  region: string | null;
  noDeploy?: boolean;
}

interface Config {
  servicePath: string;
}

interface Provider {
  region: string;
}

interface Service {
  provider: Provider;
  custom: {
    ssmPublish: SSMPublish;
  };
  getServiceName(): string;
}

interface Classes {
  Error: any; // tslint:disable-line:no-any
}

interface SSMPublish {
  enabled: boolean | string | undefined;
  params: SSMParam[] | undefined;
}

export interface SSMParam {
  path: string;
  value: string;
  description?: string;
  secure?: boolean;
}

// ---------------------------------------------------------------------------------------------------------------------

export interface ServerlessInstance {
  cli: {
    log(message: string, entity?: string): null;
    consoleLog(str: any);            // tslint:disable-line:no-any
  };
  config: Config;
  providers: {
    aws: {
      sdk: {
        SSM: any;               // tslint:disable-line:no-any
      };
      getCredentials();
      getRegion();
    };
  };
  serverlessDirPath: string;
  service: Service;
  classes: Classes;
  getProvider(name: string): AwsProvider;
}
