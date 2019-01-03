ACCOUNT=opentact
IMAGE=js-demo
TAG=dev
PORT=4001
DB=/tmp/
docker run -d -v $DB:/db:rw --name $IMAGE -p $PORT:$PORT -ti $ACCOUNT/$IMAGE:$TAG
