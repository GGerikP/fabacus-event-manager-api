#!/bin/sh
echo "Waiting for Kafka..."
until nc -z kafka 9092; do
  sleep 1
done
echo "Kafka is up!"
exec "$@"

