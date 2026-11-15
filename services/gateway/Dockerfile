# ---- Stage 1: generate Go proto stubs & build binary ----
FROM golang:1.22-alpine AS build
RUN apk add --no-cache protobuf
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.32.0 && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0
ENV PATH=$PATH:/root/go/bin

WORKDIR /app
COPY services/gateway/go.mod ./
RUN go mod download || true

COPY api/proto ./proto
ENV GO_PKG=github.com/kairos/gateway/gen/kairos/forecast/v1;forecastv1
RUN mkdir -p gen && \
    protoc -I proto \
      --go_out=gen --go_opt=module=github.com/kairos/gateway/gen \
      --go_opt=Mkairos/forecast/v1/forecast.proto=${GO_PKG} \
      --go-grpc_out=gen --go-grpc_opt=module=github.com/kairos/gateway/gen \
      --go-grpc_opt=Mkairos/forecast/v1/forecast.proto=${GO_PKG} \
      proto/kairos/forecast/v1/forecast.proto && \
    rm -rf proto

COPY services/gateway/ ./
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/gateway ./cmd/gateway

# ---- Stage 2: runtime (non-root, minimal) ----
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/gateway /gateway
ENV GATEWAY_PORT=8080
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/gateway"]
