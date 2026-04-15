import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { PLATFORM_LOGO_SRC } from './AppLogo.jsx';

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
 * Hook for tenant branding colors, names, and logo selection for the shell (Sidebar, etc.).
 */
export const useTenantBranding = () => {
  const { tenant, user } = useAuth();

  const defaultName = 'DuesAccountant';
  const platformLogoSrc = PLATFORM_LOGO_SRC;

  if (!user) {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      tenantName: defaultName,
      platformLogoSrc,
      tenantLogoUrl: null,
      sidebarBrandLabel: defaultName,
      showTenantLogo: false,
    };
  }

  if (user.role === 'system') {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      tenantName: defaultName,
      platformLogoSrc,
      tenantLogoUrl: null,
      sidebarBrandLabel: 'Platform',
      showTenantLogo: false,
    };
  }

  if (!tenant) {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      tenantName: defaultName,
      platformLogoSrc,
      tenantLogoUrl: null,
      sidebarBrandLabel: defaultName,
      showTenantLogo: false,
    };
  }

  const rawLogo = tenant.config?.branding?.logo?.trim();
  const tenantLogoUrl =
    rawLogo && /^https?:\/\//i.test(rawLogo) ? rawLogo : null;
  const name = tenant.config?.branding?.name || tenant.name || defaultName;

  return {
    primaryColor: tenant.config?.branding?.primaryColor || '#3B82F6',
    secondaryColor: tenant.config?.branding?.secondaryColor || '#1E40AF',
    tenantName: name,
    platformLogoSrc,
    tenantLogoUrl,
    sidebarBrandLabel: name,
    showTenantLogo: Boolean(tenantLogoUrl),
  };
};

export default TenantBranding;

