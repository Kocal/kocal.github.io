---
title: "Generate PDFs on Amazon AWS with PHP and Puppeteer: The Best Way"
tags:
  - php
  - node.js
  - aws
  - chrome
  - browsershot
author: Hugo Alliaume
---

::: warning
This article is a following of article [Generate PDFs on Amazon AWS with PHP and Puppeteer](/2020-01-02-generate-pdfs-on-amazon-aws-with-php-and-puppeteer.md), you must consider reading it before going further.
:::

Several months ago, I wrote my [first article](./2020-01-02-generate-pdfs-on-amazon-aws-with-php-and-puppeteer.md) explaining how to use [Browsershot](https://github.com/spatie/browsershot) and [Puppeteer](https://github.com/puppeteer/puppeteer) on [AWS Lambda](https://aws.amazon.com/en/lambda/).
We saw how to ship a _brotli-fied_ Chrome with our lambda, how to _un-brotlify_ Chrome at the runtime, and how to use it with Browsershot.

But yesterday, I had to update the Chrome version and I faced many issues:
- I had to download Chrome binary and Swiftshader librairies from [`chrome-aws-lambda`](https://github.com/alixaxel/chrome-aws-lambda/tree/master/bin) and do the update manually
- Since binaries are not the same, I had to update the `ChromiumFactory` to handle the file `swiftshader.tar.br`
- I had to update the Chrome flags list by using those from [`chrome-aws-lambda`](https://github.com/alixaxel/chrome-aws-lambda/blob/91f24fdfa87d51eca640cea5ed862d8ba46ca78e/source/index.js#L72-L129).

This is the **first**, and the **last** time I want to do that.

Why should I do what `chrome-aws-lambda` already does well? Isn't possible to use `chrome-aws-lambda` with Browsershot?

After many hours, I was able to use `chrome-aws-lambda` with a **bridge** between [`Browsershot` PHP class](https://github.com/spatie/browsershot/blob/b05da314fe465bceca366179ba4488681f69880d/src/Browsershot.php) and Browsershot's  [`bin/browser.js`](https://github.com/spatie/browsershot/blob/b05da314fe465bceca366179ba4488681f69880d/bin/browser.js), thanks to the method [`Browsershot#setBinPath`](https://github.com/spatie/browsershot#custom-binary-path) that allows us to use a custom `.js` file.

## Cleaning

First, let's clean a bunch of things:
- delete `chromium/` directory
- delete `Chromium` and `ChromiumFactory` classes (and remove them from Symfony services configuration)
- uninstall dependency [`vdechenaux/brotli-bin-amd64`](https://github.com/vdechenaux/brotli-bin-amd64): `composer remove vdechenaux/brotli-bin-amd64` 

## Installing `chrome-aws-lambda`

You can't install whatever version of `chrome-aws-lambda` or `puppeteer` you want, they must be compatible together, see [`chrome-aws-lambda`'s versioning table](https://github.com/alixaxel/chrome-aws-lambda#versioning).

When writing this article, I decided to go with `chrome-aws-lambda@~2.0.0` (which use Chrome 79):

```diff
{
  ...
  "dependencies": {
+    "chrome-aws-lambda": "~2.0.0",
    "puppeteer": "~2.0.0"
  }
}
```

## Creating the bridge

The most important thing is to handle the input and the output the same way than Browsershot does. It means:
- your binary must be able to handle argument `-f <file.json>` or JSON passed at 1st argument
- your binary must output data in base64 when needed

It may be hard, but in fact it's not. 

I've created a `bin/browser.js` file which:
- get input (request) like Browsershot does (literally a copy/paste)
- update this request with `chrome-aws-lambda`'s data (Chrome path and flags)
- override `process.argv[2]` with the new JSON request
- and run the original Browsershot JS file

```js
#!/usr/bin/env node

const fs = require('fs');
const chromium = require('chrome-aws-lambda');

const [, , ...args] = process.argv;

/**
 * There are two ways for Browsershot to communicate with puppeteer:
 * - By giving a options JSON dump as an argument
 * - Or by providing a temporary file with the options JSON dump,
 *   the path to this file is then given as an argument with the flag -f
 */
const request = args[0].startsWith('-f ')
  ? JSON.parse(fs.readFileSync(new URL(args[0].substring(3))))
  : JSON.parse(args[0]);

async function bridge() {
  // merge Browsershot options with chromium-aws-lambda options
  request.options.executablePath = await chromium.executablePath;
  request.options.args = [...chromium.args, ...request.options.args];

  // override process arguments
  process.argv[2] = JSON.stringify(request);

  // then execute Browsershot's initial binary
  return require('../vendor/spatie/browsershot/bin/browser');
}

bridge();
```

This is a real bridge between the Browsershot PHP and Browsershot JS.

## Using the bridge

In your PHP code, when you use Browsershot:

```php
$myBrowsershotInstance->setBinPath('/path/to/bin/browser.js');
```

It is also possible to manually run this file, like Browsershot can do:

```console
$ PATH=$PATH:/usr/local/bin NODE_PATH=`npm root -g` node 'bin/browser.js' '{"url":"https:\/\/google.fr\/","action":"screenshot","options":{"type":"png","args":["--disable-dev-shm-usage"],"viewport":{"width":1920,"height":1080},"ignoreHttpsErrors":true,"waitUntil":"domcontentloaded"}}'
```

If some base64 code is shown, then the bridge is working correctly!
