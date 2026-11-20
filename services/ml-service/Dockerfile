# ---- Stage 1: generate proto stubs ----
FROM python:3.11-slim AS protogen
WORKDIR /gen
RUN pip install --no-cache-dir grpcio-tools>=1.60
COPY api/proto ./proto
RUN mkdir -p /out/gen && \
    python -m grpc_tools.protoc \
      -I proto \
      --python_out=/out/gen \
      --grpc_python_out=/out/gen \
      proto/kairos/forecast/v1/forecast.proto && \
    find /out/gen -type d -exec touch {}/__init__.py \;

# ---- Stage 2: runtime (shares common Python deps layer with ingestion) ----
FROM python:3.11-slim AS runtime
WORKDIR /app

RUN useradd --create-home --uid 10001 appuser
RUN pip install --no-cache-dir \
    grpcio>=1.60 grpcio-health-checking>=1.60 \
    numpy>=1.26 pandas>=2.1 scipy>=1.11 arch>=6.2 "psycopg[binary]>=3.1" \
    pyarrow>=15.0 yfinance>=0.2.66

COPY services/ml-service/pyproject.toml ./
COPY services/ml-service/src ./src
COPY --from=protogen /out/gen ./gen

ENV PYTHONPATH=/app/src:/app/gen:/app
ENV ML_SERVICE_PORT=50051
EXPOSE 50051
USER appuser

CMD ["python", "-m", "kairos_ml.server"]
