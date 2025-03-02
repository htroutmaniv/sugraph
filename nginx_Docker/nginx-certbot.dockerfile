FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

#RUN apt remove --purge nginx
RUN apt-get update && apt-get install -y certbot python3-certbot-nginx && apt-get clean
RUN mkdir -p /etc/letsencrypt


EXPOSE 80 443

WORKDIR /etc/nginx

VOLUME ["/etc/nginx"]
VOLUME ["/etc/letsencrypt"]

CMD ["nginx", "-g", "daemon off;"]