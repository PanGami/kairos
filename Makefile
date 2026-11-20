.PHONY: proto up down logs build test test-python test-go test-web ingest fmt proto-breaking

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

test: test-python test-go test-web

test-python:
	python -m unittest discover -s services/ml-service/tests -v
	python -m unittest discover -s services/ingestion/tests -v

test-go:
	cd services/gateway && go vet ./... && go test -v ./...
	cd services/auth-service && go vet ./... && go test -v ./...

test-web:
	cd web && npm run build

# Check for breaking contract changes against main (also used in CI).
proto-breaking:
	cd api && buf breaking --against '.git#branch=main,subdir=api'
