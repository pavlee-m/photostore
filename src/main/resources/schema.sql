IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'photostore')
    EXEC('CREATE SCHEMA photostore');
