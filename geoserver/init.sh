#!/bin/bash

 aj="Accept: application/json"
 cj="Content-type: application/json"
url="http://localhost:8080/geoserver/rest/"

for i in {1..20}
do
   curl -u admin:geoserver --fail -X GET -H "$aj" -H "$cj" ${url}layers
   if [ $? -eq 0 ]
   then
      curl -u admin:geoserver -X PUT -H "$aj" -H "$cj" -d '{"newPassword":"nhdplus"}' ${url}security/self/password
      sleep 2
      
      curl -u admin:nhdplus -X PUT -H "$aj" -H "$cj" -d '{"addressCity":"","addressCountry":"","addressType":"","contactEmail":"","contactOrganization":"NHDPlusInABox","contactPerson":"","contactPosition":""}' ${url}settings/contact
      sleep 2
      
      curl -u admin:nhdplus -X PUT -H "$aj" -H "$cj" -d '{"oldMasterPassword":"geoserver","newMasterPassword":"nhdplus123"}' ${url}security/masterpw
      
      exit 0
      
   fi
   
   sleep 2
   
done

exit -99

