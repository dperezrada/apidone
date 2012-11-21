# -*- coding: utf-8 -*-

from fabric.operations import sudo, put
from fabric.contrib.files import exists
from fabric.colors import yellow, red
from fabric.api import env

# Fresh install to AMI
def fresh_install():
    server_upgrade()
    server_configure_timezone()
    server_add_user('apidone')
    prepare_log_dirs()
    server_install_base()
    server_reboot()

# Reboot server
def server_reboot():
    print yellow('\nRebooting server')
    sudo('reboot')

# Update aptitude repositories
def server_upgrade():
    print yellow('\nUpdating aptitude repositories')
    sudo('aptitude -y update')

    # Upgrade installed packages
    print yellow('\nUpgrading installed packages')
    sudo('aptitude -y dist-upgrade')

# Configure timezone (America/Santiago)
def server_configure_timezone():
    print yellow('\nSetting timezone (America/Santiago)')
    sudo('echo \'America/Santiago\' > /etc/timezone')
    sudo('dpkg-reconfigure -f noninteractive tzdata')

# Add production user
def server_add_user(name):
    if not exists('/home/%s' % name):
        print yellow('\nAdding %s user' % name)
        sudo('adduser --disabled-password --gecos "" %s' % name)

    # Install repositories keys
    sudo('mkdir -p /home/%s/.ssh' % name, user = name)
    put('files/ssh/*', '/home/%s/.ssh/' % name, use_sudo=True)
    sudo('chown -R %(name)s:%(name)s /home/%(name)s/.ssh' % {'name': name})
    sudo('chmod 644 /home/%s/.ssh/*' % name)
    sudo('chmod 600 /home/%s/.ssh/apidone_github_rsa' % name)

# Install python required packages
def server_install_base():
    def install_base():
        print yellow('\nInstalling base')
        sudo('aptitude -y install build-essential git-core')

    def install_node():
        print yellow('\nInstalling nodejs')
        sudo('apt-get install python-software-properties')
        sudo('add-apt-repository -y ppa:chris-lea/node.js')
        sudo('apt-get update')
        sudo('apt-get -y install nodejs npm')

    def install_s3cmd():
        print yellow('\nInstalling s3cmd')
        sudo('aptitude -y install s3cmd')

    install_base()
    install_node()
    install_s3cmd()

def prepare_log_dirs():
    sudo('mkdir -p /var/log/apidone/api')
    sudo('chown %s:%s /var/log/apidone/api' % (env.deploy_user, env.deploy_user))
    sudo('mkdir -p /var/log/apidone/admin')
    sudo('chown %s:%s /var/log/apidone/admin' % (env.deploy_user, env.deploy_user))
