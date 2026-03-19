package middleware

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/telegram"
)

// AuditLog represents a simple audit record
type AuditLog struct {
	Timestamp  time.Time `json:"timestamp"`
	UserID     string    `json:"user_id"`
	Email      string    `json:"email"`
	Role       string    `json:"role"`
	Action     string    `json:"action"`
	Method     string    `json:"method"`
	Path       string    `json:"path"`
	IP         string    `json:"ip"`
	StatusCode int       `json:"status_code"`
}

func AuditMiddleware(tg telegram.TelegramService) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		// Only log mutations, admin path access, or failed attempts
		method := c.Request.Method
		isMutation := method == http.MethodPost || method == http.MethodPut || method == http.MethodPatch || method == http.MethodDelete
		isAdminPath := (len(c.Request.URL.Path) >= 9 && c.Request.URL.Path[:9] == "/api/v1/admin")
		isFailure := c.Writer.Status() >= 400

		if isMutation || isAdminPath || isFailure {
			userID, _ := c.Get("userID")
			userEmail, _ := c.Get("userEmail")
			userRole, _ := c.Get("userRole")

			uid := ""
			if userID != nil { uid = fmt.Sprintf("%v", userID) }
			email := ""
			if userEmail != nil { email = fmt.Sprintf("%v", userEmail) }
			role := ""
			if userRole != nil { role = fmt.Sprintf("%v", userRole) }

			// Standardize anonymous users
			if email == "" { email = "anonymous" }
			if role == "" { role = "public" }

			log.Printf("[SECURITY-AUDIT] %s | User: %s (UID:%s, Role:%s) | %s %s | Status: %d | IP: %s",
				start.Format(time.RFC3339),
				email,
				uid,
				role,
				method,
				c.Request.URL.Path,
				c.Writer.Status(),
				c.ClientIP(),
			)

			// SEND TELEGRAM ALERT for critical security breaches or deletions
			if c.Writer.Status() == http.StatusForbidden || c.Writer.Status() == http.StatusUnauthorized || (isMutation && method == http.MethodDelete) {
				action := fmt.Sprintf("%s ACCESS", method)
				if method == http.MethodDelete { action = "DATA DELETION" }
				
				go tg.SendSecurityAlert(email, role, action, c.Request.URL.Path, c.ClientIP())
			}
		}
	}
}
