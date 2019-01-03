FROM jfloff/alpine-python:latest-slim
MAINTAINER Pedro Gutiérrez <pedrogutierrez@mac.com>
RUN apk update
RUN apk add alpine-sdk python3-dev tar git curl vim sqlite sqlite-libs
ADD . /app
RUN pip3 install -r /app/requirements.txt
WORKDIR /app
EXPOSE 4001 
ENTRYPOINT ["python3", "app.py"]
