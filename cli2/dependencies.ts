import * as util from "util";
import * as fs from "fs";
import {z} from "zod";
import parseDataUrl from "data-urls";
import {getUri} from "get-uri";
import {labelToName, decode} from "whatwg-encoding";
import {de} from "vis-network/declarations/network/locales";

const fsReadFile = util.promisify(fs.readFile);

const UnclassifiedDependency = z.object({
  kind: z.literal("unclassified"),
  path: z.string()
});

const FileDependency = z.object({
  kind: z.literal("path"),
  path: z.string()
});

const DataUrlDependency = z.object({
  kind: z.literal("dataUrl"),
  url: z.string().transform((val, ctx) => {
    const parsed = parseDataUrl(val)
    if(parsed == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Not a valid data url"
      })
      return z.NEVER;
    }
    return parsed;
  })
})

const LocalDependency = z.discriminatedUnion("kind",[
    FileDependency,
    DataUrlDependency
]);

const HttpDependency = z.object({
  kind: z.literal("http"),
  url: z.string().url()
});

const GithubData = z.object({
  owner: z.string(),
  repo: z.string(),
  baseUrl: z.string().optional()
});

const GithubConfig = z.union([GithubData, z.string()]);

const GithubDependency = z.object({
  kind: z.literal("github"),
  config: GithubConfig,
});

const RemoteDependency = z.discriminatedUnion("kind", [
  HttpDependency,
  GithubDependency
]);

const DependencyInfo = z.discriminatedUnion("kind", [
  FileDependency,
  DataUrlDependency,
  HttpDependency,
  GithubDependency,
  UnclassifiedDependency
]);

const ClassifiedDependency = z.discriminatedUnion("kind",[
  FileDependency,
  DataUrlDependency,
  HttpDependency,
  GithubDependency
]);

const DependencyConfig = z.object({
  dependencies: z.array(z.string()).optional(),
  localDependencies: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
});

const MorphirDistribution = z.tuple([z.string()]).rest(z.unknown());
const MorphirIRFile = z.object({
  formatVersion: z.number().int(),
  distribution: MorphirDistribution
}).passthrough();

type LocalDependency = z.infer<typeof LocalDependency>;
type PathDependency = z.infer<typeof FileDependency>;
type DataUrlDependency = z.infer<typeof DataUrlDependency>;
type UnclassifiedDependency = z.infer<typeof UnclassifiedDependency>;
type ClassifiedDependency = z.infer<typeof ClassifiedDependency>;
type HttpDependency = z.infer<typeof HttpDependency>;
type GithubDependency = z.infer<typeof GithubDependency>;
type RemoteDependency = z.infer<typeof RemoteDependency>;
type GithubData = z.infer<typeof GithubData>;
type GithubConfig = z.infer<typeof GithubConfig>;
type DependencyInfo = z.infer<typeof DependencyInfo>;
type MorphirDistribution = z.infer<typeof MorphirDistribution>;
type MorphirIRFile = z.infer<typeof MorphirIRFile>;
export type DependencyConfig = z.infer<typeof DependencyConfig>;

function toLocalDependency(dependency:string): LocalDependency {
  const dataUrl = parseDataUrl(dependency);
  if(dataUrl == null){
    return {kind: "path", path: dependency};
  } else {
    return {kind:"dataUrl", url: dataUrl};
  }
}

export async function loadDependencies(dependencyConfig:DependencyConfig) {
  console.error("Dependencies to load", dependencyConfig);

  let localDependencies:LocalDependency[] = (dependencyConfig.localDependencies ?? []).map(toLocalDependency);
  if(dependencyConfig.includes) {
    const includes = dependencyConfig.includes.map(toLocalDependency);
    localDependencies.push(...includes);
  }
  return await loadLocalDependencies(localDependencies);
}

async function loadLocalDependencies(dependencies:LocalDependency[]): Promise<any[]> {
  const promises = dependencies.map(async dependency => {
    switch (dependency.kind) {
      case 'path':
        if (fs.existsSync(dependency.path)) {
          const irJsonStr = (await fsReadFile(dependency.path)).toString();
          return JSON.parse(irJsonStr);
        } else {
          throw new Error(`Local dependency at path "${dependency.path}" does not exist`);
        }
      case 'dataUrl':
        const encodingName = labelToName(dependency.url.mimeType.parameters.get("charset") || "utf-8") || "UTF-8";
        const bodyDecoded = decode(dependency.url.body, encodingName);
        console.error("Dataurl body decoded", bodyDecoded);
        return JSON.parse(bodyDecoded);
    }
  })
  return Promise.all(promises);
}

async function loadHttpDependencies(dependencies:HttpDependency[]): Promise<any[]> {
  const promises = dependencies.map(async dependency => {

  });
  return Promise.all(promises);
}

function isRemoteDependency(dependency:DependencyInfo): undefined | boolean {
  switch (dependency.kind) {
    case 'dataUrl':
    case 'path':
      return false;
    case 'http':
      return true;
    case 'github':
      return true;
    default:
      return undefined;
  }
}