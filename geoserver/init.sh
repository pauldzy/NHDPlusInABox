#!/bin/bash

 aj="Accept: application/json"
 cj="Content-type: application/json"
url="http://localhost:8080/geoserver/rest/"
pwd=0
rc=0

for i in {1..500}
do
   echo $i
   curl -u admin:geoserver --fail -X GET -H "$aj" -H "$cj" ${url}layers 1> /dev/null
   ret=$?
   
   if [ $ret -eq 0 ]
   then
      echo "server now responding"
      break
         
   else
      curl -u admin:nhdplus --fail -X GET -H "$aj" -H "$cj" ${url}layers 1> /dev/null
      ret2=$?
      
      if [ $ret2 -eq 0 ]
      then
         pwd=1
         echo "server now responding"
         break
         
      fi
      
   fi
   
   if [ $i -gt 499 ]
   then
      echo "server failed to respond"
      exit -99
      
   fi
   
   sleep 2

done

if [ $pwd -eq 0 ]
then
   for i in {1..100}
   do
      echo $i
      curl -u admin:geoserver --fail -X PUT -H "$aj" -H "$cj" -d '{"newPassword":"nhdplus"}' ${url}security/self/password
      ret=$?
      
      if [ $ret -eq 0 ]
      then
         echo "changing admin password"
         break
         
      fi
      
      if [ $i -gt 99 ]
      then
         echo "unable to change admin password"
         rc=1
         
      fi
      
      sleep 2
      
   done

else
   echo "password already changed"
   
fi
  
for i in {1..100}
do
   echo $i
   curl -u admin:nhdplus --fail -X PUT -H "$aj" -H "$cj" -d '{"contact":{"addressCity":"","addressCountry":"","addressType":"","contactEmail":"","contactOrganization":"NHDPlusInABox","contactPerson":"","contactPosition":""}}' ${url}settings/contact
   ret=$?
      
   if [ $ret -eq 0 ]
   then
      echo "changing server contact info"
      break
      
   fi
      
   if [ $i -gt 99 ]
   then
      echo "unable to change contact info"
      rc=1
   fi
   
   sleep 2
   
done
  
for i in {1..100}
do
   echo $i
   
   pw=$(curl -u admin:nhdplus --fail -X GET -H "$aj" -H "$cj" ${url}security/masterpw | jq -r .oldMasterPassword)
   
   if [ $pw = "nhdplus123" ]
   then
      echo "master password already changed"
      break
      
   fi
   
   curl -u admin:nhdplus --fail -X PUT -H "$aj" -H "$cj" -d '{"oldMasterPassword":"geoserver","newMasterPassword":"nhdplus123"}' ${url}security/masterpw
   ret=$?
      
   if [ $ret -eq 0 ]
   then
      echo "changing master password"
      break
      
   fi
      
   if [ $i -gt 99 ]
   then
      echo "unable to change master password"
      rc=1
   
   fi
   
   sleep 2
   
done

curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}workspaces/cite?recurse=true
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}workspaces/nurc?recurse=true
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}workspaces/sde?recurse=true
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}workspaces/sf?recurse=true
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}workspaces/tiger?recurse=true
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}workspaces/topp?recurse=true

curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/burg
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/capitals
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/cite_lakes
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/dem
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/giant_polygon
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/grass
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/green
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/poi
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/poly_landmarks
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/pophatch
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/population
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/rain
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/restricted
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/simple_roads
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/simple_streams
curl -u admin:nhdplus --fail -X DELETE -H "$aj" -H "$cj" ${url}styles/tiger_roads

exit $rc

