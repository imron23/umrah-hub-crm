package main

import (
	"log"
	"os"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"github.com/user/umrah-hub-aggregator/apps/api/internal/worker/tasks"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/db"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("No .env file found")
	}

	db.InitDB()

	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}

	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: redisAddr},
		asynq.Config{
			Concurrency: 10,
			Queues: map[string]int{
				"critical": 6,
				"default":  3,
				"low":      1,
			},
		},
	)

	mux := asynq.NewServeMux()
	mux.HandleFunc(tasks.TypeLeadScoring, tasks.HandleLeadScoringTask)
	mux.HandleFunc(tasks.TypeAutomation, tasks.HandleAutomationTask)
	// mux.HandleFunc(tasks.TypeAnalytics, tasks.HandleAnalyticsTask)

	log.Printf("Worker server starting on %s", redisAddr)
	if err := srv.Run(mux); err != nil {
		log.Fatalf("could not run server: %v", err)
	}
}
