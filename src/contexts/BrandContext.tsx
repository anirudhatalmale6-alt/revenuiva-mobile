import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAuth } from './AuthContext';

interface BrandState {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  businessName: string;
  themed: <T extends StyleSheet.NamedStyles<T>>(
    factory: (colors: { primary: string; secondary: string }) => T
  ) => T;
}

const DEFAULT_PRIMARY = '#0047AB';
const DEFAULT_SECONDARY = '#00C853';
const DEFAULT_NAME = 'Revenuiva';

const BrandContext = createContext<BrandState>({
  primaryColor: DEFAULT_PRIMARY,
  secondaryColor: DEFAULT_SECONDARY,
  logoUrl: null,
  businessName: DEFAULT_NAME,
  themed: (factory) =>
    StyleSheet.create(
      factory({ primary: DEFAULT_PRIMARY, secondary: DEFAULT_SECONDARY })
    ),
});

export const useBrand = () => useContext(BrandContext);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { business } = useAuth();

  const primaryColor = business?.primary_color || DEFAULT_PRIMARY;
  const secondaryColor = business?.secondary_color || DEFAULT_SECONDARY;
  const logoUrl = business?.logo_url || null;
  const businessName = business?.name || DEFAULT_NAME;

  const themed = useMemo(
    () =>
      <T extends StyleSheet.NamedStyles<T>>(
        factory: (colors: { primary: string; secondary: string }) => T
      ): T =>
        StyleSheet.create(
          factory({ primary: primaryColor, secondary: secondaryColor })
        ),
    [primaryColor, secondaryColor]
  );

  const value = useMemo<BrandState>(
    () => ({
      primaryColor,
      secondaryColor,
      logoUrl,
      businessName,
      themed,
    }),
    [primaryColor, secondaryColor, logoUrl, businessName, themed]
  );

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
};

export default BrandContext;
