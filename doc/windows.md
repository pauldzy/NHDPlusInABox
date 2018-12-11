## NHDPlusInABox using Docker for Windows Setup Guide

Docker for Windows remains in 2018 a bit of a hot mess.  It works - kind of.  Your mileage is likely to vary but do keep your expectations in check.  Perhaps a healthy approach would be to use Windows to validate the proof of concept.  If you then **really** want to take this idea to town, then move the show to Linux.

Before first attempting to set up NHDPlusInABox, some settings need tweaking.

### (1) Allow Shared Drives Docker Settings:
![Shared Drives](/doc/shared_drives.png)

The loading_dock and workspace bind mounts are intended to be accessible directly by the host.  Windows users will need to expressly [allow shared drives](https://docs.docker.com/docker-for-windows/#shared-drives) via Docker Settings allowing the disk hosting the mounts (probably your C: drive) to be shared.

### (2) Adjust Memory, Swap and Disk Image Max Size:
![GitHub Logo](/doc/advanced.png)

A minimum of 2048 meg of [swap space](https://docs.docker.com/docker-for-windows/#advanced) is required.

The default 2048 meg of [memory](https://docs.docker.com/docker-for-windows/#advanced) works to load the dataset.  However more memory is advised both to speed up the load and to allow for analysis activities.

The default [disk image max size](https://docs.docker.com/docker-for-windows/#advanced) value applies to both container and docker volumes.  I recommend 432 gig for a comfortable buffer.

Note the more resources Docker is allowed to consume the more effect it will have on your host system.  
