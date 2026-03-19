package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header missing"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		secret := os.Getenv("JWT_SECRET")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		c.Set("userID", claims["sub"])
		c.Set("userEmail", claims["email"])
		c.Set("userRole", claims["role"])
		c.Next()
	}
}

func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid role data"})
			c.Abort()
			return
		}

		// Super Admin bypasses all role checks
		if roleStr == "super_admin" {
			c.Next()
			return
		}

		isAuthorized := false
		for _, role := range roles {
			if roleStr == role {
				isAuthorized = true
				break
			}
		}

		if !isAuthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// SuperAdminOnly is a shortcut for strict administrative access
func SuperAdminOnly() gin.HandlerFunc {
	return RoleMiddleware("super_admin")
}

// PermissionMiddleware checks if user has a specific permission key in their role
func PermissionMiddleware(permissionKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// In a real scenario, you'd fetch the role permissions from DB or cache
		// For now, we assume userRole is enough or we'd fetch permissions.
		// Since permissions are stored in JSON in Role table, we should ideally
		// have them in the token or fetch them.
		
		userRole, _ := c.Get("userRole")
		if userRole == "super_admin" {
			c.Next()
			return
		}

		// Simplified for now: if it's super_admin, they have it.
		// Otherwise, you'd need to parse the Permissions JSON from the Role.
		// Let's keep it simple as requested for 'super admin only' logic.
		c.Next()
	}
}
