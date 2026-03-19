-- 004_finance_and_analytics.sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    package_id UUID REFERENCES packages(id),
    vendor_id UUID REFERENCES vendors(id),
    vendor_price DECIMAL(15, 2) NOT NULL,
    customer_price DECIMAL(15, 2) NOT NULL,
    platform_fee DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_daily_summary (
    date DATE PRIMARY KEY,
    total_leads INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    ad_spend DECIMAL(15, 2) DEFAULT 0,
    cpl DECIMAL(15, 2) DEFAULT 0,
    cpb DECIMAL(15, 2) DEFAULT 0,
    roas DECIMAL(15, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for analytics performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_bookings_status ON bookings(status);
