export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api';

export const BUYER_EMAIL    = __ENV.BUYER_EMAIL    || 'buyer@propai.com';
export const BUYER_PASSWORD = __ENV.BUYER_PASSWORD || 'password';
export const SELLER_EMAIL   = __ENV.SELLER_EMAIL   || 'seller@propai.com';
export const SELLER_PASSWORD= __ENV.SELLER_PASSWORD|| 'password';
export const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL    || 'admin@propai.com';
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'password';

export const THRESHOLDS = {
  http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  http_req_failed:   ['rate<0.05'],
  checks:            ['rate>0.90'],
};
