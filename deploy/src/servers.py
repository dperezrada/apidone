from fabric.api import env

def ubuntu():
    env.user = 'ubuntu'

def set_env():
    env.user = 'apidone'
    env.deploy_user = 'apidone'
    env.home = '/home/%s' % env.deploy_user
    env.repository_path = '/home/%s/repos/apidone' % env.deploy_user
    env.repository_base = '/home/%s/repos' % env.deploy_user

def all():
    env.hosts = ['23.21.235.15', '54.235.241.224']
    set_env()

def api1d():
    env.hosts = ['23.23.157.115']
    set_env()

def api1b():
    env.hosts = ['54.235.241.224']
    set_env()
