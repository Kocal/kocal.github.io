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

Chez [yProximité](https://www.y-proximite.fr/), agence web, on utilise les machines virtuelles depuis plusieurs années comme stack de développement sur tous nos différents projets web (nécessitant du PHP, du Node.js, et des fois une base de données). 

On utilise : 
- make, car les `Makefile` c'est super pratique
- [VirtualBox](https://www.virtualbox.org/) pour la virtualisation des machines
- [Vagrant](https://www.vagrantup.com/) pour les contrôler
- [Ansible](https://docs.ansible.com/) pour automatiser le provisionnement
- [les rôles Ansible de Manala](https://github.com/manala/ansible-roles), développés par l'[agence web Elao](https://www.elao.com/) et qui nous prémâche 95% du travail (un grand merci :heart:)

Ça fonctionne plutôt bien (quand ça fonctionne :roll_eyes:), et ça a pour avantage d'avoir un environnement de développement totalement fonctionnel et isolé de la machine hôte.

En revanche, plusieurs années ont passé et l'équipe et moi-même avons rencontré plusieurs problèmes.

## La grande liste de problèmes avec les machines virtuelles

### Système

1. Pour les utilisateurs d'Ubuntu 18.04 ou plus, le plugin [Vagrant Landrush](https://github.com/vagrant-landrush/landrush) (qui permet de mapper un faux NDD vers l'IP d'une VM) [ne fonctionne pas](https://github.com/vagrant-landrush/landrush/issues/342). On doit manuellement rajouter une entrée dans notre `/etc/hosts`.
2. Il y a des versions de VirtualBox qui ne fonctionnent litérallement pas. Dès que je trouvais une version qui fonctionnait parfaitement (ex : `6.1.16` pour Ubuntu 20.10), je désactivais les mises à jour via `echo "virtualbox-6.1 hold" | sudo dpkg --set-selections`, dans la crainte qu'une mise à jour ne fasse plus fonctionner les VM...
3. Des problèmes d'espace disque. Vu qu'on a une VM par projet et qu'on travaille sur plusieurs projets, l'espace disque utilisé par les VM peut monter assez vite (~160 Go utilisé après 3 ans sans nettoyage)

### Applicatif

4. Le watching de fichiers qui ne fonctionne pas à cause de l'utilisation de NFS :
    - faire fonctionner le watch et dev-server de webpack, grâce au [polling](https://webpack.js.org/configuration/watch/#watchoptionspoll)
    - faire fonctionner le mode watch de TailwindCSS JIT grâce à `CHOKIDAR_USEPOLLING=1` ([discussion GitHub](https://github.com/tailwindlabs/tailwindcss/discussions/4024))
5. Il y a des fichiers importants qu'il faut importer dans la VM (`~/.ssh/config`, `~/.composer/auth.json`, `~/.gitconfig`, etc ...), ça se fait automatiquement dès le boot de la VM, mais si on pouvait éviter...
6. Pour nos git hooks ou tests Cypress (tout ce qui peut être lancé dans et en dehors de la VM en fait), il fallait passer par un petit script `vagrant-wrapper.sh` pour s'assurer que nos commandes soient bien exécutées dans la VM : 
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
7. Si on utilisait un certificat HTTPS local (ex : généré avec [mkcert](https://github.com/FiloSottile/mkcert)), il fallait lancer nginx après que la partition NFS (contenant notre certificat HTTPS) soit montée, sinon nginx ne se lançait pas car certificat HTTPS introuvable :
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
8. Si l'un de nos projets en utilisait un autre (ex : projet A qui utilise l'API fournie par le projet B qui est en HTTPS), alors il fallait importer le certificat racine de mkcert dans la VM (cette solution n'a été testée que sous Debian/Ubuntu) :
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

7. L'installation initiale (via le provisioning Ansible) est très longue, ~15 minutes, tellement il y a de choses à installer et à configurer.
8. La VM peut prendre plusieurs dizaines de secondes à boot
9. La partition NFS n'aide pas du tout, même si on a déjà réussi à diviser par 4 le temps des `yarn install` et `composer install` en utilisant cette configuration :
```ruby
Vagrant.configure(2) do |config|
  # ...
  config.vm.synced_folder '.', '/srv/app',
    type: 'nfs',
    mount_options: ['vers=3', 'tcp', 'rw', 'nolock', 'actimeo=1'],
    linux__nfs_options: ['rw', 'all_squash', 'async']
end
```
10. Sur notre plus gros et ancien projet, les pages peuvent mettre jusqu'à 10 secondes et plus pour s'afficher, c'est une horreur

### tl;dr

Beaucoup trop de problèmes, beaucoup trop de tweaks et temps investi pour outre-passer ces derniers.
