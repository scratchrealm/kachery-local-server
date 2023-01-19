# kachery-local-server

Connecting to a local Kachery server can dramatically speed up the loading of data for Figurl figures.

## Prerequisites

[A recent version of nodejs](https://nodejs.dev/en/learn/how-to-install-nodejs/)

## Running the local server

You do **not** need to clone this repo. Just run:

```bash
npx kachery-local-server@latest serve
# The server will start listening for requests
# Keep this terminal open
```

## Setting up Figurl to use the local server

When viewing a Figurl figure, click on the appropriate button in the top menu bar. Then follow the instructions.

## How it works

In Figurl, when a data file is downloaded from the Kachery cloud to the browser, the content is sent to the local Kachery server, which saves it to the Kachery storage directory. On subsequent page loads, the file is retrieved directly from the local server, rather than loading from the cloud. This system is possible because Kachery uses content-addressable storage.
