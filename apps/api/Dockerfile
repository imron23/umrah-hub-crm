FROM golang:alpine AS builder
ENV GOTOOLCHAIN=auto
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/api-server ./cmd/api/main.go

FROM alpine:3.19 AS runner
RUN apk add --no-cache tzdata ca-certificates curl
ENV TZ=Asia/Jakarta
WORKDIR /app
COPY --from=builder /out/api-server .
COPY migrations/ ./migrations/
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8081/api/v1/health || exit 1
CMD ["./api-server"]
