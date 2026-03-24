import Joi from 'joi';

// Allow empty/null or a valid URI
const uri = Joi.alternatives().try(
  Joi.string().uri(),
  Joi.string().max(0).allow(''),
  Joi.valid(null)
);

// Allow empty/null or valid email
const email = Joi.alternatives().try(
  Joi.string().email().lowercase(),
  Joi.string().max(0).allow(''),
  Joi.valid(null)
);

// TIME from Postgres comes as HH:MM or HH:MM:SS — accept both
const timeField = Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow('', null);

// Hex color — #rrggbb or null/empty
const hexColor = Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('', null);

const configFields = {
  // Identity
  hotel_name:       Joi.string().trim(),
  tagline:          Joi.string().trim().allow('', null),
  description:      Joi.string().trim().allow('', null),
  logo_url:         uri,

  // Branding — core
  primary_color:    hexColor,
  accent_color:     hexColor,

  // Branding — optional role overrides (null = auto-derive from primary/accent)
  nav_color:        hexColor,
  btn_color:        hexColor,
  footer_color:     hexColor,
  surface_color:    hexColor,
  bg_color:         hexColor,

  // Layout — free-form JSON object
  layout: Joi.object({
    nav_style:      Joi.string().valid('transparent_scroll', 'solid', 'minimal'),
    hero_style:     Joi.string().valid('fullscreen', 'split', 'minimal'),
    card_style:     Joi.string().valid('portrait', 'wide', 'magazine'),
    font_pair:      Joi.string().valid('cormorant_dmsans', 'playfair_lato', 'montserrat_merriweather'),
    section_order:  Joi.array().items(Joi.string()),
    section_hidden: Joi.array().items(Joi.string()),
  }).allow(null),

  // Content — free-form JSONB for website section content
  content: Joi.object().allow(null),

  // Location
  address:          Joi.string().trim().allow('', null),
  city:             Joi.string().trim().allow('', null),
  state:            Joi.string().trim().allow('', null),
  country:          Joi.string().trim().allow('', null),
  google_maps_url:  uri,

  // Contact
  phone:            Joi.string().trim().allow('', null),
  email:            email,
  whatsapp_number:  Joi.string().trim().allow('', null),

  // Social
  instagram_url:    uri,
  facebook_url:     uri,
  twitter_url:      uri,

  // Financial
  currency:         Joi.string().length(3).uppercase(),
  currency_symbol:  Joi.string().trim(),
  tax_rate:         Joi.number().min(0).max(100),
  service_charge:   Joi.number().min(0).max(100),

  // Payment
  pay_on_arrival:        Joi.boolean().allow(null),
  bank_transfer:         Joi.boolean().allow(null),
  paystack_enabled:      Joi.boolean().allow(null),
  bank_name:             Joi.string().trim().allow('', null),
  bank_account_number:   Joi.string().trim().allow('', null),
  bank_account_name:     Joi.string().trim().allow('', null),
  paystack_public_key:   Joi.string().trim().allow('', null),

  // Operations
  timezone:         Joi.string().trim(),
  check_in_time:    timeField,
  check_out_time:   timeField,

  // Policies
  cancellation_policy: Joi.string().trim().allow('', null),
  pets_policy:         Joi.string().trim().allow('', null),
  smoking_policy:      Joi.string().trim().allow('', null),

  // Billing
  receipt_footer:   Joi.string().trim().allow('', null),
};

export const initConfigSchema = Joi.object({
  hotel_name: Joi.string().trim().required(),
  ...Object.fromEntries(
    Object.entries(configFields).filter(([k]) => k !== 'hotel_name')
  ),
});

export const updateConfigSchema = Joi.object(configFields).min(1);