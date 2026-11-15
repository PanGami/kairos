# ---- Stage 1: generate Go proto stubs ----
FROM golang:1.22-bookworm AS protogen
RUN apt-get update && apt-get install -y --no-install-recommends protobuf-compiler && \
    rm -rf /var/lib/apt/lists/*
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.32.0 && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0
ENV PATH=$PATH:/root/go/bin
WORKDIR /src
COPY api/proto ./proto
# Output generated stubs to gen/ (not committed, ADR-006).
RUN mkdir -p gen && \
    protoc -I proto \
      --go_out=gen --go_opt=module=github.com/kairos/gateway/gen \
      --go-grpc_out=gen --go-grpc_opt=module=github.com/kairos/gateway/gen \
      proto/kairos/forecast/v1/forecast.proto

# ---- Stage 2: build ----
FROM golang:1.22-bookworm AS build
WORKDIR /app
COPY services/gateway/go.mod ./
RUN go mod download || true
COPY services/gateway/ ./
COPY --from=protogen /src/gen ./gen
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -o /out/gateway ./cmd/gateway

# ---- Stage 3: runtime (non-root, minimal) ----
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/gateway /gateway
ENV GATEWAY_PORT=8080
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/gateway"]
