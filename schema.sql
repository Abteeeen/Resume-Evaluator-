-- Job Descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    file_url TEXT, -- In case we store the file in Supabase Storage
    parsed_content TEXT NOT NULL,
    source TEXT NOT NULL, -- 'linkedin', 'local', 'notion'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    jd_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    summary TEXT,
    detailed_feedback TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (simplifying for now, can be refined later)
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Basic Policies (allow all for now to facilitate development)
CREATE POLICY "Allow all on job_descriptions" ON job_descriptions FOR ALL USING (true);
CREATE POLICY "Allow all on resumes" ON resumes FOR ALL USING (true);
CREATE POLICY "Allow all on evaluations" ON evaluations FOR ALL USING (true);
