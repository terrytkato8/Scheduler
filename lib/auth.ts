export function isAdminUser(userId: string): boolean {
  const adminId = process.env.ADMIN_USER_ID
  return !!adminId && userId === adminId
}
