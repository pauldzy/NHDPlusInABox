#/bin/bash

if [ -z "${POSTGREST_PORT}" ]; then
   :
   
else
   if [ "${POSTGREST_PORT}" == "3000" ]; then
      :
      
   else
      find /src/static -name '*.js' | while read filename
      do
         sed -i -e "s|http://localhost:3000/|http://localhost:${POSTGREST_PORT}/|g" $filename
      
      done
   
   fi
  
fi

exit 0;
