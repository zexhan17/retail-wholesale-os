import React from 'react';
import { useAppStore } from '../../store/useAppStore';

interface CurrencyTextProps {
  amount: number;
  showPlus?: boolean;
}

export const formatMoney = (amount: number, currencySymbol?: string): string => {
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? '-' : '';
  const symbol = currencySymbol && currencySymbol !== '$' ? `${currencySymbol} ` : '';
  return `${sign}${symbol}${formatted}`;
};

export const CurrencyText: React.FC<CurrencyTextProps> = ({ amount, showPlus = false }) => {
  const profileCurrency = useAppStore((state) => state.profile.currencySymbol);
  const symbol = profileCurrency && profileCurrency !== '$' ? `${profileCurrency} ` : '';
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sign = amount < 0 ? '-' : showPlus && amount > 0 ? '+' : '';

  return (
    <span>
      {sign}
      {symbol}
      {formatted}
    </span>
  );
};
