.PHONY: proto up down logs build test ingest fmt

COMPOSE_LOCAL := docker compose -f docker-compose.local.yml

# Generate local proto stubs (requires buf installed). In Docker, stubs are generated automatically during build.
proto:
	cd api && buf lint && buf generate

build:
	$(COMPOSE_LOCAL) build

up:
	$(COMPOSE_LOCAL) up --build

down:
	$(COMPOSE_LOCAL) down

logs:
	$(COMPOSE_LOCAL) logs -f

ingest:
	$(COMPOSE_LOCAL) run --rm ingestion

test:
	python -m unittest discover -s services/ml-service/tests -v
	python -m unittest discover -s services/ingestion/tests -v

# Check for breaking contract changes against main (also used in CI).
proto-breaking:
	cd api && buf breaking --against '.git#branch=main,subdir=api'
