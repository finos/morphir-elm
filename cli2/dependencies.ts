import * as util from "util";
import * as fs from "fs";
import {z} from "zod";

const UnclassifiedDependency = z.object({
  kind: z.literal("unclassified"),
  path: z.string(),
});

const LocalDependency = z.object({
  kind: z.literal("local"),
  path: z.string()
});

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

const RemoteDependency = z.discriminatedUnion("kind",[
    HttpDependency,
    GithubDependency
]);

const DependencyInfo = z.discriminatedUnion("kind",[
    LocalDependency,
    HttpDependency
]);

const DependencyConfig = z.object({
  dependencies: z.array(z.string()).optional(),
  localDependencies: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
});

const MorphirDistribution = z.tuple([z.string()]).rest(z.unknown());
const MorphirIRFile = z.object ({
  formatVersion: z.number().int(),
  distribution: MorphirDistribution
}).passthrough();

type LocalDependency = z.infer<typeof LocalDependency>;
type UnclassifiedDependency = z.infer<typeof UnclassifiedDependency>;
type HttpDependency = z.infer<typeof HttpDependency>;
type GithubDependency = z.infer<typeof GithubDependency>;
type RemoteDependency = z.infer<typeof RemoteDependency>;
type GithubData = z.infer<typeof GithubData>;
type GithubConfig = z.infer<typeof GithubConfig>;
type DependencyInfo = z.infer<typeof DependencyInfo>;
type MorphirDistribution = z.infer<typeof MorphirDistribution>;
type MorphirIRFile = z.infer<typeof MorphirIRFile>;
export type DependencyConfig = z.infer<typeof DependencyConfig>;

const fsReadFile = util.promisify(fs.readFile);

export async function getDependencies(dependencyInfo:DependencyConfig): Promise<any[]> {
  const workItems = [];
  if(dependencyInfo.localDependencies !== undefined) {
    let work = loadLocalDependencies(dependencyInfo.localDependencies);
    workItems.push(work);
  }
  return Promise.all(workItems);
}



async function loadLocalDependencies(dependencies:string[]): Promise<any[]> {

  const workItems = dependencies.map(async (dependencyPath) => {
    if (fs.existsSync(dependencyPath)) {
      const dependencyIR = (await fsReadFile(dependencyPath)).toString();
      const ir = JSON.parse(dependencyIR);
      return ir;
    } else {
      throw new Error(`${dependencyPath} does not exist`);
    }
  });
  return Promise.all(workItems);
}

export async function loadDependencies():Promise<any[]>{
  return [];
}

function toLocalDependency(dependency:string) : LocalDependency {
  return { kind:"local", path:dependency};
}



