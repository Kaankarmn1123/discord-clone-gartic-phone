// Test script to check servers table structure
const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as the frontend
const supabaseUrl = 'https://jrdznwtwnbzizneflvij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZHpud3R3bmJ6aXpuZWZsdmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzUxMzQsImV4cCI6MjA3NjMxMTEzNH0.0uMgY-XZRnz6TawnPQN5kyPj2DkKpAJE5Kcgp-m2BSU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testServersTable() {
  console.log('Testing servers table...');
  
  try {
    // First, let's try to query the servers table
    const { data, error } = await supabase
      .from('servers')
      .select('id')
      .eq('owner_id', '00000000-0000-0000-0000-000000000000') // Use a valid UUID format
      .limit(1);
    
    if (error) {
      console.error('Error querying servers table:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('Query successful. Data:', data);
    }
    
    // Let's also try to get table schema information
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'servers')
      .eq('table_schema', 'public');
    
    if (schemaError) {
      console.error('Error getting schema:', schemaError);
    } else {
      console.log('Servers table schema:');
      schemaData.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
    }
    
  } catch (err) {
    console.error('Exception:', err);
  }
}

testServersTable();