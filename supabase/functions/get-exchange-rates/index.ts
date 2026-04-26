import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching exchange rates...');
    
    // Using exchangerate-api.com free tier (no API key required)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Exchange rates fetched successfully');

    return new Response(JSON.stringify({
      rates: data.rates,
      base: data.base,
      date: data.date
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return fallback rates if API fails
    const fallbackRates = {
      "USD": 1,
      "EUR": 0.85,
      "GBP": 0.73,
      "INR": 83.12,
      "JPY": 110.0,
      "CAD": 1.25,
      "AUD": 1.35
    };
    
    return new Response(JSON.stringify({
      rates: fallbackRates,
      base: "USD",
      date: new Date().toISOString().split('T')[0],
      fallback: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});