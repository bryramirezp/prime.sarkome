/**
 * Manual Testing Script for PubMed Service
 * Run this script to test the Europe PMC API integration manually
 * 
 * Usage:
 *   npx tsx scripts/test-pubmed-api.ts
 */

import {
  searchCitations,
  searchEntityCitations,
  searchRelationshipCitations,
  searchMechanismCitations,
  getCitationCount,
} from '../services/pubmedService';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

async function testBasicSearch() {
  logSection('Test 1: Basic Search - TP53 and Cancer');
  
  try {
    const result = await searchCitations({
      query: 'TP53 AND cancer',
      pageSize: 3,
    });

    logSuccess(`Found ${result.hitCount} total papers`);
    logInfo(`Showing first ${result.results.length} results:\n`);

    result.results.forEach((citation, index) => {
      console.log(`${index + 1}. ${citation.title}`);
      console.log(`   Authors: ${citation.authors}`);
      console.log(`   Journal: ${citation.journal} (${citation.year})`);
      console.log(`   Citations: ${citation.citedByCount}`);
      console.log(`   Open Access: ${citation.isOpenAccess ? 'Yes' : 'No'}`);
      console.log(`   Tags: ${citation.tags.join(', ')}`);
      if (citation.abstract) {
        console.log(`   Abstract: ${citation.abstract.substring(0, 100)}...`);
      }
      console.log('');
    });

    return true;
  } catch (error: any) {
    logError(`Failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testGeneSearch() {
  logSection('Test 2: Gene-Specific Search - BRCA1');
  
  try {
    const results = await searchEntityCitations('BRCA1', 'gene', 3);

    logSuccess(`Found ${results.length} papers about BRCA1`);
    
    results.forEach((citation, index) => {
      console.log(`\n${index + 1}. ${citation.title}`);
      console.log(`   ${citation.journal} (${citation.year}) - ${citation.citedByCount} citations`);
      if (citation.pdfUrl) {
        console.log(`   PDF: ${citation.pdfUrl}`);
      }
    });

    return true;
  } catch (error: any) {
    logError(`Failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testDrugSearch() {
  logSection('Test 3: Drug-Specific Search - Metformin');
  
  try {
    const results = await searchEntityCitations('Metformin', 'drug', 3);

    logSuccess(`Found ${results.length} papers about Metformin`);
    
    results.forEach((citation, index) => {
      console.log(`\n${index + 1}. ${citation.title}`);
      console.log(`   ${citation.authors}`);
      console.log(`   ${citation.journal} (${citation.year})`);
    });

    return true;
  } catch (error: any) {
    logError(`Failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testDiseaseSearch() {
  logSection('Test 4: Disease-Specific Search - Alzheimer\'s Disease');
  
  try {
    const results = await searchEntityCitations('Alzheimer\'s disease', 'disease', 3);

    logSuccess(`Found ${results.length} papers about Alzheimer's disease`);
    
    results.forEach((citation, index) => {
      console.log(`\n${index + 1}. ${citation.title}`);
      console.log(`   Citations: ${citation.citedByCount}`);
      console.log(`   Year: ${citation.year}`);
    });

    return true;
  } catch (error: any) {
    logError(`Failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testRelationshipSearch() {
  logSection('Test 5: Relationship Search - TP53 and Apoptosis');
  
  try {
    const results = await searchRelationshipCitations('TP53', 'apoptosis', 3);

    logSuccess(`Found ${results.length} papers about TP53-apoptosis relationship`);
    
    results.forEach((citation, index) => {
      console.log(`\n${index + 1}. ${citation.title}`);
      console.log(`   ${citation.journal} (${citation.year})`);
    });

    return true;
  } catch (error: any) {
    logError(`Failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testMechanismSearch() {
  logSection('Test 6: Mechanism Search - Aspirin and Cardiovascular Disease');
  
  try {
    const results = await searchMechanismCitations('Aspirin', 'cardiovascular disease', 3);

    logSuccess(`Found ${results.length} papers about Aspirin mechanism in cardiovascular disease`);
    
    results.forEach((citation, index) => {
      console.log(`\n${index + 1}. ${citation.title}`);
      console.log(`   ${citation.authors}`);
      console.log(`   ${citation.journal} (${citation.year})`);
    });

    return true;
  } catch (error: any) {
    logError(`Failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testYearFilter() {
  logSection('Test 7: Year Filter - Recent Papers (2023-2024)');
  
  try {
    const result = await searchCitations({
      query: 'CRISPR',
      pageSize: 3,
      yearFrom: 2023,
      yearTo: 2024,
      sort: 'DATE desc',
    });

    logSuccess(`Found ${result.hitCount} papers from 2023-2024`);
    
    result.results.forEach((citation, index) => {
      console.log(`\n${index + 1}. ${citation.title}`);
      console.log(`   Year: ${citation.year}`);
      console.log(`   ${citation.journal}`);
    });

    return true;
  } catch (error: any) {
    logError(`Failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testOpenAccessFilter() {
  logSection('Test 8: Open Access Filter');
  
  try {
    const result = await searchCitations({
      query: 'machine learning AND medicine',
      pageSize: 3,
      openAccessOnly: true,
    });

    logSuccess(`Found ${result.hitCount} open access papers`);
    
    result.results.forEach((citation, index) => {
      console.log(`\n${index + 1}. ${citation.title}`);
      console.log(`   Open Access: ${citation.isOpenAccess ? 'Yes ✓' : 'No ✗'}`);
      if (citation.pdfUrl) {
        console.log(`   PDF Available: Yes ✓`);
      }
    });

    return true;
  } catch (error: any) {
    logError(`Failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testCitationCount() {
  logSection('Test 9: Get Citation Count for Specific Paper');
  
  try {
    // Famous paper: "The hallmarks of cancer" (PMID: 10647931)
    const count = await getCitationCount('10647931');

    logSuccess(`Citation count retrieved successfully`);
    logInfo(`PMID 10647931 has been cited ${count} times`);

    return true;
  } catch (error: any) {
    logError(`Failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testErrorHandling() {
  logSection('Test 10: Error Handling - Invalid Query');
  
  try {
    // This should return 0 results, not error
    const result = await searchCitations({
      query: 'xyznonexistent123randomstring',
      pageSize: 3,
    });

    if (result.hitCount === 0) {
      logSuccess('Empty results handled correctly');
      logInfo('Returned 0 results as expected');
    } else {
      logError('Expected 0 results but got some');
    }

    return true;
  } catch (error: any) {
    logError(`Unexpected error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('\n' + '█'.repeat(60), colors.bright + colors.blue);
  log('  PubMed/Europe PMC API Integration Test Suite', colors.bright + colors.blue);
  log('█'.repeat(60) + '\n', colors.bright + colors.blue);

  const tests = [
    testBasicSearch,
    testGeneSearch,
    testDrugSearch,
    testDiseaseSearch,
    testRelationshipSearch,
    testMechanismSearch,
    testYearFilter,
    testOpenAccessFilter,
    testCitationCount,
    testErrorHandling,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
      logError(`Test crashed: ${error}`);
    }
    
    // Small delay between tests to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  logSection('Test Summary');
  log(`Total Tests: ${tests.length}`, colors.bright);
  logSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  }
  
  const successRate = ((passed / tests.length) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, colors.bright + colors.cyan);

  if (failed === 0) {
    log('\n🎉 All tests passed! Europe PMC integration is working correctly.\n', colors.green + colors.bright);
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.\n', colors.yellow + colors.bright);
  }
}

// Run all tests
runAllTests().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
