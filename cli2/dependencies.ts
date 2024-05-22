import * as util from "util";
import * as fs from "fs";
import { z } from "zod";
import { getUri } from "get-uri";
import { decode, labelToName } from "whatwg-encoding";
import { Readable } from "stream";
import { ResultAsync } from "neverthrow";

const parseDataUrl = require("data-urls");
const fsReadFile = util.promisify(fs.readFile);

const DataUrl = z.string().trim().transform((val, ctx) => {
  const parsed = parseDataUrl(val)
  if (parsed == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Not a valid data url"
    })
    return z.NEVER;
  }
  return parsed;
});

const FileUrl = z.string().trim().url().transform((val, ctx) => {
  if (!val.startsWith("file:")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Not a valid file url"
    })
    return z.NEVER;
  }
  return new URL(val);
});

const Url = z.string().url().transform((url) => new URL(url));

const PathOrUrl = z.union([FileUrl, z.string().trim().min(1)]);

const DependencyBase = z.object({
  source: z.enum(["dependencies", "localDependencies", "includes"]).optional()
});

const UnclassifiedDependency = DependencyBase.extend({
  kind: z.literal("unclassified"),
  path: z.string()
});


const FileDependency = DependencyBase.extend({
  kind: z.literal("file"),
  pathOrUrl: PathOrUrl,
});

const DataUrlDependency = DependencyBase.extend({
  kind: z.literal("dataUrl"),
  url: DataUrl
})

const LocalDependency = z.discriminatedUnion("kind", [
  FileDependency,
  DataUrlDependency
]);

const HttpDependency = DependencyBase.extend({
  kind: z.literal("http"),
  url: Url
});

const GithubData = z.object({
  owner: z.string(),
  repo: z.string(),
  baseUrl: z.string().optional()
});

const GithubConfig = z.union([GithubData, z.string()]);

