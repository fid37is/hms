// hms/frontend/src/modules/settings/preview/hotel-config-stub.js
//
// Stub for hotel-website/src/config/hotel.config.js when imported in the HMS.
// api.js uses hotelConfig.api.baseUrl — we point it at the HMS's own API.
// Everything else is safe defaults.

const hotelConfig = {
  name:        'Hotel Preview',
  shortName:   'Preview',
  tagline:     '',
  description: '',
  brand:       { primary: '#1a1a1a', secondary: '#c9a96e' },
  contact:     { phone: '', email: '', city: '', country: '' },
  payment:     { currency: 'NGN', currencySymbol: '₦' },
  social:      { instagram: '', facebook: '', twitter: '' },
  features:    {},
  seo:         { titleTemplate: '%s', defaultTitle: 'Preview' },
  api: {
    // Point to the same backend the HMS uses
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1/public',
  },
};

export default hotelConfig;