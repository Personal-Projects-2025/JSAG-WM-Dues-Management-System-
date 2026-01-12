import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * TenantBranding component applies tenant-specific branding
 * This can be used to inject custom styles based on tenant configuration
 */
const TenantBranding = ({ children }) => {
  const { tenant } = useAuth();

  if (!tenant) {
    return <>{children}</>;
  }

  // Get branding colors from tenant config
  const primaryColor = tenant.config?.branding?.primaryColor || '#3B82F6';
  const secondaryColor = tenant.config?.branding?.secondaryColor || '#1E40AF';

  // Create CSS variables for tenant branding
  const brandingStyles = {
    '--tenant-primary': primaryColor,
    '--tenant-secondary': secondaryColor,
  };

  return (
    <div style={brandingStyles}>
      {children}
    </div>
  );
};

/**
 * Hook to get tenant branding colors
 */
export const useTenantBranding = () => {
  const { tenant } = useAuth();

  if (!tenant) {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      tenantName: 'Dues Accountant'
    };
  }

  return {
    primaryColor: tenant.config?.branding?.primaryColor || '#3B82F6',
    secondaryColor: tenant.config?.branding?.secondaryColor || '#1E40AF',
    tenantName: tenant.config?.branding?.name || tenant.name
  };
};

export default TenantBranding;