const GithubDependency = DependencyBase.extend({
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

const ClassifiedDependency = z.discriminatedUnion("kind", [
  FileDependency,
  DataUrlDependency,
  HttpDependency,
  GithubDependency
]);


const DependencySettings = z.union([DataUrl, FileUrl, z.string().trim()])
const Dependencies = z.array(DependencySettings).default([]);

export const DependencyConfig = z.object({
  dependencies: Dependencies,
  localDependencies: z.array(z.string()).default([]),
  includes: z.array(z.string()).default([]),
});

const IncludeProvided = z.object({
  eventKind: z.literal('IncludeProvided'),
  payload: z.string()
});

const LocalDependencyProvided = z.object({
  eventKind: z.literal('LocalDependencyProvided'),
  payload: z.string()
})

const DependencyProvided = z.object({
  eventKind: z.literal('DependencyProvided'),
  payload: DependencySettings
});

const DependencyEvent = z.discriminatedUnion("eventKind", [
  IncludeProvided,
  LocalDependencyProvided,
  DependencyProvided
]);

const DependencyEvents = z.array(DependencyEvent);

const DependencyConfigToDependencyEvents = DependencyConfig.transform((config) => {
  let events = DependencyEvents.parse([]);
  const includes = config.includes.map((include) => IncludeProvided.parse({ eventKind: "IncludeProvided", payload: include }));
  events.push(...includes);
  const localDeps = config.localDependencies.map((localDependency) => LocalDependencyProvided.parse({ eventKind: "LocalDependencyProvided", payload: localDependency }));
  events.push(...localDeps);
  const deps = config.dependencies.map((dep) => DependencyProvided.parse({ eventKind: "DependencyProvided", payload: dep }));
  events.push(...deps);
  return events;
});


const MorphirDistribution = z.tuple([z.string()]).rest(z.unknown());
const MorphirIRFile = z.object({
  formatVersion: z.number().int(),
  distribution: MorphirDistribution
}).passthrough();

type DataUrl = z.infer<typeof DataUrl>;
type FileUrl = z.infer<typeof FileUrl>;
type Url = z.infer<typeof Url>;
type DependencyConfigToDependencyEvents = z.infer<typeof DependencyConfigToDependencyEvents>
type LocalDependency = z.infer<typeof LocalDependency>;
type PathDependency = z.infer<typeof FileDependency>;
type PathOrUrl = z.infer<typeof PathOrUrl>;
type DataUrlDependency = z.infer<typeof DataUrlDependency>;
type UnclassifiedDependency = z.infer<typeof UnclassifiedDependency>;
type ClassifiedDependency = z.infer<typeof ClassifiedDependency>;
type HttpDependency = z.infer<typeof HttpDependency>;
type GithubDependency = z.infer<typeof GithubDependency>;
type RemoteDependency = z.infer<typeof RemoteDependency>;
type GithubData = z.infer<typeof GithubData>;
type GithubConfig = z.infer<typeof GithubConfig>;
type DependencyInfo = z.infer<typeof DependencyInfo>;
type DependencyEvent = z.infer<typeof DependencyEvent>;
type MorphirDistribution = z.infer<typeof MorphirDistribution>;
type MorphirIRFile = z.infer<typeof MorphirIRFile>;
export type DependencyConfig = z.infer<typeof DependencyConfig>;

function toLocalDependency(dependency: string): LocalDependency {
  const dataUrl = parseDataUrl(dependency);
  if (dataUrl == null) {
    return { kind: "file", pathOrUrl: PathOrUrl.parse(dependency) };
  } else {
    return { kind: "dataUrl", url: dataUrl };
  }
}

export async function loadAllDependencies(config: DependencyConfig) {
  const events = DependencyConfigToDependencyEvents.parse(config);
  const results = events.map(eventToDependencyInfo);
  const finalResults = await Promise.all(results);
  return finalResults.flatMap((result) => {
    if (result.isOk()) {
      return result.value;
    } else {
      return [];
    }
  });
}

async function eventToDependencyInfo(event: DependencyEvent) {
  let source: "dependencies" | "localDependencies" | "includes";
  let payload = event.payload;
  switch (event.eventKind) {
    case 'IncludeProvided':
      source = "includes";
      return await loadDependenciesFromString(event.payload);
    case 'LocalDependencyProvided':
      source = "localDependencies";
      return await loadDependenciesFromString(event.payload);
    case 'DependencyProvided':
      source = "dependencies";
      if (typeof payload === "string") {
        return await loadDependenciesFromString(payload);
      } else {
        return await loadDependenciesFromURL(payload);
      }
  }
}

export async function loadDependencies(dependencyConfig: DependencyConfig) {
  let remoteDependencies: RemoteDependency[] = [];
  let localDependencies: LocalDependency[] = (dependencyConfig.localDependencies ?? []).map(toLocalDependency).map((d) => {
    d.source = "localDependencies";
    return d;
  });
  if (dependencyConfig.includes) {
    const includes = dependencyConfig.includes.map(toLocalDependency).map((d) => {
      d.source = "includes";
      return d;
    });
    localDependencies.push(...includes);
  }
  if (dependencyConfig.dependencies) {
    dependencyConfig.dependencies.forEach((input) => {
      let parseResult = DataUrl.safeParse(input);
      let parseSuccess = parseResult.success;
      if (parseSuccess) {
        localDependencies.push({ kind: "dataUrl", url: parseResult.data, source: "dependencies" });
      }
      if (!parseSuccess) {
        let parseResult = FileUrl.safeParse(input);
        parseSuccess = parseResult.success;
        if (parseResult.success) {
          localDependencies.push({ kind: "file", pathOrUrl: parseResult.data, source: "dependencies" });
        }
      }
      if (!parseSuccess) {
        let parseResult = HttpDependency.safeParse({ kind: "http", url: input, source: "dependencies" });
        parseSuccess = parseResult.success;
        if (parseResult.success) {
          let httpDependency: HttpDependency = parseResult.data;
          remoteDependencies.push(httpDependency);
        }
      }

    })
  }
  const localWorkItems = loadLocalDependencies(localDependencies);
  const remoteWorkItems = loadRemoteDependencies(remoteDependencies);
  const allResults = await Promise.all([localWorkItems, remoteWorkItems]);
  return allResults.flat();
}

async function loadLocalDependencies(dependencies: LocalDependency[]): Promise<any[]> {
  const promises = dependencies.map(async dependency => {
    switch (dependency.kind) {
      case 'file':
        if (typeof dependency.pathOrUrl === "string") {
          if (fs.existsSync(dependency.pathOrUrl)) {
            const irJsonStr = (await fsReadFile(dependency.pathOrUrl)).toString();
            return JSON.parse(irJsonStr);
          } else {
            throw new LocalDependencyNotFound(`Local dependency at path "${dependency.pathOrUrl}" does not exist`, dependency.pathOrUrl);
          }
        } else {
          try {
            const stream = await getUri(dependency.pathOrUrl);
            const jsonBuffer = await toBuffer(stream);
            return JSON.parse(jsonBuffer.toString());
          } catch (err: any) {
            if (err.code === 'ENOTFOUND') {
              throw new LocalDependencyNotFound(`Local dependency at url "${dependency.pathOrUrl}" does not exist`, dependency.pathOrUrl, err);
            } else {
              throw err;
            }
          }
        }
        break;
      case 'dataUrl':
        const encodingName = labelToName(dependency.url.mimeType.parameters.get("charset") || "utf-8") || "UTF-8";
        const bodyDecoded = decode(dependency.url.body, encodingName);
        return JSON.parse(bodyDecoded);
    }
  })
  return Promise.all(promises);
}

async function loadRemoteDependencies(dependencies: RemoteDependency[]): Promise<any[]> {
  const promises = dependencies.map(async dependency => {
    switch (dependency.kind) {
      case 'http':
        if (dependency.url.protocol.startsWith("http")) {
          const stream = await getUri(dependency.url.toString());
          const buffer = await toBuffer(stream);
          const jsonString = buffer.toString();
          return JSON.parse(jsonString);
        }
        break;
    }
  });
  return Promise.all(promises);
}

function isRemoteDependency(dependency: DependencyInfo): undefined | boolean {
  switch (dependency.kind) {
    case 'dataUrl':
    case 'file':
      return false;
    case 'http':
      return true;
    case 'github':
      return true;
    default:
      return undefined;
  }
}

function loadDependenciesFromString(input: string) {
  const doWork = async () => {
    let sanitized = input.trim();
    let { success, data } = DataUrl.safeParse(sanitized);
    if (success) {
      const dataFromDataUrl = await getUri(data);
      const buffer = await toBuffer(dataFromDataUrl);
      const jsonString = buffer.toString();
      return JSON.parse(jsonString);
    }
    let { success: fileSuccess, data: fileData } = FileUrl.safeParse(sanitized);
    if (fileSuccess && fileData !== undefined) {
      const data = await getUri(fileData);
      const buffer = await toBuffer(data);
      const jsonString = buffer.toString();
      return JSON.parse(jsonString);
    }
    let { success: urlSuccess, data: urlData } = Url.safeParse(sanitized);
    if (urlSuccess && urlData !== undefined) {
      if (urlData.protocol.startsWith("http") || urlData.protocol.startsWith("ftp")) {
        const data = await getUri(urlData);
        const buffer = await toBuffer(data);
        const jsonString = buffer.toString();
        return JSON.parse(jsonString);
      }
    }
    throw new DependencyError("Invalid dependency string", input);
  }
  return ResultAsync.fromPromise(doWork(), (err) => new DependencyError("Error loading dependency", input, err));
}

function loadDependenciesFromURL(url: URL | Url) {
  const doWork = async () => {
    const data = await getUri(url);
    const buffer = await toBuffer(data);
    const jsonString = buffer.toString();
    return JSON.parse(jsonString);
  }
  return ResultAsync.fromPromise(doWork(), (err) => new DependencyError("Error loading dependency", url, err));
}

async function toBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

class DependencyError extends Error {
  constructor(message: string, dependency?: string | FileUrl | DataUrl | URL, cause?: Error | unknown) {
    super(message);
    this.name = "DependencyError";
    if (cause) {
      this.cause = cause;
    }
  }
  cause?: Error | unknown;
  dependency?: string | FileUrl | DataUrl | URL;
}

class LocalDependencyNotFound extends Error {
  constructor(message: string, pathOrUrl?: PathOrUrl, cause?: Error | unknown) {
    super(message);
    this.name = "LocalDependencyNotFound";
    if (cause) {
      this.cause = cause;
    }
    if (pathOrUrl) {
      this.pathOrUrl = pathOrUrl;
    }
  }

  cause?: Error | unknown;
  pathOrUrl?: PathOrUrl;

}