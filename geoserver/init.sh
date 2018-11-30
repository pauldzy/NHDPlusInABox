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

exit $rc

