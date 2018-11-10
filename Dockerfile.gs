FROM winsent/geoserver:2.13

MAINTAINER Paul Dziemiela <Paul.Dziemiela@erg.com>

RUN DEBIAN_FRONTEND=noninteractive apt-get update &&\
   apt-get install -y --no-install-recommends       \
      apt-utils                                     \
      curl                                        &&\
   rm -rf /var/lib/apt/lists/*
