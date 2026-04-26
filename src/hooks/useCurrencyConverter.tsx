import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExchangeRates {
  [key: string]: number;
}

export const useCurrencyConverter = () => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-exchange-rates');
      
      if (error) {
        console.error('Error fetching exchange rates:', error);
        return;
      }

      if (data) {
        setExchangeRates(data.rates);
        setLastUpdated(data.date);
      }
    } catch (error) {
      console.error('Error in currency converter:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
    
    // Update rates every 30 minutes
    const interval = setInterval(fetchExchangeRates, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency || !exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
      return amount;
    }

    // Convert to USD first (base currency), then to target currency
    const usdAmount = amount / exchangeRates[fromCurrency];
    const convertedAmount = usdAmount * exchangeRates[toCurrency];
    
    return convertedAmount;
  };

  const formatCurrency = (amount: number, currencyCode: string): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      const symbols: { [key: string]: string } = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        INR: '₹',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$'
      };
      
      const symbol = symbols[currencyCode] || currencyCode;
      return `${symbol}${amount.toFixed(2)}`;
    }
  };

  return {
    exchangeRates,
    loading,
    lastUpdated,
    convertCurrency,
    formatCurrency,
    refetchRates: fetchExchangeRates
  };
};