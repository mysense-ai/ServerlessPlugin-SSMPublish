declare class AwsProvider {

  constructor(serverless: ServerlessInstance, options: Options)

  public getProviderName(): string;
  public getRegion(): string;
  public getServerlessDeploymentBucketName(): string;
  public getStage(): string;
  public request(service: string, method: string, data: { }, stage: string, region: string): Promise<any>; // tslint:disable-line:no-any
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
  name: string;
  stage: string;
}

interface Service {
  name: string;
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
  customPrefix?: string;
  publishCloudFormationExports?: boolean;
}

export interface BaseSSMParam {
  path: string;
  description?: string;
  secure?: boolean;
}
export interface SSMParamCloudFormation extends BaseSSMParam {
  source: string;
}

export interface SSMParamWithValue extends BaseSSMParam {
  value: string;
}

export type SSMParam = SSMParamWithValue | SSMParamCloudFormation;

// ---------------------------------------------------------------------------------------------------------------------

export interface ServerlessInstance {
  cli: {
    log(message: string, entity?: string): null;
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
