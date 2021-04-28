---
title: Migration de notre stack de développement vers Docker
tags:
- virtual machine
- docker
- symfony cli
- php
- node.js
date: 2021-04-26
summary: Pourquoi et comment migrer des machines virtuelles à de l'hybride et containers Docker.
---

Chez [yProximité](https://www.y-proximite.fr/), agence web, on utilise les machines virtuelles depuis plusieurs années comme stack de développement sur tous nos différents projets web (nécessitant un
serveur web nginx, du PHP, du Node.js, et des fois une base de données).

On utilise :

- make, car les `Makefile` c'est super pratique
- [VirtualBox](https://www.virtualbox.org/) pour la virtualisation des machines
- [Vagrant](https://www.vagrantup.com/) pour les contrôler
- [Ansible](https://docs.ansible.com/) pour automatiser le provisionnement
- [les rôles Ansible de Manala](https://github.com/manala/ansible-roles), développés par l'[agence web Elao](https://www.elao.com/) et qui nous prémâche 95% du travail (un grand merci :heart:)

Ça fonctionne plutôt bien (quand ça fonctionne :stuck_out_tongue_winking_eye:), et ça a pour avantage d'avoir un environnement de développement totalement fonctionnel et isolé de la machine hôte.

En revanche, plusieurs années ont passé et l'équipe et moi-même avons rencontré plusieurs problèmes.

## La grande liste de problèmes avec les machines virtuelles

### Problèmes systèmes

1. Pour les utilisateurs d'Ubuntu 18.04 ou plus, le plugin [Vagrant Landrush](https://github.com/vagrant-landrush/landrush) (qui permet de mapper un faux NDD vers l'IP d'une
   VM) [ne fonctionne pas](https://github.com/vagrant-landrush/landrush/issues/342). On doit manuellement rajouter une entrée dans notre `/etc/hosts`.
2. Il y a des versions de VirtualBox qui ne fonctionnent litérallement pas. Dès que je trouvais une version qui fonctionnait parfaitement (ex : `6.1.16` pour Ubuntu 20.10), je désactivais les mises à
   jour via `echo "virtualbox-6.1 hold" | sudo dpkg --set-selections`, dans la crainte qu'une mise à jour ne fasse plus fonctionner les VM...
3. Des problèmes d'espace disque. Avec une VM par projet, l'espace disque utilisé peut monter assez vite (~160 Go utilisé après 3 ans sans nettoyage).
4. Des problèmes de consommation CPU / RAM, faire tourner une ou plusieurs VM, avec PhpStorm, avec Google Chrome, etc... le tout en même temps, ce n'est pas donné à tout le monde. Il faut avoir une
   très bonne machine capable d'encaisser la charge.

### Problèmes applicatifs

5. Le watching de fichiers qui ne fonctionne pas à cause de l'utilisation de NFS :
    - faire fonctionner le mode watch et dev-server de webpack, grâce au [polling](https://webpack.js.org/configuration/watch/#watchoptionspoll)
    - faire fonctionner le mode watch de TailwindCSS JIT grâce à `CHOKIDAR_USEPOLLING=1` ([discussion GitHub](https://github.com/tailwindlabs/tailwindcss/discussions/4024))
6. Il y a des fichiers importants qu'il faut importer dans la VM (`~/.ssh/config`, `~/.composer/auth.json`, `~/.gitconfig`, etc ...), ça se fait automatiquement dès le boot de la VM, mais si on
   pouvait éviter...
7. Pour nos git hooks ou tests Cypress (tout ce qui peut être lancé dans et en dehors de la VM en fait), il fallait passer par un petit script `vagrant-wrapper.sh` pour s'assurer que nos commandes
   soient bien exécutées dans la VM :

```shell
#!/usr/bin/env bash

# Permet d'exécuter une commande dans la VM, que l'on soit dans la VM ou non.
# Exemple : ./vagrant-wrapper.sh bin/phpstan analyse

vagrant_wrapper() {
    local user_command=$@

    # we assume that we are outside the VM if command `vagrant` is available
    if [[ -x "$(command -v vagrant)" ]]; then
        vagrant ssh -- "cd /srv/app && ${user_command}"
    else
        eval ${user_command}
    fi
}

vagrant_wrapper $@
```

8. Si on utilisait un certificat HTTPS local (ex : généré avec [mkcert](https://github.com/FiloSottile/mkcert)), il fallait lancer nginx après que la partition NFS (contenant notre certificat HTTPS)
   soit montée, sinon nginx ne se lançait pas car certificat HTTPS introuvable :

```ruby
Vagrant.configure(2) do |config|
  # ...
  config.trigger.after :up do |trigger|
    trigger.name = "nginx"
    trigger.info = "Starting nginx..."
    trigger.run_remote = {inline: "if systemctl cat nginx >/dev/null 2>&1; then sudo systemctl start nginx; fi"}
  end
end
```

9. Si l'un de nos projets dépendait d'un autre (ex : projet **A** qui utilise l'API du projet **B** et qui est en HTTPS), alors il fallait importer le certificat racine de mkcert dans la VM (cette
   solution n'a été testée que sous Debian/Ubuntu, ne fonctionne sans doute pas sous macOS) :

```ruby
Vagrant.configure(2) do |config|
  # ...
  Dir['/usr/local/share/ca-certificates/mkcert_*'].each do |path|
    filename = path.split('/').last

    config.vm.provision 'file', run: 'always' do |file|
      file.source = path
      file.destination = "/home/#{config.ssh.username}/#{filename}" # file provisionner can't write in /usr/local/... due to permissions, we have to use a trigger
    end

    # copy to /usr/local/..., apply permissions and update CA certificates
    config.trigger.after [:up, :provision] do |trigger|
      trigger.name = "mkcert"
      trigger.info = "Copying mkcert's CA file..."
      trigger.run_remote = {
        inline: 'if [ -f "%{source}" ]; then mv "%{source}" "%{path}" && chown root:staff "%{path}" && update-ca-certificates; fi' % { source: "/home/#{config.ssh.username}/#{filename}", path: path }
      }
    end
  end
end
```

### Des performances abominables

10. L'installation initiale (via le provisioning Ansible) est très longue, ~15 minutes, tellement il y a de choses à installer et à configurer.
11. La VM peut prendre plusieurs dizaines de secondes à boot.
12. La partition NFS n'aide pas du tout, même si on a déjà réussi à diviser par 4 le temps des `yarn install` et `composer install` en utilisant cette configuration :

```ruby
Vagrant.configure(2) do |config|
  # ...
  config.vm.synced_folder '.', '/srv/app',
    type: 'nfs',
    mount_options: ['vers=3', 'tcp', 'rw', 'nolock', 'actimeo=1'],
    linux__nfs_options: ['rw', 'all_squash', 'async']
end
```

13. Sur notre plus gros (et ancien) projet, notre CMS maison, certaines pages peuvent mettre jusqu'à 10 secondes ou **beaucoup plus** pour s'afficher, c'est une horreur comme expérience développeur et
    ça casse la vélocité.

### tl;dr

Beaucoup trop de problèmes, beaucoup trop de tweaks et temps investi pour outre-passer ces derniers.

## Analyses et réflexions

Pour récapituler :

- nos projets webs nécessitent un serveur web, Nginx
- ils sont tous basés sur du PHP (mais avec des versions différentes)
- certains ont besoin de Node.js (également avec des versions différentes) pour build des assets via [webpack Encore](https://github.com/symfony/webpack-encore)
- certains ont besoin d'une base de données (MySQL, MariaDB ou PostgreSQL avec des versions différentes aussi)
- certains ont besoin de Redis (pour la mise en cache et stocker des sessions PHP)

### Réflexions

Je sais par expérience que :

- il est facile d'installer nginx, mais ce n'est peut-être pas forcément l'idéal... à voir comment gérer les noms de domaines
- il est très facile d'installer plusieurs versions de PHP, via :
    - le [PPA d'Ondrej](https://launchpad.net/~ondrej/+archive/ubuntu/php) pour Ubuntu,
    - le [DPA Sury.org/PHP](https://packages.sury.org/php/) pour Debian,
    - [Brew](https://brew.sh/) pour macOS et Linux,
    - ou encore [phpenv](https://github.com/phpenv/phpenv) pour macOS et Linux également
- il est également très facile d'installer plusieurs version de Node.js, via :
    - [nvm](https://github.com/nvm-sh/nvm) pour macOS et Linux,
    - [n](https://github.com/tj/n) pour macOS et Linux également
- installer des serveurs de base de données et gérer différentes versions en même temps, c'est **UNE HORREUR** et je n'ai pas envie de bousiller ma machine
- installer Redis globalement n'est peut-être pas la meilleure des idées non plus...

Avec ce constant, je me suis dit qu'on pouvait tenter une stack hybride :

- PHP et Node.js installés sur la machine
- les bases de données et Redis installés via Docker
- il ne manque plus que le serveur web... Comment qu'on fait ?

## Symfony CLI :sparkles:

[Symfony CLI](https://github.com/symfony/cli) est un outil écrit en Go et qui a remplacé l'ancien [Symfony WebServerBundle](https://github.com/symfony/web-server-bundle). Il permet donc de lancer un
serveur PHP et c'est déjà l'outil qu'on utilisait sur nos CI pour nos tests E2E avec [Cypress](https://www.cypress.io/).

Dans notre cas, c'est vraiment l'outil utltime qui fait ~80% du travail :

- il permet donc de démarrer un serveur web
- il est possible d'activer le support d'HTTPS, voir [Enabling TLS](https://symfony.com/doc/current/setup/symfony_server.html#enabling-tls)
- il est possible de démarrer proxy local et d'y attacher des domaines (un ou plusieurs domaines par projets),
  voir [Setting up the Local Proxy](https://symfony.com/doc/current/setup/symfony_server.html#setting-up-the-local-proxy)
- il est possible de configurer PHP à la volée par projet via un `php.ini`,
  voir [Overriding PHP Config Options Per Project](https://symfony.com/doc/current/setup/symfony_server.html#overriding-php-config-options-per-project)
- il est possible de configurer la version de PHP pour chaque projet, via un fichier `.php-version`,
  voir [Selecting a Different PHP Version](https://symfony.com/doc/current/setup/symfony_server.html#selecting-a-different-php-version)
  ::: tip Ça veut dire qu'il faut utiliser le binaire `symfony` pour exécuter des commandes/binaires avec la bonne version de PHP :
- PHP via `symfony php` (ex : `symfony php bin/phpstan analyze`)
- Composer via `symfony composer` (ex : `symfony composer install`)
- La console Symfony avec le raccourci `symfony console` (ex : `symfony console cache:clear`)
  :::
- et le plus exceptionnel, une [intégration avec Docker](https://symfony.com/doc/current/setup/symfony_server.html#docker-integration) qui permet d'injecter automatiquement des variables d'
  environnement du type `DATABASE_URL` ou `REDIS_URL` si des containers d'un certain type sont détectés, **et c'est PARFAIT pour nous !** :heart_eyes:    
  ::: warning Le binaire `symfony` utilisera **toujours** les variables d'environnement détectées via Docker et ignorera les variables d'environnement locales. Cela veut dire que les variables
  d'environnement `DATABASE_URL`, `REDIS_URL`, etc... définies dans vos `.env` ou `.env.test` **ne seront pas utilisées**.
  :::

## Docker

On a donc utilisé des containers Docker pour la base de données et Redis, exemple :

```yaml
version: '3.6'

volumes:
  db-data:
  redis-data:

services:
  database:
    image: 'postgres:12-alpine'
    ports: [5432]
    environment:
      POSTGRES_USER: 'app'
      POSTGRES_PASSWORD: 'app'
      POSTGRES_DB: 'app'
      TZ: Etc/UTC
      PGTZ: Etc/UTC
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: pg_isready
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: 'redis:alpine'
    ports: [6379]
    environment:
      TZ: Etc/UTC
    volumes:
      - redis-data:/data
```

Un coup de `docker-compose up --detach` pour démarrer les containers Docker, et c'est parti !
Pour stopper les containers, lancer simplement `docker-compose stop`.

En lançant `symfony var:export --multiline`, une liste de variables d'environnement semblable devrait s'afficher :

```text
export DATABASE_DATABASE=app
export DATABASE_NAME=app
export DATABASE_URL=postgres://app:app@127.0.0.1:49160/app?sslmode=disable&charset=utf8
export REDIS_URL=redis://127.0.0.1:49234
# ...
```

Si c'est le cas, félicitations ! Le binaire `symfony` a correctement détecté vos containers Docker et vous pouvez lancer `symfony serve`.

## En résumé

- Avoir PHP installé localement
- Avoir Node.js installé localement (ou non)
- Utiliser Docker pour les bases de données et Redis
- Utiliser le Symfony CLI en tant que serveur web, proxy pour le nom de domaine, le https, et intégration Docker

Mettre en route tout ça sur un projet :

- Créer un `docker-compose.yaml` à votre sauce
- Puis lancer les commandes suivantes :

```shell
symfony server:ca:install
symfony proxy:start
symfony proxy:domain:attach my-app
docker-compose up --detach
symfony serve
```

Enjoy !

## Pour aller plus loin

### Utiliser Manala et les recipes

Pour faciliter la maintenance, l'évolutivité, la configuration et la gestion de ces toutes étapes à travers nos différents, on utilise [l'outil Manala](https://manala.github.io/manala/)
qui permet d'utiliser un système de recipes (recettes) et de générer automatiquement plusieurs fichiers à partir d'un seul point d'entrée : le `.manala.yaml`.

Il y a des [recipes officielles](https://github.com/manala/manala-recipes) fournies par Manala, mais ça ne nous convenait pas forcément. On a donc
créé [notre propre repository de recipes](https://github.com/yproximite/manala-recipes), avec une [recipe `yprox.app-docker`](https://github.com/Yproximite/manala-recipes/tree/main/yprox.app-docker)
qui permet :

- de définir la timezone du projet, qui sera injectée dans PHP et dans les containers Docker
- de définir une configuration PHP, qui sera injectée dans le `php.ini`
- de définir quelle base de données utiliser et quelle version, qui modifiera le `docker-compose.yaml`
- de mettre à disposition au développeur des commandes :
    - `make setup` : à exécuter qu'une seule fois, pour _setuper_ le projet, créer les containers Docker...
    - `make up` : pour lancer le proxy local Symfony et les containers Docker
    - `make halt` : pour stopper les containers Docker (quand la journée est finie :stuck_out_tongue: )
    - `make destroy` : pour supprimer les containers Docker et volumes associés

Une fois cette recipe mise en place via `manala init -i yprox.app-docker --repository https://github.com/Yproximite/manala-recipes.git`, sa mise à jour se fera très simplement via un `manala up` :
tada:.

Il ne me faut pas plus de 2 minutes pour mettre à jour la recipe sur 4 ou 5 projets, c'est un vrai gain de temps considérable !

### Intégration avec le CI

Puisqu'on a :

- la version de PHP définie dans le `.php-version`
- la version de Node.js définie dans le `.nvmrc`
- et un `docker-compose.yaml`

Est-ce qu'il serait possible d'exploiter tout ça dans le CI ? La réponse est oui.

On utilise [GitHub Actions](https://github.com/features/actions) comme CI, et il est plutôt facile de modifier nos workflows pour prendre en compte les éléments listés précédemment.

#### Installer PHP et Node.js aux bonnes versions

Le soucis étant que les actions [shivammathur/setup-php](https://github.com/shivammathur/setup-php) et [actions/setup-node](https://github.com/actions/setup-node) ne prennent pas en compte
les `.php-version` et `.nvmrc`, il va donc falloir trouver une solution.

J'ai pris pour habitude de définir la version de PHP et Node.js à utiliser en tant que variables d'environnement définies au niveau du worklfow :

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

env:
  TZ: UTC
  PHP_VERSION: 7.4
  NODE_VERSION: 12.x

jobs:
  php:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ env.PHP_VERSION }}
          coverage: none
          extensions: iconv, intl
          ini-values: date.timezone=${{ env.TZ }}
          tools: symfony

      - uses: actions/setup-node@v2
        with:
          node-version: ${{ env.NODE_VERSION }}

  another_job:
  # ...
```

Sachant qu'il est possible de définir des variables d'environnement à la volée, pourquoi est-ce qu'on n'utiliserait pas le contenu des fichiers `.php-version` et `.nvmrc` ?

C'est totallement possible en faisant ainsi :

```diff
# .github/workflows/ci.yml
name: CI

on:
    pull_request:
        types: [opened, synchronize, reopened, ready_for_review]

env:
    TZ: UTC
-    PHP_VERSION: 7.4
-    NODE_VERSION: 12.x

jobs:
    php:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v2

+           - run: echo "PHP_VERSION=$(cat .php-version | xargs)" >> $GITHUB_ENV
+           - run: echo "NODE_VERSION=$(cat .nvmrc | xargs)" >> $GITHUB_ENV

            # Installation de PHP et Node.js
```

#### Lancer Docker

Une commande `make setup@integration` est disponible pour lancer Docker sur le CI.

```diff
# .github/workflows/ci.yml
name: CI

on:
    pull_request:
        types: [opened, synchronize, reopened, ready_for_review]

env:
    TZ: UTC

jobs:
    php:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v2

            - run: echo "PHP_VERSION=$(cat .php-version | xargs)" >> $GITHUB_ENV
            - run: echo "NODE_VERSION=$(cat .nvmrc | xargs)" >> $GITHUB_ENV
            
            # Installation de PHP et Node.js
            
+           # Configure le Symfony CLI and lance les containers Docker
+           - run: make setup@integration
```

#### Exemple complet

Il est possible de créer une GitHub Action locale qui définira plusieurs variables d'environnement pour nous faciliter la vie :

```yaml
# .github/actions/setup-environment/action.yml
name: Setup environment
description: Setup environment
runs:
  using: 'composite'
  steps:
    - run: echo "PHP_VERSION=$(cat .php-version | xargs)" >> $GITHUB_ENV
      shell: bash

    - run: echo "NODE_VERSION=$(cat .nvmrc | xargs)" >> $GITHUB_ENV
      shell: bash

    # Composer cache
    - id: composer-cache
      run: echo "::set-output name=dir::$(composer global config cache-files-dir)"
      shell: bash

    - run: echo "COMPOSER_CACHE_DIR=${{ steps.composer-cache.outputs.dir }}" >> $GITHUB_ENV
      shell: bash

    # Yarn cache
    - id: yarn-cache-dir
      run: echo "::set-output name=dir::$(yarn cache dir)"
      shell: bash

    - run: echo "YARN_CACHE_DIR=${{ steps.yarn-cache-dir.outputs.dir }}" >> $GITHUB_ENV
      shell: bash

    # Misc
    - run: echo "IS_DEPENDABOT=${{ startsWith(github.head_ref, 'dependabot') == true }}" >> $GITHUB_ENV
      shell: bash
```

Et un exemple de workflow pour PHP, nos assets JavaScript, et des tests E2E Cypress + auto-approve si l'auteur de la PR est [Dependabot](https://dependabot.com/) :

```yaml
name: CI

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

env:
  TZ: UTC

  COMPOSER_ALLOW_SUPERUSER: '1' # https://getcomposer.org/doc/03-cli.md#composer-allow-superuser
  # À décommenter si vous utilisez Packagist.com
  #COMPOSER_AUTH: '{"http-basic":{"repo.packagist.com":{"username":"token","password":"${{ secrets.PACKAGIST_AUTH_TOKEN }}"}}}'

jobs:
  php:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - uses: ./.github/actions/setup-environment

      - uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ env.PHP_VERSION }}
          coverage: none
          extensions: iconv, intl
          ini-values: date.timezone=${{ env.TZ }}
          tools: symfony

      - uses: actions/setup-node@v2
        with:
          node-version: ${{ env.NODE_VERSION }}

      - uses: actions/cache@v2
        with:
          path: ${{ env.COMPOSER_CACHE_DIR }}
          key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
          restore-keys: ${{ runner.os }}-composer-

      - uses: actions/cache@v2
        with:
          path: ${{ env.YARN_CACHE_DIR }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: ${{ runner.os }}-yarn-

      # Check des dépendances
      - run: symfony composer validate
      - run: symfony security:check

      # Installe l'environnement et l'application
      - run: make setup@integration

      # Préparation des tests
      - run: symfony console cache:clear
      - run: APP_ENV=test symfony console doctrine:schema:validate # force APP_ENV=test because only the test database is created
      - run: symfony console api:swagger:export > /dev/null # Check if ApiPlatform is correctly configured

      # Lint des fichiers Twig, Yaml et XLIFF 
      - run: symfony console lint:twig templates
      - run: symfony console lint:yaml config --parse-tags
      - run: symfony console lint:xliff translations

      # Outils d'analyse de code statique
      - run: symfony php bin/php-cs-fixer.phar fix --verbose --diff --dry-run
      - run: symfony php bin/phpcs
      - run: symfony php bin/phpstan analyse
      - run: APP_ENV=test symfony php bin/phpunit.phar # See https://github.com/symfony/symfony-docs/pull/15228
      - run: symfony php bin/phpspec run

  javascript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - uses: ./.github/actions/setup-environment

      - uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ env.PHP_VERSION }}
          coverage: none
          extensions: iconv, intl
          ini-values: date.timezone=${{ env.TZ }}
          tools: symfony

      - uses: actions/setup-node@v2
        with:
          node-version: ${{ env.NODE_VERSION }}

      - uses: actions/cache@v2
        with:
          path: ${{ env.COMPOSER_CACHE_DIR }}
          key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
          restore-keys: ${{ runner.os }}-composer-

      - uses: actions/cache@v2
        with:
          path: ${{ env.YARN_CACHE_DIR }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: ${{ runner.os }}-yarn-

      - run: make setup@integration

      # Check des types TypeScript
      - run: yarn tsc --noEmit

      # Lint des fichiers JS et CSS
      - run: yarn lint:js --no-fix
      - run: yarn lint:css --no-fix

      # Build pour le développement et production
      - run: yarn dev
      - run: yarn prod

  cypress:
    runs-on: ubuntu-latest
    name: cypress (${{ matrix.cypress.group }})
    strategy:
      fail-fast: false
      matrix:
        cypress:
          # Ajouter plus d'entrées pour bénificier de la parallélisation
          - group: default
            spec: 'tests/cypress/**/*'

    steps:
      - uses: actions/checkout@v2

      - uses: ./.github/actions/setup-environment

      - uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ env.PHP_VERSION }}
          coverage: none
          extensions: iconv, intl
          ini-values: date.timezone=${{ env.TZ }}
          tools: symfony

      - uses: actions/setup-node@v2
        with:
          node-version: ${{ env.NODE_VERSION }}

      - uses: actions/cache@v2
        with:
          path: ${{ env.COMPOSER_CACHE_DIR }}
          key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
          restore-keys: ${{ runner.os }}-composer-

      - uses: actions/cache@v2
        with:
          path: ${{ env.YARN_CACHE_DIR }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: ${{ runner.os }}-yarn-

      - run: make setup@integration

      # Démarrage du serveur Symfony
      - run: APP_ENV=test symfony serve --port 8000 --daemon
      - run: echo "CYPRESS_BASE_URL=https://localhost:8000" >> $GITHUB_ENV

      - name: Run Cypress
        if: ${{ env.IS_DEPENDABOT == 'false' && ! github.event.pull_request.draft }}
        uses: cypress-io/github-action@v2
        with:
          spec: ${{ matrix.cypress.spec }}
          # À décommenter si le projet est configuré sur le Cypress Dashboard
          #record: true
          #parallel: true
          #group: ${{ matrix.cypress.group }}
          #env:
          #    CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}

      - name: Run Cypress (for Dependabot or when pull request is draft)
        if: ${{ env.IS_DEPENDABOT == 'true' || github.event.pull_request.draft }}
        uses: cypress-io/github-action@v2

      - name: Auto approve (for Dependabot)
        if: ${{ env.IS_DEPENDABOT == 'true' && success() }}
        uses: hmarr/auto-approve-action@v2.0.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```
