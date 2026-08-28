export interface WorkerBuildInput {
  readonly options: { readonly typesOnly: boolean };
  readonly packageInfo: {
    readonly name: string;
    readonly exposedModules: readonly string[];
  };
  readonly dependencies: readonly unknown[];
  readonly fileSnapshot: Readonly<Record<string, string>>;
}

type ProgressCallback = (message: string) => void;

interface ElmSubscriptionPort<T> {
  readonly subscribe: (handler: (value: T) => void) => void;
  readonly unsubscribe: (handler: (value: T) => void) => void;
}

export interface ElmBuildWorker {
  readonly ports: {
    readonly decodeFailed: ElmSubscriptionPort<unknown>;
    readonly buildFailed: ElmSubscriptionPort<unknown>;
    readonly reportProgress: ElmSubscriptionPort<string>;
    readonly buildCompleted: ElmSubscriptionPort<[unknown, unknown]>;
    readonly buildFromScratch: {
      readonly send: (input: WorkerBuildInput) => void;
    };
  };
}

export class ElmWorkerDecodeError extends Error {
  readonly details: unknown;

  constructor(details: unknown) {
    super("The Elm worker could not decode its build input");
    this.name = "ElmWorkerDecodeError";
    this.details = details;
  }
}

export function createBuildFromScratch(
  elmWorker: ElmBuildWorker
): (input: WorkerBuildInput, onProgress: ProgressCallback) => Promise<unknown> {
  let buildQueue: Promise<void> = Promise.resolve();

  return (input, onProgress) => {
    const invoke = (): Promise<unknown> =>
      new Promise((resolve, reject) => {
        const installedSubscriptions: Array<() => void> = [];
        let cleaned = false;
        const cleanup = (): unknown | undefined => {
          if (cleaned) {
            return undefined;
          }
          cleaned = true;
          let firstError: unknown | undefined;
          for (
            let index = installedSubscriptions.length - 1;
            index >= 0;
            index -= 1
          ) {
            try {
              installedSubscriptions[index]();
            } catch (error) {
              firstError ??= error;
            }
          }
          return firstError;
        };
        const fail = (error: unknown) => {
          cleanup();
          reject(error);
        };
        const succeed = (distribution: unknown) => {
          const cleanupError = cleanup();
          if (cleanupError === undefined) {
            resolve(distribution);
          } else {
            reject(cleanupError);
          }
        };
        const guard =
          <T>(consumer: (value: T) => void) =>
          (value: T) => {
            try {
              consumer(value);
            } catch (error) {
              fail(error);
            }
          };
        const handleDecodeFailure = guard<unknown>((error) =>
          fail(new ElmWorkerDecodeError(error))
        );
        const handleBuildFailure = guard<unknown>((error) => fail(error));
        const handleProgress = guard<string>(onProgress);
        const handleBuildCompletion = guard<[unknown, unknown]>(
          ([error, distribution]) =>
            error ? fail(error) : succeed(distribution)
        );
        const subscribe = <T>(
          port: ElmSubscriptionPort<T>,
          handler: (value: T) => void
        ) => {
          installedSubscriptions.push(() => port.unsubscribe(handler));
          port.subscribe(handler);
        };

        try {
          subscribe(elmWorker.ports.decodeFailed, handleDecodeFailure);
          subscribe(elmWorker.ports.buildFailed, handleBuildFailure);
          subscribe(elmWorker.ports.reportProgress, handleProgress);
          subscribe(elmWorker.ports.buildCompleted, handleBuildCompletion);
          elmWorker.ports.buildFromScratch.send(input);
        } catch (error) {
          fail(error);
        }
      });

    const result = buildQueue.then(invoke);
    buildQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  };
}
