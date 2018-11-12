# NHDPlus In A Box

Docker project intended to provide a set of containers for the inspection and analysis of the US Environmental Protection Agency's [NHDPlus in WATERS dataset](https://www.epa.gov/waterdata/nhdplus-waters).

This project provides NHDPlus as a PostgreSQL/PostGIS database and further exposed via Geoserver, PostgREST and Jupyter Notebooks for extract and analysis - then further shown by examples on the provided Nginx container.

![overview](doc/overview.png)

## Requirements

* Docker
* docker-compose

## Usage

After inspecting the docker-compose.yml file, execute

```
docker-compose build
docker-compose up
```

Then open the default nginx server page, mostly probably at http://localhost:8081 for information on how to download and install the NHDPlus data.

## Notes

There are some challenges to this concept which may send you immediately away or perhaps inspire your feedback (most welcome!):

* **Dataset Size**
   
   NHDPlus in WATERS is rather large - certainly not big data large - but large to download to your government-provided laptop or personal computer.  If you do not have a workstation-type computer for this purpose, its worth considering if its a viable solution for you.  The official [NHDPlus download site](https://www.epa.gov/waterdata/get-data#NHDPlusV2Map) provides data in smaller region-based extracts that may suit your capabilities better.  For this project one might also suggest also having smaller extracts of the data.  However one purpose of this project is to just give you everything circumventing the need to generate your own national aggregations and load them to a database.  So to host this project you will need a comfortable amount of free disk:

   
   loading_dock: 110 GB  
   pgdata: 

* **Processor Requirements**
   
   Similar to the previous item this project will spin up a database and four support servers.  If you are using an underpowered government laptop you may just not have the juice to result in a viable work environment.  One answer would be to remove unneeded servers from the docker-compose.yml file to prune things down or perhaps suffer the startup and then manually stop unneeded containers.

   
   suggested processor minimum: 4

* **Security Concerns**
   
   The intention currently is not to create a shared hosted server environment.  Thus security is deliberately left weak with a single master password which can be altered if you like in the docker-compose.yml file.  But again these servers are intended for personal use on your personal machine safely firewalled off from the rest of humanity.  If you wish to expose this project to a larger audience then a thorough security review and update is for you to provide.  The default configuration is to just use "nhdplus" as the password for all components.

* **Ports**
   
   You may have conflicts with the existing port selections which default to typical port choices for the servers.  Examine the docker-compose.yml and update the ports as needed at the top.

* **Mounts**

   The loading_dock, workspace and pgdata mounts are provided to keep large items on the host file system. The default is to just dump these items in the git project.  To manage storage needs you can repoint these items to other locations on your file system by editing the docker-compose.yml file as needed at the top.

* **Image Choices**

   The base images utilized represent my best shot at providing useful functionality.  The backend database container is a very solid choice I stand behind.  However the middleware containers may or may not be the best for your purposes.  Feedback is definately welcome to perhaps swap out to a better or more often-maintained image.
   

   PostgreSQL: postgres:10.6  
   Geoserver:  winsent/geoserver:2.13  
   PostgREST:  ubuntu:latest  
   Jupyter:    geonotebook/geonotebook  
   Nginx:      nginx  
  
