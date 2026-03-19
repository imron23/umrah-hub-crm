package service

import (
	"github.com/user/umrah-hub-aggregator/apps/api/internal/crm"
	"github.com/user/umrah-hub-aggregator/apps/api/pkg/db"
)

type DashboardMetrics struct {
	TotalLeads     int64   `json:"total_leads"`
	TotalBookings  int64   `json:"total_bookings"`
	TotalRevenue   float64 `json:"total_revenue"`
	TotalAdSpend   float64 `json:"total_ad_spend"`
	ROAS           float64 `json:"roas"`
	ConversionRate float64 `json:"conversion_rate"`
}

type AnalyticsService interface {
	GetDashboardMetrics() (DashboardMetrics, error)
}

type analyticsService struct{}

func NewAnalyticsService() AnalyticsService {
	return &analyticsService{}
}

func (s *analyticsService) GetDashboardMetrics() (DashboardMetrics, error) {
	var metrics DashboardMetrics
	
	// 1. Total Leads
	db.DB.Model(&crm.Lead{}).Count(&metrics.TotalLeads)

	// 2. Total Bookings & Revenue
	// Assuming bookings table exists and has platform_fee or total price
	type BookingStats struct {
		Count   int64
		Revenue float64
	}
	var stats BookingStats
	db.DB.Table("bookings").Select("count(id) as count, sum(customer_price) as revenue").Scan(&stats)
	
	metrics.TotalBookings = stats.Count
	metrics.TotalRevenue = stats.Revenue

	// 3. Ad Spend (Placeholder logic, should query campaign_costs)
	db.DB.Table("campaign_costs").Select("sum(amount)").Scan(&metrics.TotalAdSpend)

	// 4. Calculations
	if metrics.TotalAdSpend > 0 {
		metrics.ROAS = metrics.TotalRevenue / metrics.TotalAdSpend
	}
	if metrics.TotalLeads > 0 {
		metrics.ConversionRate = (float64(metrics.TotalBookings) / float64(metrics.TotalLeads)) * 100
	}

	return metrics, nil
}
