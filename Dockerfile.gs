FROM winsent/geoserver:2.13

LABEL maintainer="Paul Dziemiela <Paul.Dziemiela@erg.com>"

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update                             &&\
    apt-get install -y --no-install-recommends   \
       apt-utils                                 \
       ca-certificates                         &&\
    rm -rf /var/lib/apt/lists/*
    
RUN apt-get update                             &&\
    apt-get install -y --no-install-recommends   \
       supervisor                                \
       dos2unix                                  \
       curl                                    &&\
    rm -rf /var/lib/apt/lists/*

COPY ./geoserver/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN  dos2unix --quiet /etc/supervisor/conf.d/supervisord.conf

COPY ./geoserver/init.sh /src/init.sh
RUN  dos2unix --quiet /src/init.sh &&\
     chmod 755 /src/init.sh

CMD ["/usr/bin/supervisord","-c","/etc/supervisor/conf.d/supervisord.conf"]

