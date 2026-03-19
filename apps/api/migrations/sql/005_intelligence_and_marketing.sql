-- 005_intelligence_and_marketing.sql

-- Add new fields to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_priority INTEGER DEFAULT 0;

-- Add performance metrics to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS avg_response_time INTEGER DEFAULT 0; -- in minutes

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50), 
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Costs
CREATE TABLE IF NOT EXISTS campaign_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    cost_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Detailed Attribution
CREATE TABLE IF NOT EXISTS lead_attribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    fbclid VARCHAR(255),
    gclid VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Call Logs
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id),
    call_duration INTEGER, 
    call_result VARCHAR(50), 
    recording_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Existing Index Optimizations
CREATE INDEX IF NOT EXISTS idx_leads_priority_score ON leads (lead_priority DESC, lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_attribution_lead_id ON lead_attribution(lead_id);
