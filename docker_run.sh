docker stop bot
docker build -t bot -<Dockerfile

docker run -d -p 4000:4000 bot
