-- 007_pricing_engine.sql
-- Trip Package (Paket Perjalanan), e.g. "Umrah Liburan 2 Juni 2026"
CREATE TABLE trip_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,                         -- e.g. "Umrah Liburan - 2 Juni 2026"
    description TEXT,
    departure_date DATE,
    return_date DATE,
    destination VARCHAR(100) DEFAULT 'Makkah - Madinah',
    duration_nights INTEGER DEFAULT 9,
    currency VARCHAR(10) DEFAULT 'IDR',                 -- IDR or USD
    status VARCHAR(20) DEFAULT 'active',               -- active, sold_out, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Package Tiers (Bronze, Silver, Gold, VVIP, etc.) - fully custom
CREATE TABLE package_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_package_id UUID REFERENCES trip_packages(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL,                   -- e.g. "VVIP", "Gold", "Silver", "Bronze"
    tier_label VARCHAR(50),                            -- e.g. "Full Private", "Premium", "Standard"
    sort_order INTEGER DEFAULT 0,                      -- for display ordering
    color_code VARCHAR(20) DEFAULT '#6366f1',           -- hex color for UI
    includes_items TEXT,                               -- JSON list of inclusions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Room Pricing per Tier + Room Type (double, triple, quad)
CREATE TABLE tier_room_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_id UUID REFERENCES package_tiers(id) ON DELETE CASCADE,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('single', 'double', 'triple', 'quad')),
    price DECIMAL(20, 2) NOT NULL,                     -- Per-person price
    quota INTEGER DEFAULT 0,                           -- available seats for this config
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tier_id, room_type)
);

-- Lead Transaction: links a converted lead to a specific package, tier, room type & price
CREATE TABLE lead_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    trip_package_id UUID REFERENCES trip_packages(id),
    tier_id UUID REFERENCES package_tiers(id),
    room_price_id UUID REFERENCES tier_room_prices(id),
    transaction_type VARCHAR(20) NOT NULL DEFAULT 'dp' CHECK (transaction_type IN ('dp', 'full_payment')),
    pax_count INTEGER DEFAULT 1,
    dp_amount DECIMAL(20, 2),                          -- For DP only: the custom DP nominal
    final_amount DECIMAL(20, 2),                       -- Full price (price * pax_count)
    currency VARCHAR(10) DEFAULT 'IDR',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast revenue queries
CREATE INDEX idx_lead_transactions_type ON lead_transactions(transaction_type);
CREATE INDEX idx_lead_transactions_currency ON lead_transactions(currency);
CREATE INDEX idx_lead_transactions_package ON lead_transactions(trip_package_id);
