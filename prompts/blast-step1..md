# NIH BLAST Zip Streaming & Parsing Implementation

This document provides the complete setup, utility script, and integration code required to fetch, extract, stream-parse, and clean up the NIH BLAST ZIP response using modern Node.js v24.11.0 features.

## Step 1: Environment Setup and Directory Creation

First, create the necessary utility directory and install the required streaming and unzipping dependencies (`unzipper` to handle the ZIP structure and `stream-json` for memory-efficient parsing).

```bash
# Create the utils directory
mkdir -p src/server/utils

# Install the required dependencies
npm install unzipper stream-json