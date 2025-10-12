import axios, { AxiosError } from "axios";

import { headers } from ".";

interface Account {
  id: string;
  object: string;
  applied_configurations: string[];
  configuration: Configuration;
  contact_email: string;
  created: string;
  dashboard: string;
  identity: Identity;
  business_details: BusinessDetails;
  country: string;
  entity_type: string;
  individual: Individual;
  defaults: null;
  display_name: string;
  metadata: Record<string, unknown>;
  requirements: null;
  livemode: boolean;
}

export interface Configuration {
  customer: null;
  merchant: Merchant;
  recipient: null;
}

interface Merchant {
  applied: boolean;
  bacs_debit_payments: BacsDebitPayments;
  branding: Branding;
  capabilities: Capabilities;
  card_payments: CardPayments;
  mcc: string;
  sepa_debit_payments: null;
  statement_descriptor: StatementDescriptor;
  support: Support;
}

interface BacsDebitPayments {
  display_name: string;
  service_user_number: string;
}

interface Branding {
  icon: null;
  logo: null;
  primary_color: null;
  secondary_color: null;
}

interface Capabilities {
  ach_debit_payments: null;
  acss_debit_payments: null;
  affirm_payments: null;
  afterpay_clearpay_payments: null;
  alma_payments: null;
  amazon_pay_payments: AmazonPayPayments;
  au_becs_debit_payments: null;
  bacs_debit_payments: null;
  bancontact_payments: null;
  blik_payments: null;
  boleto_payments: null;
  card_payments: CardPayments;
  cartes_bancaires_payments: null;
  cashapp_payments: null;
  eps_payments: null;
  fpx_payments: null;
  gb_bank_transfer_payments: null;
  grabpay_payments: null;
  ideal_payments: null;
  jcb_payments: null;
  jp_bank_transfer_payments: null;
  kakao_pay_payments: null;
  klarna_payments: null;
  konbini_payments: null;
  kr_card_payments: null;
  link_payments: null;
  mobilepay_payments: null;
  multibanco_payments: null;
  mx_bank_transfer_payments: null;
  naver_pay_payments: null;
  oxxo_pay_payments: null;
  p24_payments: null;
  pay_by_bank_payments: null;
  payco_payments: null;
  paynow_payments: null;
  promptpay_payments: null;
  revolut_pay_payments: null;
  samsung_pay_payments: null;
  sepa_bank_transfer_payments: null;
  sepa_debit_payments: null;
  stripe_balance: StripeBalance;
  swish_payments: null;
  twint_payments: null;
  us_bank_transfer_payments: null;
  zip_payments: null;
}

interface AmazonPayPayments {
  requested: boolean;
  status: string;
  // eslint-disable-next-line
  status_details: any[];
}

interface CardPayments {
  requested?: boolean;
  status?: string;
  // eslint-disable-next-line
  status_details?: any[];
  decline_on?: DeclineOn;
}

interface DeclineOn {
  avs_failure: boolean;
  cvc_failure: boolean;
}

interface StripeBalance {
  payouts: Payouts;
}

interface Payouts {
  requested: boolean;
  status: string;
  // eslint-disable-next-line
  status_details: any[];
}

interface StatementDescriptor {
  descriptor: null;
  prefix: null;
}

interface Support {
  address: Address;
  email: null;
  phone: null;
  url: null;
}

interface Address {
  city: null | string;
  country: null | string;
  line1: null | string;
  line2: null | string;
  postal_code: null | string;
  state: null | string;
  town: null | string;
}

interface Identity {
  attestations: Attestations;
  business_details: BusinessDetails;
}

interface Attestations {
  directorship_declaration: null;
  ownership_declaration: null;
  persons_provided: null;
  terms_of_service: TermsOfService;
}

interface TermsOfService {
  account: TermsOfServiceAccount;
}

interface TermsOfServiceAccount {
  date: string;
  ip: null;
  user_agent: null;
}

interface BusinessDetails {
  address: Address;
  annual_revenue: AnnualRevenue;
  documents: Documents;
  doing_business_as: null;
  estimated_worker_count: null;
  id_numbers: string[];
  monthly_estimated_revenue: null;
  phone: string;
  product_description: null;
  registered_name: string;
  script_addresses: null;
  script_names: null;
  structure: null;
  url: null;
}

interface AnnualRevenue {
  amount: null;
  fiscal_year_end: null;
}

interface Documents {
  bank_account_ownership_verification: null;
  company_license: null;
  company_memorandum_of_association: null;
  company_ministerial_decree: null;
  company_registration_verification: null;
  company_tax_id_verification: null;
  primary_verification: null;
  proof_of_address: null;
  proof_of_registration: null;
  proof_of_ultimate_beneficial_ownership: null;
}

interface Individual {
  id: string;
  object: string;
  account: string;
  additional_addresses: string[];
  additional_names: null;
  additional_terms_of_service: null;
  address: Address;
  created: string;
  date_of_birth: null;
  documents: Documents;
  email: string;
  given_name: string;
  id_numbers: string[];
  legal_gender: null;
  metadata: Record<string, unknown>;
  nationalities: string[];
  phone: string;
  political_exposure: null;
  relationship: Relationship;
  script_addresses: null;
  script_names: null;
  surname: string;
  updated: string;
}

interface Relationship {
  authorizer: boolean;
  director: boolean;
  executive: boolean;
  legal_guardian: boolean;
  owner: boolean;
  percent_ownership: null;
  representative: boolean;
  title: null;
}

export const getConnectedAccountUsingId = async function (id: string) {
  try {
    // Axios request with proper typing for the response
    const response = await axios.get<Account>(
      `https://api.stripe.com/v2/core/accounts/${id}?include=identity&include=configuration.merchant`,
      {
        headers: headers,
      },
    );

    // Return the card_payments status
    return response.data;
  } catch (err) {
    // Better error handling with AxiosError type guard
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError;
      console.error("Error Response:", axiosError.response?.data);
    }
    throw err; // Re-throw the error after logging
  }
};
