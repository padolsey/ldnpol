# Policy Exploration Tool for Policymaking in Greater London

## Overview

[Take-home exercise]

This tool allows hypothetical policies to be tested against simulated constituents in the Greater London area. The responses are backed by real data on London boroughs, census data from 2021, and recent YouGov polls.

## Key Features

- Pre-cleansed data: census 2021, yougov polls, found in `./data`
- Policy input interface for policymakers, see `./src/app/components/PolicyInputs.tsx` for an overview
- AI-powered reaction generation using Anthropic and OpenAI models; see `./src/app/policy_simulator`

## Technical Stack

- Node / Next.js
- TypeScript + SCSS for styling
- OpenAI + Anthropic APIs for reaction generation + data extraction

## Setup and Installation

1. Clone the repo
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## Future Improvements

- Implement visualization of reaction sentiments
- Add persona customization options
- Add comprehensive unit and integration tests
- Improve error handling and fallbacks
