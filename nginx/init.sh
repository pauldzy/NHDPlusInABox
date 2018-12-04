#/bin/bash

if [ -z "${NGINX_PORT}" ]; then
   ng_port="8081";
else
   ng_port=${NGINX_PORT} 
fi
 
if [ -z "${POSTGREST_PORT}" ]; then
   pr_port="3000";
else
   pr_port=${POSTGREST_PORT}
fi
   
if [ -z "${JUPYTER_PORT}" ]; then
   jp_port="8888";
else
   jp_port=${JUPYTER_PORT} 
fi

if [ -z "${GEOSERVER_PORT}" ]; then
   gs_port="8080";
else
   gs_port=${GEOSERVER_PORT} 
fi
   
find /src/static -name '*.js' -or -name '*.html' | while read filename
do
   sed -i                                                          \
      -e "s|var ng_port = \"8081\"|var ng_port = \"${ng_port}\"|g" \
      -e "s|var pr_port = \"3000\"|var pr_port = \"${pr_port}\"|g" \
      -e "s|var jp_port = \"8888\"|var jp_port = \"${jp_port}\"|g" \
      -e "s|var gs_port = \"8080\"|var gs_port = \"${gs_port}\"|g" \
      $filename

done



exit 0;
