---
title: Generate PDFs on Amazon AWS with PHP and Puppeteer
tags:
  - php
  - node.js
  - aws
  - chrome
  - browsershot
author: Hugo Alliaume
---

## Some context

Those last months at work, for a new big functionality in our CMS, we had to think to _« how to generate a lot of PDFs (~1000 and more in the future) in a really short amount of time? »_.
Our servers are great, but they weren't powerful enough and scalable to generate a lot of PDFs without slowing performances, that's why we go for [Amazon AWS](https://aws.amazon.com/en) by using [Amazon Simple Queue Service](https://aws.amazon.com/sqs/) and [Amazon Lambda](https://aws.amazon.com/lambda/).

I assume you have some knowledge about AWS SQS/Lambda and [the Symfony Messenger Component](https://symfony.com/doc/current/components/messenger.html) before reading this article. More info on [**Symfony Messenger on AWS Lambda**](https://developer.happyr.com/symfony-messenger-on-aws-lambda)

This is the plan:
- our CMS (Symfony) generates and send a message to the SQS queue. Thanks to the Messenger component, [happyr/message-serializer](https://github.com/Happyr/message-serializer), [sroze/messenger-enqueue-transport](https://github.com/sroze/messenger-enqueue-transport) and [enqueue/sqs](https://github.com/php-enqueue/sqs)
- the SQS queue receives messages and pass them to the lambda
- our lambda consumes the message, generates a PDF and save it on [Scaleway](https://www.scaleway.com/) ([Amazon S3](https://aws.amazon.com/en/s3/) like, but cheaper and **easier** to use)

## The lambda

To handle the message from the queue, the lambda will have to run PHP and Symfony because the actual Messenger component only supports Symfony apps (read and vote for RFC [Improve Messenger to support other app consuming/recieving the message](https://github.com/symfony/symfony/issues/33912)).

We will use [Bref](https://github.com/brefphp/bref) to run PHP on our lambda. Bref is a [Serverless](https://github.com/serverless/serverless) plugin, and Serverless is a framework to build and operate serverless applications.
Here is a _simplified_ version of our Serverless configuration file:

```yaml{12-14,32-34}
# serverless.yml
service: app

provider:
    name: aws
    runtime: provided
    region: eu-west-2
    stage: ${opt:stage,'dev'} # we had two stages "dev" (default) and "prod"
    environment:
        APP_ENV: ${self:provider.stage}

plugins:
    # Include Bref plugin
    - ./vendor/bref/bref

package:
  exclude:
    # Excluding those files/directories will reduce deploy time and lambda size a lot
    - bin/.phpunit/**
    - vendor/bin/.phpunit/**
    - var/log/**
    - var/storage/**
    - var/cache/**
    - "!var/cache/${opt:stage,'dev'}/**" # include cache of targeted stage
    - var/cache/*/profiler/**

functions:
  generate_pdf:
    handler: bin/consume-generate-pdf
    reservedConcurrency: 50 # 50 lambda invocations at the same time
    timeout: 60
    layers:
      # Use the Bref layer, see https://bref.sh/docs/runtimes
      - 'arn:aws:lambda:us-west-1:209497400698:layer:php-74:1'
    events:
      - sqs:
          arn: <arn SQS>
          # We tell Amazon SQS to send only 1 message from the queue to the function,
          # otherwise if we send more than 1 message and one of them fails, then ALL messages are put again in the queue.
          batchSize: 1
```

## How to generate a PDF?

We didn't want to use [wkhtmltopdf](https://wkhtmltopdf.org/)/[KnpLabs/KnpSnappyBundle](https://github.com/KnpLabs/KnpSnappyBundle), because we had enough issues in the past to install and use it (missing shared Linux libraries, crash when SSL errors, the render is not _predictable_ and can be different of what Chrome renders ...).

Instead, we thought about using [Puppeteer](https://github.com/puppeteer/puppeteer) and [Browsershot](https://github.com/spatie/browsershot). Puppeteer is a **Node.js** library which profides an API to control **Chrome**, and Browsershot is a nice PHP wrapper around Puppeteer.

```bash
$ yarn add puppeteer
$ composer require spatie/browsershot
```

But Puppeteer won't work because the lambda doesn't have Node.js support yet. To fix this, we used a layer provided by [lambci/node-custom-lambda](https://github.com/lambci/node-custom-lambda):

```yaml{9}
# serverless.yml
# ...

functions:
  generate_pdf:
    handler: bin/consume-generate-pdf
    # ...
    layers:
      - 'arn:aws:lambda:<region>:553035198032:layer:nodejs12:21'
      # Use the Bref layer, see https://bref.sh/docs/runtimes
      - 'arn:aws:lambda:us-west-1:209497400698:layer:php-74:1'
    # ...
```

Then run `serverless deploy` and... uh? the lambda size is too big?

Yup, it's too big because of the Chrome binary that has been downloaded when installing puppeteer:

```{5}
➜  puppeteer-deps l node_modules/puppeteer/.local-chromium/linux-706915/chrome-linux 
total 279M
drwxr-xr-x 7 kocal kocal 4,0K janv.  2 10:09 .
drwxr-xr-x 3 kocal kocal 4,0K janv.  2 10:09 ..
-rwxr-xr-x 1 kocal kocal 229M janv.  2 10:09 chrome
-rw-r--r-- 1 kocal kocal 1,2M janv.  2 10:09 chrome_100_percent.pak
-rw-r--r-- 1 kocal kocal 1,5M janv.  2 10:09 chrome_200_percent.pak
-rwxr-xr-x 1 kocal kocal 326K janv.  2 10:09 chrome_sandbox
-rwxr-xr-x 1 kocal kocal 5,0K janv.  2 10:09 chrome-wrapper
drwxr-xr-x 3 kocal kocal 4,0K janv.  2 10:09 ClearKeyCdm
-rwxr-xr-x 1 kocal kocal 1,5M janv.  2 10:09 crashpad_handler
-rw-r--r-- 1 kocal kocal  10M janv.  2 10:09 icudtl.dat
-rwxr-xr-x 1 kocal kocal 345K janv.  2 10:09 libEGL.so
-rwxr-xr-x 1 kocal kocal  12M janv.  2 10:09 libGLESv2.so
drwxr-xr-x 2 kocal kocal 4,0K janv.  2 10:09 locales
drwxr-xr-x 2 kocal kocal 4,0K janv.  2 10:09 MEIPreload
-rwxr-xr-x 1 kocal kocal 4,3M janv.  2 10:09 nacl_helper
-rwxr-xr-x 1 kocal kocal 9,5K janv.  2 10:09 nacl_helper_bootstrap
-rwxr-xr-x 1 kocal kocal 3,7M janv.  2 10:09 nacl_helper_nonsfi
-rwxr-xr-x 1 kocal kocal 3,7M janv.  2 10:09 nacl_irt_x86_64.nexe
-rw-r--r-- 1 kocal kocal    1 janv.  2 10:09 natives_blob.bin
-rw-r--r-- 1 kocal kocal 2,5K janv.  2 10:09 product_logo_48.png
drwxr-xr-x 3 kocal kocal 4,0K janv.  2 10:09 resources
-rw-r--r-- 1 kocal kocal  12M janv.  2 10:09 resources.pak
drwxr-xr-x 2 kocal kocal 4,0K janv.  2 10:09 swiftshader
-rw-r--r-- 1 kocal kocal 619K janv.  2 10:09 v8_context_snapshot.bin
-rwxr-xr-x 1 kocal kocal  37K janv.  2 10:09 xdg-mime
-rwxr-xr-x 1 kocal kocal  33K janv.  2 10:09 xdg-settings
➜  puppeteer-deps 
```

On [AWS Lambda limits](https://docs.aws.amazon.com/en_en/lambda/latest/dg/limits.html) page, the deployment package size is:
  - 50 MB (zipped)
  - 250 MB (unzipped)

But when we zip the Chrome binary and its libraries, the size is about 100 MB and so it fails:

```{6}
➜  puppeteer-deps l node_modules/puppeteer/.local-chromium/linux-706915
total 106M
drwxr-xr-x 3 kocal kocal 4,0K janv.  2 10:13 .
drwxr-xr-x 3 kocal kocal 4,0K janv.  2 10:09 ..
drwxr-xr-x 7 kocal kocal 4,0K janv.  2 10:09 chrome-linux
-rw-r--r-- 1 kocal kocal 106M janv.  2 10:14 chrome-linux.zip
```

What can we do?

## Use a _Brotli-fied_ Chrome

During all my research to make Chrome runnable on AWS Lambda, I've found [chrome-aws-lambda](https://github.com/alixaxel/chrome-aws-lambda), a Node.js package that:
- ship a _[Brotli](https://github.com/google/brotli)-fied_ Chrome (**~ 36MB**) which can run on AWS Lambda (see [`bin/` directory](https://github.com/alixaxel/chrome-aws-lambda/tree/master/bin))
- provide a small wrapper around Puppeteer which uncompress Chrome on-the-fly 

Okay great, we have a Chrome that can by used on AWS Lambda, but now we are facing many solutions.

### Solution #1

Download the brotlified Chrome, commit it in our project, and write some PHP to uncompress Chrome at runtime.

**Pros:**
- Fatest solution
- We have a total control over Chrome binaries

**Cons:**
- Chrome updates should be applied manually 

### Solution #2

(I've thought about this solution when writing this article, not when working on the lambda 3/4 months ago.)

Install the package `chrome-aws-lambda` and write some PHP to uncompress Chrome at runtime.

**Pros:**
- Chrome updates are automatically applied

**Cons:**
- The binaries are _hidden_ by `chrome-aws-lambda`, it means that you can't rely on them without using the provided wrapper. Between [v1.20.1](https://github.com/alixaxel/chrome-aws-lambda/tree/v1.20.1/bin) and [v1.20.2](https://github.com/alixaxel/chrome-aws-lambda/tree/v1.20.2/bin) the `bin/` directory structure has been modified and shared libraries are archived with `tar`. If we had installed `chrome-aws-lambda` without a fixed version constraint (eg.: `1.20.1`), then the PDFs generation might have fails and it would have been **really critical** for us. 

### Solution #3

Fork `chrome-aws-lambda`, write a PHP wrapper, and open a pull request.

**Pros:**
- The PHP wrapper would have been available for more users

**Cons:**
- Time to wait before potential merging? We had a deadline for our new big functionality
- Maybe the PR could have been refused
- Two wrappers to maintain and test

### EDIT 21/04/2020: Solution #4



## Use Chrome, Browsershot and Puppeteer on Amazon AWS 

We used the Solution #1 for the stability and lake of time.

### Don't deploy Puppeteer's Chrome binary

Since Chrome binary from `puppeteer` package is to large, we can replace it by [`puppeteer-core`](https://www.npmjs.com/package/puppeteer-core) (same `puppeteer-core` but without Chrome binary), but Browsershot [is only compatible with `puppeteer`](https://github.com/spatie/browsershot/blob/ca0a5882b87e53e602d3f8bd236086056a50c108/bin/browser.js#L1).

A solution is to configure Serverless to exclude Puppeteer's Chrome binary folder like this:

```yaml{7}
# serverless.yml
#...

package:
  exclude:
    # ...
    - node_modules/puppeteer/.local-chromium/** # we will ship a brotli-compressed Chrome binary

#...
```

### Download brotlified Chrome binary

When working on the lambda, the latest version of `chrome-aws-lambda` was 1.20.1 (see [binary files](https://github.com/alixaxel/chrome-aws-lambda/tree/v1.20.1/bin)).

We have created a directory `chromium`, downloaded `.br` files and put them like this:

```
➜  the-lambda git:(master) tree chromium
chromium
├── chromium-78.0.3882.0.br
└── swiftshader
    ├── libEGL.so.br
    └── libGLESv2.so.br

1 directory, 3 files
```

### Uncompress Chrome binary on-the-fly

#### Install Brotli binary

We use [vdechenaux/brotli-bin-amd64](https://github.com/vdechenaux/brotli-bin-amd64) to download the brotli binary.

```bash
composer require vdechenaux/brotli-bin-amd64
```

The file `bin/brotli-bin-amd64` should now exists.

#### Create a `Chromium` class

I prefer to manipulate an object instead of a scalar values. Later we can imagine we had to store Chrome version and using an object will make things easier.

```php
<?php declare(strict_types=1);
// src/Chromium/Chromium.php

namespace App\Chromium;

class Chromium
{
    private $path;

    public function __construct(string $path)
    {
        $this->path = $path;
    }

    public function getPath(): string
    {
        return $this->path;
    }
}
```

#### Create a `ChromiumFactory` class

This is the class which will uncompress Chrome at the runtime into `/tmp/chromium` folder.

We have profiled this part of code and it takes ~2-3 seconds on a _fresh_ lamda, but it can be much faster if the lambda is re-used (`/tmp` is not cleared and uncompressed Chrome is still here). 

```php
<?php declare(strict_types=1);
// src/Chromium/Factory/ChromiumFactory.php

namespace App\Chromium\Factory;

use App\Chromium\Chromium;
use Symfony\Component\Finder\Finder;
use Symfony\Component\Finder\SplFileInfo;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

class ChromiumFactory
{
    private $binDir;
    private $tmpDir;
    private $chromiumDir;

    public function __construct(string $binDir, string $tmpDir, string $chromiumDir)
    {
        $this->binDir      = $binDir;
        $this->tmpDir      = $tmpDir;
        $this->chromiumDir = $chromiumDir;
    }

    public function initialize(): Chromium
    {
        $finder = new Finder();
        $finder->name('chromium-*')->files()->in($this->chromiumDir);

        foreach ($finder as $chromiumFile) {
            break;
        }

        if (!isset($chromiumFile) || !($chromiumFile instanceof SplFileInfo)) {
            throw new \RuntimeException(sprintf(
                'Unable to find Chromium binary in "%s" directory.',
                $this->chromiumDir
            ));
        }

        $this->inflate($chromiumFile->getFilename());
        $this->inflate('swiftshader/libEGL.so.br');
        $this->inflate('swiftshader/libGLESv2.so.br');

        $chromiumPath = $this->tmpDir.'/'.$chromiumFile->getFilenameWithoutExtension();

        $this->markAsExecutable($chromiumPath);

        return new Chromium($chromiumPath);
    }

    protected function inflate(string $filename): void
    {
        $extension = '.br';
        $extensionLength = strlen($extension);

        if (substr($filename, -$extensionLength) !== $extension) {
            throw new \InvalidArgumentException('Not a brotli file.');
        }

        $outputFilename = $this->tmpDir.'/'.substr($filename, 0, -$extensionLength);
        @mkdir(dirname($outputFilename), 0777, true);

        // Inflate file only if output file does not exist
        if (!file_exists($outputFilename)) {
            $process = new Process(["{$this->binDir}/brotli-amd64", '-d', "{$this->chromiumDir}/{$filename}", '-o', $outputFilename]);
            $process->run();

            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }
        }
    }

    protected function markAsExecutable(string $filename): void
    {
        $process = new Process(['chmod', '+x', $filename]);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }
    }
}
```

and configure it like this:

```yaml
# config/services.yaml
services:
  # default configuration for services in *this* file
  _defaults:
    autowire: true      # Automatically injects dependencies in your services.
    autoconfigure: true # Automatically registers your services as commands, event subscribers, etc.

  # ... your Symfony services ...

  App\Chromium\Factory\ChromiumFactory:
    arguments:
      $tmpDir: '/tmp/chromium' # it probably better to use `sys_get_temp_dir()`
      $binDir: '%kernel.project_dir%/bin'
      $chromiumDir: '%kernel.project_dir%/chromium'
```

#### Use Browsershot with the `ChromiumFactory`

This is an example of how to use Browsershot and the `ChromiumFactory` inside a Message handler (specific to Symfony Messenger Component), but you can use them anywhere you want.

I've used [`league/flysystem-bundle`](https://github.com/thephpleague/flysystem-bundle) and configured a [Scaleway filesystem adapter](https://github.com/thephpleague/flysystem-bundle/blob/master/docs/2-cloud-storage-providers.md#scaleway-object-storage) in order to save my PDF on Scaleway.

```php
<?php declare(strict_types=1);

namespace App\MessageHandler;

use App\Chromium\Factory\ChromiumFactory;
use App\Message\GeneratePdfMessage;
use League\Flysystem\FilesystemInterface;
use Psr\Log\LoggerAwareInterface;
use Psr\Log\LoggerAwareTrait;
use Spatie\Browsershot\Browsershot;
use Symfony\Component\Messenger\Handler\MessageHandlerInterface;

class GeneratePdfMessageHandler implements MessageHandlerInterface, LoggerAwareInterface
{
    use LoggerAwareTrait;

    private $chromiumFactory;
    private $s3Storage;

    public function __construct(ChromiumFactory $chromiumFactory, FilesystemInterface $s3Storage)
    {
        $this->chromiumFactory = $chromiumFactory;
        $this->s3Storage = $s3Storage;
    }

    public function __invoke(GeneratePdfMessage $message): void
    {
        $pdf = $this->getBrowsershot()
            ->setHtml('My html...')
            ->pdf();
        // $pdf contains binary file content

        // Let's save it on Scaleway!
        $this->s3Storage->put('my-file.pdf', $pdf);
    }

    protected function getBrowsershot(): Browsershot
    {
        $chromium = $this->chromiumFactory->initialize();

        $browsershot = (new Browsershot())
            ->setChromePath($chromium->getPath())

            // recommended arguments
            ->addChromiumArguments([
                'disable-dev-shm-usage', // https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#tips
                'disable-gpu',
                'single-process',
                'no-sandbox',
            ])

            // we needed those options in our lambda to prevent issues, but you can ignore them
            ->ignoreHttpsErrors()
            ->setOption('waitUntil', 'domcontentloaded') // when event `DOMContentLoaded` is fired, external resources that takes longer to load (or timeout after 2 min) are not waited.
          ;

        return $browsershot;
    }
}
```

And voilà! When executing this code, a PDF should have been generated with Browsershot and Puppeteer and be saved on Scaleway.
