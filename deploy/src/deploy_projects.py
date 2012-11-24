# -*- coding: utf-8 -*-
from fabric.api import env
from fabric.contrib.files import exists
from fabric.context_managers import cd
from fabric.operations import put, run, local
from fabric.utils import abort
from fabric.colors import yellow, red, green

def create_dir(path):
    run('mkdir -p %s' % path)

def cp_file(local_path, server_path, user_is_owner = True, chmod = None):
    put(local_path, server_path)
    if chmod:
        run('chmod %s %s' % (chmod, server_path))

def update_repo():
    if not exists(env.repository_path):
        create_dir(env.repository_path)
    if not exists(env.repository_path+'/.git'):
        with cd(env.repository_base):
            run('git clone git@github.com:dperezrada/apidone.git')
    with cd(env.repository_path):
        run('git fetch --tags')

def git_checkout(version):
    with cd(env.repository_path):
        server_version = run('git tag | grep %s' % version )
        if version == server_version:
            run('git checkout -q %s' % version)
        else:
            abort('Version %s doesn\'t exist in server' % version)
    # run('git checkout -q %s' % versions.get(repo))

def setup_base_files():
    create_dir("%s/configs" % env.home)
    cp_file('files/service_files/config_api', "%s/configs/config_api" % env.home)
    cp_file('files/service_files/config_admin', "%s/configs/config_admin" % env.home)
    cp_file(
        'files/service_files/restart_admin.sh',
        '%s/restart_admin.sh' % env.home,
        chmod = 'u+x'
    )
    cp_file(
        'files/service_files/restart_api.sh',
        '%s/restart_api.sh' % env.home,
        chmod = 'u+x'
    )

def install_project():
    with cd(env.repository_path):
        run('npm install -d')

def restart_services():
    print yellow("To restart execute")
    for host in env.hosts:
        print green('ssh %s@%s "%s/restart_api.sh"' % (env.deploy_user, host, env.home))
        print green('ssh %s@%s "%s/restart_admin.sh"' % (env.deploy_user, host, env.home))

def remove_permissions():
    run("chmod o-rwx -R %s/*" % env.home)

def generate_pages():
    local("jade ../pages/src/pages/*.jade --out ../pages/public/")
    local("lessc  ../pages/src/css/main.less > ../pages/public/assets/css/main.css")
def upload_pages():
    local("s3cmd sync -P ../pages/public/ s3://www.apidone.com")

def deploy(version):
    setup_base_files()
    update_repo()
    git_checkout(version)
    install_project()
    remove_permissions()
    restart_services()
    generate_pages()
    upload_pages()