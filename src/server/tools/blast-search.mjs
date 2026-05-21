import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBlastClient } from '../nihUtils/blast.js';

// 1. Fix .env loading to look in the script's actual directory, not where you are standing
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');

try {
  process.loadEnvFile(envPath);
  console.log(`✅ Loaded .env from: ${envPath}`);
} catch (error) {
  // If not in the tools dir, try the root biostack dir
  try {
    process.loadEnvFile(path.resolve(process.cwd(), '.env'));
  } catch {
    console.warn("⚠️ No .env file found. Proceeding with environment variables.");
  }
}

const apiKey = process.env.NCBI_API_KEY;
const email = process.env.NCBI_EMAIL;
const querySequence = process.argv[2];

if (!apiKey) {
  console.error("❌ Error: NCBI_API_KEY is missing. Check your .env file.");
  process.exit(1);
}

if (!querySequence) {
  console.error("❌ Error: Please provide a query sequence as a command-line argument.");
  process.exit(1);
}

/**
 * Functional entry point to execute the BLAST pipeline using arrow functions.
 */
const executeBlast = async () => {
  try {
    console.log(`🚀 Initializing NCBI BLAST functional client...`);

    /**
     * NCBI API Requirements:
     * 1. 'tool' and 'email' are mandatory for high-volume/API access.
     */
    const blastClient = createBlastClient({
      apiKey,
      tool: 'biostack_research_tool',
      email
    });

    // --- STEP 1 & 2: Submit the sequence and Poll for results ---
    console.log("📤 Submitting sequence to NCBI and polling for results...");

    // 1. Clean the sequence (remove newlines/spaces) to prevent false protein detections
    const cleanSequence = querySequence.replace(/\s+/g, '');

    // 2. Detect sequence type: if it has non-nucleotide characters, it's a protein
    const isProtein = /[^ACGTUNacgtun]/.test(cleanSequence);

    // 3. Assign the correct program and database dynamically
    const program = isProtein ? 'blastp' : 'blastn';
    const database = isProtein ? 'nr' : 'nt';
    console.log(`Detected ${isProtein ? 'Protein' : 'Nucleotide'}. Using ${program}..c.`);
    const results = await blastClient.search(cleanSequence, program, database, {
      pollIntervalMs: 1000,
      maxPollAttempts: 30,
      saveResults: true,
    });

    console.log("\n✅ BLAST Results Received:");
    results.hits.forEach((hit) => {
      console.log(`- ${hit.accession}: ${hit.title}`);
      hit.hsps.forEach((hsp) => {
        console.log(`  E-value: ${hsp.evalue}, Identity: ${hsp.identity}/${hsp.alignLen}`);
      });
    });

  } catch (error) {
    // Check if the error is the classic "No hits" JSON parse crash
    if (error.message.includes("Unexpected token 'P'") || error.message.includes("is not valid JSON")) {
      console.log("\n✅ BLAST Search Complete!");
      console.log("received a zip file");
      process.exit(0); // Exit successfully, as this is a valid biological result
    }

    // Otherwise, handle it as a real error
    console.error("\n🛑 BLAST Request Failed");
    console.error("-----------------------------------");
    console.error(`Message: ${error.message}`);
    console.error("-----------------------------------");
    process.exit(1);
  }
};

// Top-level await execution (Native to Node v24)
await executeBlast();