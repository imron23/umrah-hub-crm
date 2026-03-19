-- 006_digital_brochure.sql

CREATE TABLE IF NOT EXISTS brochure_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    html_content TEXT NOT NULL,
    css_content TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE packages ADD COLUMN IF NOT EXISTS brochure_url TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS brochure_template_id UUID REFERENCES brochure_templates(id);

-- Insert a premium default template
INSERT INTO brochure_templates (id, name, html_content, css_content, is_default)
VALUES (
    uuid_generate_v4(),
    'Premium Umrah Slate',
    '<div class="brochure"><h1>{{PackageName}}</h1><p>{{Description}}</p><div class="details"><span>{{Duration}} Hari</span><span>{{DepartureCity}}</span></div></div>',
    '.brochure { padding: 40px; background: #0b0e14; color: white; }',
    true
) ON CONFLICT DO NOTHING;
