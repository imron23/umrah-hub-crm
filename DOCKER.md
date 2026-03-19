# 🐳 Umrah Hub — Docker All-in-One

Satu image Docker yang membungkus seluruh stack:
- **PostgreSQL 16** — database utama
- **Redis 7** — cache & queue
- **Go API** (Gin) — REST API backend
- **Next.js 14** — frontend web

---

## ⚡ Quick Start (All-in-One)

### Build image:
```bash
docker build -t umrah-hub:latest .
```

### Run container:
```bash
docker run -d \
  --name umrah-hub \
  -p 5400:5400 \
  -p 8081:8081 \
  -v umrah_data:/var/lib/postgresql/data \
  -e DB_PASSWORD=password_anda \
  -e JWT_SECRET=secret_minimal_32_karakter_disini \
  umrah-hub:latest
```

### Atau pakai Docker Compose:
```bash
docker compose --profile all-in-one up -d
```

---

## 🌐 Akses Setelah Running

| Service | URL |
|---------|-----|
| Web UI  | http://localhost:5400 |
| REST API | http://localhost:8081/api/v1 |

---

## ⚙️ Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `DB_USER` | `umrah` | PostgreSQL user |
| `DB_PASSWORD` | `umrah123` | ⚠️ Ganti di production! |
| `DB_NAME` | `umrah_hub` | Nama database |
| `JWT_SECRET` | `change_me_...` | ⚠️ Ganti di production! |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8081/api/v1` | URL API untuk frontend |
| `PORT` | `8081` | Port API server |

---

## 📦 Lihat Logs

```bash
# Semua logs
docker logs -f umrah-hub

# Per service (masuk ke container)
docker exec -it umrah-hub tail -f /var/log/api.log
docker exec -it umrah-hub tail -f /var/log/web.log
docker exec -it umrah-hub tail -f /var/log/postgres.log
docker exec -it umrah-hub tail -f /var/log/redis.log
```

---

## 🔄 Microservices Mode (Development)

```bash
docker compose --profile services up -d
```

---

## 🗑️ Cleanup

```bash
# Stop & remove container
docker rm -f umrah-hub

# Hapus data volume (hati-hati!)
docker volume rm umrah_data
```
