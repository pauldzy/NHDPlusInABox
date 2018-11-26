#/bin/bash

if [ -z "${NGINX_PORT}" ]; then
   ng_port="8081";
else
   ng_port=${NGINX_PORT} 
fi
 
if [ -z "${POSTGREST_PORT}" ]; then
   pg_port="3000";
else
   pg_port=${POSTGREST_PORT}
fi
   
if [ -z "${JUPYTER_PORT}" ]; then
   jp_port="8888";
else
   jp_port=${JUPYTER_PORT} 
fi
   
find /src/static -name '*.js' | while read filename
do
   sed -i -e "s|https://inlandwaters.geoplatform.gov/waterspg/|http://localhost:${POSTGREST_PORT}/|g" $filename
      
done

if [ "${JUPYTER_PORT}" != "8888" ]; then
   find /src/static -name '*.html' | while read filename
   do
      sed -i -e "s|http://localhost:8888/|http://localhost:${JUPYTER_PORT}/|g" $filename
      
   done
   
fi

if [ "${NGINX_PORT}" != "8081" ]; then
   find /src/static -name '*.html' | while read filename
   do
      sed -i -e "s|http://localhost:8081|http://localhost:${NGINX_PORT}/|g" $filename
      
   done
   
fi

exit 0;
