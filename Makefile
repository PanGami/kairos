.PHONY: proto up down logs build fmt

# Generate local proto stubs (requires buf installed). In Docker, stubs are generated automatically during build.
proto:
	cd api && buf lint && buf generate

build:
	docker compose build

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

# Check for breaking contract changes against main (also used in CI).
proto-breaking:
	cd api && buf breaking --against '.git#branch=main,subdir=api'
