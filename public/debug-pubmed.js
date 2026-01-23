/**
 * Debugging script for Europe PMC API
 * Run this in the browser console to test connectivity
 */

async function debugPubMedAPI() {
  const TERM = 'TP53';
  const BASE_URL = 'https://www.ebi.ac.uk/europepmc/webservices/rest';
  
  console.log('🧪 Testing Europe PMC API connectivity...');
  
  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set('query', `${TERM} AND (gene OR protein)`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('pageSize', '1');
  url.searchParams.set('resultType', 'core');
  
  console.log(`📡 Fetching: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`📥 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('❌ Request failed');
      return;
    }
    
    const data = await response.json();
    console.log('✅ Response received:', data);
    
    if (data.hitCount > 0) {
      console.log(`🎉 Found ${data.hitCount} papers! First title:`, data.resultList.result[0].title);
    } else {
      console.warn('⚠️ No results found (but API works)');
    }
    
  } catch (error) {
    console.error('🔥 Error:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('possible CORS issue?');
    }
  }
}

// Automatically run if pasted in console
debugPubMedAPI();
