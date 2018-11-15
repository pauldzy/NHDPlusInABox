#/bin/sh

group=`id -g -n`

setfacl -Rdm g:${group}:rwx loading_dock/
setfacl -Rdm g:${group}:rwx pgdata/
setfacl -Rdm g:${group}:rwx workspace/
