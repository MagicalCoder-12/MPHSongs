import { createAdminLogoutResponse } from '@/lib/admin-auth';

export async function POST() {
  return createAdminLogoutResponse();
}
