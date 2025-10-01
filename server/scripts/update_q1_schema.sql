-- Add new fields for hierarchical Q1
ALTER TABLE responses 
ADD COLUMN IF NOT EXISTS primary_impression VARCHAR(50),
ADD COLUMN IF NOT EXISTS primary_features JSON,
ADD COLUMN IF NOT EXISTS primary_other_text TEXT,
ADD COLUMN IF NOT EXISTS secondary_impressions JSON;

-- Add constraint (drop first if exists to avoid errors)
DO $$ 
BEGIN
    -- Drop constraint if it exists
    ALTER TABLE responses DROP CONSTRAINT IF EXISTS valid_primary_impression;
    
    -- Add the constraint
    ALTER TABLE responses
    ADD CONSTRAINT valid_primary_impression CHECK (
        primary_impression IS NULL OR primary_impression IN (
            'visual_appearance',
            'spatial_arrangement',
            'structure_connections',
            'quantities_sizes',
            'changes_movement',
            'organization_grouping',
            'rules_patterns'
        )
    );
END $$;