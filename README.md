# NHDPlus In A Box

Proof-of-concept Docker project intended to provide a set of containers for the inspection and analysis of the US Environmental Protection Agency's [NHDPlus in WATERS dataset](https://www.epa.gov/waterdata/nhdplus-waters).

This project provides NHDPlus as a PostgreSQL/PostGIS database further exposed via Geoserver, PostgREST and Jupyter Notebooks for extract and analysis - then further illustrated by web examples.

![overview](doc/overview.png)

## Requirements

* [Docker](https://docs.docker.com/install/)
* [docker-compose](https://docs.docker.com/compose/install/) (bundled with Docker CE for Windows)
* A modern web browser

## Suggested Software

* [PGAdmin](https://www.pgadmin.org/download/)
* [QGIS](https://qgis.org/en/site/forusers/download.html)

## Usage

After inspecting the docker-compose.yml file, execute
```
docker-compose build --parallel
docker-compose up
```

A full build from scratch will take 20 to 30 minutes to download and build depending on your internet speed and processor power.

When all five containers are up, then open the default setup page, mostly probably at http://localhost:8081 for information on how to download, install and consume the NHDPlus dataset.

To shut down the containers either CTRL-C the process or in a separate session execute
```
docker-compose stop
```

If you wish to stop and also remove the containers execute
```
docker-compose down
```
Add a "-v" to the down command to also remove the associated volumes and networks. 

For more information on configuring Docker for Windows, see the [Windows Setup](/doc/windows.md).

## Notes

There are some challenges to this concept which may send you immediately away or perhaps inspire your feedback (most welcome!):

**Dataset Size:**
   
NHDPlus in WATERS is rather large - certainly not big data large - but large to download to your government-provided laptop or personal computer.  If you do not have a workstation-type computer for this purpose, its worth considering if its a viable solution for you.  The official [NHDPlus download site](https://www.epa.gov/waterdata/get-data#NHDPlusV2Map) provides data in smaller region-based extracts that may suit your capabilities better.  One purpose of this project is to just give you everything circumventing the need to generate your own national aggregations and load them to a database.  So to host this project you will need a comfortable amount of free disk:
   
* loading_dock: 80 GB  
* images: 9.2 GB
* pgdata: 210 GB

At least 300GB of free disk is needed to get the project up and running. Your own analysis/aggregation database tasks or geoserver extracts can of course push this amount higher. 

If you do not have that amount of disk handy and/or are just interested in the project concept, I also provide a "pruned" NHDPlus dataset cut down to only NHDPlus VPU 09.  This abbreviated dataset only needs about 30 GB of disk space for Docker to stage.

**Machine Requirements:**
   
This project will spin up a database and four support servers.  If you are using an underpowered government laptop you may just not have the juice to result in a viable work environment.  One answer would be to remove unneeded servers from the docker-compose.yml file to prune things down or perhaps suffer the startup and then manually stop unneeded containers.

* suggested processor minimum: 4
* suggested memory minimum: 8 GB

**Security Concerns:**
   
The intention currently is not to provide a shared hosted server environment.  Thus security is deliberately left weak with a single master password which can be altered if you like in the docker-compose.yml file.  But again these servers are intended for personal use on your personal machine safely firewalled off from the rest of humanity.  If you wish to expose this project to a larger audience then a thorough security review and update is for you to provide.  The default configuration is to just use "nhdplus" as the password for all components.

**Ports:**
   
You may have conflicts with the existing port selections which default to typical port choices for the servers.  Examine the docker-compose.yml and update the port numbers as needed at the top.

**Mounts:**

The loading_dock and workspace volume mounts are provided to persist large items on the host file system. The default is to just dump these items in the git project root.  To manage storage needs you could repoint these items to other locations on your file system by editing the docker-compose.yml file as needed at the top.

**Image Choices:**

The base images utilized represent my best shot at providing useful functionality.  The backend database container is a very solid choice I stand behind.  However the middleware containers may or may not be the best for your purposes.  Feedback is definately welcome to perhaps swap out to a better or more often-maintained image.
   
```
   PostgreSQL:  postgres:10.6  
   Geoserver:   winsent/geoserver:2.13  
   PostgREST:   haskell:8.0.2  
   Jupyter:     jupyter/scipy-notebook:14fdfbf9cfc1  
   Nginx/Flask: python:3.6.7 
```
