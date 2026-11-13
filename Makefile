.PHONY: proto up down logs build fmt

# Generate stub proto lokal (butuh buf terpasang). Di Docker, generate otomatis saat build.
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

# Cek breaking change kontrak terhadap main (dipakai CI juga).
proto-breaking:
	cd api && buf breaking --against '.git#branch=main,subdir=api'
