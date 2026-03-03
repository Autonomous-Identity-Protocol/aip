import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { type AppLoadContext, type EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext
) {
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={5_000}
      />,
      {
        onShellReady() {
          const body = new PassThrough();
          responseHeaders.set("Content-Type", "text/html");
          resolve(new Response(body, {
            headers: responseHeaders,
            status: responseStatusCode,
          }));
          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
      }
    );

    setTimeout(abort, 5_000);
  });
}
