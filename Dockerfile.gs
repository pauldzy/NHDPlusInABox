FROM winsent/geoserver:2.13

LABEL maintainer="Paul Dziemiela <Paul.Dziemiela@erg.com>"

ARG DEBIAN_FRONTEND=noninteractive

RUN printf "#!/bin/sh\nexit 0" > /usr/sbin/policy-rc.d &&\
    apt-get update                             &&\
    apt-get install -y --no-install-recommends   \
       supervisor                                \
       dos2unix                                  \
       jq                                        \
       curl                                    &&\
    rm -rf /var/lib/apt/lists/*

COPY ./geoserver/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY ./geoserver/init.sh /src/init.sh

RUN  dos2unix --quiet /etc/supervisor/conf.d/supervisord.conf   &&\
     dos2unix --quiet /src/init.sh                              &&\
     chmod 755 /src/init.sh

CMD ["/usr/bin/supervisord","-c","/etc/supervisor/conf.d/supervisord.conf"]

