package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	crmHandlers "github.com/user/umrah-hub-aggregator/apps/api/internal/crm/handlers"
	crmRepository "github.com/user/umrah-hub-aggregator/apps/api/internal/crm/repository"
	crmService "github.com/user/umrah-hub-aggregator/apps/api/internal/crm/service"
	crmMiddleware "github.com/user/umrah-hub-aggregator/apps/api/internal/crm/middleware"
	iamHandlers "github.com/user/umrah-hub-aggregator/apps/api/internal/iam/handlers"
	iamMiddleware "github.com/user/umrah-hub-aggregator/apps/api/internal/iam/middleware"
	iamRepository "github.com/user/umrah-hub-aggregator/apps/api/internal/iam/repository"
	iamService "github.com/user/umrah-hub-aggregator/apps/api/internal/iam/service"
	vendorHandlers "github.com/user/umrah-hub-aggregator/apps/api/internal/provider/handlers"
	vendorRepository "github.com/user/umrah-hub-aggregator/apps/api/internal/provider/repository"
	packageHandlers "github.com/user/umrah-hub-aggregator/apps/api/internal/package/handlers"
	packageRepository "github.com/user/umrah-hub-aggregator/apps/api/internal/package/repository"
	"github.com/hibiken/asynq"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/db"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/telegram"
	intelligenceService "github.com/user/umrah-hub-aggregator/apps/api/internal/intelligence/service"
	analyticsHandlers "github.com/user/umrah-hub-aggregator/apps/api/internal/analytics/handlers"
	analyticsService "github.com/user/umrah-hub-aggregator/apps/api/internal/analytics/service"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(".env"); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize Database
	db.InitDB()

	// Initialize Telegram Bot Service
	tgSvc := telegram.NewTelegramService()

	// Initialize Redis for background workers
	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}
	workerClient := asynq.NewClient(asynq.RedisClientOpt{Addr: redisAddr})
	defer workerClient.Close()

	// Initialize Intelligence Services
	scoringSvc := intelligenceService.NewScoringService()
	routingSvc := intelligenceService.NewRoutingService()

	// Initialize Analytics Module
	aService := analyticsService.NewAnalyticsService()
	aHandler := analyticsHandlers.NewAnalyticsHandler(aService)

	// Initialize CRM Module
	leadRepo := crmRepository.NewLeadRepository(db.DB)
	leadService := crmService.NewLeadService(leadRepo, scoringSvc, routingSvc, workerClient, tgSvc)
	leadHandler := crmHandlers.NewLeadHandler(leadRepo, leadService)

	// Initialize IAM Module
	userRepo := iamRepository.NewUserRepository(db.DB)
	authService := iamService.NewIAMService(userRepo)
	authHandler := iamHandlers.NewIAMHandler(authService)

	// Initialize Vendor Module
	vRepo := vendorRepository.NewVendorRepository(db.DB)
	vHandler := vendorHandlers.NewVendorHandler(vRepo)

	// Initialize Package Module
	pRepo := packageRepository.NewPackageRepository(db.DB)
	pHandler := packageHandlers.NewPackageHandler(pRepo)

	// Initialize Recycle Bin
	rbHandler := crmHandlers.NewRecycleBinHandler()

	// Initialize Router
	r := gin.Default()
	r.Use(crmMiddleware.CORSMiddleware())
	r.Use(iamMiddleware.AuditMiddleware(tgSvc))

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "up",
			"message": "Umrah Marketing Marketplace CRM API",
		})
	})

	// V1 Routes
	v1 := r.Group("/api/v1")
	{
		// Auth Routes
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		// Public Routes (No Auth)
		public := v1.Group("/public")
		{
			public.GET("/vendors", vHandler.GetAllVendors)
			public.GET("/packages", pHandler.GetAllPackages)
			public.GET("/vendors/:vendor_id/packages", pHandler.GetPackagesByVendor)
			public.GET("/agents", leadHandler.GetActiveAgents)
			public.POST("/leads", leadHandler.CreatePublicLead)
			public.GET("/lps", leadHandler.GetAllLandingPages)
			public.GET("/pixels", leadHandler.GetTrackingPixels)
			public.GET("/leads_demo", leadHandler.GetLeadsDemo)
			public.GET("/leads_demo/:id", leadHandler.GetLeadDetail)
			public.PATCH("/leads_demo/:id", leadHandler.UpdateLead)
			public.POST("/leads_demo/activity", leadHandler.AddLeadActivity)
			public.PATCH("/lps/:id/status", leadHandler.UpdateLandingPageStatus)
			public.GET("/users", authHandler.GetAllUsers)
			public.POST("/users", authHandler.CreateUser)
			public.PATCH("/users/:id", authHandler.UpdateUser)
			public.DELETE("/users/:id", authHandler.DeleteUser)
			public.GET("/roles", authHandler.GetAllRoles)
			public.POST("/roles", authHandler.CreateRole)
			public.PATCH("/roles/:id/permissions", authHandler.UpdateRolePermissions)
			public.PATCH("/agents/:id/capacity", leadHandler.UpdateAgentCapacity)
			public.GET("/api-configs", leadHandler.GetAPIConfigs)
			public.POST("/api-configs", leadHandler.SaveAPIConfig)
			public.POST("/pixels", leadHandler.SaveTrackingPixel)

			// Recycle Bin Routes (Public for Demo)
			public.GET("/recycle-bin", rbHandler.GetDeletedItems)
			public.POST("/recycle-bin/restore", rbHandler.RestoreItem)
			public.DELETE("/recycle-bin/purge/:id", rbHandler.PurgeItem)
		}

		// Restricted Admin Routes
		admin := v1.Group("/admin")
		admin.Use(iamMiddleware.AuthMiddleware(), iamMiddleware.SuperAdminOnly())
		{
			admin.POST("/vendors", vHandler.CreateVendor)

			// Entity Management (Permanent Delete or move to Bin depends on UI)
			admin.POST("/packages", pHandler.CreatePackage)
			admin.PATCH("/packages/:id", pHandler.UpdatePackage)
			admin.DELETE("/packages/:id", pHandler.DeletePackage)
			admin.DELETE("/lps/:id", leadHandler.DeleteLandingPage)

			// Recycle Bin Routes
			admin.GET("/recycle-bin", rbHandler.GetDeletedItems)
			admin.POST("/recycle-bin/restore", rbHandler.RestoreItem)
			admin.DELETE("/recycle-bin/purge/:id", rbHandler.PurgeItem)
		}

		// Analytics Routes
		analytics := v1.Group("/analytics")
		analytics.Use(iamMiddleware.AuthMiddleware())
		{
			analytics.GET("/dashboard", aHandler.GetDashboard)
			analytics.GET("/campaigns", aHandler.GetCampaignPerformance)
			analytics.GET("/vendors", aHandler.GetVendorPerformance)
			analytics.GET("/agents", aHandler.GetAgentLeaderboard)
			analytics.GET("/ai-audit", leadHandler.AIAudit)
		}

		// Protected CRM Routes
		crm := v1.Group("/crm")
		crm.Use(iamMiddleware.AuthMiddleware())
		{
			crm.GET("/leads", leadHandler.GetAllLeads)
			crm.GET("/leads/:id", leadHandler.GetLeadDetail)
			crm.PATCH("/leads/:id", leadHandler.UpdateLead)
			crm.DELETE("/leads/:id", leadHandler.DeleteLead)
			crm.POST("/activity", leadHandler.AddLeadActivity)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
